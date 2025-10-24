import React, { useState } from 'react';
import { useCart } from '../lib/cart';

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

    const { items, total, clearCart } = useCart();

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
                body: JSON.stringify({ items, customer: { name: formData.name, email: formData.email }, total })
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
                    items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
                    customerEmail: formData.email,
                    metadata: { order_id: orderId }
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold">Checkout</h2>
            <div>
                <label className="block">Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">Address</label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">City</label>
                <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">Postal Code</label>
                <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">Country</label>
                <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">Card Number</label>
                <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">Card Expiry</label>
                <input
                    type="text"
                    name="cardExpiry"
                    value={formData.cardExpiry}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <div>
                <label className="block">Card CVC</label>
                <input
                    type="text"
                    name="cardCvc"
                    value={formData.cardCvc}
                    onChange={handleChange}
                    required
                    className="border p-2 w-full"
                />
            </div>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded">
                Complete Purchase
            </button>
        </form>
    );
};

export default CheckoutForm;