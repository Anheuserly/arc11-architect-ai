import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthenticatedRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const unauthorized = requireAuthenticatedRequest(request);
  if (unauthorized) return unauthorized;
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';

    const contacts = await prisma.contact.findMany({
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { lastMessageAt: 'desc' },
        },
        leads: {
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          orderBy: { scheduledAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const filtered = query
      ? contacts.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(query)) ||
            c.phoneNumber.includes(query) ||
            (c.city && c.city.toLowerCase().includes(query))
        )
      : contacts;

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error('[Contacts GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAuthenticatedRequest(request);
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    const { name, phoneNumber, email, city, notes } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');

    const contact = await prisma.contact.upsert({
      where: { waId: cleanPhone },
      update: {
        name: name || undefined,
        phoneNumber: cleanPhone,
        email: email || undefined,
        city: city || undefined,
        notes: notes || undefined,
      },
      create: {
        waId: cleanPhone,
        phoneNumber: cleanPhone,
        name: name || 'Valued Client',
        email: email || null,
        city: city || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (error) {
    console.error('[Contacts POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create or update contact' }, { status: 500 });
  }
}
