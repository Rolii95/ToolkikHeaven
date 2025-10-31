import React, { useState } from 'react';
import { useCartStore } from '../lib/store/cartStore';
import { useToastHelpers } from './ToastProvider';

const CheckoutFormSimple: React.FC = () => {
    const { success, error, info } = useToastHelpers();
    
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Customer Info
        name: '',
        email: '',
        phone: '',
        
        // Billing Address
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',
        
        // Shipping Address
        sameAsBilling: true,
        shippingAddress: '',
        shippingCity: '',
        shippingState: '',
        shippingPostalCode: '',
        shippingCountry: 'United States',
        
        // Payment Info
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
        cardName: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const actualValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        
        setFormData({ ...formData, [name]: actualValue });
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Use only basic Zustand store - no complex selectors
    const items = useCartStore(state => state.items);
    const total = useCartStore(state => state.total);
    const clearCart = useCartStore(state => state.clearCart);

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            // Customer Information
            if (!formData.name.trim()) newErrors.name = 'Name is required';
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
            if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        }

        if (step === 2) {
            // Billing Address
            if (!formData.address.trim()) newErrors.address = 'Address is required';
            if (!formData.city.trim()) newErrors.city = 'City is required';
            if (!formData.state.trim()) newErrors.state = 'State is required';
            if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
            
            // Shipping Address (if different)
            if (!formData.sameAsBilling) {
                if (!formData.shippingAddress.trim()) newErrors.shippingAddress = 'Shipping address is required';
                if (!formData.shippingCity.trim()) newErrors.shippingCity = 'Shipping city is required';
                if (!formData.shippingState.trim()) newErrors.shippingState = 'Shipping state is required';
                if (!formData.shippingPostalCode.trim()) newErrors.shippingPostalCode = 'Shipping postal code is required';
            }
        }

        if (step === 3) {
            // Payment Information
            if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
            if (!formData.cardExpiry.trim()) newErrors.cardExpiry = 'Expiry date is required';
            if (!formData.cardCvc.trim()) newErrors.cardCvc = 'CVC is required';
            if (!formData.cardName.trim()) newErrors.cardName = 'Cardholder name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!items || items.length === 0) {
            error('Cart Empty', 'Please add items to your cart before checking out.');
            return;
        }

        if (!validateStep(3)) {
            return;
        }

        try {
            setIsSubmitting(true);
            info('Processing Order', 'Please wait while we process your order...');
            
            // Simulate order processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Just clear cart for now - simplified
            clearCart();
            success('Order Successful!', 'Your order has been submitted successfully. You will receive a confirmation email shortly.');
            
            // Reset form
            setCurrentStep(1);
            setFormData({
                name: '', email: '', phone: '', address: '', city: '', state: '',
                postalCode: '', country: 'United States', sameAsBilling: true,
                shippingAddress: '', shippingCity: '', shippingState: '',
                shippingPostalCode: '', shippingCountry: 'United States',
                cardNumber: '', cardExpiry: '', cardCvc: '', cardName: ''
            });
            
        } catch (err) {
            console.error('Checkout error', err);
            error('Checkout Failed', 'There was an error processing your order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { number: 1, title: 'Contact Info', description: 'Your details' },
        { number: 2, title: 'Addresses', description: 'Billing & shipping' },
        { number: 3, title: 'Payment', description: 'Complete order' },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                                    currentStep >= step.number
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-500 border-gray-300'
                                }`}>
                                    {currentStep > step.number ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <div className={`text-sm font-medium ${
                                        currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                                    }`}>
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {step.description}
                                    </div>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-4 ${
                                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                                }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Customer Information */}
                        {currentStep === 1 && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-bold mb-6">Contact Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.name ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your email address"
                                        />
                                        {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.phone ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Enter your phone number"
                                        />
                                        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Address Information */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* Billing Address */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-xl font-bold mb-6">Billing Address</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.address ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="123 Main Street"
                                            />
                                            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.city ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="City"
                                            />
                                            {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleChange}
                                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.state ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="State"
                                            />
                                            {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.postalCode ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="12345"
                                            />
                                            {errors.postalCode && <p className="text-red-600 text-sm mt-1">{errors.postalCode}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="United States">United States</option>
                                                <option value="Canada">Canada</option>
                                                <option value="United Kingdom">United Kingdom</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h2 className="text-xl font-bold mb-6">Shipping Address</h2>
                                    
                                    <div className="mb-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="sameAsBilling"
                                                checked={formData.sameAsBilling}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Same as billing address</span>
                                        </label>
                                    </div>

                                    {!formData.sameAsBilling && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                                                <input
                                                    type="text"
                                                    name="shippingAddress"
                                                    value={formData.shippingAddress}
                                                    onChange={handleChange}
                                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        errors.shippingAddress ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="123 Shipping Street"
                                                />
                                                {errors.shippingAddress && <p className="text-red-600 text-sm mt-1">{errors.shippingAddress}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                                <input
                                                    type="text"
                                                    name="shippingCity"
                                                    value={formData.shippingCity}
                                                    onChange={handleChange}
                                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        errors.shippingCity ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="City"
                                                />
                                                {errors.shippingCity && <p className="text-red-600 text-sm mt-1">{errors.shippingCity}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                                                <input
                                                    type="text"
                                                    name="shippingState"
                                                    value={formData.shippingState}
                                                    onChange={handleChange}
                                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        errors.shippingState ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="State"
                                                />
                                                {errors.shippingState && <p className="text-red-600 text-sm mt-1">{errors.shippingState}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                                                <input
                                                    type="text"
                                                    name="shippingPostalCode"
                                                    value={formData.shippingPostalCode}
                                                    onChange={handleChange}
                                                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        errors.shippingPostalCode ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                    placeholder="12345"
                                                />
                                                {errors.shippingPostalCode && <p className="text-red-600 text-sm mt-1">{errors.shippingPostalCode}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                                                <select
                                                    name="shippingCountry"
                                                    value={formData.shippingCountry}
                                                    onChange={handleChange}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="United States">United States</option>
                                                    <option value="Canada">Canada</option>
                                                    <option value="United Kingdom">United Kingdom</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment Information */}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h2 className="text-xl font-bold mb-6">Payment Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name *</label>
                                        <input
                                            type="text"
                                            name="cardName"
                                            value={formData.cardName}
                                            onChange={handleChange}
                                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.cardName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Name on card"
                                        />
                                        {errors.cardName && <p className="text-red-600 text-sm mt-1">{errors.cardName}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                                        <input
                                            type="text"
                                            name="cardNumber"
                                            value={formData.cardNumber}
                                            onChange={handleChange}
                                            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.cardNumber ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="1234 5678 9012 3456"
                                        />
                                        {errors.cardNumber && <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                            <input
                                                type="text"
                                                name="cardExpiry"
                                                value={formData.cardExpiry}
                                                onChange={handleChange}
                                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.cardExpiry ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="MM/YY"
                                            />
                                            {errors.cardExpiry && <p className="text-red-600 text-sm mt-1">{errors.cardExpiry}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CVC *</label>
                                            <input
                                                type="text"
                                                name="cardCvc"
                                                value={formData.cardCvc}
                                                onChange={handleChange}
                                                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.cardCvc ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="123"
                                            />
                                            {errors.cardCvc && <p className="text-red-600 text-sm mt-1">{errors.cardCvc}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span>Your payment information is secure and encrypted</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between">
                            <button
                                type="button"
                                onClick={prevStep}
                                className={`px-6 py-2 border border-gray-300 rounded-lg font-medium transition-colors ${
                                    currentStep === 1
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-gray-50'
                                }`}
                                disabled={currentStep === 1}
                            >
                                Previous
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <span>Complete Purchase</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        
                        <div className="space-y-3 mb-6">
                            {items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <div className="text-gray-500 text-xs">Qty: {item.quantity}</div>
                                    </div>
                                    <span className="font-medium text-sm">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 pb-4 border-b border-gray-200">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Shipping</span>
                                <span>FREE</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Tax</span>
                                <span>Calculated at checkout</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <div className="flex justify-between items-center text-xl font-bold">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Security Features */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Secure SSL checkout</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>30-day return policy</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H15a2 2 0 012 2v2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2H5z" />
                                    </svg>
                                    <span>Free shipping included</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutFormSimple;