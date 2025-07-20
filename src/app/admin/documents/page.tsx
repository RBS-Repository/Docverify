'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  userId: string;
  createdAt: string;
  moderationStatus: 'pending' | 'safe' | 'flagged';
  moderationDetails?: {
    classes: Array<{ class: string; score: number }>;
  };
  user: {
    email: string;
    displayName?: string;
    photoURL?: string;
  };
}

interface PaginationData {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export default function AdminDocumentsPage() {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    currentPage: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get the ID token
        const token = await currentUser.getIdToken();
        
        // Build the query parameters
        const params = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: pagination.limit.toString(),
        });
        
        // Fetch documents
        const response = await fetch(`/api/admin/documents?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const data = await response.json();
        setDocuments(data.documents);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [currentUser, pagination.currentPage, pagination.limit]);

  // Filter documents based on search term and status
  const filteredDocuments = documents.filter(doc => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchLower) ||
      doc.id.toLowerCase().includes(searchLower) ||
      (doc.user.email && doc.user.email.toLowerCase().includes(searchLower)) ||
      (doc.user.displayName && doc.user.displayName.toLowerCase().includes(searchLower));
    
    const matchesStatus = 
      filterStatus === 'all' || 
      doc.moderationStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage,
      }));
    }
  };

  // Get document type icon
  const getDocumentTypeIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type === 'application/pdf') {
      return (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type.includes('word') || type.includes('document')) {
      return (
        <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      );
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Document Management</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Search and filters */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search documents by name or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="safe">Verified</option>
            <option value="flagged">Flagged</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      
      {/* Documents table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {getDocumentTypeIcon(doc.type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {doc.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {doc.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {doc.user.displayName || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.moderationStatus === 'safe' 
                            ? 'bg-green-100 text-green-800' 
                            : doc.moderationStatus === 'flagged'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {doc.moderationStatus === 'safe' 
                            ? 'Verified' 
                            : doc.moderationStatus === 'flagged'
                            ? 'Flagged'
                            : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.pages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Document detail modal */}
      {showModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Document Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Document Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name:</p>
                    <p className="text-gray-900">{selectedDocument.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID:</p>
                    <p className="text-gray-900">{selectedDocument.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type:</p>
                    <p className="text-gray-900">{selectedDocument.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Uploaded by:</p>
                    <p className="text-gray-900">
                      {selectedDocument.user.displayName || selectedDocument.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Upload date:</p>
                    <p className="text-gray-900">
                      {new Date(selectedDocument.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status:</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedDocument.moderationStatus === 'safe' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedDocument.moderationStatus === 'flagged'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedDocument.moderationStatus === 'safe' 
                        ? 'Verified' 
                        : selectedDocument.moderationStatus === 'flagged'
                        ? 'Flagged'
                        : 'Pending'}
                    </span>
                  </div>
                </div>
                
                {selectedDocument.moderationDetails && selectedDocument.moderationStatus === 'flagged' && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Moderation Details</h4>
                    <div className="bg-red-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-red-800">Flagged content:</p>
                      <ul className="mt-1 pl-5 text-sm list-disc space-y-1">
                        {selectedDocument.moderationDetails.classes
                          .filter(item => item.score > 0.7)
                          .map((item, index) => (
                            <li key={index} className="text-red-700">
                              {item.class} ({(item.score * 100).toFixed(1)}%)
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Document Preview</h3>
                {selectedDocument.type.startsWith('image/') ? (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={selectedDocument.url} 
                      alt={selectedDocument.name}
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-100 rounded-md">
                    <div className="text-center">
                      {getDocumentTypeIcon(selectedDocument.type)}
                      <p className="mt-2 text-sm text-gray-500">
                        Preview not available for this file type
                      </p>
                      <a 
                        href={selectedDocument.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                      >
                        Download Document
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 