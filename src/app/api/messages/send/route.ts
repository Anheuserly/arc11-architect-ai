import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppClient } from '@/services/whatsapp-client';
import { MessageProcessorService } from '@/services/message-processor';
import { ConversationStatus, MessageDeliveryStatus, MessageDirection } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toPhone, recipientName, messageText, scheduleTime, isSimulateIncoming } = body;

    if (!toPhone || !messageText) {
      return NextResponse.json({ error: 'Phone number and message text are required' }, { status: 400 });
    }

    const cleanPhone = toPhone.replace(/[^\d]/g, '');

    // OPTION A: Test Simulate Incoming Message from Client
    if (isSimulateIncoming) {
      const mockWamid = `sim_in_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await MessageProcessorService.processIncomingMessage({
        wamid: mockWamid,
        fromPhone: cleanPhone,
        senderName: recipientName || 'Portal Test Client',
        body: messageText,
        messageType: 'text',
      });

      return NextResponse.json({
        success: true,
        mode: 'simulated_incoming',
        message: 'Simulated inbound customer message processed through automation engine.',
      });
    }

    // OPTION B: Send Outbound Direct WhatsApp Message
    // Fetch or create contact & conversation
    let contact = await prisma.contact.findUnique({
      where: { waId: cleanPhone },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          waId: cleanPhone,
          phoneNumber: cleanPhone,
          name: recipientName || 'Valued Client',
        },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          status: ConversationStatus.HUMAN_ACTIVE,
        },
      });
    }

    // Send via Meta WhatsApp Cloud API
    const sendResult = await WhatsAppClient.sendMessage({
      to: cleanPhone,
      text: messageText,
    });

    const wamid = sendResult.wamid || `out_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const savedMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        wamid,
        direction: MessageDirection.OUTBOUND,
        type: 'text',
        body: messageText,
        deliveryStatus: sendResult.success ? MessageDeliveryStatus.SENT : MessageDeliveryStatus.FAILED,
        senderType: 'human_agent',
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), status: ConversationStatus.HUMAN_ACTIVE },
    });

    return NextResponse.json({
      success: true,
      mode: 'outbound_sent',
      data: savedMsg,
      metaResponse: sendResult,
      scheduledFor: scheduleTime || null,
    });
  } catch (error) {
    console.error('[Send Test Route] Error:', error);
    return NextResponse.json({ error: 'Failed to dispatch message' }, { status: 500 });
  }
}
