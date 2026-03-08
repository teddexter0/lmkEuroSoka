import { db } from './firebase'
import {
  collection, doc, getDocs, getDoc, query,
  where, orderBy, limit,
} from 'firebase/firestore'
import type { Team, Fixture, Story, PlayerStat, WeeklyDigest } from '@/types'

// ── CLIENT READS ──────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const snap = await getDocs(collection(db, 'teams'))
  return snap.docs.map(d => d.data() as Team)
}

export async function getSelectedTeams(): Promise<Team[]> {
  const q = query(collection(db, 'teams'), where('isUserSelected', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Team)
}

export async function getFixturesByWeek(weekLabel: string): Promise<Fixture[]> {
  const q = query(
    collection(db, 'fixtures'),
    where('weekLabel', '==', weekLabel),
    orderBy('matchDate', 'asc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => {
    const data = d.data()
    return {
      ...data,
      matchDate: data.matchDate?.toDate ? data.matchDate.toDate() : new Date(data.matchDate),
    } as Fixture
  })
}

export async function getStoriesByWeek(weekLabel: string): Promise<Story[]> {
  const q = query(
    collection(db, 'stories'),
    where('weekLabel', '==', weekLabel),
    where('isActive', '==', true)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as Story)
}

export async function getPlayerStatsByTeam(teamId: string, weekLabel: string): Promise<PlayerStat[]> {
  const q = query(
    collection(db, 'playerStats'),
    where('teamId', '==', teamId),
    where('statWeek', '==', weekLabel)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as PlayerStat)
}

export async function getWeeklyDigest(weekLabel: string): Promise<WeeklyDigest | null> {
  const snap = await getDoc(doc(db, 'weeklyDigest', weekLabel))
  return snap.exists() ? (snap.data() as WeeklyDigest) : null
}

export async function getUserPreferences() {
  const snap = await getDoc(doc(db, 'userPreferences', 'ted'))
  return snap.exists()
    ? snap.data()
    : { selectedTeams: ['MUN','BAR','ARS','MCI','LFC','CFC','TOT','NEW','FUL','BRI','BOU','CRY'], activeLeague: 'EPL' }
}

export async function getPreviousWeekLabels(count = 4): Promise<string[]> {
  const q = query(
    collection(db, 'weeklyDigest'),
    orderBy('generatedAt', 'desc'),
    limit(count)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.id)
}
