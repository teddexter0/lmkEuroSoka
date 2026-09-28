import { NextResponse } from 'next/server'
import { getAiConfig, footballProviderName, missingFirebaseConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const missingFirebase=missingFirebaseConfig()
  const football=footballProviderName()
  const ai=getAiConfig().provider
  const cronReady=Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length>=16)
  const ready=cronReady
  return NextResponse.json({
    status:ready?'ready':'configuration-required',
    services:{firebase:missingFirebase.length?'optional-not-configured':'configured',football,ai,cron:cronReady?'configured':'missing'},
  },{status:ready?200:503,headers:{'Cache-Control':'no-store'}})
}
