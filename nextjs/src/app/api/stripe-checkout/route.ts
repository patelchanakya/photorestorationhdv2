import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';

export async function POST(request: NextRequest) {
    console.log('🚀 Starting Stripe checkout API call');
    try {
        const { user_id, price_id, mode, success_url, cancel_url } = await request.json();
        console.log('📝 Request data:', { user_id, price_id, mode, success_url, cancel_url });

        if (!user_id || !price_id || !mode || !success_url || !cancel_url) {
            console.log('❌ Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: user_id, price_id, mode, success_url, cancel_url' },
                { status: 400 }
            );
        }

        console.log('✅ User ID received:', user_id);

        // Call the Supabase Edge Function
        const functionsUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'http://127.0.0.1:54321';
        const edgeFunctionUrl = `${functionsUrl}/functions/v1/stripe-checkout`;
        console.log('🌐 Calling Edge Function:', edgeFunctionUrl);

        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRIVATE_SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
                user_id,
                price_id,
                mode,
                success_url,
                cancel_url,
            }),
        });

        console.log('📡 Edge Function response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Edge Function error:', errorText);
            return NextResponse.json(
                { error: 'Failed to create checkout session' },
                { status: 500 }
            );
        }

        const result = await response.json();
        console.log('✅ Edge Function success:', result);
        
        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}