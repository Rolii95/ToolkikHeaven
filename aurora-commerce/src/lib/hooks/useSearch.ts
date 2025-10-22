import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '@/types';

interface UseSearchOptions {
  delay?: number;
  minLength?: number;
  maxResults?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const {
    delay = 300,
    minLength = 2,
    maxResults = 10
  } = options;

  // Use separate state variables instead of a single object
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxResults}`,
        {
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const searchResults = await response.json();

      setResults(searchResults);
      setIsLoading(false);
      setError(null);
    } catch (error: any) {
      // Don't set error state if request was aborted
      if (error.name !== 'AbortError') {
        setResults([]);
        setIsLoading(false);
        setError('Search failed. Please try again.');
      }
    }
  }, [minLength, maxResults]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setIsOpen(newQuery.length >= minLength);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce
    debounceRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, delay);
  }, [delay, minLength, performSearch]);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQueryState('');
    setResults([]);
    setError(null);

    // Clear any pending search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    results,
    isLoading,
    error,
    isOpen,
    setQuery,
    openSearch,
    closeSearch,
    clearResults
  };
}