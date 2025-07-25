# DocVerify - Document Authentication Platform

DocVerify is a web application that allows users to verify the authenticity of documents and images using AI-powered analysis. The platform includes user authentication with Firebase and data storage with MongoDB.

## Features

* **User Authentication**: Sign up, login, and profile management using Firebase Authentication
* **Document Verification**: Upload documents and images for authenticity verification
* **AI-Powered Analysis**: Integration with Hive API for content moderation and analysis
* **Verification History**: Track and review past document verifications
* **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

* **Frontend**: Next.js, React, TypeScript, Tailwind CSS
* **Authentication**: Firebase Authentication
* **Database**: MongoDB with Mongoose ODM
* **API Integration**: Hive API for content moderation
* **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

* Node.js 16+ and npm
* MongoDB instance (local or cloud)
* Firebase project with Authentication enabled

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/docverify.git
   cd docverify
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:

   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/docverify
   ```

4. Replace the placeholder values with your actual Firebase and MongoDB credentials.

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication and select Email/Password and Google as sign-in methods
3. Create a web app in your Firebase project to get your configuration values
4. Copy the configuration values to your `.env.local` file

### MongoDB Setup

1. Install MongoDB locally or use a cloud service like MongoDB Atlas
2. Create a database named "docverify"
3. Update the `MONGODB_URI` in your `.env.local` file with the connection string

### Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

* `/src/app`: Next.js app router pages and API routes
* `/src/components`: React components
* `/src/contexts`: Context providers including authentication
* `/src/lib`: Utility functions and configuration
* `/src/models`: MongoDB models

## Deployment

The easiest way to deploy this application is using [Vercel](https://vercel.com/):

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Configure the environment variables in the Vercel dashboard
4. Deploy!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

* Next.js team for the amazing framework
* Firebase for authentication services
* MongoDB for database solutions
* Hive API for content moderation capabilities

# Document Uploader with Content Moderation

This project includes a robust document uploader component that integrates with the Hive API for content moderation. The component allows users to upload files, take photos with their camera, and ensures that uploaded content meets moderation guidelines.

## Features

* **Drag and Drop Interface**: Easy-to-use drag and drop file upload
* **Camera Integration**: Take photos directly using device camera
* **Content Moderation**: Integration with Hive API to detect inappropriate content
* **Robust Error Handling**: Graceful degradation when moderation services are unavailable
* **Progress Indicators**: Clear visual feedback during upload and analysis
* **Adaptive Feedback**: Informative messages about upload and moderation status

## Technical Implementation

### Document Uploader Component

The main component (`DocumentUploader.tsx`) provides a user interface for uploading files and handles:

* File selection via input or drag-and-drop
* Camera access and photo capture
* Content moderation via the Hive API
* Progress and status display

### Hive API Integration

Content moderation is handled through a server-side API route that communicates with the Hive API:

* **API Route**: `/api/hive-moderation`
* **Authentication**: Uses a Hive API key for authentication
* **Request Format**: Sends images as base64-encoded data
* **Response Handling**: Processes moderation results and provides user feedback

### Error Handling and Fallbacks

The implementation includes robust error handling:

* **API Authentication Errors**: Detected and handled with informative messages
* **Rate Limit Handling**: Tracks API usage and informs users of limits
* **Mock Implementation**: Falls back to a simulated response when the API is unavailable
* **Default Safe Status**: Marks files as safe when moderation fails to prevent blocking uploads

## How to Use

1. Drag and drop files onto the uploader area, or click "Select Files" to browse
2. Alternatively, click "Enable Camera" to take a photo
3. Files will be analyzed for content compliance if they are images
4. Results of the analysis will be displayed next to each file
5. Use the "Force Refresh Camera" button if camera feed issues occur

## Configuration

The Hive API integration can be configured:

* Update the API key in `src/app/api/hive-moderation/route.ts`
* Adjust moderation thresholds in the `analyzeWithHive` function in `DocumentUploader.tsx`
* Modify the mock implementation behavior as needed

## Error Messages

The component provides detailed feedback for various scenarios:

* **Camera Access Denied**: "Camera access was denied. Please check your browser permissions."
* **Moderation Unavailable**: "We couldn't verify the content of some images. Files are available but may not have been fully analyzed."
* **API Authentication Issue**: "We couldn't verify the content of some images due to an authentication issue with our moderation service."

## Fallback Mechanisms

When the Hive API is unavailable, the component:

1. Falls back to a mock implementation that simulates moderation results
2. Displays a "Demo Mode" notification to inform users
3. Continues to allow file uploads, ensuring functionality isn't blocked

## Development and Testing

For testing without using real API calls:

1. Set `useMockImplementation = true` in the API route
2. This will simulate moderation responses without calling the Hive API
3. Adjust the `shouldFlag` probability in the `provideMockResponse` function to test different scenarios

## Technical Design Choices

* **Server-side API Route**: Protects the API key and handles CORS issues
* **Base64 Encoding**: Ensures reliable image transmission to the Hive API
* **Stateful Tracking**: Monitors API failures to prevent repeated failed calls
* **Rate Limit Awareness**: Tracks and displays API usage to prevent quota issues
* **Graceful Degradation**: Maintains functionality even when moderation is unavailable
