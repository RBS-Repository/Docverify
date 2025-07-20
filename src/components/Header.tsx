'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  useEffect(() => {
    const handleScroll = () => {
      const header = document.getElementById('main-header');
      if (header) {
        if (window.scrollY > 10) {
          header.classList.add('shadow-md', 'bg-white/95', 'backdrop-blur-sm');
        } else {
          header.classList.remove('shadow-md', 'bg-white/95', 'backdrop-blur-sm');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle click outside profile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuRef]);

  // Handle logout
  async function handleLogout() {
    try {
      await logout();
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'History', href: '/history' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header id="main-header" className="fixed w-full top-0 z-50 bg-white transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-xl mr-3">
                DV
              </div>
              <span className="text-xl font-bold text-gray-900">DocVerify</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <NavLink 
                key={item.name} 
                href={item.href}
                active={pathname === item.href}
                className="text-gray-600 hover:text-gray-900"
              >
                {item.name}
              </NavLink>
            ))}
            
            {currentUser ? (
              <div className="ml-4 relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-medium text-sm">
                      {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Profile dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{currentUser.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Your Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-4 flex items-center space-x-2">
                <Link href="/login" className="px-4 py-2 text-primary-600 font-medium hover:text-primary-700">
                  Log in
                </Link>
                <Link href="/signup" className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <MobileNavLink
                  key={item.name}
                  href={item.href}
                  active={pathname === item.href}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </MobileNavLink>
              ))}
              
              {currentUser ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="text-primary-700 font-medium">
                        {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{currentUser.email}</p>
                    </div>
                  </div>
                  <MobileNavLink href="/profile" onClick={() => setIsMenuOpen(false)}>
                    Your Profile
                  </MobileNavLink>
                  <MobileNavLink href="/settings" onClick={() => setIsMenuOpen(false)}>
                    Settings
                  </MobileNavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 flex flex-col space-y-4">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-primary-600 font-medium hover:text-primary-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Update NavLink component to accept active prop
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

function NavLink({ href, children, active, className = '' }: NavLinkProps) {
  const isActive = active !== undefined ? active : false;
  return (
    <Link 
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive 
          ? 'text-primary-600 font-semibold' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      } ${className}`}
    >
      {children}
    </Link>
  );
}

// Update MobileNavLink component to accept active prop
interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}

function MobileNavLink({ href, children, onClick, active }: MobileNavLinkProps) {
  const isActive = active !== undefined ? active : false;
  return (
    <Link
      href={href}
      className={`block px-4 py-2 text-base font-medium rounded-md ${
        isActive ? 'bg-gray-100 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
} 