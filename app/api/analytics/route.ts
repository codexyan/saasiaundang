import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-server'
import { invitations, guests, wishes, invitationViews } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Sesi kamu sudah berakhir. Silakan masuk lagi ya.' }, { status: 401 })
  }

  const invitationId = req.nextUrl.searchParams.get('invitation_id')
  if (!invitationId) {
    return NextResponse.json({ error: 'Undangannya belum dipilih.' }, { status: 400 })
  }

  const inv = await invitations.findById(invitationId)
  if (!inv || inv.user_id !== session.userId) {
    return NextResponse.json({ error: 'Datanya tidak ditemukan.' }, { status: 404 })
  }

  const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10)

  const [totalViews, dailyViews, guestStats, wishList, topReferrers] = await Promise.all([
    invitationViews.countByInvitation(invitationId),
    invitationViews.dailyCounts(invitationId, days),
    guests.countByInvitation(invitationId),
    wishes.findByInvitationId(invitationId),
    invitationViews.topReferrers(invitationId, 5),
  ])

  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const viewsThisWeek = dailyViews
    .filter(d => new Date(d.date) >= weekAgo)
    .reduce((s, d) => s + d.count, 0)

  return NextResponse.json({
    totalViews,
    viewsThisWeek,
    dailyViews,
    topReferrers,
    rsvp: {
      total: guestStats.total,
      attending: guestStats.attending,
      declined: guestStats.declined,
      pending: guestStats.pending,
    },
    wishes: wishList.length,
  })
}
