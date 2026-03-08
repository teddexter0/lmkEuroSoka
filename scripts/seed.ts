import * as admin from 'firebase-admin'
import { TEAMS_SEED, FIXTURES_SEED, STORIES_SEED, PLAYER_STATS_SEED, WEEKLY_DIGEST_SEED } from '../lib/seed-data'

// Load env manually for ts-node
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = admin.firestore()

async function seed() {
  console.log('🌱 Seeding lmkEuroSoka Firebase...\n')

  console.log('📋 Seeding teams...')
  for (const team of TEAMS_SEED) {
    await db.collection('teams').doc(team.id).set(team)
  }
  console.log(`   ✓ ${TEAMS_SEED.length} teams`)

  console.log('📅 Seeding fixtures...')
  for (const fixture of FIXTURES_SEED) {
    await db.collection('fixtures').doc(fixture.id).set({
      ...fixture,
      matchDate: admin.firestore.Timestamp.fromDate(new Date(fixture.matchDate as string)),
    })
  }
  console.log(`   ✓ ${FIXTURES_SEED.length} fixtures`)

  console.log('📖 Seeding stories...')
  for (const story of STORIES_SEED) {
    await db.collection('stories').doc(story.id).set({
      ...story,
      createdAt: admin.firestore.Timestamp.now(),
    })
  }
  console.log(`   ✓ ${STORIES_SEED.length} stories`)

  console.log('📊 Seeding player stats...')
  for (const stat of PLAYER_STATS_SEED) {
    const id = `${stat.teamId}-${stat.playerName.replace(/\s+/g, '-')}-${stat.statWeek}`
    await db.collection('playerStats').doc(id).set(stat)
  }
  console.log(`   ✓ ${PLAYER_STATS_SEED.length} player stats`)

  console.log('📰 Seeding weekly digest...')
  await db.collection('weeklyDigest').doc(WEEKLY_DIGEST_SEED.weekLabel).set({
    ...WEEKLY_DIGEST_SEED,
    generatedAt: admin.firestore.Timestamp.now(),
  })
  console.log(`   ✓ week: ${WEEKLY_DIGEST_SEED.weekLabel}`)

  console.log('⚙️  Seeding user preferences...')
  await db.collection('userPreferences').doc('ted').set({
    selectedTeams: ['MUN','BAR','ARS','MCI','LFC','CFC','TOT','NEW','FUL','BRI','BOU','CRY','ATM','RMA','PSG','BMU','BVB','LEV','INT','ACM','JUV','ASM'],
    activeLeague: 'EPL',
    updatedAt: admin.firestore.Timestamp.now(),
  })
  console.log(`   ✓ user preferences set`)

  console.log('\n✅ Seed complete! Run: npm run dev')
  process.exit(0)
}

seed().catch(e => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
