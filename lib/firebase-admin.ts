import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let _db: ReturnType<typeof getFirestore> | null = null

export function getAdminDb() {
  if (_db) return _db
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  _db = getFirestore()
  return _db
}

// Backward-compatible export — initializes on first access (only in runtime, not build)
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    return (getAdminDb() as any)[prop]
  },
})
