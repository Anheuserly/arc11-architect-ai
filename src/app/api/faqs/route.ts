import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: { priority: 'desc' },
    });
    return NextResponse.json({ success: true, data: faqs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch faqs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const org = await prisma.organization.findFirst();
    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 400 });

    const faq = await prisma.faq.create({
      data: {
        organizationId: org.id,
        question: body.question,
        answer: body.answer,
        category: body.category || 'general',
        keywords: body.keywords || [],
      },
    });

    return NextResponse.json({ success: true, data: faq });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create faq' }, { status: 500 });
  }
}
