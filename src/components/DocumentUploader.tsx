'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { FaCamera, FaSync, FaTimes } from 'react-icons/fa';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Tesseract from 'tesseract.js';

// Add this at the top of the file, after imports
// eslint-disable-next-line @typescript-eslint/no-unused-vars

// Type for moderation class results
interface ModerationClass {
  class: string;
  score: number;
}

// Type for uploaded file
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  moderationStatus: 'pending' | 'safe' | 'flagged';
  verificationDetails?: {
    isLikelyGenuine: boolean;
    isLikelyAiGenerated: boolean;
    detectedAnomalies: string[];
    confidenceScore: number;
    analysisExplanation: string;
    moderationStatus?: string;
    metadata?: Record<string, string>;
    extractedText?: string;
    textConfidence?: number;
  };
}

// Type for Gemini API response
interface GeminiVerificationResponse {
  status: string;
  error?: boolean;
  message?: string;
  details?: string;
  verification?: any;
  mockImplementation?: boolean;
  rateLimit?: {
    callsInLastMinute: number;
    resetInMs: number;
  };
}

export default function DocumentUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<{ used: number, reset: number } | null>(null);
  const [usingMockModeration, setUsingMockModeration] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Add state for model loading
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load TensorFlow model on component mount
  useEffect(() => {
    async function loadModel() {
      setIsModelLoading(true);
      try {
        // Load TensorFlow.js
        await tf.ready();
        console.log('TensorFlow.js loaded successfully');
        
        // Load MobileNet model (lighter alternative to Inception v3)
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        console.log('MobileNet model loaded successfully');
      } catch (error) {
        console.error('Failed to load TensorFlow model:', error);
      } finally {
        setIsModelLoading(false);
      }
    }
    
    loadModel();
    
    // Cleanup function
    return () => {
      // Dispose of any tensors when component unmounts
      tf.dispose();
    };
  }, []);

  /**
   * Extract features from an image using the pre-trained model
   */
  const extractImageFeatures = async (file: File): Promise<number[]> => {
    if (!model) {
      console.warn('Model not loaded, skipping feature extraction');
      return [];
    }
    
    try {
      // Create an image element to load the file
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = URL.createObjectURL(file);
      
      // Wait for image to load
      await new Promise(resolve => {
        img.onload = resolve;
      });
      
      // Get image classification and features
      const predictions = await model.classify(img);
      
      // Extract class probabilities as features
      const features = predictions.map((p: { className: string; probability: number }) => p.probability);
      
      // Add image dimensions as additional features
      features.push(img.naturalWidth / 1000); // Normalize width
      features.push(img.naturalHeight / 1000); // Normalize height
      features.push(img.naturalWidth / img.naturalHeight); // Aspect ratio
      
      // Clean up
      URL.revokeObjectURL(img.src);
      
      console.log('Extracted features:', features);
      return features;
    } catch (error) {
      console.error('Error extracting image features:', error);
      return [];
    }
  };

  /**
   * Analyzes an image with the Gemini API for advanced verification
   */
  const analyzeWithGemini = async (file: File, metadata: Record<string, string> = {}): Promise<{ 
    isGenuine: boolean; 
    details: {
      isLikelyGenuine: boolean;
      isLikelyAiGenerated: boolean;
      detectedAnomalies: string[];
      confidenceScore: number;
      analysisExplanation: string;
      moderationStatus?: string;
    } 
  }> => {
    try {
      console.log(`Analyzing ${file.name} with Gemini API...`);
      
      // Extract image features using TensorFlow if model is loaded
      // Skip feature extraction for PDFs and other non-image files
      let imageFeatures: number[] = [];
      if (model && file.type.startsWith('image/')) {
        console.log('Extracting image features using AI model...');
        imageFeatures = await extractImageFeatures(file);
      } else {
        console.log('Skipping feature extraction for non-image file');
      }
      
      // Create form data for the API request
      const formData = new FormData();
      
      // For PDFs, we'll create a smaller file representation to avoid timeouts
      if (file.type === 'application/pdf' && file.size > 500000) { // If PDF > 500KB
        console.log('PDF file is large, creating optimized version for API');
        // Create a smaller representation of the file with just the metadata
        const metadataFile = new File(
          [JSON.stringify({ 
            fileName: file.name, 
            fileType: file.type, 
            fileSize: file.size,
            isPdf: true
          })], 
          file.name, 
          { type: 'application/json' }
        );
        formData.append('image', metadataFile);
      } else {
        // For other files, send as normal
      formData.append('image', file);
      }
      
      // Add image features to the form data if available
      if (imageFeatures.length > 0) {
        formData.append('features', JSON.stringify(imageFeatures));
      }
      
      // Add metadata to the form data if available
      if (Object.keys(metadata).length > 0) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      // Send the request to our API route
      const response = await fetch('/api/gemini-verification', {
        method: 'POST',
        body: formData,
      });
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error from Gemini API: ${response.status}`, errorText);
        throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
      }
      
      // Parse the response
      const data: GeminiVerificationResponse = await response.json();
      console.log('Full Gemini API response:', data);
      
      // Check if using mock implementation
      if (data.mockImplementation) {
        setUsingMockModeration(true);
        console.log('Using mock implementation for Gemini verification');
      } else {
        setUsingMockModeration(false);
        console.log('Using real Gemini API - response data:', data.verification);
      }
      
      // Update rate limit information if available
      if (data.rateLimit) {
        setRateLimit({
          used: data.rateLimit.callsInLastMinute,
          reset: Math.ceil(data.rateLimit.resetInMs / 1000)
        });
      }
      
      // Check for API errors
      if (data.error) {
        console.error(`API Error: ${data.message}`, data.details);
        throw new Error(data.message || 'Unknown error from Gemini API');
      }
      
      // Process the response data
      if (data.status === 'success' && data.verification) {
        const verificationDetails = {
          ...data.verification,
          moderationStatus: data.verification.isLikelyGenuine ? 'safe' : 'flagged'
        };
        
        console.log('Gemini verification result:', verificationDetails);
        
        return {
          isGenuine: data.verification.isLikelyGenuine,
          details: verificationDetails
        };
      }
      
      console.warn('Gemini verification returned unexpected format:', data);
      return { 
        isGenuine: true,
        details: {
          isLikelyGenuine: true,
          isLikelyAiGenerated: false,
          detectedAnomalies: [],
          confidenceScore: 1.0,
          analysisExplanation: "Verification skipped or failed"
        }
      };
    } catch (error) {
      console.error(`Error analyzing ${file.name} with Gemini:`, error);
      throw error; // Rethrow to handle it in the calling function
    }
  };

  /**
   * Handles file uploads from any source
   */
  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log('No files uploaded');
      return;
    }
    
    try {
    setModerationError(null);
      setIsUploading(true);
    
      // Create new file objects
      const newFiles: UploadedFile[] = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const id = `file-${Date.now()}-${i}`;
        const url = URL.createObjectURL(file);
        
        newFiles.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          moderationStatus: 'pending'
        });
        
        console.log(`Uploaded file: ${file.name} (${file.type}, ${file.size} bytes)`);
      }
      
      // Add the new files to state
      setFiles(prev => [...prev, ...newFiles]);
      
      // Start analyzing after files are added
      setIsAnalyzing(true);
      
      // Process each file for verification with Gemini
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileId = newFiles[i].id;
        
        try {
          console.log(`Processing file ${i + 1}/${uploadedFiles.length}: ${file.name} (${file.type})`);
          
          // Handle different file types
          if (file.type.startsWith('image/')) {
            // For images, first try to extract text with OCR
            console.log(`Processing image file: ${file.name}`);
            
            // Extract text using OCR
            const ocrResult = await extractTextFromImage(file);
            
            // Create basic metadata for images
            const metadata: Record<string, string> = {
              'File Name': file.name,
              'File Size': `${(file.size / 1024).toFixed(2)} KB`,
              'File Type': file.type,
              'OCR Text Length': `${ocrResult.text.length} characters`,
              'OCR Confidence': `${Math.round(ocrResult.confidence * 100)}%`
            };
            
            // Check for suspicious patterns in the extracted text
            const suspiciousTextPatterns = [
              { pattern: /fake|copy|specimen|sample|test/i, description: "Contains terms like 'fake', 'copy', 'specimen'" },
              { pattern: /\b(not|non)[\s-]?(valid|official)\b/i, description: "Contains disclaimers like 'not valid'" }
            ];
            
            const textAnomalies: string[] = [];
            for (const { pattern, description } of suspiciousTextPatterns) {
              if (pattern.test(ocrResult.text)) {
                textAnomalies.push(description);
              }
            }
            
            if (textAnomalies.length > 0) {
              metadata['Text Anomalies'] = textAnomalies.join(', ');
            }
            
            // Analyze with Gemini for advanced verification with metadata
            const geminiResult = await analyzeWithGemini(file, metadata);
            console.log(`File ${file.name} verification result:`, geminiResult);
            
            // Update the file with verification results and OCR data
            setFiles(prev => 
              prev.map(f => 
                f.id === fileId ? {
                  ...f,
                  // Default to safe unless explicitly flagged as AI-generated
                  moderationStatus: geminiResult.details.isLikelyAiGenerated ? 'flagged' : 'safe',
                  verificationDetails: {
                    ...geminiResult.details,
                    metadata: metadata,
                    extractedText: ocrResult.text,
                    textConfidence: ocrResult.confidence
                  }
                } : f
              )
            );
          } else if (file.type === 'application/pdf' || 
                    file.type === 'application/msword' || 
                    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // For PDFs and other document types, perform basic verification
            console.log(`Document file detected: ${file.name} (${file.type})`);
            
            // For PDFs, try to extract text with OCR if possible
            let extractedText = '';
            let textConfidence = 0;
            
            if (file.type === 'application/pdf') {
              try {
                console.log('Attempting OCR on PDF document...');
                const ocrResult = await extractTextFromImage(file);
                extractedText = ocrResult.text;
                textConfidence = ocrResult.confidence;
                console.log('PDF OCR result:', { text: extractedText.substring(0, 100) + '...', confidence: textConfidence });
              } catch (ocrError) {
                console.log('OCR failed for PDF, continuing with metadata analysis');
                extractedText = "Text extraction from PDF requires server-side processing.";
                textConfidence = 0.5;
              }
            }
            
            // Perform document verification based on file type
            let anomalies: string[] = [];
            let confidenceScore = 0.9;
            let metadata: Record<string, string> = {};
            
            if (file.type === 'application/pdf') {
              try {
                // For PDFs, use our PDF metadata extraction
                console.log('Extracting PDF metadata...');
                const pdfAnalysis = await extractPdfMetadata(file);
                anomalies = pdfAnalysis.anomalies;
                confidenceScore = pdfAnalysis.confidenceScore;
                metadata = pdfAnalysis.metadata;
                
                // Add OCR results to metadata if available
                if (extractedText) {
                  metadata['OCR Text Length'] = `${extractedText.length} characters`;
                  metadata['OCR Confidence'] = `${Math.round(textConfidence * 100)}%`;
                  
                  // Check for suspicious text patterns
                  const suspiciousPatterns = [
                    { pattern: /fake|copy|specimen|sample|test/i, description: "Contains terms like 'fake', 'copy', 'specimen'" },
                    { pattern: /\b(not|non)[\s-]?(valid|official)\b/i, description: "Contains disclaimers like 'not valid'" }
                  ];
                  
                  for (const { pattern, description } of suspiciousPatterns) {
                    if (pattern.test(extractedText)) {
                      anomalies.push(description);
                      confidenceScore -= 0.2;
                    }
                  }
                }
                
                // Use Gemini for enhanced verification with metadata
                try {
                  console.log(`Processing PDF with Gemini API including metadata: ${file.name}`);
                  const geminiResult = await analyzeWithGemini(file, metadata);
                  console.log(`PDF Gemini verification result for ${file.name}:`, geminiResult);
                  
                  // Update the file with verification results
            setFiles(prev => 
              prev.map(f => 
                      f.id === fileId ? {
                        ...f,
                        moderationStatus: geminiResult.details.isLikelyAiGenerated ? 'flagged' : 'safe',
                        verificationDetails: {
                          ...geminiResult.details,
                          metadata: metadata,
                          extractedText: extractedText,
                          textConfidence: textConfidence
                        }
                      } : f
                    )
                  );
                  
                  // Skip the rest of the document verification process
                  continue;
                } catch (geminiError) {
                  console.error(`Error analyzing PDF with Gemini: ${geminiError}`);
                  // Fall back to our basic verification if Gemini fails
                  // We'll continue with the existing verification logic below
                }
              } catch (pdfError) {
                console.error(`Error in PDF processing pipeline: ${pdfError}`);
                // If metadata extraction fails, create basic metadata
                metadata = {
                  'File Name': file.name,
                  'File Size': `${(file.size / 1024).toFixed(2)} KB`,
                  'File Type': file.type,
                  'Status': 'Limited analysis - PDF may be encrypted or damaged'
                };
                anomalies.push("Could not fully analyze PDF structure");
                confidenceScore = 0.7; // Reduced confidence but not flagged as suspicious
              }
            } else {
              // For other document types, perform basic checks
              // 1. Check file size (unusually small docs might be suspicious)
              const isSuspiciousSize = file.size < 10000; // Less than 10KB is suspicious for most documents
              
              // 2. Check file name for suspicious patterns
              const hasSuspiciousName = /temp|untitled|unnamed|copy|fake|test|sample/i.test(file.name);
              
              // 3. Check file extension vs actual type
              const declaredExtension = file.name.split('.').pop()?.toLowerCase();
              const expectedType = {
                'doc': 'application/msword',
                'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              }[declaredExtension || ''];
              const hasTypeMismatch = expectedType && expectedType !== file.type;
              
              // Collect anomalies
              if (isSuspiciousSize) anomalies.push("Unusually small file size for a document");
              if (hasSuspiciousName) anomalies.push("Document has a potentially suspicious filename");
              if (hasTypeMismatch) anomalies.push("File extension doesn't match the actual file type");
              
              // Calculate confidence score based on checks
              if (isSuspiciousSize) confidenceScore -= 0.3;
              if (hasSuspiciousName) confidenceScore -= 0.2;
              if (hasTypeMismatch) confidenceScore -= 0.4;
              
              // Add basic metadata
              metadata = {
                'File Size': `${(file.size / 1024).toFixed(2)} KB`,
                'File Type': file.type,
                'File Name': file.name
              };
            }
            
            // Ensure confidence score is in valid range
            confidenceScore = Math.max(0.1, Math.min(1, confidenceScore));
            
            // Determine if document is likely genuine
            // More lenient approach: only flag as non-genuine if there are serious issues
            const isLikelyAiGenerated = anomalies.some(anomaly => 
              anomaly.includes("does not have a valid PDF header") || 
              anomaly.includes("File extension doesn't match") ||
              anomaly.includes("fake") ||
              anomaly.includes("specimen")
            );
            
            const isLikelyGenuine = !isLikelyAiGenerated;
            
            // Create verification result for document files
            const docVerification = {
              isGenuine: isLikelyGenuine,
              details: {
                isLikelyGenuine: isLikelyGenuine,
                isLikelyAiGenerated: isLikelyAiGenerated,
                detectedAnomalies: anomalies,
                confidenceScore: confidenceScore,
                analysisExplanation: anomalies.length > 0 
                  ? `Document verification found ${anomalies.length} potential issue${anomalies.length === 1 ? '' : 's'}, but ${isLikelyGenuine ? 'these are not critical to authenticity' : 'some critical issues were detected'}.` 
                  : `Document appears to be genuine based on file characteristics.`,
                metadata: metadata,
                extractedText: extractedText,
                textConfidence: textConfidence
              }
            };
            
            console.log(`Document verification result for ${file.name}:`, docVerification);
            
            // Update the file status
          setFiles(prev => 
            prev.map(f => 
                f.id === fileId ? {
                  ...f,
                  moderationStatus: isLikelyAiGenerated ? 'flagged' : 'safe',
                  verificationDetails: docVerification.details
                } : f
              )
            );
          } else {
            // For other file types
            console.log(`Unsupported file type: ${file.name} (${file.type})`);
            setFiles(prev => 
              prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  moderationStatus: 'safe',
                  verificationDetails: {
                    isLikelyGenuine: true,
                    isLikelyAiGenerated: false,
                    detectedAnomalies: [],
                    confidenceScore: 0.5,
                    analysisExplanation: `This file type (${file.type}) cannot be verified automatically.`
                  }
                } : f
              )
            );
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          
          setModerationError(`Failed to analyze ${file.name}. Please try again.`);
          
          // Mark the file as failed
          setFiles(prev => 
            prev.map(f => 
              f.id === fileId ? { 
                ...f,
                moderationStatus: 'flagged',
                verificationDetails: {
                  isLikelyGenuine: false,
                  isLikelyAiGenerated: false,
                  detectedAnomalies: ["Analysis failed"],
                  confidenceScore: 0,
                  analysisExplanation: `Error analyzing document: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
              } : f
            )
          );
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setModerationError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // Force camera display to update correctly when camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current) {
      // Use a small delay to ensure DOM has updated
      setTimeout(() => {
        // Direct DOM manipulation as a last resort fallback
        const videoElement = document.getElementById('camera-video');
        const containerElement = document.getElementById('camera-container');
        
        if (videoElement && videoElement instanceof HTMLVideoElement) {
          console.log('Applying direct DOM fixes to camera video element');
          
          // Force visibility and size
          videoElement.style.display = 'block';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.backgroundColor = 'black';
          
          // Ensure video source is set
          if (!videoElement.srcObject && streamRef.current) {
            videoElement.srcObject = streamRef.current;
            videoElement.play().catch(e => console.error('Error in DOM fallback play:', e));
          }
        }
        
        if (containerElement) {
          console.log('Applying direct DOM fixes to camera container');
          containerElement.style.display = 'block';
          containerElement.style.height = '400px';
        }
      }, 200);
    }
  }, [cameraActive]);

  // Add additional check for camera status changes
  useEffect(() => {
    // When camera becomes active, ensure the video is playing
    if (cameraActive && streamRef.current) {
      console.log('Camera active state detected, ensuring video is playing');
      
      // Check if video element exists and is playing
      const checkVideoPlaying = () => {
        const videoElement = videoRef.current || document.getElementById('camera-video') as HTMLVideoElement;
        
        if (videoElement) {
          // Check if video is actually playing
          if (videoElement.paused || videoElement.ended) {
            console.log('Video is paused or ended, attempting to play');
            
            // Ensure source is set
            if (!videoElement.srcObject && streamRef.current) {
              videoElement.srcObject = streamRef.current;
            }
            
            // Attempt to play
            videoElement.play().catch(e => {
              console.error('Failed to play video in status check:', e);
            });
          } else {
            console.log('Video is playing correctly');
          }
        }
      };
      
      // Check immediately
      checkVideoPlaying();
      
      // And check again after a delay
      const timeoutId = setTimeout(checkVideoPlaying, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [cameraActive]);

  // Helper function to stop camera stream
  const stopCameraStream = useCallback(() => {
    console.log('Stopping camera stream');
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clear the camera timeout if it exists
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Update state
    setCameraActive(false);
    setCameraInitializing(false);
  }, []);

  // Function to detect if device is mobile
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  };

  // Handle camera access with facingMode option
  const handleCameraToggle = async () => {
    setCameraError(null);
    
    if (cameraActive) {
      // Stop the camera
      stopCameraStream();
    } else {
      setCameraInitializing(true);
      setCameraPermissionDenied(false);
      
      // Clear any previous timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      // Set timeout to prevent getting stuck in initializing state
      initTimeoutRef.current = setTimeout(() => {
        if (cameraInitializing && !cameraActive) {
          console.error('Camera initialization timed out');
          setCameraError('Camera initialization timed out. Please try again.');
          stopCameraStream();
        }
      }, 10000); // 10 second timeout
      
      try {
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported in this browser');
        }
        
        // Check for browser support
        console.log('Browser info:', {
          userAgent: navigator.userAgent,
          mediaDevices: !!navigator.mediaDevices,
          getUserMedia: !!navigator.mediaDevices?.getUserMedia
        });
        
        // Set facing mode for mobile devices
        const constraints = { 
          video: isMobileDevice() 
            ? { facingMode: isFrontCamera ? 'user' : 'environment' } 
            : true,
          audio: false
        };
        
        console.log('Requesting camera with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera stream obtained:', stream);
        
        // Log track information
        const videoTracks = stream.getVideoTracks();
        console.log('Video tracks:', videoTracks.length);
        videoTracks.forEach((track, index) => {
          console.log(`Track ${index} settings:`, track.getSettings());
        });
        
        if (!stream || stream.getVideoTracks().length === 0) {
          throw new Error('No video tracks found in stream');
        }
        
        // Set the stream reference
        streamRef.current = stream;
        
        // Ensure the video element exists in the DOM before proceeding
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Try to get the video element reference
        let videoElement = videoRef.current;
        
        if (!videoElement) {
          console.log('Video ref not available, trying to get from DOM');
          videoElement = document.getElementById('camera-video') as HTMLVideoElement;
        }
        
        if (videoElement) {
          console.log('Video element found, setting up stream');
          
          // Force camera element visibility and size
          const containerElement = document.getElementById('camera-container');
          if (containerElement) {
            containerElement.style.display = 'block';
            containerElement.style.height = '400px';
          }
          
          // Set source and attempt playback
          videoElement.srcObject = stream;
          videoElement.style.display = 'block';
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.backgroundColor = 'black';
          
          // Force a microtask delay before attempting to play
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
            console.log('Attempting to play video');
            await videoElement.play();
            console.log('Video playback started successfully');
            
            // Force a small delay to ensure UI updates
            setTimeout(() => {
              setCameraActive(true);
              setCameraInitializing(false);
              console.log('Camera state updated: active=true, initializing=false');
              
              if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
              }
            }, 300);
          } catch (error) {
            console.error('Error playing video:', error);
            
            // Try one more time with a delay
            setTimeout(async () => {
              if (videoElement && streamRef.current) {
                try {
                  await videoElement.play();
                  console.log('Video playback started on second attempt');
                  
                  setCameraActive(true);
                  setCameraInitializing(false);
                  console.log('Camera state updated after retry: active=true, initializing=false');
                  
                  if (initTimeoutRef.current) {
                    clearTimeout(initTimeoutRef.current);
                    initTimeoutRef.current = null;
                  }
                } catch (secondError) {
                  console.error('Error playing video on second attempt:', secondError);
                  setCameraError('Failed to start camera. Please try again or use a different browser.');
                  stopCameraStream();
                }
              } else {
                console.error('Video element or stream not available for retry');
                setCameraError('Camera element not found. Please refresh the page and try again.');
                stopCameraStream();
              }
            }, 1000);
          }
        } else {
          // If video element is still not available
          console.error('Video element not available');
          setCameraError('Camera element not found. Please refresh the page and try again.');
          stopCameraStream();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error accessing camera';
        
        if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowed')) {
          setCameraPermissionDenied(true);
          setCameraError('Camera access was denied. Please check your browser permissions.');
        } else if (errorMessage.includes('NotFound') || errorMessage.includes('not found')) {
          setCameraError('No camera found on your device.');
        } else if (errorMessage.includes('NotSupported') || errorMessage.includes('not supported')) {
          setCameraError('Camera is not supported in your browser.');
        } else {
          setCameraError(`Failed to access camera: ${errorMessage}`);
        }
        
        stopCameraStream();
      }
    }
  };

  // Toggle between front and back camera
  const toggleCameraFacing = () => {
    if (cameraActive) {
      stopCameraStream();
      setIsFrontCamera(!isFrontCamera);
      setTimeout(() => {
        handleCameraToggle();
      }, 300);
    } else {
      setIsFrontCamera(!isFrontCamera);
    }
  };

  // Capture image from camera
  const captureImage = () => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a file-like object
          const now = new Date();
          const fileName = `camera-capture-${now.getTime()}.jpg`;
          const capturedFile = new File([blob], fileName, { type: 'image/jpeg' });
          
          // Create a FileList-like object
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(capturedFile);
          
          // Process the captured image
          handleFileUpload(dataTransfer.files);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Delete a file
  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  /**
   * Extract basic metadata from a PDF file to help with verification
   * This is a simplified version that doesn't rely on pdf-lib
   */
  const extractPdfMetadata = async (file: File): Promise<{
    metadata: Record<string, string>;
    anomalies: string[];
    confidenceScore: number;
  }> => {
    try {
      console.log(`Starting metadata extraction for ${file.name}...`);
      
      // Check file size - PDFs smaller than 10KB are suspicious
      const isSuspiciouslySmall = file.size < 10000;
      
      // Check file header (first few bytes)
      const headerBytes = await readFileHeader(file, 5);
      const hasPdfHeader = headerBytes === '%PDF-';
      
      // Check file extension vs mime type
      const hasCorrectType = file.type === 'application/pdf';
      
      // Check file name for suspicious patterns
      const fileName = file.name.toLowerCase();
      const hasSuspiciousName = /temp|untitled|unnamed|copy|fake|test|sample/i.test(fileName);
      
      // Collect anomalies
      const anomalies = [];
      if (isSuspiciouslySmall) anomalies.push("Unusually small file size for a PDF");
      if (!hasPdfHeader) anomalies.push("File does not have a valid PDF header");
      if (!hasCorrectType) anomalies.push("File does not have the correct PDF MIME type");
      if (hasSuspiciousName) anomalies.push("Document has a potentially suspicious filename");
      
      // Calculate confidence score
      let confidenceScore = 0.95; // Start with high confidence
      if (isSuspiciouslySmall) confidenceScore -= 0.2;
      if (!hasPdfHeader) confidenceScore -= 0.5; // Major red flag
      if (!hasCorrectType) confidenceScore -= 0.3;
      if (hasSuspiciousName) confidenceScore -= 0.2;
      
      // Extract basic metadata without using pdf-lib
      const metadata: Record<string, string> = {
        'File Name': file.name,
        'File Size': `${(file.size / 1024).toFixed(2)} KB`,
        'File Type': file.type,
        'Valid PDF Header': hasPdfHeader ? 'Yes' : 'No',
        'Last Modified': new Date(file.lastModified).toLocaleString()
      };
      
      // Try to extract more metadata from the PDF content
      try {
        if (hasPdfHeader) {
          // Read a larger portion of the file to look for metadata
          const pdfContent = await readFileAsText(file);
          
          // Extract title if available
          const titleMatch = pdfContent.match(/\/Title\s*\((.*?)\)/);
          if (titleMatch && titleMatch[1]) {
            metadata['Title'] = decodeURIComponent(titleMatch[1].replace(/\\([0-9a-f]{2})/g, '%$1'));
          }
          
          // Extract author if available
          const authorMatch = pdfContent.match(/\/Author\s*\((.*?)\)/);
          if (authorMatch && authorMatch[1]) {
            metadata['Author'] = decodeURIComponent(authorMatch[1].replace(/\\([0-9a-f]{2})/g, '%$1'));
          }
          
          // Extract creator if available
          const creatorMatch = pdfContent.match(/\/Creator\s*\((.*?)\)/);
          if (creatorMatch && creatorMatch[1]) {
            metadata['Creator'] = decodeURIComponent(creatorMatch[1].replace(/\\([0-9a-f]{2})/g, '%$1'));
          }
          
          // Extract producer if available
          const producerMatch = pdfContent.match(/\/Producer\s*\((.*?)\)/);
          if (producerMatch && producerMatch[1]) {
            metadata['Producer'] = decodeURIComponent(producerMatch[1].replace(/\\([0-9a-f]{2})/g, '%$1'));
          }
          
          // Check for suspicious metadata patterns
          const suspiciousCreators = ['AI', 'Generated', 'GPT', 'DALL-E', 'Midjourney', 'Stable Diffusion'];
          const suspiciousProducers = ['AI', 'Generated', 'GPT', 'DALL-E', 'Midjourney', 'Stable Diffusion'];
          
          // Check if any of the suspicious terms are in the creator or producer
          if (metadata['Creator'] && suspiciousCreators.some(term => metadata['Creator'].includes(term))) {
            anomalies.push("Document creator suggests AI generation");
            confidenceScore -= 0.3;
          }
          
          if (metadata['Producer'] && suspiciousProducers.some(term => metadata['Producer'].includes(term))) {
            anomalies.push("Document producer suggests AI generation");
            confidenceScore -= 0.3;
          }
          
          // Check for missing essential metadata that most legitimate documents have
          const missingMetadataCount = ['Title', 'Author', 'Creator', 'Producer'].filter(field => !metadata[field]).length;
          if (missingMetadataCount >= 3) {
            anomalies.push("Document is missing most standard metadata fields");
            confidenceScore -= 0.2;
          }
        }
      } catch (metadataError) {
        console.error('Error extracting PDF metadata from content:', metadataError);
        metadata['Status'] = 'Limited metadata extraction';
      }
      
      console.log(`PDF metadata extraction results for ${file.name}:`, {
        hasPdfHeader,
        hasCorrectType,
        isSuspiciouslySmall,
        confidenceScore,
        metadata
      });
      
      return {
        metadata,
        anomalies,
        confidenceScore: Math.max(0.1, Math.min(1, confidenceScore)) // Ensure between 0.1 and 1
      };
    } catch (error) {
      console.error('Error extracting PDF metadata:', error);
      return {
        metadata: {
          'Error': 'Failed to analyze document structure',
          'File Size': `${(file.size / 1024).toFixed(2)} KB`,
          'File Type': file.type
        },
        anomalies: ['Error analyzing PDF structure'],
        confidenceScore: 0.5
      };
    }
  };
  
  /**
   * Read a file as text
   */
  const readFileAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  /**
   * Read the first few bytes of a file to check its header
   */
  const readFileHeader = async (file: File, bytes: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result instanceof ArrayBuffer) {
          const array = new Uint8Array(result);
          let header = '';
          for (let i = 0; i < Math.min(bytes, array.length); i++) {
            header += String.fromCharCode(array[i]);
          }
          resolve(header);
        } else {
          resolve('');
        }
      };
      reader.readAsArrayBuffer(file.slice(0, bytes));
    });
  };

  /**
   * Extract text from an image or document using OCR
   */
  const extractTextFromImage = async (file: File): Promise<{
    text: string;
    confidence: number;
  }> => {
    try {
      console.log(`Starting OCR text extraction for ${file.name}...`);
      setIsOcrRunning(true);
      
      // For PDFs, we need a special approach since Tesseract might not handle them directly
      if (file.type === 'application/pdf') {
        console.log('PDF detected, using simplified OCR approach');
        // For PDFs, we'll return a simplified result since we can't easily extract text with Tesseract
        return {
          text: "PDF text extraction requires server-side processing.",
          confidence: 0.5
        };
      }
      
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      
      // Create an image element to verify the image can be loaded
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      // Wait for the image to load or fail
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = fileUrl;
      });
      
      // Now that we know the image can be loaded, use Tesseract.js for OCR
      const result = await Tesseract.recognize(
        fileUrl,
        'eng', // English language
        { 
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      // Clean up resources
      URL.revokeObjectURL(fileUrl);
      
      // Get the extracted text and confidence
      let extractedText = result.data.text || '';
      const confidence = result.data.confidence / 100; // Convert to 0-1 scale
      
      // Clean up the extracted text
      extractedText = extractedText
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim(); // Remove leading/trailing whitespace
      
      console.log(`OCR completed for ${file.name} with ${extractedText.length} characters and ${confidence.toFixed(2)} confidence`);
      
      // If the text is too short or confidence is too low, consider it failed
      if (extractedText.length < 5 && confidence < 0.3) {
        return {
          text: "No meaningful text could be extracted from this document.",
          confidence: 0.1
        };
      }
      
      return {
        text: extractedText,
        confidence: confidence
      };
    } catch (error) {
      console.error('Error extracting text with OCR:', error);
      // Return a fallback response instead of throwing
      return {
        text: "Text extraction failed. The document may be encrypted, damaged, or in an unsupported format.",
        confidence: 0
      };
    } finally {
      setIsOcrRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Document Uploader</h1>
      
      {/* Model loading indicator */}
      {isModelLoading && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-md text-blue-800">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading AI model for enhanced document analysis...
          </p>
        </div>
      )}
      
      {/* AI model loaded notification */}
      {model && !isModelLoading && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md text-green-800">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            AI model loaded successfully. Enhanced document analysis is active.
          </p>
        </div>
      )}
      
      {/* API status notification banners */}
      {usingMockModeration && (
        <div className="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-md text-amber-800">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd"></path>
            </svg>
            <strong>Demo Mode:</strong> Using mock implementation for content moderation.
          </p>
        </div>
      )}
      
      {!usingMockModeration && files.length > 0 && !moderationError && (
        <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-md text-green-800">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <strong>Live API Mode:</strong> Using MobileNet and Gemini AI for document verification.
            {rateLimit && (
              <span className="ml-2 text-sm">
                (API calls: {rateLimit.used}/minute, reset in {rateLimit.reset}s)
              </span>
            )}
          </p>
        </div>
      )}
      
      {moderationError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
          <p className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
            {moderationError}
          </p>
        </div>
      )}
      
      {/* Drag & drop area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-all duration-200 ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleInputChange}
          className="hidden"
          multiple
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        />
        
        {isUploading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-2"></div>
            <p>Uploading files...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center py-3">
              <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="mb-2 text-sm text-gray-700">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Images, PDFs, DOC, DOCX up to 10MB
              </p>
              <button 
                type="button"
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Select Files
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* Camera upload option */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleCameraToggle}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md ${
            cameraActive 
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
        >
          {cameraActive ? (
            <>
              <FaCamera className="w-5 h-5" />
              Stop Camera
            </>
          ) : (
            <>
              <FaCamera className="w-5 h-5" />
              Take Photo
            </>
          )}
        </button>
        
        {cameraInitializing && (
          <p className="mt-2 text-sm text-gray-500">Initializing camera...</p>
        )}
        
        {cameraPermissionDenied && (
          <p className="mt-2 text-sm text-red-500">
            Camera permission denied. Please allow camera access in your browser settings.
          </p>
        )}
        
        {cameraError && !cameraPermissionDenied && (
          <p className="mt-2 text-sm text-red-500">{cameraError}</p>
        )}
        
        {/* Camera container - always present but hidden when not active */}
        <div 
          id="camera-container"
          className={`relative mt-3 bg-black rounded-lg overflow-hidden ${cameraActive ? 'block' : 'hidden'}`}
          style={{ height: '400px' }}
        >
          <video
            id="camera-video"
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          ></video>
          
          {cameraActive && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-4">
              <button
                type="button"
                onClick={captureImage}
                className="px-4 py-2 bg-white text-blue-600 rounded-full shadow-lg hover:bg-gray-100"
              >
                <FaCamera className="w-6 h-6" />
              </button>
              
              {isMobileDevice() && (
                <button
                  type="button"
                  onClick={() => setIsFrontCamera(!isFrontCamera)}
                  className="px-4 py-2 bg-white text-blue-600 rounded-full shadow-lg hover:bg-gray-100"
                >
                  <FaSync className="w-6 h-6" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Show preview of captured or selected image */}
      {imagePreview && !cameraActive && (
        <div className="mt-3 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-auto max-h-64 object-contain border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setImagePreview(null);
                setFiles([]);
              }}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">
            Uploaded Documents
          </h3>
          
          <div className="space-y-4">
            {files.map(file => (
              <div 
                key={file.id} 
                className={`relative p-4 border rounded-lg transition-all ${
                  file.moderationStatus === 'flagged' 
                    ? 'border-red-300 bg-red-50' 
                    : file.moderationStatus === 'safe'
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start">
                  {/* File thumbnail/preview */}
                  <div className="relative h-16 w-16 mr-4 overflow-hidden rounded border border-gray-200 bg-white">
                    {file.type.startsWith('image/') ? (
                      <Image 
                        src={file.url} 
                        alt={file.name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gray-100">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* File details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    
                    {/* Moderation status */}
                    <div className="mt-1">
                      {file.moderationStatus === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="mr-1 h-3 w-3 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying
                        </span>
                      )}
                      {file.moderationStatus === 'safe' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                          </svg>
                          Verified
                        </span>
                      )}
                      {file.moderationStatus === 'flagged' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.667-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                          </svg>
                          Flagged
                        </span>
                      )}
                    </div>
                    
                    {/* Moderation details */}
                    {/* Removed moderationDetails as it's no longer used */}

                    {/* Verification Details */}
                    {file.verificationDetails && file.moderationStatus !== 'pending' && (
                      <div className={`mt-2 p-2 rounded-md ${
                        file.moderationStatus === 'flagged' ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        <p className="text-xs font-medium text-gray-800 mb-1">
                          Verification Results: 
                          <span className={`ml-1 ${file.moderationStatus === 'flagged' ? 'text-red-600' : 'text-green-600'}`}>
                            {file.moderationStatus === 'flagged' ? 'Potentially AI-Generated' : 'Likely Authentic'}
                          </span>
                        </p>
                        <div className="space-y-1">
                          {file.verificationDetails.isLikelyAiGenerated && (
                            <div className="flex items-center text-red-700 text-xs">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                              </svg>
                              <span>Likely AI-generated content</span>
                            </div>
                          )}
                          
                          {file.verificationDetails.detectedAnomalies.length > 0 && (
                            <div>
                              <p className="text-red-700 font-medium text-xs">Detected issues:</p>
                              <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                                {file.verificationDetails.detectedAnomalies.map((anomaly, index) => (
                                  <li key={index} className="text-red-700">{anomaly}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Document metadata section */}
                          {file.verificationDetails.metadata && Object.keys(file.verificationDetails.metadata).length > 0 && (
                            <div className="mt-2">
                              <p className="text-gray-700 font-medium text-xs">Document metadata:</p>
                              <div className="mt-1 text-xs bg-white bg-opacity-50 p-1 rounded">
                                {Object.entries(file.verificationDetails.metadata).map(([key, value], index) => (
                                  <div key={index} className="flex justify-between border-b border-gray-100 py-1">
                                    <span className="text-gray-600 font-medium">{key}:</span>
                                    <span className="text-gray-800">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* OCR extracted text section */}
                          {file.verificationDetails.extractedText && file.verificationDetails.extractedText.trim() !== '' && (
                            <div className="mt-2">
                              <div className="flex justify-between items-center">
                                <p className="text-gray-700 font-medium text-xs">Extracted Text:</p>
                                {file.verificationDetails.textConfidence && (
                                  <span className="text-xs text-gray-500">
                                    OCR Confidence: {Math.round(file.verificationDetails.textConfidence * 100)}%
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 text-xs bg-white bg-opacity-50 p-2 rounded max-h-32 overflow-y-auto">
                                <p className="text-gray-800 whitespace-pre-wrap">
                                  {file.verificationDetails.extractedText.length > 300 
                                    ? `${file.verificationDetails.extractedText.substring(0, 300)}...` 
                                    : file.verificationDetails.extractedText}
                                </p>
                                {file.verificationDetails.extractedText.length > 300 && (
                                  <button 
                                    className="text-primary-600 hover:text-primary-800 text-xs mt-1"
                                    onClick={() => alert(file.verificationDetails?.extractedText)}
                                  >
                                    Show full text
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center text-xs mt-2">
                            <span className="text-gray-700 mr-2">Confidence:</span>
                            <div className="flex-grow bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  file.verificationDetails.confidenceScore > 0.7 
                                    ? 'bg-green-500' 
                                    : file.verificationDetails.confidenceScore > 0.4 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${file.verificationDetails.confidenceScore * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-gray-700">
                              {Math.round(file.verificationDetails.confidenceScore * 100)}%
                            </span>
                          </div>
                          
                          <p className="text-gray-700 text-xs mt-1">{file.verificationDetails.analysisExplanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    className="ml-2 text-gray-400 hover:text-red-500"
                    onClick={() => deleteFile(file.id)}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
            <p className="text-center text-gray-700">
              {isOcrRunning ? 'Extracting text with OCR...' : 'Analyzing document with Gemini AI...'}
            </p>
            {usingMockModeration && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Using simulated response (API rate limit reached)
              </p>
            )}
            {rateLimit && (
              <p className="text-xs text-center text-gray-500 mt-1">
                API calls: {rateLimit.used}/10 per minute
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 