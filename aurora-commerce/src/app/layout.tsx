import React from 'react';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MobileNavBar from '../components/MobileNavBar';
import CartNotifications from '../components/CartNotifications';
import WebVitalsReporter from '../components/WebVitalsReporter';
import PerformanceDashboard from '../components/PerformanceDashboard';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aurora Commerce - Smart E-commerce Platform',
  description: 'Discover amazing products with smart pricing and fast delivery',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <MobileNavBar />
        <CartNotifications />
        <WebVitalsReporter />
        <PerformanceDashboard />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}