#!/usr/bin/env node

/**
 * Import Users from JSON (Official Supabase Method)
 * 
 * This script imports users from a JSON export file using the Supabase Admin API.
 * Preserves passwords, UUIDs, metadata, and all user data.
 * 
 * Usage: node scripts/import-users-json.js <path_to_json_file> [batch_size]
 * 
 * Examples:
 *   node scripts/import-users-json.js users-export-2024-01-15.json
 *   node scripts/import-users-json.js users-export-2024-01-15.json 50
 * 
 * Environment variables:
 *   TARGET_SUPABASE_URL=http://localhost:54321
 *   TARGET_SUPABASE_SERVICE_KEY=your-local-service-role-key
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Parse command line arguments
const jsonFile = process.argv[2]
const batchSize = parseInt(process.argv[3]) || 100

if (!jsonFile) {
  console.error('❌ Usage: node import-users-json.js <path_to_json_file> [batch_size]')
  console.error('')
  console.error('Examples:')
  console.error('  node import-users-json.js users-export-2024-01-15.json')
  console.error('  node import-users-json.js users-export-2024-01-15.json 50')
  process.exit(1)
}

// Configuration
const TARGET_SUPABASE_URL = process.env.TARGET_SUPABASE_URL
const TARGET_SUPABASE_SERVICE_KEY = process.env.TARGET_SUPABASE_SERVICE_KEY

if (!TARGET_SUPABASE_URL || !TARGET_SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:')
  console.error('   TARGET_SUPABASE_URL=http://localhost:54321')
  console.error('   TARGET_SUPABASE_SERVICE_KEY=your-local-service-role-key')
  console.error('')
  console.error('Get service role key from: Supabase Dashboard → Settings → API')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(TARGET_SUPABASE_URL, TARGET_SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create import logs directory
const logsDir = path.join(process.cwd(), 'import-logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Helper function to create batches
function createBatches(array, size) {
  const batches = []
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size))
  }
  return batches
}

// Helper function to safely parse date
function parseDate(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date.toISOString()
}

// Test Supabase connection
async function testConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      throw error
    }
    
    console.log(`✅ Connected to Supabase (${data.users.length} existing users)`)
    return { success: true, existingUsers: data.users.length }
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
    return { success: false, error: error.message }
  }
}

// Load and validate JSON file
function loadUsersFromJSON() {
  console.log(`📂 Loading users from: ${jsonFile}`)
  
  if (!fs.existsSync(jsonFile)) {
    console.error(`❌ File not found: ${jsonFile}`)
    process.exit(1)
  }
  
  try {
    const fileContent = fs.readFileSync(jsonFile, 'utf8')
    const rawData = JSON.parse(fileContent)
    
    // Handle different JSON formats
    let users
    if (Array.isArray(rawData)) {
      // Check if it's wrapped in SQL function format
      if (rawData[0]?.ufn_export_users_json && Array.isArray(rawData[0].ufn_export_users_json)) {
        users = rawData[0].ufn_export_users_json
        console.log('📋 Detected SQL function export format - extracting user array')
      } else if (rawData[0]?.id && rawData[0]?.email) {
        // Direct user array format
        users = rawData
        console.log('📋 Detected direct user array format')
      } else {
        throw new Error('Unrecognized JSON format - expected user array or SQL function output')
      }
    } else {
      throw new Error('JSON file must contain an array')
    }
    
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('No users found in JSON file')
    }
    
    console.log(`✅ Loaded ${users.length} users from JSON file`)
    
    // Validate user structure
    const sampleUser = users[0]
    const requiredFields = ['id', 'email', 'encrypted_password']
    const missingFields = requiredFields.filter(field => !sampleUser[field])
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in user data: ${missingFields.join(', ')}`)
    }
    
    console.log('✅ User data structure validated')
    console.log(`   Sample user: ${sampleUser.email} (ID: ${sampleUser.id})`)
    console.log(`   Password hash format: ${sampleUser.encrypted_password.substring(0, 10)}...`)
    
    return users
    
  } catch (error) {
    console.error('❌ Failed to load JSON file:', error.message)
    process.exit(1)
  }
}

// Import a single user
async function importUser(user, index) {
  try {
    const userData = {
      id: user.id,
      email: user.email,
      password_hash: user.encrypted_password,
      email_confirm: !!user.email_confirmed_at,
      phone: user.phone || undefined,
      phone_confirm: !!user.phone_confirmed_at,
      user_metadata: user.raw_user_meta_data || {},
      app_metadata: user.raw_app_meta_data || {}
    }
    
    const { data, error } = await supabase.auth.admin.createUser(userData)
    
    if (error) {
      // Handle common errors gracefully
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return {
          success: false,
          error: 'User already exists',
          skipped: true,
          user: { email: user.email, id: user.id }
        }
      }
      
      throw error
    }
    
    return {
      success: true,
      user: { email: user.email, id: user.id },
      created: data.user
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      skipped: false,
      user: { email: user.email, id: user.id }
    }
  }
}

// Import users in batches
async function importUsersInBatches(users) {
  console.log('\n📥 Importing users...')
  console.log('=' .repeat(50))
  
  const batches = createBatches(users, batchSize)
  const results = {
    total: users.length,
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: []
  }
  
  console.log(`🔄 Processing ${users.length} users in ${batches.length} batches (${batchSize} per batch)`)
  console.log('')
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const batchNumber = batchIndex + 1
    
    console.log(`📦 Batch ${batchNumber}/${batches.length} (${batch.length} users)`)
    
    const batchPromises = batch.map((user, userIndex) => {
      const globalIndex = batchIndex * batchSize + userIndex
      return importUser(user, globalIndex)
    })
    
    try {
      const batchResults = await Promise.all(batchPromises)
      
      // Process batch results
      let batchSuccessful = 0
      let batchSkipped = 0
      let batchFailed = 0
      
      batchResults.forEach((result, userIndex) => {
        if (result.success) {
          batchSuccessful++
          results.successful++
          console.log(`   ✅ ${result.user.email}`)
        } else if (result.skipped) {
          batchSkipped++
          results.skipped++
          console.log(`   ⚠️  ${result.user.email} - ${result.error}`)
        } else {
          batchFailed++
          results.failed++
          results.errors.push({
            user: result.user,
            error: result.error
          })
          console.log(`   ❌ ${result.user.email} - ${result.error}`)
        }
      })
      
      console.log(`   📊 Batch summary: ✅ ${batchSuccessful} | ⚠️  ${batchSkipped} | ❌ ${batchFailed}`)
      
      // Small delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
    } catch (error) {
      console.error(`   ❌ Batch ${batchNumber} failed:`, error.message)
      results.failed += batch.length
    }
    
    console.log('')
  }
  
  return results
}

// Generate import report
function generateImportReport(results, startTime) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const duration = Date.now() - startTime
  
  const report = {
    import_timestamp: new Date().toISOString(),
    target_supabase_url: TARGET_SUPABASE_URL,
    json_file: jsonFile,
    batch_size: batchSize,
    duration_ms: duration,
    duration_readable: `${Math.floor(duration / 1000)}s`,
    results: {
      total_users: results.total,
      successful_imports: results.successful,
      skipped_existing: results.skipped,
      failed_imports: results.failed,
      success_rate: `${((results.successful / results.total) * 100).toFixed(1)}%`
    },
    errors: results.errors.length > 0 ? results.errors : undefined
  }
  
  const reportFile = path.join(logsDir, `import-report-${timestamp}.json`)
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
  
  console.log('📊 Import Summary')
  console.log('=' .repeat(50))
  console.log(`Total users processed: ${results.total}`)
  console.log(`✅ Successfully imported: ${results.successful}`)
  console.log(`⚠️  Skipped (already exist): ${results.skipped}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⏱️  Duration: ${report.duration_readable}`)
  console.log(`📄 Report saved: ${reportFile}`)
  
  if (results.errors.length > 0) {
    console.log('')
    console.log('❌ Failed imports:')
    results.errors.slice(0, 5).forEach(error => {
      console.log(`   • ${error.user.email}: ${error.error}`)
    })
    if (results.errors.length > 5) {
      console.log(`   • ... and ${results.errors.length - 5} more (see report file)`)
    }
  }
  
  return report
}

// Main import function
async function main() {
  const startTime = Date.now()
  
  console.log('📥 Import Users from JSON (Official Supabase Method)')
  console.log(`📂 File: ${jsonFile}`)
  console.log(`📦 Batch size: ${batchSize}`)
  console.log(`🎯 Target: ${TARGET_SUPABASE_URL}`)
  console.log('')
  
  // Test connection
  const connectionTest = await testConnection()
  if (!connectionTest.success) {
    process.exit(1)
  }
  
  if (connectionTest.existingUsers > 0) {
    console.log(`⚠️  Target database already has ${connectionTest.existingUsers} users`)
    console.log('   Existing users will be skipped during import')
    console.log('')
  }
  
  // Load users
  const users = loadUsersFromJSON()
  
  // Import users
  const results = await importUsersInBatches(users)
  
  // Generate report
  const report = generateImportReport(results, startTime)
  
  // Final status
  if (results.failed === 0) {
    console.log('\n🎉 Import completed successfully!')
    console.log('   All users have been imported with preserved passwords.')
    console.log('   Users can now login to the new project with their existing passwords.')
  } else {
    console.log('\n⚠️  Import completed with some failures.')
    console.log('   Check the import report for details on failed users.')
  }
  
  console.log('\n💡 Next steps:')
  console.log('   • Test user login with existing passwords')
  console.log('   • Verify user data and metadata')
  console.log('   • Run validation script if available')
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n⚠️  Import interrupted by user')
  process.exit(1)
})

// Run import
main().catch(error => {
  console.error('❌ Import failed:', error.message)
  process.exit(1)
})