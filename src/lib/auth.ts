import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

const SESSION_COOKIE = 'arc11_session';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

export function verifyPortalAccessKey(candidate: unknown): boolean {
  const expected = process.env.PORTAL_ACCESS_KEY;
  if (!expected || typeof candidate !== 'string') return false;

  const expectedBuffer = Buffer.from(expected);
  const candidateBuffer = Buffer.from(candidate);
  return expectedBuffer.length === candidateBuffer.length
    && timingSafeEqual(expectedBuffer, candidateBuffer);
}

export function getSession(request: NextRequest): JwtPayload | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret());
    return typeof payload === 'string' ? null : payload;
  } catch {
    return null;
  }
}

export function requireAuthenticatedRequest(request: NextRequest): NextResponse | null {
  if (getSession(request)) return null;
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
}
