"use client";

import CheckoutForm from "../../components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <CheckoutForm />
      </div>
    </main>
  );
}
