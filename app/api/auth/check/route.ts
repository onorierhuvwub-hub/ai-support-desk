import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('admin_session');

  const isAuthenticated = authCookie?.value === 'authenticated';

  return NextResponse.json({ authenticated: isAuthenticated });
}
