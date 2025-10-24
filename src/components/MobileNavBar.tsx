'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User, Package } from 'lucide-react';
import { useCartItemCount, useCartDrawer } from '../lib/store/cartStore';
import { getCurrentUser, signInDemo } from '../lib/auth';

export default function MobileNavBar() {
  const pathname = usePathname();
  const itemCount = useCartItemCount();
  const { toggle: toggleCartDrawer } = useCartDrawer();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for current user on mount
    setUser(getCurrentUser());

    // Listen for auth changes
    const handleAuthChange = (event: CustomEvent) => {
      setUser(event.detail);
    };

    window.addEventListener('authChange', handleAuthChange as EventListener);
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange as EventListener);
    };
  }, []);

  const handleMobileSignIn = useCallback(async () => {
    try {
      await signInDemo();
    } catch (error) {
      console.error('Mobile sign in error:', error);
    }
  }, []);

  const navItems = useMemo(() => [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      name: 'Products',
      href: '/#products',
      icon: Package,
      isActive: pathname.includes('/products') || pathname.includes('/product')
    },
    {
      name: 'Cart',
      href: '#',
      icon: ShoppingCart,
      isActive: false,
      onClick: toggleCartDrawer,
      badge: itemCount > 0 ? (itemCount > 99 ? '99+' : itemCount.toString()) : null
    },
    {
      name: user ? 'Account' : 'Sign In',
      href: user ? '/account' : '#',
      icon: User,
      isActive: pathname.includes('/account'),
      onClick: !user ? handleMobileSignIn : undefined
    }
  ], [pathname, itemCount, toggleCartDrawer, user, handleMobileSignIn]);

  return (
    <>
      {/* Sticky Mobile Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        {/* Background with blur effect */}
        <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-4 h-16">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isButton = item.onClick;
              
              const baseClasses = `
                flex flex-col items-center justify-center space-y-1 p-2 h-full
                transition-all duration-200 active:scale-95
                ${item.isActive 
                  ? 'text-blue-600 bg-blue-50/80' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/40'
                }
              `.trim().replace(/\s+/g, ' ');

              const content = (
                <>
                  <div className="relative">
                    <IconComponent className="h-5 w-5" />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate w-full text-center">
                    {item.name}
                  </span>
                </>
              );

              if (isButton) {
                return (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className={baseClasses}
                    type="button"
                    aria-label={item.name}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={baseClasses}
                  aria-label={item.name}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="bg-white/95 backdrop-blur-md h-1" />
      </div>
    </>
  );
}