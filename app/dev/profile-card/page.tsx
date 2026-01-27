'use client'

import { ProfileCard } from '@/components/profile-card'

export default function ProfileCardIsolatedPage() {
  return (
    <main className="min-h-screen bg-white p-8 overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <ProfileCard />
      </div>
    </main>
  )
}
