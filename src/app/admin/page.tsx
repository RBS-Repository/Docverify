'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalUsers: number;
  totalDocuments: number;
  verifiedDocuments: number;
  flaggedDocuments: number;
  newUsersToday: number;
  newDocumentsToday: number;
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDocuments: 0,
    verifiedDocuments: 0,
    flaggedDocuments: 0,
    newUsersToday: 0,
    newDocumentsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get the ID token
        const token = await currentUser.getIdToken();
        
        // Fetch users
        const usersResponse = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const usersData = await usersResponse.json();
        
        // Fetch documents
        const documentsResponse = await fetch('/api/admin/documents', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!documentsResponse.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const documentsData = await documentsResponse.json();
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const newUsersToday = usersData.users.filter((user: any) => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= today;
        }).length;
        
        const newDocumentsToday = documentsData.documents.filter((doc: any) => {
          const createdAt = new Date(doc.createdAt);
          return createdAt >= today;
        }).length;
        
        const verifiedDocuments = documentsData.documents.filter((doc: any) => 
          doc.moderationStatus === 'safe'
        ).length;
        
        const flaggedDocuments = documentsData.documents.filter((doc: any) => 
          doc.moderationStatus === 'flagged'
        ).length;
        
        setStats({
          totalUsers: usersData.users.length,
          totalDocuments: documentsData.documents.length,
          verifiedDocuments,
          flaggedDocuments,
          newUsersToday,
          newDocumentsToday,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        setError('Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [currentUser]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
              <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 mt-2">+{stats.newUsersToday} today</p>
            </div>
            
            {/* Total Documents */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Documents</h3>
              <p className="text-3xl font-bold mt-2">{stats.totalDocuments}</p>
              <p className="text-sm text-green-600 mt-2">+{stats.newDocumentsToday} today</p>
            </div>
            
            {/* Document Status */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Document Status</h3>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="text-xl font-bold text-green-600">{stats.verifiedDocuments}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Flagged</p>
                  <p className="text-xl font-bold text-red-600">{stats.flaggedDocuments}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {stats.totalDocuments - stats.verifiedDocuments - stats.flaggedDocuments}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <p className="text-gray-500">
              {stats.newDocumentsToday > 0 ? (
                <>{stats.newDocumentsToday} new documents uploaded today.</>
              ) : (
                <>No new documents uploaded today.</>
              )}
            </p>
            <p className="text-gray-500 mt-2">
              {stats.newUsersToday > 0 ? (
                <>{stats.newUsersToday} new users registered today.</>
              ) : (
                <>No new users registered today.</>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
} 