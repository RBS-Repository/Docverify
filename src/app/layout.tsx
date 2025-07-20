import { Inter } from 'next/font/google';
import ClientSideLayout from '@/components/ClientSideLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'DocVerify - Document Authentication Platform',
  description: 'Verify the authenticity of documents and images using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full light">
      <body className={`${inter.variable}`} suppressHydrationWarning={true}>
        <ClientSideLayout className="flex flex-col min-h-screen bg-white text-gray-900">
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientSideLayout>
      </body>
    </html>
  );
} 