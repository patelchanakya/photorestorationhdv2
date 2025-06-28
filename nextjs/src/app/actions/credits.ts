'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient'

interface CreditActionResult {
  success: boolean
  credits?: number
  error?: string
}

export async function getCredits(userId: string): Promise<CreditActionResult> {
  try {
    const adminClient = await createServerAdminClient()
    
    const { data, error } = await adminClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching credits:', error)
      return { success: false, error: 'Failed to fetch credits' }
    }
    
    return { success: true, credits: data?.credits ?? 0 }
  } catch (error) {
    console.error('Credits fetch error:', error)
    return { success: false, error: 'Failed to fetch credits' }
  }
}

export async function deductCredits(userId: string, amount: number): Promise<CreditActionResult> {
  try {
    const adminClient = await createServerAdminClient()
    
    // First, get current credits to check if user has enough
    const { data: currentData, error: fetchError } = await adminClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !currentData) {
      return { success: false, error: 'Failed to fetch current credits' }
    }
    
    const currentCredits = currentData.credits
    if (currentCredits < amount) {
      return { success: false, error: 'Insufficient credits' }
    }
    
    // Deduct credits
    const newCredits = currentCredits - amount
    const { data, error } = await adminClient
      .from('user_credits')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('credits')
      .single()
    
    if (error) {
      console.error('Error deducting credits:', error)
      return { success: false, error: 'Failed to deduct credits' }
    }
    
    // Revalidate cache for credits data
    revalidateTag('user-credits')
    revalidatePath('/app')
    
    return { success: true, credits: data?.credits ?? newCredits }
  } catch (error) {
    console.error('Credits deduction error:', error)
    return { success: false, error: 'Failed to deduct credits' }
  }
}

export async function refundCredits(userId: string, amount: number): Promise<CreditActionResult> {
  try {
    const adminClient = await createServerAdminClient()
    
    // Get current credits
    const { data: currentData, error: fetchError } = await adminClient
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .single()
    
    if (fetchError || !currentData) {
      return { success: false, error: 'Failed to fetch current credits' }
    }
    
    // Add credits back
    const newCredits = currentData.credits + amount
    const { data, error } = await adminClient
      .from('user_credits')
      .update({ 
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select('credits')
      .single()
    
    if (error) {
      console.error('Error refunding credits:', error)
      return { success: false, error: 'Failed to refund credits' }
    }
    
    // Revalidate cache for credits data
    revalidateTag('user-credits')
    revalidatePath('/app')
    
    return { success: true, credits: data?.credits ?? newCredits }
  } catch (error) {
    console.error('Credits refund error:', error)
    return { success: false, error: 'Failed to refund credits' }
  }
}

export async function validateCreditsForOperation(userId: string, requiredAmount: number): Promise<CreditActionResult> {
  try {
    const result = await getCredits(userId)
    if (!result.success || result.credits === undefined) {
      return result
    }
    
    if (result.credits < requiredAmount) {
      return { 
        success: false, 
        error: `Insufficient credits. Required: ${requiredAmount}, Available: ${result.credits}` 
      }
    }
    
    return { success: true, credits: result.credits }
  } catch (error) {
    console.error('Credits validation error:', error)
    return { success: false, error: 'Failed to validate credits' }
  }
}