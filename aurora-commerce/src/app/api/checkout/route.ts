import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
    const { items, userDetails } = await request.json();

    if (!items || !userDetails) {
        return NextResponse.json({ error: 'Missing items or user details' }, { status: 400 });
    }

    const { data, error } = await supabase
        .from('orders')
        .insert([
            {
                items,
                user_details: userDetails,
                status: 'pending',
            },
        ]);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orderId: data[0].id }, { status: 201 });
}