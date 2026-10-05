import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppClient } from '@/services/whatsapp-client';
import { ConversationStatus, MessageDeliveryStatus, MessageDirection } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status as ConversationStatus;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        states: true,
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error('[Conversations GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
