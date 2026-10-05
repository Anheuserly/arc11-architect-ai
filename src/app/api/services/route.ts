import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 400 });

    const service = await prisma.service.create({
      data: {
        organizationId: org.id,
        title: body.title,
        category: body.category,
        description: body.description,
        keyFeatures: body.keyFeatures || [],
      },
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
