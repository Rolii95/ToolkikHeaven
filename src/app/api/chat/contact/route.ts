import { NextRequest, NextResponse } from 'next/server';
import { validateContactForm, ContactFormData, sanitize } from '../../../../lib/validation';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'orders' | 'returns' | 'other';
  timestamp?: string;
  userAgent?: string;
  ipAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the contact form data
    const contactData: ContactFormData = {
      name: sanitize.text(body.name || ''),
      email: sanitize.text(body.email || ''),
      subject: sanitize.text(body.subject || 'Support Request'),
      message: sanitize.text(body.message || ''),
    };

    // Validate the form data
    const validation = validateContactForm(contactData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.errors 
        }, 
        { status: 400 }
      );
    }

    // Additional data for logging/tracking
    const requestData: ContactRequest = {
      ...contactData,
      priority: body.priority || 'medium',
      category: body.category || 'general',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'Unknown',
    };

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Send email notification to support team
    // 3. Send auto-reply email to customer
    // 4. Create ticket in support system
    
    // For now, we'll simulate processing and log the request
    console.log('Contact form submission:', {
      ...requestData,
      message: requestData.message.substring(0, 100) + '...', // Truncate for logging
    });

    // Simulate email sending (in real implementation, use your email service)
    const emailSuccess = await simulateEmailSending(requestData);
    
    if (!emailSuccess) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send notification email' 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We\'ll get back to you within 24 hours.',
      ticketId: `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      estimatedResponse: '24 hours',
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      }, 
      { status: 500 }
    );
  }
}

// Simulate email sending (replace with actual email service)
async function simulateEmailSending(data: ContactRequest): Promise<boolean> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would be something like:
    // await sendEmail({
    //   to: 'support@auroracommerce.com',
    //   from: 'noreply@auroracommerce.com',
    //   subject: `New Support Request: ${data.subject}`,
    //   template: 'support-notification',
    //   data: data
    // });
    
    // await sendEmail({
    //   to: data.email,
    //   from: 'support@auroracommerce.com',
    //   subject: 'We received your message - Aurora Commerce Support',
    //   template: 'auto-reply',
    //   data: data
    // });

    console.log(`Email notifications sent for contact form submission from ${data.email}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Contact endpoint is available. Use POST to submit contact forms.' 
    }, 
    { status: 200 }
  );
}