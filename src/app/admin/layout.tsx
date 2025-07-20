'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the user is authenticated
    if (!authLoading) {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Check if the user is an admin
      const checkAdminStatus = async () => {
        try {
          // Get the ID token
          const token = await currentUser.getIdToken();
          
          // Call the admin API to check if the user is an admin
          const response = await fetch('/api/admin/users', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            setIsAdmin(true);
          } else {
            // If the user is not an admin, redirect to the dashboard
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push('/dashboard');
        } finally {
          setLoading(false);
        }
      };
      
      checkAdminStatus();
    }
  }, [currentUser, authLoading, router]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If not admin, don't render anything (redirect is handled in the useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex flex-grow pt-24">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-gray-800 text-white p-4">
          <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
          
          <nav className="space-y-2">
            <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-700">
              Dashboard
            </Link>
            <Link href="/admin/users" className="block px-4 py-2 rounded hover:bg-gray-700">
              Users
            </Link>
            <Link href="/admin/documents" className="block px-4 py-2 rounded hover:bg-gray-700">
              Documents
            </Link>
            <Link href="/admin/settings" className="block px-4 py-2 rounded hover:bg-gray-700">
              Settings
            </Link>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-grow p-6 bg-gray-100">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
} 