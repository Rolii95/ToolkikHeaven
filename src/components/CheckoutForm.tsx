import React, { useState, useMemo } from 'react';
import { useCartStore, useHasDigitalProducts, useHasPhysicalProducts, useDigitalCartItems, usePhysicalCartItems, useIsDigitalOnly } from '../lib/store/cartStore';

const CheckoutForm: React.FC = () => {
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

    // Use Zustand store
    const items = useCartStore(state => state.items);
    const total = useCartStore(state => state.total);
    const clearCart = useCartStore(state => state.clearCart);
    
    // Digital product analysis using Zustand selectors
    const hasDigitalProducts = useHasDigitalProducts();
    const hasPhysicalProducts = useHasPhysicalProducts();
    const digitalItems = useDigitalCartItems();
    const physicalItems = usePhysicalCartItems();
    const isDigitalOnly = useIsDigitalOnly();

    const cartAnalysis = {
        hasDigitalProducts,
        hasPhysicalProducts,
        digitalItems,
        physicalItems,
        isDigitalOnly,
        isMixed: hasDigitalProducts && hasPhysicalProducts
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!items || items.length === 0) {
            alert('Your cart is empty')
            return
        }

        try {
            // Create a draft order server-side to reserve an order id
            const draftRes = await fetch('/api/orders/create-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items, 
                    customer: { name: formData.name, email: formData.email }, 
                    total,
                    isDigitalOnly: cartAnalysis.isDigitalOnly,
                    digitalItems: cartAnalysis.digitalItems,
                    physicalItems: cartAnalysis.physicalItems
                })
            })
            const draftJson = await draftRes.json()
            if (!draftRes.ok) {
                console.error('Draft order creation failed', draftJson)
                alert('Failed to create order. Try again.')
                return
            }

            const orderId = draftJson.orderId

            // Request a Stripe Checkout session and redirect
            const paymentRes = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(i => ({ 
                        name: i.name, 
                        price: i.price, 
                        quantity: i.quantity,
                        isDigital: i.isDigital || i.product?.isDigital || false
                    })),
                    customerEmail: formData.email,
                    metadata: { 
                        order_id: orderId,
                        is_digital_only: cartAnalysis.isDigitalOnly,
                        has_digital_products: cartAnalysis.hasDigitalProducts
                    }
                })
            })

            const paymentJson = await paymentRes.json()
            if (!paymentRes.ok || !paymentJson.url) {
                console.error('Failed to create Stripe session', paymentJson)
                alert('Payment initialization failed')
                return
            }

            // Clear cart locally (optional) and redirect to Stripe
            clearCart()
            window.location.href = paymentJson.url

        } catch (err) {
            console.error('Checkout error', err)
            alert('Checkout failed')
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Cart Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                {/* Digital Products Section */}
                {cartAnalysis.hasDigitalProducts && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg font-semibold text-blue-600">⚡ Digital Products</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Instant Download
                            </span>
                        </div>
                        <div className="space-y-2">
                            {cartAnalysis.digitalItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <div>
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-gray-500 ml-2">x{item.quantity}</span>
                                        <div className="text-xs text-gray-500">
                                            {item.fileFormat} • {item.licenseType} license
                                        </div>
                                    </div>
                                    <span className="font-medium">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Physical Products Section */}
                {cartAnalysis.hasPhysicalProducts && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg font-semibold text-gray-700">📦 Physical Products</span>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                Shipping Required
                            </span>
                        </div>
                        <div className="space-y-2">
                            {cartAnalysis.physicalItems.map((item, index) => (
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
                    </div>
                )}

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
                            {cartAnalysis.hasDigitalProducts && (
                                <p className="text-sm text-gray-500 mt-1">
                                    📧 Digital download links will be sent to this email
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Shipping Information - Only for Physical Products */}
                {cartAnalysis.hasPhysicalProducts && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required={cartAnalysis.hasPhysicalProducts}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required={cartAnalysis.hasPhysicalProducts}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                                <input
                                    type="text"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                    required={cartAnalysis.hasPhysicalProducts}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    required={cartAnalysis.hasPhysicalProducts}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Digital-Only Benefits */}
                {cartAnalysis.isDigitalOnly && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                            <span>⚡</span>
                            <span>Digital-Only Benefits</span>
                        </div>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Instant access after payment</li>
                            <li>• No shipping fees</li>
                            <li>• Immediate download links</li>
                            <li>• Eco-friendly delivery</li>
                        </ul>
                    </div>
                )}

                {/* Payment Information */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Payment Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                            <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleChange}
                                required
                                placeholder="1234 5678 9012 3456"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                            <input
                                type="text"
                                name="cardExpiry"
                                value={formData.cardExpiry}
                                onChange={handleChange}
                                required
                                placeholder="MM/YY"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CVC *</label>
                            <input
                                type="text"
                                name="cardCvc"
                                value={formData.cardCvc}
                                onChange={handleChange}
                                required
                                placeholder="123"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                >
                    {cartAnalysis.isDigitalOnly 
                        ? '💾 Complete Purchase & Download' 
                        : cartAnalysis.hasDigitalProducts 
                        ? '🛒 Complete Purchase (Digital + Physical)' 
                        : '🛒 Complete Purchase'
                    }
                </button>

                {/* Security Notice */}
                <div className="text-center text-sm text-gray-500">
                    <p>🔒 Your payment information is secure and encrypted</p>
                    {cartAnalysis.hasDigitalProducts && (
                        <p className="mt-1">⚡ Digital products will be available immediately after payment</p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CheckoutForm;