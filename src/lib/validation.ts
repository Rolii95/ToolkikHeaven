/**
 * Input Validation and Sanitization Utilities
 * Provides basic validation for forms and API inputs
 */

// Basic email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length >= 5 && email.length <= 254;
};

// Basic phone validation
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  const cleanPhone = phone.replace(/\s+/g, '');
  return phoneRegex.test(phone) && cleanPhone.length >= 10 && cleanPhone.length <= 20;
};

// Basic name validation
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
  const trimmedName = name.trim();
  return nameRegex.test(trimmedName) && trimmedName.length >= 2 && trimmedName.length <= 50;
};

// Price validation
export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && price >= 0.01 && price <= 999999.99 && 
         Number.isFinite(price) && Math.round(price * 100) === price * 100;
};

// Checkout form validation
export interface CheckoutFormData {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export const validateCheckoutForm = (data: CheckoutFormData): { 
  isValid: boolean; 
  errors: Partial<Record<keyof CheckoutFormData, string>> 
} => {
  const errors: Partial<Record<keyof CheckoutFormData, string>> = {};

  // Validate name
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (!isValidName(data.name)) {
    errors.name = 'Please enter a valid name (2-50 characters, letters only)';
  }

  // Validate email
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate address
  if (!data.address.trim()) {
    errors.address = 'Address is required';
  } else if (data.address.trim().length < 5) {
    errors.address = 'Address must be at least 5 characters';
  } else if (data.address.length > 100) {
    errors.address = 'Address must be less than 100 characters';
  }

  // Validate city
  if (!data.city.trim()) {
    errors.city = 'City is required';
  } else if (!isValidName(data.city)) {
    errors.city = 'Please enter a valid city name';
  }

  // Validate postal code
  if (!data.postalCode.trim()) {
    errors.postalCode = 'Postal code is required';
  } else if (data.postalCode.trim().length < 3 || data.postalCode.length > 12) {
    errors.postalCode = 'Postal code must be 3-12 characters';
  }

  // Validate country
  if (!data.country.trim()) {
    errors.country = 'Country is required';
  } else if (data.country.trim().length < 2 || data.country.length > 50) {
    errors.country = 'Country must be 2-50 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Review form validation
export interface ReviewFormData {
  rating: number;
  reviewText: string;
}

export const validateReviewForm = (data: ReviewFormData): { 
  isValid: boolean; 
  errors: Partial<Record<keyof ReviewFormData, string>> 
} => {
  const errors: Partial<Record<keyof ReviewFormData, string>> = {};

  // Validate rating
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Rating must be between 1 and 5';
  }

  // Validate review text (optional but if provided, must be valid)
  if (data.reviewText && data.reviewText.trim().length > 1000) {
    errors.reviewText = 'Review must be less than 1000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Contact form validation
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const validateContactForm = (data: ContactFormData): { 
  isValid: boolean; 
  errors: Partial<Record<keyof ContactFormData, string>> 
} => {
  const errors: Partial<Record<keyof ContactFormData, string>> = {};

  // Validate name
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (!isValidName(data.name)) {
    errors.name = 'Please enter a valid name';
  }

  // Validate email
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate subject
  if (!data.subject.trim()) {
    errors.subject = 'Subject is required';
  } else if (data.subject.trim().length < 5 || data.subject.length > 100) {
    errors.subject = 'Subject must be 5-100 characters';
  }

  // Validate message
  if (!data.message.trim()) {
    errors.message = 'Message is required';
  } else if (data.message.trim().length < 10 || data.message.length > 2000) {
    errors.message = 'Message must be 10-2000 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Sanitization utilities
export const sanitize = {
  // Remove HTML tags and encode special characters
  html: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  },

  // Remove potentially dangerous characters
  basic: (input: string): string => {
    return input
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
  },

  // Sanitize file names
  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9\-_\.]/g, '') // Remove special characters
      .replace(/\.{2,}/g, '.') // Remove multiple dots
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 255) // Limit length
      .trim();
  },

  // Sanitize URLs
  url: (input: string): string => {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }
      return url.toString();
    } catch {
      return '';
    }
  },

  // Clean text input
  text: (input: string): string => {
    return input
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .substring(0, 1000); // Reasonable length limit
  },
};

// React hook for form validation
export const useFormValidation = <T extends Record<string, any>>(
  validateFn: (data: T) => { isValid: boolean; errors: Partial<Record<keyof T, string>> }
) => {
  const validate = (data: T) => validateFn(data);
  
  const validateField = (fieldName: keyof T, value: any, allData: T) => {
    const result = validateFn({ ...allData, [fieldName]: value });
    return {
      isValid: !result.errors[fieldName],
      error: result.errors[fieldName] || null,
    };
  };
  
  return { validate, validateField };
};

export default {
  validators: {
    isValidEmail,
    isValidPhone,
    isValidName,
    isValidPrice,
    validateCheckoutForm,
    validateReviewForm,
    validateContactForm,
  },
  sanitize,
  useFormValidation,
};