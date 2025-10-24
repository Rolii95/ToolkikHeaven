import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', customerEmail, customerName, orderId, items } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    console.log('Creating payment intent', { amount, currency, customerEmail, orderId });

    // Create or get customer
    const customer = await StripeService.createOrUpdateCustomer(
      customerEmail,
      customerName,
      { orderId: orderId?.toString() }
    );

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent(
      amount,
      currency,
      customer.id,
      {
        orderId: orderId?.toString(),
        customerEmail,
        items: JSON.stringify(items),
      }
    );

    console.log('Payment intent created successfully', { 
      paymentIntentId: paymentIntent.id,
      customerId: customer.id 
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId: customer.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });

  } catch (error) {
    console.error('Error creating payment intent', error);
    
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent_id');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    console.log('Retrieving payment intent', { paymentIntentId });

    const paymentIntent = await StripeService.getPaymentIntent(paymentIntentId);

    return NextResponse.json(paymentIntent);

  } catch (error) {
    console.error('Error retrieving payment intent', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve payment intent' },
      { status: 500 }
    );
  }
}