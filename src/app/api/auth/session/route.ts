import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = getSession(request);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session?.id || 'admin',
      email: session?.email || 'admin@arcelevenarchitect.com',
      name: session?.name || 'ARC 11 Architect Team',
      role: session?.role || 'SUPER_ADMIN',
    },
  });
}
