import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';

export async function POST(request: NextRequest) {
    console.log('🚀 Starting photo restoration API call');
    try {
        const { user_id, image_path } = await request.json();
        console.log('📝 Request data:', { user_id, image_path });

        if (!user_id || !image_path) {
            console.log('❌ Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: user_id, image_path' },
                { status: 400 }
            );
        }

        // Validate that the user owns the file
        console.log('🔍 Creating admin client and checking file ownership');
        const adminClient = await createServerAdminClient();
        
        // Check if the file exists in storage for this user
        const { data: file, error: fileError } = await adminClient
            .storage
            .from('files')
            .list(user_id);

        console.log('📁 File listing result:', { file, fileError });

        if (fileError || !file) {
            console.log('❌ Error accessing user files:', fileError);
            return NextResponse.json(
                { error: 'Error accessing user files' },
                { status: 500 }
            );
        }

        // Extract filename from path (user_id/filename)
        const filename = image_path.split('/').pop();
        const userOwnsFile = file.some(f => f.name === filename);
        console.log('🔐 File ownership check:', { filename, userOwnsFile, availableFiles: file.map(f => f.name) });

        if (!userOwnsFile) {
            console.log('❌ File not found or access denied');
            return NextResponse.json(
                { error: 'File not found or access denied' },
                { status: 403 }
            );
        }

        // Call the Supabase Edge Function
        const functionsUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'http://localhost:54321';
        const edgeFunctionUrl = `${functionsUrl}/functions/v1/restore-photo`;
        console.log('🌐 Calling Edge Function:', edgeFunctionUrl);

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

        console.log('📡 Edge Function response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Edge Function error:', errorText);
            console.error('❌ Response status:', response.status);
            console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
            return NextResponse.json(
                { error: 'Failed to start photo restoration' },
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