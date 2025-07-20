'use client';

import { useState } from 'react';
import Image from 'next/image';

// Mock data for demo purposes
const MOCK_HISTORY = [
  {
    id: '1',
    filename: 'passport.jpg',
    type: 'image/jpeg',
    timestamp: new Date('2023-08-15T14:32:00'),
    status: 'authentic',
    thumbnail: null
  },
  {
    id: '2',
    filename: 'driver_license.jpg',
    type: 'image/jpeg',
    timestamp: new Date('2023-08-10T09:15:00'),
    status: 'fake',
    thumbnail: null
  },
  {
    id: '3',
    filename: 'invoice.pdf',
    type: 'application/pdf',
    timestamp: new Date('2023-08-05T16:45:00'),
    status: 'authentic',
    thumbnail: null
  },
  {
    id: '4',
    filename: 'certificate.png',
    type: 'image/png',
    timestamp: new Date('2023-07-28T11:20:00'),
    status: 'authentic',
    thumbnail: null
  },
  {
    id: '5',
    filename: 'contract.pdf',
    type: 'application/pdf',
    timestamp: new Date('2023-07-20T15:10:00'),
    status: 'suspicious',
    thumbnail: null
  }
];

type HistoryItem = typeof MOCK_HISTORY[0];

export default function UserHistory() {
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [history] = useState<HistoryItem[]>(MOCK_HISTORY);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredHistory = history.filter(item => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const handleItemClick = (item: HistoryItem) => {
    setSelectedItem(item);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authentic':
        return 'bg-green-100 text-green-800';
      case 'fake':
        return 'bg-red-100 text-red-800';
      case 'suspicious':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* History list section */}
        <div className="w-full md:w-2/5 mb-6 md:mb-0">
          <div className="card overflow-visible">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Document History
              </h3>
              <div>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                >
                  <option value="all">All Status</option>
                  <option value="authentic">Authentic</option>
                  <option value="fake">Fake</option>
                  <option value="suspicious">Suspicious</option>
                </select>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
              {filteredHistory.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No documents found with the selected filter.
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden relative">
                        {item.type.startsWith('image/') ? (
                          item.thumbnail ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={item.thumbnail}
                                alt={item.filename}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                              </svg>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.timestamp)}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Detail view section */}
        <div className="w-full md:w-3/5">
          <div className="card h-full">
            {selectedItem ? (
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedItem.filename}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                  </span>
                </div>
                
                <div className="mb-6">
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center mb-4">
                    {selectedItem.type.startsWith('image/') ? (
                      selectedItem.thumbnail ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={selectedItem.thumbnail}
                            alt={selectedItem.filename}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </div>
                      )
                    ) : (
                      <div className="text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">File Type</h4>
                      <p className="text-sm text-gray-900">{selectedItem.type}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Verification Date</h4>
                      <p className="text-sm text-gray-900">{formatDate(selectedItem.timestamp)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Verification Results</h4>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center mb-2">
                        {selectedItem.status === 'authentic' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500 mr-2">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                          </svg>
                        ) : selectedItem.status === 'fake' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 mr-2">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-yellow-500 mr-2">
                            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="font-medium text-gray-900">
                          {selectedItem.status === 'authentic' 
                            ? 'Document appears to be authentic' 
                            : selectedItem.status === 'fake'
                            ? 'Document appears to be fake'
                            : 'Document has suspicious elements'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedItem.status === 'authentic' 
                          ? 'Our analysis indicates this document is legitimate with no detectable alterations or inconsistencies.'
                          : selectedItem.status === 'fake'
                          ? 'Our analysis has detected significant inconsistencies indicating this document has been manipulated or falsified.'
                          : 'Our analysis has detected some inconsistencies that require further verification.'}
                      </p>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button className="btn btn-outline">
                        Download Report
                      </button>
                      <button className="btn btn-primary">
                        Verify Again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-20 h-20 text-gray-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a document to view details
                </h3>
                <p className="text-sm text-gray-500">
                  Click on any document from your history to see verification results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}