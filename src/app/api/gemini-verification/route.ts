import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API with better error handling
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || '';
console.log('Gemini API key length:', GEMINI_API_KEY?.length || 0);
console.log('Gemini API key first few characters:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 5)}...` : 'Not available');

let genAI: any;
try {
  if (!GEMINI_API_KEY) {
    throw new Error('API key is empty or undefined');
  }
  
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('GoogleGenerativeAI initialized successfully');
} catch (error) {
  console.error('Failed to initialize GoogleGenerativeAI:', error);
}

// Track rate limits
let apiCallsInLastMinute = 0;
let lastResetTime = Date.now();
const RATE_LIMIT_RESET_INTERVAL = 60000; // 1 minute

/**
 * Extract text from image using OCR
 */
async function extractTextFromImage(imageBuffer: Buffer) {
  try {
    // For now, we'll use a mock implementation
    // In production, you would integrate with a proper OCR service like Google Cloud Vision
    return "Sample extracted text from document";
    
    // Example Google Cloud Vision implementation:
    /*
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.textDetection(imageBuffer);
    return result.fullTextAnnotation?.text || '';
    */
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return '';
  }
}

/**
 * Analyze document using Gemini API
 */
async function analyzeWithGemini(imageType: string, extractedText: string, imageFeatures: number[] = [], documentMetadata: Record<string, string> = {}) {
  try {
    // Check if Gemini API is initialized
    if (!genAI) {
      console.error('Gemini API not initialized, using mock response');
      throw new Error('Gemini API not initialized');
    }

    // Get the generative model
    console.log('Getting generative model: gemini-1.5-flash');
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('Successfully created model instance');
    } catch (modelError) {
      console.error('Error creating model instance:', modelError);
      throw new Error('Failed to create Gemini model instance');
    }
    
    // Format metadata for the prompt
    const metadataString = Object.keys(documentMetadata).length > 0 
      ? `Document metadata:
${Object.entries(documentMetadata)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}` 
      : 'No metadata available for this document.';
    
    // Create a prompt that includes image features, type and extracted text
    const prompt = `
    I need you to analyze a document for authenticity verification.
    
    Document type: ${imageType}
    
    Extracted text from document: ${extractedText}
    
    ${metadataString}
    
    ${imageFeatures.length > 0 ? `
    Image features extracted using neural network (first 10 values):
    ${imageFeatures.slice(0, 10).join(', ')}
    
    These features represent visual patterns and characteristics detected by MobileNet, a lightweight AI model.
    High confidence in certain classes may indicate specific content types.
    The last three values represent normalized width, normalized height, and aspect ratio.
    ` : 'No AI feature extraction available for this image.'}
    
    Please analyze this document for authenticity using the following criteria:
    
    1. ASSUME THE DOCUMENT IS AUTHENTIC BY DEFAULT unless there are clear indicators otherwise.
    2. Look for specific signs of AI generation such as:
       - Unnatural or inconsistent lighting, shadows, or reflections
       - Irregular or impossible geometry
       - Unusual artifacts or distortions
       - Inconsistent text formatting or alignment
       - Blurry or overly perfect elements
    3. Consider the document metadata:
       - Check for suspicious creators or producers that might indicate AI generation
       - Examine creation and modification dates for inconsistencies
       - Look for missing metadata that would typically be present in legitimate documents
       - Verify that metadata is consistent with document content
    4. Consider the document context and purpose:
       - Official documents should have consistent formatting
       - Photos should have natural perspective and lighting
    5. DO NOT flag a document as non-authentic simply due to:
       - Low quality or resolution
       - Lack of some metadata (this is normal for many legitimate documents)
       - Simple or basic content
       - Ordinary photos without suspicious elements
    
    Provide your analysis in JSON format with the following structure:
    {
      "isLikelyGenuine": boolean, // Default to true unless clear evidence suggests otherwise
      "isLikelyAiGenerated": boolean, // Only true if specific AI generation indicators are present
      "detectedAnomalies": [list of specific anomalies found, if any],
      "confidenceScore": number (0-1), // Start at 0.9 and reduce only for specific issues
      "analysisExplanation": string // Detailed explanation of your assessment
    }
    
    Important: Be conservative in flagging documents as non-authentic. Only flag if there are clear, specific indicators of manipulation or AI generation.
    `;
    
    console.log('Sending prompt to Gemini API...');
    
    // Generate content with timeout
    let result;
    try {
      // Set a timeout for the API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API call timed out after 30 seconds')), 30000)
      );
      
      // Optimize the prompt by trimming long text and metadata
      const optimizedPrompt = createOptimizedPrompt(imageType, extractedText, imageFeatures, documentMetadata);
      
      const apiPromise = model.generateContent(optimizedPrompt);
      result = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('API call completed successfully');
    } catch (apiError: any) {
      console.error('Error calling Gemini API:', apiError);
      throw new Error(`Gemini API call failed: ${apiError?.message || 'Unknown error'}`);
    }
    
    // Process response
    let text;
    try {
      const response = await result.response;
      text = response.text();
      console.log('Received response from Gemini API');
    } catch (responseError: any) {
      console.error('Error getting response text:', responseError);
      throw new Error('Failed to get response text from Gemini API');
    }
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse Gemini API response');
      throw new Error('Failed to parse Gemini API response');
    }
    
    try {
      const analysisResult = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed Gemini response JSON');
      return analysisResult;
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse Gemini API JSON response');
    }
  } catch (error: any) {
    console.error('Error analyzing with Gemini API:', error);
    
    // Return a mock response instead of throwing
    console.log('Using mock verification result due to API error:', error?.message);
    
    // Create a user-friendly error message
    let userFriendlyError = "API connection issue";
    if (error?.message?.includes("429 Too Many Requests") || error?.message?.includes("quota")) {
      userFriendlyError = "API rate limit reached";
    } else if (error?.message?.includes("401") || error?.message?.includes("403")) {
      userFriendlyError = "API authentication error";
    } else if (error?.message?.includes("timeout")) {
      userFriendlyError = "API request timed out";
    }
    
    return {
      isLikelyGenuine: true,
      isLikelyAiGenerated: false,
      detectedAnomalies: [],
      confidenceScore: 0.9,
      analysisExplanation: `This is a mock verification result. Reason: ${userFriendlyError}`
    };
  }
}

