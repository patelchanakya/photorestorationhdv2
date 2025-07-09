import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const timestamp = new Date().toISOString();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    console.log(`🚀 [${timestamp}] [${requestId}] Starting photo restoration API call`);
    console.log(`📊 [${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()));
    console.log(`📊 [${requestId}] Request URL:`, request.url);
    console.log(`📊 [${requestId}] Request method:`, request.method);
    
    try {
        const { user_id, image_path } = await request.json();
        console.log(`📝 [${requestId}] Request data:`, { user_id, image_path });
        console.log(`📝 [${requestId}] User ID length:`, user_id?.length);
        console.log(`📝 [${requestId}] Image path format:`, image_path?.split('/').length, 'parts');

        if (!user_id || !image_path) {
            console.log(`❌ [${requestId}] Missing required fields - user_id: ${!!user_id}, image_path: ${!!image_path}`);
            return NextResponse.json(
                { error: 'Missing required fields: user_id, image_path' },
                { status: 400 }
            );
        }

        // Call the Supabase Edge Function
        const functionsUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:54321';
        const edgeFunctionUrl = `${functionsUrl}/functions/v1/restore-photo`;
        console.log(`🌐 [${requestId}] Calling Edge Function:`, edgeFunctionUrl);
        console.log(`🌐 [${requestId}] Functions URL base:`, functionsUrl);
        console.log(`🌐 [${requestId}] Service key available:`, !!process.env.PRIVATE_SUPABASE_SERVICE_KEY);

        const startTime = Date.now();
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.PRIVATE_SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({
                user_id,
                image_path,
            }),
        });

        const responseTime = Date.now() - startTime;
        console.log(`📡 [${requestId}] Edge Function response status:`, response.status);
        console.log(`📡 [${requestId}] Edge Function response time:`, responseTime, 'ms');
        console.log(`📡 [${requestId}] Edge Function response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [${requestId}] Edge Function error:`, errorText);
            console.error(`❌ [${requestId}] Response status:`, response.status);
            console.error(`❌ [${requestId}] Response headers:`, Object.fromEntries(response.headers.entries()));
            console.error(`❌ [${requestId}] Request payload:`, { user_id, image_path });
            return NextResponse.json(
                { error: 'Failed to start photo restoration' },
                { status: 500 }
            );
        }

        const result = await response.json();
        console.log(`✅ [${requestId}] Edge Function success:`, result);
        console.log(`✅ [${requestId}] Total API call time:`, Date.now() - startTime, 'ms');
        return NextResponse.json(result);

    } catch (error) {
        console.error(`❌ [${requestId}] API error:`, error);
        console.error(`❌ [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack available');
        console.error(`❌ [${requestId}] Error occurred at:`, new Date().toISOString());
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}