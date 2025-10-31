import React from 'react';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNavBar from '../components/MobileNavBar';
import CartNotifications from '../components/CartNotifications';
import WebVitalsReporter from '../components/WebVitalsReporter';
import PerformanceDashboard from '../components/PerformanceDashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import ToastProvider from '../components/ToastProvider';
import ChatWidget from '../components/ChatWidget';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://aurora-commerce.com'),
  title: {
    default: 'Aurora Commerce - Smart E-commerce Platform',
    template: '%s | Aurora Commerce',
  },
  description: 'Discover amazing products with smart pricing and fast delivery. Shop electronics, clothing, furniture and more with free shipping on orders over $150.',
  keywords: [
    'e-commerce',
    'online shopping',
    'electronics',
    'clothing',
    'furniture',
    'free shipping',
    'smart pricing',
    'aurora commerce',
  ],
  authors: [{ name: 'Aurora Commerce Team' }],
  creator: 'Aurora Commerce',
  publisher: 'Aurora Commerce',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aurora-commerce.com',
    siteName: 'Aurora Commerce',
    title: 'Aurora Commerce - Smart E-commerce Platform',
    description: 'Discover amazing products with smart pricing and fast delivery. Shop electronics, clothing, furniture and more.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Aurora Commerce - Smart E-commerce Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aurora Commerce - Smart E-commerce Platform',
    description: 'Discover amazing products with smart pricing and fast delivery.',
    images: ['/og-image.jpg'],
    creator: '@auroracommerce',
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual verification code
    yandex: 'yandex-verification-code', // Replace with actual verification code
    yahoo: 'yahoo-site-verification-code', // Replace with actual verification code
  },
  alternates: {
    canonical: 'https://aurora-commerce.com',
  },
  category: 'shopping',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Organization structured data for SEO
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Aurora Commerce",
    "description": "Smart e-commerce platform with amazing products and fast delivery",
    "url": "https://aurora-commerce.com",
    "logo": "https://aurora-commerce.com/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-AURORA",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Commerce Street",
      "addressLocality": "E-commerce City",
      "addressRegion": "Digital State",
      "postalCode": "12345",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://facebook.com/auroracommerce",
      "https://twitter.com/auroracommerce",
      "https://instagram.com/auroracommerce"
    ]
  };

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aurora Commerce",
    "url": "https://aurora-commerce.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://aurora-commerce.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Favicons and Icons */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Meta tags */}
        <meta name="theme-color" content="#3B82F6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
        {/* Website Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-gray-50">
        <ErrorBoundary>
          <ToastProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <MobileNavBar />
            <CartNotifications />
            <WebVitalsReporter />
            <PerformanceDashboard />
            <ChatWidget 
              position="bottom-right"
              theme="light"
              companyName="Aurora Commerce"
              supportEmail="support@auroracommerce.com"
              supportPhone="+1 (555) 123-4567"
            />
          </ToastProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}