import { Metadata } from 'next';
import AdminOrdersDashboard from '@/components/AdminOrdersDashboard';

export const metadata: Metadata = {
  title: 'Order Management - Aurora Commerce Admin',
  description: 'Manage and prioritize orders for optimal fulfillment. Track high-value orders, express shipping, and VIP customers.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminOrdersDashboard />
    </div>
  );
}