// This file defines TypeScript types and interfaces used throughout the application.

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
}

export interface CartItem {
    productId: string;
    quantity: number;
}

export interface Cart {
    items: CartItem[];
    totalPrice: number;
}

export interface CheckoutForm {
    name: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    paymentMethod: 'creditCard' | 'paypal';
}