import React, { useState } from 'react';
import { useCartStore } from '../lib/store/cartStore';

const CheckoutFormSimple: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Use only basic Zustand store - no complex selectors
    const items = useCartStore(state => state.items);
    const total = useCartStore(state => state.total);
    const clearCart = useCartStore(state => state.clearCart);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!items || items.length === 0) {
            alert('Your cart is empty')
            return
        }

        try {
            // Just clear cart for now - simplified
            clearCart()
            alert('Order submitted successfully!')
        } catch (err) {
            console.error('Checkout error', err)
            alert('Checkout failed')
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Simple Cart Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-gray-500 ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-medium">
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Customer Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                >
                    Complete Purchase
                </button>
            </form>
        </div>
    );
};

export default CheckoutFormSimple;