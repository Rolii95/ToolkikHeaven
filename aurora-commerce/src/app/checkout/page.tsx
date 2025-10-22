import React from 'react';
import CheckoutForm from '@/components/CheckoutForm';

const CheckoutPage = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Checkout</h1>
            <CheckoutForm />
        </div>
    );
};

export default CheckoutPage;