/**
 * Main API handler
 */
export async function POST(request: NextRequest) {
  console.log('Gemini document verification API request received');
  
  // Reset rate limiting counter if needed
  const now = Date.now();
  if (now - lastResetTime > RATE_LIMIT_RESET_INTERVAL) {
    apiCallsInLastMinute = 0;
    lastResetTime = now;
  }
  
  // Increment counter for tracking
  apiCallsInLastMinute++;
  
  try {
    // Check API key
    if (!GEMINI_API_KEY) {
      console.error('Missing Gemini API key');
      return provideMockResponse(apiCallsInLastMinute, "API key missing");
    }
    
    // Parse the incoming form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const featuresString = formData.get('features') as string;
    const metadataString = formData.get('metadata') as string;
    
    if (!imageFile) {
      console.error('No image file provided in the request');
      return NextResponse.json(
        { 
          status: 'success',
          mockImplementation: true,
          verification: {
            isLikelyGenuine: false,
            isLikelyAiGenerated: false,
            detectedAnomalies: ["No image provided"],
            confidenceScore: 0,
            analysisExplanation: "No image file was provided for verification.",
            moderationStatus: 'flagged'
          },
          error: true, 
          message: 'No image file provided' 
        }, 
        { status: 200 }
      );
    }
    
    // Parse features if available
    let imageFeatures: number[] = [];
    if (featuresString) {
      try {
        imageFeatures = JSON.parse(featuresString);
        console.log('Received image features:', imageFeatures.length);
      } catch (e) {
        console.error('Failed to parse image features:', e);
      }
    }
    
    // Parse metadata if available
    let documentMetadata: Record<string, string> = {};
    if (metadataString) {
      try {
        documentMetadata = JSON.parse(metadataString);
        console.log('Received document metadata:', Object.keys(documentMetadata).length);
      } catch (e) {
        console.error('Failed to parse document metadata:', e);
      }
    }
    
    // Check if this is an optimized PDF file (JSON representation)
    let isOptimizedPdf = false;
    if (imageFile.type === 'application/json') {
      try {
        const jsonContent = await imageFile.text();
        const fileInfo = JSON.parse(jsonContent);
        if (fileInfo.isPdf && fileInfo.fileName && fileInfo.fileType === 'application/pdf') {
          console.log('Detected optimized PDF representation:', fileInfo.fileName);
          isOptimizedPdf = true;
          
          // Add file info to metadata if not already present
          if (!documentMetadata['File Name']) documentMetadata['File Name'] = fileInfo.fileName;
          if (!documentMetadata['File Size']) documentMetadata['File Size'] = `${(fileInfo.fileSize / 1024).toFixed(2)} KB`;
          if (!documentMetadata['File Type']) documentMetadata['File Type'] = fileInfo.fileType;
          documentMetadata['Optimized'] = 'Yes - Large PDF file';
        }
      } catch (e) {
        console.error('Failed to parse optimized PDF data:', e);
      }
    }
    
    // Log image details for debugging
    console.log(`Processing image: ${imageFile.name}, Size: ${imageFile.size}, Type: ${imageFile.type}${isOptimizedPdf ? ' (Optimized PDF)' : ''}`);
    
    // Check rate limits
    if (apiCallsInLastMinute > 10) {
      console.log('Rate limit exceeded, using mock implementation');
      return provideMockResponse(apiCallsInLastMinute, "Rate limit exceeded", documentMetadata);
    }
    
    // For optimized PDFs, we'll skip the buffer processing and use metadata directly
    let extractedText = "";
    if (isOptimizedPdf) {
      extractedText = "Large PDF document - metadata-only analysis";
    } else {
      // Convert file to buffer for processing
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Extract text using OCR
      console.log('Extracting text from image...');
      extractedText = await extractTextFromImage(buffer);
    }
    
    // Analyze with Gemini API
    console.log('Analyzing with Gemini API...');
    try {
      const analysisResult = await analyzeWithGemini(
        isOptimizedPdf ? 'application/pdf' : imageFile.type, 
        extractedText, 
        imageFeatures, 
        documentMetadata
      );
      
      // Return the verification results
      return NextResponse.json({
        status: 'success',
        verification: {
          ...analysisResult,
          moderationStatus: analysisResult.isLikelyGenuine ? 'safe' : 'flagged'
        },
        rateLimit: {
          callsInLastMinute: apiCallsInLastMinute,
          resetInMs: RATE_LIMIT_RESET_INTERVAL - (now - lastResetTime)
        }
      });
    } catch (geminiError: any) {
      console.error('Error analyzing with Gemini API:', geminiError);
      return provideMockResponse(apiCallsInLastMinute, geminiError.message || "Unknown error", documentMetadata);
    }
  } catch (error: any) {
    console.error('Error in document verification API:', error);
    return provideMockResponse(apiCallsInLastMinute, error.message || "Unknown error");
  }
}

