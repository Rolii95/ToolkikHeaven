'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Menu } from 'lucide-react';
import AuthButton from './AuthButton';
import CartDrawer from './CartDrawer';
import SearchInput from './SearchInput';
import { useCartItemCount, useCartDrawer } from '../lib/store/cartStore';

export default function Header() {
  const router = useRouter();
  const itemCount = useCartItemCount();
  const { toggle: toggleCartDrawer } = useCartDrawer();

  const handleSearchResultSelect = useCallback((productId: string) => {
    router.push(`/product/${productId}`);
  }, [router]);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">Aurora</span>
                <span className="text-2xl font-bold text-gray-900 ml-1">Commerce</span>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <SearchInput 
                placeholder="Search products..."
                onResultSelect={handleSearchResultSelect}
                className="w-full"
              />
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex space-x-6">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/#products" 
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Products
              </Link>
              <button
                onClick={toggleCartDrawer}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Cart
              </button>
              <Link 
                href="/checkout" 
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Checkout
              </Link>
            </nav>

            {/* Action buttons */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <AuthButton />
              </div>
              
              {/* Cart Button with Live Count */}
              <button
                onClick={toggleCartDrawer}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors group"
                title={`Shopping cart (${itemCount} items)`}
              >
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
                {itemCount === 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-300 text-gray-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    0
                  </span>
                )}
              </button>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button className="text-gray-600 hover:text-gray-900">
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <SearchInput 
              placeholder="Search products..."
              onResultSelect={handleSearchResultSelect}
              className="w-full"
            />
          </div>
        </div>
      </header>
      
      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}