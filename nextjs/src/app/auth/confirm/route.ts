// src/app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createSSRSassClient } from "@/lib/supabase/server";
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/app/storage'
  
  // Create redirect URL
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')

  if (token_hash && type) {
    const supabase = await createSSRSassClient()
    const client = supabase.getSupabaseClient()

    const { error } = await client.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      // Email verification successful - redirect to intended destination
      console.log(`Email verification successful, redirecting to: ${redirectTo.pathname}`)
      return NextResponse.redirect(redirectTo)
    } else {
      console.error('Email verification failed:', error.message)
    }
  } else {
    console.error('Missing token_hash or type in email verification request')
  }

  // Verification failed - redirect to error page
  redirectTo.pathname = '/auth/error'
  return NextResponse.redirect(redirectTo)
}