'use client';

import React, { useState, useEffect } from 'react';

interface OrderNotification {
  id: string;
  customerName: string;
  product: string;
  location: string;
  timeAgo: string;
  amount?: number;
  type: 'purchase' | 'review' | 'signup';
}

const LiveOrderFeed: React.FC = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Check if user previously closed the widget
  useEffect(() => {
    const wasClosed = localStorage.getItem('orderFeedClosed');
    if (wasClosed === 'true') {
      // Show again after 30 minutes
      const closedTime = localStorage.getItem('orderFeedClosedTime');
      if (closedTime) {
        const thirtyMinutes = 30 * 60 * 1000;
        const timeSinceClosed = Date.now() - parseInt(closedTime);
        if (timeSinceClosed < thirtyMinutes) {
          setIsVisible(false);
        } else {
          // Reset after 30 minutes
          localStorage.removeItem('orderFeedClosed');
          localStorage.removeItem('orderFeedClosedTime');
        }
      }
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('orderFeedClosed', 'true');
    localStorage.setItem('orderFeedClosedTime', Date.now().toString());
  };

  // Mock data for demo purposes
  const mockNotifications: OrderNotification[] = [
    {
      id: '1',
      customerName: 'Sarah M.',
      product: 'MacBook Air M3',
      location: 'New York, NY',
      timeAgo: '2 minutes ago',
      amount: 1299,
      type: 'purchase'
    },
    {
      id: '2',
      customerName: 'John D.',
      product: 'iPhone 15 Pro',
      location: 'Los Angeles, CA',
      timeAgo: '5 minutes ago',
      amount: 999,
      type: 'purchase'
    },
    {
      id: '3',
      customerName: 'Emma K.',
      product: 'Digital Marketing Course',
      location: 'Chicago, IL',
      timeAgo: '8 minutes ago',
      type: 'review'
    },
    {
      id: '4',
      customerName: 'Mike R.',
      product: 'Gaming Monitor',
      location: 'Houston, TX',
      timeAgo: '12 minutes ago',
      amount: 349,
      type: 'purchase'
    },
    {
      id: '5',
      customerName: 'Lisa P.',
      product: 'Wireless Headphones',
      location: 'Phoenix, AZ',
      timeAgo: '15 minutes ago',
      amount: 199,
      type: 'purchase'
    },
    {
      id: '6',
      customerName: 'David W.',
      product: 'Newsletter',
      location: 'Philadelphia, PA',
      timeAgo: '18 minutes ago',
      type: 'signup'
    },
    {
      id: '7',
      customerName: 'Jennifer L.',
      product: 'Office Chair',
      location: 'San Antonio, TX',
      timeAgo: '22 minutes ago',
      amount: 299,
      type: 'purchase'
    },
    {
      id: '8',
      customerName: 'Alex T.',
      product: 'Coffee Maker',
      location: 'San Diego, CA',
      timeAgo: '25 minutes ago',
      amount: 89,
      type: 'purchase'
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setNotifications(mockNotifications);

    // Simulate new notifications appearing every 10-15 seconds
    const interval = setInterval(() => {
      const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      const newNotification = {
        ...randomNotification,
        id: Date.now().toString(),
        timeAgo: 'Just now'
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 7)]); // Keep only latest 8
    }, 12000); // Show new notification every 12 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-cycle through notifications
    if (notifications.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % notifications.length);
      }, 4000); // Change every 4 seconds

      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case 'signup':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">•</span>
          </div>
        );
    }
  };

  const getMessage = (notification: OrderNotification) => {
    switch (notification.type) {
      case 'purchase':
        return `purchased ${notification.product}`;
      case 'review':
        return `left a review for ${notification.product}`;
      case 'signup':
        return `joined our newsletter`;
      default:
        return `interacted with ${notification.product}`;
    }
  };

  if (!isVisible || notifications.length === 0) return null;

  const currentNotification = notifications[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-50 transition-all duration-500 ease-in-out sm:block hidden">
      {/* Main notification bubble */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm relative transition-all duration-300 ease-in-out transform hover:scale-105">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Live Activity</span>
        </div>

        {/* Notification content */}
        <div className="flex items-start space-x-3">
          {getIcon(currentNotification.type)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 mb-1">
              <span className="font-semibold text-gray-900 text-sm">
                {currentNotification.customerName}
              </span>
              <span className="text-sm text-gray-600">
                {getMessage(currentNotification)}
              </span>
            </div>
            
            {currentNotification.amount && (
              <div className="text-sm font-medium text-green-600 mb-1">
                ${currentNotification.amount}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{currentNotification.location}</span>
              </span>
              <span>{currentNotification.timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex space-x-1 mt-3">
          {notifications.slice(0, 5).map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                index === currentIndex % 5 ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Verification badge */}
      <div className="mt-2 flex items-center justify-center">
        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Verified Purchases</span>
        </div>
      </div>

      {/* Social proof counter */}
      <div className="mt-2 text-center">
        <div className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full inline-block">
          <span className="font-medium">{notifications.length + 145}</span> orders in the last 24 hours
        </div>
      </div>
    </div>
  );
};

export default LiveOrderFeed;