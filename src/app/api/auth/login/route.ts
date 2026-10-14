import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret, verifyPortalAccessKey } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, accessKey } = await request.json();

    if (!email || !password || !accessKey) {
      return NextResponse.json({ error: 'All access credentials are required' }, { status: 400 });
    }

    if (!verifyPortalAccessKey(accessKey)) {
      return NextResponse.json({ error: 'Invalid access credentials' }, { status: 401 });
    }

    const member = await prisma.teamMember.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!member || !member.isActive) {
      return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, member.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        organizationId: member.organizationId,
      },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    await prisma.teamMember.update({
      where: { id: member.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: member.organizationId,
        actorId: member.id,
        action: 'login',
        entityType: 'auth',
        details: { email: member.email, role: member.role },
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
      },
    });

    response.cookies.set('arc11_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json({ error: 'Internal login error' }, { status: 500 });
  }
}
