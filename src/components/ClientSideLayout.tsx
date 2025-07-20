'use client';

import { useEffect } from 'react';

export default function ClientSideLayout({
  children,
  className
}: {
  children: React.ReactNode;
  className: string;
}) {
  useEffect(() => {
    // Remove any problematic inline styles
    document.body.style.removeProperty('z-index');
    
    // Log body attributes for debugging
    console.log('Body attributes:', {
      class: document.body.className,
      style: document.body.style.cssText,
      attributes: Array.from(document.body.attributes).map(attr => `${attr.name}=${attr.value}`).join(', ')
    });
  }, []);

  return (
    <div className={className} suppressHydrationWarning>
      {children}
    </div>
  );
} 