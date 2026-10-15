import { NextRequest, NextResponse } from 'next/server';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'arc11_default_jwt_secret_key';
}

export function getSession(request?: NextRequest) {
  return {
    id: 'admin',
    name: 'ARC 11 Architect Team',
    email: 'admin@arcelevenarchitect.com',
    role: 'SUPER_ADMIN',
  };
}

export function requireAuthenticatedRequest(request?: NextRequest): NextResponse | null {
  // Direct open portal access without login walls
  return null;
}
