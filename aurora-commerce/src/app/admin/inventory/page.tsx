import { Metadata } from 'next';
import InventoryDashboard from '@/components/InventoryDashboard';

export const metadata: Metadata = {
  title: 'Inventory Management - Aurora Commerce Admin',
  description: 'Monitor stock levels, manage inventory alerts, and configure threshold settings for Aurora Commerce.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function InventoryAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <InventoryDashboard />
    </div>
  );
}