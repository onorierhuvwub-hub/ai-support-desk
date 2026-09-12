import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body || {};

    const expectedUsername = process.env.ADMIN_USERNAME || 'bbrown123';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'GodisLove123';

    if (username === expectedUsername && password === expectedPassword) {
      const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

      // Set secure HTTP-only session cookie
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid admin username or password.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('Unexpected error in POST /api/auth/login:', err);
    return NextResponse.json(
      { error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
