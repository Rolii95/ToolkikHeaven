'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, X, ShoppingCart } from 'lucide-react';

interface CartNotification {
  id: string;
  productName: string;
  productImage: string;
  timestamp: number;
}

export default function CartNotifications() {
  const [notifications, setNotifications] = useState<CartNotification[]>([]);

  useEffect(() => {
    const handleCartItemAdded = (event: CustomEvent) => {
      const { item } = event.detail;
      
      const notification: CartNotification = {
        id: `${Date.now()}-${Math.random()}`,
        productName: item.name,
        productImage: item.imageUrl,
        timestamp: Date.now(),
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-remove notification after 4 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 4000);
    };

    // Listen for cart item added events
    window.addEventListener('cartItemAdded', handleCartItemAdded as EventListener);

    return () => {
      window.removeEventListener('cartItemAdded', handleCartItemAdded as EventListener);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white rounded-lg shadow-lg border border-green-200 p-4 min-w-[300px] transform transition-all duration-300 ease-out animate-slideIn"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Added to cart!
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {notification.productName}
                  </p>
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="ml-2 flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              
              <div className="mt-2 flex items-center space-x-2">
                <img
                  src={notification.productImage}
                  alt=""
                  className="w-8 h-8 rounded object-cover"
                />
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <ShoppingCart className="h-3 w-3" />
                  <span>Item added successfully</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}