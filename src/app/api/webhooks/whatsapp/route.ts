import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppClient } from '@/services/whatsapp-client';
import { MessageProcessorService } from '@/services/message-processor';
import { prisma } from '@/lib/prisma';
import { MessageDeliveryStatus } from '@prisma/client';

/**
 * GET: Meta Webhook Challenge Verification
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  console.log(`[Webhook GET] mode: ${mode}, token provided: ${token}`);

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook GET] Verified Meta challenge successfully.');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST: Incoming WhatsApp Messages & Delivery Statuses
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // 1. Verify Meta Signature
    if (!WhatsAppClient.verifySignature(rawBody, signature)) {
      console.warn('[Webhook POST] Invalid signature rejected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Meta sends entry array
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const val = change.value;
        if (!val) continue;

        // A. Handle Status Updates (sent, delivered, read, failed)
        if (val.statuses && Array.isArray(val.statuses)) {
          for (const s of val.statuses) {
            const wamid = s.id;
            const statusStr = s.status; // sent, delivered, read, failed

            let deliveryStatus: MessageDeliveryStatus = MessageDeliveryStatus.PENDING;
            if (statusStr === 'sent') deliveryStatus = MessageDeliveryStatus.SENT;
            if (statusStr === 'delivered') deliveryStatus = MessageDeliveryStatus.DELIVERED;
            if (statusStr === 'read') deliveryStatus = MessageDeliveryStatus.READ;
            if (statusStr === 'failed') deliveryStatus = MessageDeliveryStatus.FAILED;

            const existingMsg = await prisma.message.findUnique({
              where: { wamid },
            });

            if (existingMsg) {
              await prisma.message.update({
                where: { id: existingMsg.id },
                data: { deliveryStatus },
              });

              await prisma.messageStatus.create({
                data: {
                  messageId: existingMsg.id,
                  wamid,
                  status: deliveryStatus,
                  errorDetails: s.errors ? s.errors : null,
                },
              });
            }
          }
        }

        // B. Handle Inbound Messages
        if (val.messages && Array.isArray(val.messages)) {
          const contactMetadata = val.contacts?.[0];
          const senderName = contactMetadata?.profile?.name;

          for (const msg of val.messages) {
            const wamid = msg.id;
            const fromPhone = msg.from;
            const msgType = msg.type; // text, interactive, image, document, location

            let body = '';
            if (msgType === 'text') {
              body = msg.text?.body || '';
            } else if (msgType === 'interactive') {
              body = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
            } else if (msgType === 'location') {
              body = `Location shared: Lat ${msg.location?.latitude}, Lng ${msg.location?.longitude}`;
            } else {
              body = `[${msgType.toUpperCase()} message received]`;
            }

            // Asynchronously process without blocking Meta webhook response
            await MessageProcessorService.processIncomingMessage({
              wamid,
              fromPhone,
              senderName,
              body,
              messageType: msgType,
              rawPayload: msg,
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error) {
    console.error('[Webhook POST] Error handling event:', error);
    // Always return 200 to prevent Meta from disabling the webhook endpoint during transient exceptions
    return NextResponse.json({ status: 'ERROR_RECORDED' }, { status: 200 });
  }
}