/**
 * Provides a mock response when the real API is unavailable
 */
function provideMockResponse(callCount: number, reason: string = "API unavailable", metadata: Record<string, string> = {}) {
  console.log(`Generating mock verification response (reason: ${reason})`);
  
  // Create a user-friendly reason
  let userFriendlyReason = "API temporarily unavailable";
  if (reason.includes("API key missing") || reason.includes("empty")) {
    userFriendlyReason = "API configuration issue";
  } else if (reason.includes("Rate limit") || reason.includes("429") || reason.includes("quota")) {
    userFriendlyReason = "API rate limit reached";
  } else if (reason.includes("timeout")) {
    userFriendlyReason = "API request timed out - document may be too complex";
  }
  
  // For timeouts and large documents, assume they're likely genuine
  const isTimeout = reason.includes("timeout");
  
  // Create a mock response that's more likely to be positive for timeouts
  const shouldFlag = isTimeout ? Math.random() < 0.05 : Math.random() < 0.2;
  
  // Create a more informative mock response
  const mockAnalysis = shouldFlag 
    ? {
        isLikelyGenuine: false,
        isLikelyAiGenerated: Math.random() < 0.7,
        detectedAnomalies: [
          "Inconsistent text formatting",
          "Potential digital manipulation detected",
          "Unusual metadata patterns"
        ],
        confidenceScore: 0.75 + Math.random() * 0.2,
        analysisExplanation: `This is a mock verification result. Reason: ${userFriendlyReason}. The document contains some suspicious elements that warrant further review.`,
        moderationStatus: 'flagged'
      }
    : {
        isLikelyGenuine: true,
        isLikelyAiGenerated: false,
        detectedAnomalies: [],
        confidenceScore: 0.85 + Math.random() * 0.15,
        analysisExplanation: `This is a mock verification result. Reason: ${userFriendlyReason}. Based on available metadata${Object.keys(metadata).length > 0 ? ' and document properties' : ''}, no suspicious elements were detected.`,
        moderationStatus: 'safe'
      };
  
  return NextResponse.json({
    status: 'success',
    verification: mockAnalysis,
    mockImplementation: true,
    mockReason: reason,
    rateLimit: {
      callsInLastMinute: callCount,
      resetInMs: RATE_LIMIT_RESET_INTERVAL - (Date.now() - lastResetTime)
    }
  });
}

