'use client';

import { useAuth } from '@/contexts/AuthContext';
import DocumentUploader from '@/components/DocumentUploader';
import UserHistory from '@/components/UserHistory';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function Home() {
  const { currentUser } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-28 pb-16">
        <section className="bg-gradient-to-b from-white to-gray-50 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Verify Documents & Images Instantly
              </h1>
              <p className="text-lg text-gray-600">
                Upload a document or take a photo to verify its authenticity in seconds. 
                Our AI-powered system detects fake documents with high accuracy.
              </p>
              
              {!currentUser && (
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                  <Link 
                    href="/signup" 
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-full font-medium transform transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
                  >
                    Get Started - It&apos;s Free
                  </Link>
                  <Link 
                    href="/login" 
                    className="bg-white text-primary-600 border border-primary-200 px-8 py-3 rounded-full font-medium transition-all duration-300 hover:bg-primary-50"
                  >
                    Login to Your Account
                  </Link>
                </div>
              )}
            </div>
            
            {/* Document Uploader - available for all users */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                {currentUser ? (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                        Upload Document or Use Camera
                      </h2>
                      <DocumentUploader />
                    </div>
                    
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                        Verification History
                      </h2>
                      <UserHistory />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
                        Try Document Verification - No Login Required
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Upload a document to see our verification technology in action. 
                        Create an account to save your verification history.
                      </p>
                      <DocumentUploader />
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3">
                        Want to save your verification history?
                      </h3>
                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link 
                          href="/signup" 
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg font-medium"
                        >
                          Create Account
                        </Link>
                        <Link 
                          href="/login" 
                          className="bg-white text-primary-600 border border-primary-200 px-6 py-2 rounded-lg font-medium hover:bg-primary-50"
                        >
                          Sign In
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-12 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  How It Works
                </h2>
                <p className="text-lg text-gray-600">
                  Our advanced verification system uses AI to analyze documents and images for authenticity
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    1. Upload or Capture
                  </h3>
                  <p className="text-gray-600">
                    Upload a document from your device or capture a new image using your camera
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    2. Analysis
                  </h3>
                  <p className="text-gray-600">
                    Our AI system analyzes the document for tampering, inconsistencies, and authenticity markers
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    3. Verification Result
                  </h3>
                  <p className="text-gray-600">
                    Get instant verification results showing if the document is authentic, fake, or suspicious
                  </p>
                </div>
              </div>
            </div>
        </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
