'use client';

import React from 'react';
import { useCart } from '../lib/cart'; // Assuming you have a cart context or hook

const Cart: React.FC = () => {
    const { items, total, removeItem } = useCart();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
            {items.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div>
                    <ul className="space-y-4">
                        {items.map(item => (
                            <li key={item.id} className="flex justify-between items-center border-b pb-2">
                                <div>
                                    <h2 className="text-lg">{item.name}</h2>
                                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center">
                                    <button 
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <h2 className="text-xl font-bold">Total: ${total.toFixed(2)}</h2>
                        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;