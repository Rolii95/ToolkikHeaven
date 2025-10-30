// This file defines TypeScript types and interfaces used throughout the application.

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    stock: number;
    tags: string[];
    // Digital product fields
    isDigital?: boolean;
    downloadUrl?: string;
    fileSize?: number; // in bytes
    fileFormat?: string; // e.g., 'PDF', 'ZIP', 'MP4', 'SOFTWARE'
    licenseType?: 'personal' | 'commercial' | 'extended';
    instantDownload?: boolean;
    digitalDeliveryInfo?: string;
    systemRequirements?: string[];
    // Preview and demo fields
    previewUrl?: string;
    demoUrl?: string;
    sampleFiles?: string[];
}

export interface CartItem {
    productId: string;
    quantity: number;
    product?: Product; // Optional populated product data
    // Digital product specific fields
    licenseSelected?: 'personal' | 'commercial' | 'extended';
    downloadReady?: boolean;
    downloadToken?: string;
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

// Custom Logic Service Types
export interface PricingRule {
    id: string;
    name: string;
    description: string;
    type: 'percentage' | 'fixed' | 'bulk' | 'free_shipping';
    condition: (items: CartItem[]) => boolean;
    apply: (items: CartItem[]) => PricingAdjustment[];
}

export interface PricingAdjustment {
    type: 'discount' | 'shipping' | 'tax';
    amount: number;
    description: string;
    ruleId: string;
}

export interface FulfillmentRequest {
    orderId: string;
    items: CartItem[];
    shippingAddress: Partial<CheckoutForm>;
}

export interface FulfillmentResponse {
    success: boolean;
    orderId: string;
    trackingNumbers: string[];
    estimatedDelivery: string;
    fulfillmentDetails: {
        warehouse: string;
        carrier: string;
        shippingMethod: string;
        cost: number;
    };
    errors?: string[];
}

// Review System Types for Social Proof Integration
export interface ProductReview {
    id: string;
    product_id: string;
    user_id: string;
    rating: number; // 1-5 stars
    review_text?: string;
    helpful_votes: number;
    created_at: string;
    updated_at: string;
    user_profile?: UserProfile;
}

export interface UserProfile {
    id: string;
    display_name?: string;
    avatar_url?: string;
    created_at: string;
}

export interface ReviewStats {
    average_rating: number;
    total_reviews: number;
    rating_distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

export interface ReviewSubmission {
    product_id: string;
    rating: number;
    review_text?: string;
}

export interface ReviewFormData {
    rating: number;
    review_text: string;
}

// Digital Product specific types
export interface DigitalProductPurchase {
    id: string;
    orderId: string;
    productId: string;
    userId?: string;
    downloadUrl: string;
    downloadToken: string;
    licenseKey?: string;
    expiresAt?: string;
    downloadCount: number;
    maxDownloads: number;
    purchasedAt: string;
}

export interface DigitalLicense {
    type: 'personal' | 'commercial' | 'extended';
    description: string;
    features: string[];
    restrictions?: string[];
    priceModifier: number; // multiplier for base price
}