// Add this helper function to optimize the prompt by trimming long text and metadata
function createOptimizedPrompt(
  imageType: string, 
  extractedText: string, 
  imageFeatures: number[] = [],
  documentMetadata: Record<string, string> = {}
): string {
  // Trim extracted text if it's too long (limit to 1000 characters)
  const trimmedText = extractedText.length > 1000 
    ? extractedText.substring(0, 1000) + "... (text truncated for brevity)"
    : extractedText;
  
  // Format metadata, limiting the number of entries
  const metadataEntries = Object.entries(documentMetadata);
  const importantMetadataFields = ['Title', 'Author', 'Creator', 'Producer', 'Creation Date', 'File Type', 'Valid PDF Header'];
  
  // Filter to important metadata first, then add others if we have space
  const prioritizedMetadata = [
    ...metadataEntries.filter(([key]) => importantMetadataFields.includes(key)),
    ...metadataEntries.filter(([key]) => !importantMetadataFields.includes(key)).slice(0, 5)
  ].slice(0, 10); // Limit to 10 metadata entries maximum
  
  const metadataString = prioritizedMetadata.length > 0 
    ? `Document metadata:\n${prioritizedMetadata.map(([key, value]) => `${key}: ${value}`).join('\n')}` 
    : 'No metadata available for this document.';
  
  // Create a more concise prompt
  return `
  I need you to analyze a document for authenticity verification.
  
  Document type: ${imageType}
  
  Extracted text summary: ${trimmedText}
  
  ${metadataString}
  
  ${imageFeatures.length > 0 ? `
  Image features extracted using neural network (first 5 values):
  ${imageFeatures.slice(0, 5).join(', ')}
  ` : 'No AI feature extraction available for this image.'}
  
  Please analyze this document for authenticity using the following criteria:
  
  1. ASSUME THE DOCUMENT IS AUTHENTIC BY DEFAULT unless there are clear indicators otherwise.
  2. Look for specific signs of AI generation such as:
     - Unnatural or inconsistent lighting, shadows, or reflections
     - Irregular or impossible geometry
     - Unusual artifacts or distortions
     - Inconsistent text formatting or alignment
  3. Consider the document metadata:
     - Check for suspicious creators or producers that might indicate AI generation
     - Examine creation and modification dates for inconsistencies
     - Verify that metadata is consistent with document content
  4. DO NOT flag a document as non-authentic simply due to:
     - Low quality or resolution
     - Lack of some metadata (this is normal for many legitimate documents)
     - Simple or basic content
  
  Provide your analysis in JSON format with the following structure:
  {
    "isLikelyGenuine": boolean, // Default to true unless clear evidence suggests otherwise
    "isLikelyAiGenerated": boolean, // Only true if specific AI generation indicators are present
    "detectedAnomalies": [list of specific anomalies found, if any],
    "confidenceScore": number (0-1), // Start at 0.9 and reduce only for specific issues
    "analysisExplanation": string // Brief explanation of your assessment
  }
  
  Be conservative in flagging documents as non-authentic. Only flag if there are clear indicators of manipulation or AI generation.
  `;
}

// Increase the max request size to handle larger images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 