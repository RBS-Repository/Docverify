'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DocumentUploader from '@/components/DocumentUploader';

// Define types
interface Document {
  id: string;
  name: string;
  status: 'verified' | 'pending' | 'rejected';
  date: string;
}

interface DashboardStats {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
}

export default function Dashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalDocuments: 0,
    verifiedDocuments: 0,
    pendingDocuments: 0,
    rejectedDocuments: 0
  });

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }
    
    // Fetch user's documents and stats
    // This would typically connect to your API
    if (currentUser) {
      // Mock data for now
      setRecentDocuments([
        { id: '1', name: 'Contract.pdf', status: 'verified', date: '2023-06-15' },
        { id: '2', name: 'Invoice.pdf', status: 'pending', date: '2023-06-14' },
        { id: '3', name: 'Agreement.docx', status: 'rejected', date: '2023-06-12' },
      ]);
      
      setDashboardStats({
        totalDocuments: 15,
        verifiedDocuments: 8,
        pendingDocuments: 5,
        rejectedDocuments: 2
      });
    }
  }, [currentUser, authLoading, router]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Don't render anything if not authenticated (during redirect)
  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow pt-28 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          
          <div className="welcome-section mb-8">
            <h2 className="text-2xl font-semibold mb-2">
              Welcome, {currentUser.displayName || currentUser.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-gray-600">Here&apos;s an overview of your document verification activity</p>
          </div>
          
          <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stat-card bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-gray-500 text-sm font-medium">Total Documents</h3>
              <p className="text-3xl font-bold mt-2">{dashboardStats.totalDocuments}</p>
            </div>
            
            <div className="stat-card bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-gray-500 text-sm font-medium">Verified</h3>
              <p className="text-3xl font-bold mt-2 text-green-600">{dashboardStats.verifiedDocuments}</p>
            </div>
            
            <div className="stat-card bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
              <p className="text-3xl font-bold mt-2 text-yellow-600">{dashboardStats.pendingDocuments}</p>
            </div>
            
            <div className="stat-card bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-gray-500 text-sm font-medium">Rejected</h3>
              <p className="text-3xl font-bold mt-2 text-red-600">{dashboardStats.rejectedDocuments}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4">Recent Documents</h2>
                
                {recentDocuments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td className="px-4 py-4 whitespace-nowrap">{doc.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                                doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{doc.date}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button className="text-primary-600 hover:text-primary-900 mr-3">View</button>
                              <button className="text-gray-600 hover:text-gray-900">Download</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No documents found.</p>
                )}
                
                <div className="mt-4 text-right">
                  <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                    View All Documents →
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-md h-full">
                <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
                <p className="text-gray-600 mb-4">
                  Upload a document to verify its authenticity and check for potential issues.
                </p>
                
                <DocumentUploader />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 