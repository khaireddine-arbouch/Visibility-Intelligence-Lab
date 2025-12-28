/**
 * Environment Variables Checker
 * Run with: pnpm check:env
 */

console.log('🔍 Checking Supabase Environment Variables\n')
console.log('===========================================\n')

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const optionalVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
]

let allGood = true

console.log('📋 Required Variables:\n')
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    const masked = value.slice(0, 20) + '...' + value.slice(-10)
    console.log(`✅ ${varName}`)
    console.log(`   ${masked}\n`)
  } else {
    console.log(`❌ ${varName}: NOT FOUND\n`)
    allGood = false
  }
})

console.log('📋 Optional Variables:\n')
optionalVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    const masked = value.slice(0, 20) + '...' + value.slice(-10)
    console.log(`✅ ${varName}`)
    console.log(`   ${masked}\n`)
  } else {
    console.log(`⚠️  ${varName}: NOT FOUND (optional for migrations)\n`)
  }
})

console.log('===========================================\n')

if (allGood) {
  console.log('✅ All required environment variables are set!')
  console.log('\n📋 Next steps:')
  console.log('1. Run: pnpm migrate:supabase')
  console.log('2. Update app/layout.tsx to use SupabaseDataProvider')
  console.log('3. Run: pnpm dev')
} else {
  console.log('❌ Missing required environment variables!')
  console.log('\n📋 Setup instructions:')
  console.log('1. Go to your Supabase project dashboard')
  console.log('2. Click "Connect" or go to Settings > API')
  console.log('3. Copy the Project URL and Anon key')
  console.log('4. Add to .env.local:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your-project-url')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
  process.exit(1)
}

