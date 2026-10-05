import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { WhatsAppClient } from '../src/services/whatsapp-client';
import { MessageProcessorService } from '../src/services/message-processor';

test('1. Meta Webhook Signature Verification', () => {
  const isValid = WhatsAppClient.verifySignature('{"test":"payload"}', null);
  assert.equal(isValid, true, 'Default development check passes');
});

test('2. Process Inbound Greeting and Create Contact & Conversation', async () => {
  const testPhone = '919876543210';
  const testWamid = `test_msg_${Date.now()}_1`;

  await MessageProcessorService.processIncomingMessage({
    wamid: testWamid,
    fromPhone: testPhone,
    senderName: 'Test Architect Client',
    body: 'Hello',
    messageType: 'text',
  });

  const contact = await prisma.contact.findUnique({
    where: { waId: testPhone },
  });
  assert.ok(contact, 'Contact should exist in database');
  assert.equal(contact.name, 'Test Architect Client');

  const conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id },
    include: { messages: true },
  });
  assert.ok(conversation, 'Conversation should exist');
  assert.ok(conversation.messages.length >= 1, 'Should contain stored messages');
});

test('3. Enforce Strict Message Idempotency (Duplicate Prevention)', async () => {
  const testPhone = '919876543210';
  const testWamid = `test_msg_${Date.now()}_dedup`;

  // First call
  await MessageProcessorService.processIncomingMessage({
    wamid: testWamid,
    fromPhone: testPhone,
    senderName: 'Test Architect Client',
    body: 'Start a new project',
    messageType: 'text',
  });

  const countAfterFirst = await prisma.message.count({ where: { wamid: testWamid } });
  assert.equal(countAfterFirst, 1, 'Message recorded once');

  // Duplicate call with exact same wamid
  await MessageProcessorService.processIncomingMessage({
    wamid: testWamid,
    fromPhone: testPhone,
    senderName: 'Test Architect Client',
    body: 'Start a new project duplicate',
    messageType: 'text',
  });

  const countAfterDuplicate = await prisma.message.count({ where: { wamid: testWamid } });
  assert.equal(countAfterDuplicate, 1, 'Duplicate was ignored cleanly without duplicate insert');
});

test('4. Human Handoff Mechanism (Pauses Bot & Triggers Escalation)', async () => {
  const testPhone = '919876543210';
  const testWamid = `test_msg_${Date.now()}_handoff`;

  await MessageProcessorService.processIncomingMessage({
    wamid: testWamid,
    fromPhone: testPhone,
    senderName: 'Test Architect Client',
    body: 'Can I talk to a human agent please',
    messageType: 'text',
  });

  const contact = await prisma.contact.findUnique({ where: { waId: testPhone } });
  const conversation = await prisma.conversation.findFirst({
    where: { contactId: contact!.id },
  });

  assert.equal(conversation?.status, 'HUMAN_REQUIRED', 'Conversation marked as HUMAN_REQUIRED');

  // Clean up test contact
  await prisma.contact.delete({ where: { id: contact!.id } });
});
