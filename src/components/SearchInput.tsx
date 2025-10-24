'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useSearch } from '../lib/hooks/useSearch';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (productId: string) => void;
}

export default function SearchInput({ 
  placeholder = "Search products...",
  className = "",
  onResultSelect
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    results,
    isLoading,
    error,
    isOpen,
    setQuery,
    openSearch,
    closeSearch
  } = useSearch({
    delay: 300,
    minLength: 2,
    maxResults: 8
  });

  // Store functions in refs to avoid dependency issues
  const openSearchRef = useRef(openSearch);
  const closeSearchRef = useRef(closeSearch);
  openSearchRef.current = openSearch;
  closeSearchRef.current = closeSearch;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        openSearchRef.current();
      }

      // Escape to close search
      if (event.key === 'Escape' && isOpen) {
        closeSearchRef.current();
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]); // Only depend on isOpen

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, [setQuery]);

  const handleInputFocus = useCallback(() => {
    if (query.length >= 2) {
      openSearch();
    }
  }, [query.length, openSearch]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    closeSearch();
    inputRef.current?.focus();
  }, [setQuery, closeSearch]);

  const handleResultClick = useCallback((productId: string) => {
    closeSearch();
    onResultSelect?.(productId);
  }, [closeSearch, onResultSelect]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-2 
            bg-white border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            placeholder-gray-400 text-gray-900
            transition-all duration-200
          "
        />

        {/* Loading or Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClearSearch}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="text-xs text-gray-400 hidden sm:block">
              ⌘K
            </div>
          )}
        </div>
      </div>

      {/* Search Results Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeSearch}
          />
          
          {/* Results Panel */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
            {error ? (
              <div className="p-4 text-center text-red-600">
                <p>{error}</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleResultClick(product.id)}
                    className="
                      w-full px-4 py-3 text-left hover:bg-gray-50 
                      focus:bg-gray-50 focus:outline-none
                      border-b border-gray-100 last:border-b-0
                      transition-colors duration-150
                    "
                  >
                    <div className="flex items-center space-x-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {product.category}
                        </p>
                      </div>
                      
                      {/* Price */}
                      <div className="flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 && !isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p>No products found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}