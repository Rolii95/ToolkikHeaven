import React, { useState } from 'react';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic, such as sending data to the backend
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