import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppClient } from '@/services/whatsapp-client';
import { MessageDeliveryStatus, MessageDirection } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: {
          include: {
            leads: true,
            appointments: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        states: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Reset unread count when opened
    await prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('[Conversation Detail GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, text } = body;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 1. Takeover action (Set human mode)
    if (action === 'takeover') {
      await prisma.conversation.update({
        where: { id },
        data: { status: 'HUMAN_ACTIVE' },
      });
      return NextResponse.json({ success: true, message: 'Agent took over conversation' });
    }

    // 2. Resume AI
    if (action === 'resume_ai') {
      await prisma.conversation.update({
        where: { id },
        data: { status: 'BOT_ACTIVE' },
      });
      return NextResponse.json({ success: true, message: 'AI automation resumed' });
    }

    // 3. Send Manual Message from Human Agent
    if (action === 'send_message' && text) {
      const sendResult = await WhatsAppClient.sendMessage({
        to: conversation.contact.phoneNumber,
        text,
      });

      const wamid = sendResult.wamid || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          wamid,
          direction: MessageDirection.OUTBOUND,
          type: 'text',
          body: text,
          deliveryStatus: sendResult.success ? MessageDeliveryStatus.SENT : MessageDeliveryStatus.FAILED,
          senderType: 'human_agent',
        },
      });

      await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      });

      if (!sendResult.success) {
        const metaErrMsg = sendResult.error?.error?.message || sendResult.error?.message || 'Meta Cloud API rejected outbound delivery';
        return NextResponse.json({
          success: false,
          error: `WhatsApp Delivery Failed: ${metaErrMsg}`,
          metaError: sendResult.error,
          data: message,
        }, { status: 422 });
      }

      return NextResponse.json({ success: true, data: message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Conversation Detail POST] Error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
