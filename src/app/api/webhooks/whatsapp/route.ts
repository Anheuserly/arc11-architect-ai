import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppClient } from '@/services/whatsapp-client';
import { MessageProcessorService } from '@/services/message-processor';
import { prisma } from '@/lib/prisma';
import { MessageDeliveryStatus } from '@prisma/client';

/** GET: Meta Webhook Challenge Verification */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[Webhook GET] Verified Meta challenge successfully.');
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/** POST: signed inbound messages and delivery statuses from Meta */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!WhatsAppClient.verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
      console.warn('[Webhook POST] Invalid signature rejected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'IGNORED' }, { status: 200 });
    }

    // Persist and process before acknowledging Meta. This prevents a rapid series
    // of customer messages from racing into duplicate conversations.
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        for (const status of value.statuses || []) {
          const existing = await prisma.message.findUnique({ where: { wamid: status.id } });
          if (!existing) continue;
          const deliveryStatus = status.status === 'sent' ? MessageDeliveryStatus.SENT
            : status.status === 'delivered' ? MessageDeliveryStatus.DELIVERED
            : status.status === 'read' ? MessageDeliveryStatus.READ
            : status.status === 'failed' ? MessageDeliveryStatus.FAILED
            : MessageDeliveryStatus.PENDING;
          await prisma.message.update({ where: { id: existing.id }, data: { deliveryStatus } });
          await prisma.messageStatus.create({
            data: { messageId: existing.id, wamid: status.id, status: deliveryStatus, errorDetails: status.errors || null },
          });
        }

        const senderName = value.contacts?.[0]?.profile?.name;
        for (const message of value.messages || []) {
          const type = message.type || 'text';
          const body = type === 'text' ? message.text?.body || ''
            : type === 'interactive' ? message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || ''
            : type === 'location' ? `Location shared: Lat ${message.location?.latitude}, Lng ${message.location?.longitude}`
            : `[${type.toUpperCase()} message received]`;
          await MessageProcessorService.processIncomingMessage({
            wamid: message.id,
            fromPhone: message.from,
            senderName,
            body,
            messageType: type,
            rawPayload: message,
          });
        }
      }
    }
    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error) {
    console.error('[Webhook POST] Error handling event:', error);
    // Meta expects a 2xx response for syntactically valid deliveries. Errors are
    // logged for investigation while an individual malformed event cannot disable the subscription.
    return NextResponse.json({ status: 'ERROR_RECORDED' }, { status: 200 });
  }
}
