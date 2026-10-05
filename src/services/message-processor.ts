import { prisma } from '@/lib/prisma';
import { WhatsAppClient } from './whatsapp-client';
import { AiEngineService } from './ai-engine';
import { ClientMemoryService, ClientProfileMemory } from './client-memory';
import { ConversationStatus, MessageDirection, MessageDeliveryStatus } from '@prisma/client';

export interface ProcessIncomingMessageParams {
  wamid: string;
  fromPhone: string;
  senderName?: string;
  body: string;
  messageType?: string;
  rawPayload?: any;
}

export class MessageProcessorService {
  /**
   * Main entry point for processing incoming WhatsApp messages
   */
  public static async processIncomingMessage(params: ProcessIncomingMessageParams): Promise<void> {
    const { wamid, fromPhone, senderName, body, messageType = 'text', rawPayload } = params;

    // 1. Strict Idempotency Check
    const existingMsg = await prisma.message.findUnique({
      where: { wamid },
    });

    if (existingMsg) {
      console.log(`[MessageProcessor] Message ${wamid} already processed. Skipping duplicate.`);
      return;
    }

    // 2. Fetch or Create Contact (Auto-add new contacts to the portal)
    const cleanPhone = fromPhone.replace(/[^\d]/g, '');
    let contact = await prisma.contact.findUnique({
      where: { waId: cleanPhone },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          waId: cleanPhone,
          phoneNumber: cleanPhone,
          name: senderName || 'Valued Client',
        },
      });
      console.log(`[MessageProcessor] New contact registered: ${cleanPhone} (${contact.name})`);
    } else if (senderName && contact.name !== senderName && contact.name === 'Valued Client') {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { name: senderName },
      });
    }

    // 3. Find or Create Active Conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        contactId: contact.id,
        status: { in: [ConversationStatus.BOT_ACTIVE, ConversationStatus.HUMAN_REQUIRED, ConversationStatus.HUMAN_ACTIVE] },
      },
      include: { states: true },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          status: ConversationStatus.BOT_ACTIVE,
          unreadCount: 1,
        },
        include: { states: true },
      });
    } else {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          unreadCount: { increment: 1 },
          lastMessageAt: new Date(),
        },
        include: { states: true },
      });
    }

    // 4. Save Inbound Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        wamid,
        direction: MessageDirection.INBOUND,
        type: messageType,
        body,
        rawPayload,
        deliveryStatus: MessageDeliveryStatus.DELIVERED,
        senderType: 'customer',
      },
    });

    // 5. Intelligent Client Memory & Preference Extraction
    // Automatically remembers style likes, dislikes, location, plot size, budget
    const memory = await ClientMemoryService.recordInteractionMemory(contact.id, body);

    // 6. Automatic Lead Qualification from Freeform Conversation
    await ClientMemoryService.autoCaptureLeadIfApplicable(contact.id, body);

    // 7. If Human Mode is Active, do not auto-respond
    if (conversation.status === ConversationStatus.HUMAN_ACTIVE || conversation.status === ConversationStatus.HUMAN_REQUIRED) {
      console.log(`[MessageProcessor] Conversation ${conversation.id} is in human mode. Auto-response paused.`);
      return;
    }

    // 8. Execute Intelligent Automation Flow with Memory Awareness
    await this.handleAutomationFlow({
      contact,
      conversation,
      body: body.trim(),
      clientMemory: memory,
    });
  }

  /**
   * Orchestrates Human Handoff, State Machine Lead Intake, and Smart Replies
   */
  private static async handleAutomationFlow(ctx: {
    contact: any;
    conversation: any;
    body: string;
    clientMemory: ClientProfileMemory;
  }): Promise<void> {
    const { contact, conversation, body, clientMemory } = ctx;
    const lower = body.toLowerCase();

    // TRIGGER A: Human Escalation Request
    if (
      lower.includes('human') ||
      lower.includes('agent') ||
      lower.includes('team') ||
      lower.includes('talk to someone') ||
      lower.includes('call me') ||
      lower.includes('representative') ||
      lower.includes('speak to architect')
    ) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.HUMAN_REQUIRED },
      });

      await prisma.handoff.create({
        data: {
          conversationId: conversation.id,
          reason: `User requested live assistance: "${body}"`,
        },
      });

      const responseText =
        'You are now connected with our human design queue.\n\nAn ARC 11 Architect senior partner has been notified and will review your conversation shortly.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, responseText);
      return;
    }

    // TRIGGER B: Conversation State Machine (Active Lead Intake)
    const currentStateRecord = conversation.states?.[0];
    if (currentStateRecord && currentStateRecord.currentState !== 'idle') {
      const handled = await this.handleStateProgress({
        conversationId: conversation.id,
        contact,
        stateRecord: currentStateRecord,
        input: body,
      });
      if (handled) return;
    }

    // TRIGGER C: Greetings & Main Menu
    if (
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower === 'start' ||
      lower === 'menu' ||
      lower === 'namaste' ||
      lower === 'good morning' ||
      lower === 'good afternoon'
    ) {
      const settings = await prisma.systemSetting.findUnique({ where: { key: 'bot_responses' } });
      const val = settings?.value as any;
      const welcomeText =
        val?.greetingText ||
        'Welcome to ARC 11 Architect.\n\nWe provide professional architectural and interior solutions for residential, commercial and bespoke projects.\n\nHow can we help you today?\n\n1. Architecture & Planning\n2. Interior Design\n3. 3D Visualization\n4. Residential Projects\n5. Commercial Projects\n6. Renovation & Remodeling\n7. Start a New Project\n8. Book a Consultation\n9. Portfolio\n10. Talk to Our Team';

      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, welcomeText);
      return;
    }

    // TRIGGER D: Menu Selection Options (1 to 10)
    if (body === '1' || lower.includes('architecture & planning')) {
      const text =
        '*ARC 11 Architect — Architecture & Planning*\n\nWe provide complete architectural planning, conceptual design, municipal approvals, and working drawings.\n\nWould you like to start a new architectural project? Reply *"7"* or share your site location.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    if (body === '2' || lower.includes('interior design')) {
      const text =
        '*ARC 11 Architect — Interior Design*\n\nCustom spatial planning, luxury material selection, lighting design, and bespoke joinery for homes & corporate spaces.\n\nWould you like to discuss your interior requirement? Reply *"7"* to start.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    if (body === '3' || lower.includes('3d visualization')) {
      const text =
        '*ARC 11 Architect — 3D Visualization*\n\nPhotorealistic 3D exterior facades, interior views, and 3D architectural walkthroughs.\n\nShare your floor plans or drawings to begin.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    if (body === '4' || lower.includes('residential')) {
      const text =
        '*ARC 11 Architect — Residential Design*\n\nFrom independent villas and duplex bungalows to modern farmhouses.\n\nShare your plot size and preferred location to explore concepts.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    if (body === '5' || lower.includes('commercial')) {
      const text =
        '*ARC 11 Architect — Commercial Projects*\n\nCorporate offices, retail outlets, boutique hospitality, and healthcare clinics.\n\nTell us your site location and business category to assist you.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    if (body === '6' || lower.includes('renovation')) {
      const text =
        '*ARC 11 Architect — Renovation & Remodeling*\n\nStructural revamps, elevation modernization, and layout optimization for existing properties.\n\nYou can send photos or drawings of your current space.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    // TRIGGER E: Start New Project or Intent = Project Enquiry
    if (
      body === '7' ||
      body === '8' ||
      lower.includes('start a project') ||
      lower.includes('need a house design') ||
      lower.includes('build a house') ||
      lower.includes('design my villa') ||
      lower.includes('new project')
    ) {
      await this.initiateLeadIntake(conversation.id, contact);
      return;
    }

    if (body === '9' || lower.includes('portfolio')) {
      const text =
        '*ARC 11 Architect Portfolio*\n\nOur portfolio spans contemporary residences, modern duplexes, luxury commercial offices, and interior restorations.\n\nPlease share your project type (Residential or Commercial) and we will send relevant project case studies.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    if (body === '10') {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: ConversationStatus.HUMAN_REQUIRED },
      });
      const text = 'Connecting you with the ARC 11 Architect team. A representative will get back to you shortly.';
      await this.sendAndRecordReply(conversation.id, contact.phoneNumber, text);
      return;
    }

    // Fetch past conversation messages for AI history
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    const conversationHistory = recentMessages.reverse().map(m => ({
      role: m.direction === MessageDirection.INBOUND ? 'user' : 'assistant',
      content: m.body || '',
    }));

    // TRIGGER F: Knowledge Base / AI Layer Response with Persistent Memory
    const aiAnswer = await AiEngineService.generateResponse({
      userMessage: body,
      conversationHistory,
      clientMemory,
      contactName: contact.name || undefined,
    });
    await this.sendAndRecordReply(conversation.id, contact.phoneNumber, aiAnswer);
  }

  /**
   * Starts progressive information collection for new architectural project
   */
  private static async initiateLeadIntake(conversationId: string, contact: any): Promise<void> {
    const prompt =
      'Thank you for your interest in ARC 11 Architect.\n\nTo help our design team understand your project, could you please share:\n\n1. *Project Location* (City or Area)?';

    await prisma.conversationState.upsert({
      where: { conversationId },
      update: {
        currentState: 'collecting_location',
        collectedData: {},
        lastPromptSent: prompt,
      },
      create: {
        conversationId,
        currentState: 'collecting_location',
        collectedData: {},
        lastPromptSent: prompt,
      },
    });

    await this.sendAndRecordReply(conversationId, contact.phoneNumber, prompt);
  }

  /**
   * Manages progressive lead collection state transitions
   */
  private static async handleStateProgress(params: {
    conversationId: string;
    contact: any;
    stateRecord: any;
    input: string;
  }): Promise<boolean> {
    const { conversationId, contact, stateRecord, input } = params;
    const data = (stateRecord.collectedData as any) || {};

    if (stateRecord.currentState === 'collecting_location') {
      data.location = input;
      const prompt = 'Got it! What is the approximate *plot size* or built-up area (e.g. 200 sq yards, 30x50 ft, 2500 sq ft)?';
      await prisma.conversationState.update({
        where: { id: stateRecord.id },
        data: { currentState: 'collecting_plot_size', collectedData: data, lastPromptSent: prompt },
      });
      await this.sendAndRecordReply(conversationId, contact.phoneNumber, prompt);
      return true;
    }

    if (stateRecord.currentState === 'collecting_plot_size') {
      data.plotArea = input;
      const prompt = 'Great. How many *floors* are you planning (e.g. G+1, G+2, Duplex)?';
      await prisma.conversationState.update({
        where: { id: stateRecord.id },
        data: { currentState: 'collecting_floors', collectedData: data, lastPromptSent: prompt },
      });
      await this.sendAndRecordReply(conversationId, contact.phoneNumber, prompt);
      return true;
    }

    if (stateRecord.currentState === 'collecting_floors') {
      data.floors = input;
      const prompt =
        'Do you have any specific requirements or preferred project style (e.g. 4 Bedrooms, Modern elevation, Vastu compliant)?';
      await prisma.conversationState.update({
        where: { id: stateRecord.id },
        data: { currentState: 'collecting_requirements', collectedData: data, lastPromptSent: prompt },
      });
      await this.sendAndRecordReply(conversationId, contact.phoneNumber, prompt);
      return true;
    }

    if (stateRecord.currentState === 'collecting_requirements') {
      data.requirements = input;

      // Finalize and Create Qualified Lead in Database
      const org = await prisma.organization.findFirst();
      if (org) {
        const lead = await prisma.lead.create({
          data: {
            organizationId: org.id,
            contactId: contact.id,
            projectType: data.projectType || 'Residential Architecture',
            location: data.location,
            plotArea: data.plotArea,
            floors: data.floors,
            requirements: data.requirements,
          },
        });

        await prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            eventType: 'lead_captured',
            description: `Lead auto-captured via WhatsApp for ${data.location}`,
            actorName: 'WhatsApp Automation',
          },
        });
      }

      // Record in client memory
      await ClientMemoryService.recordInteractionMemory(
        contact.id,
        `Location: ${data.location}, Plot: ${data.plotArea}, Floors: ${data.floors}, Style: ${data.requirements}`
      );

      // Reset state machine
      await prisma.conversationState.update({
        where: { id: stateRecord.id },
        data: { currentState: 'idle', collectedData: {} },
      });

      const finalSummary = `Thank you! Your project enquiry has been registered with ARC 11 Architect:\n\n📍 *Location:* ${data.location}\n📐 *Plot Area:* ${data.plotArea}\n🏢 *Floors:* ${data.floors}\n✨ *Requirements:* ${data.requirements}\n\nOur architectural team will review these details and contact you for a concept discussion. You can also send site drawings, sketches, or photos right here!`;

      await this.sendAndRecordReply(conversationId, contact.phoneNumber, finalSummary);
      return true;
    }

    return false;
  }

  /**
   * Dispatches WhatsApp outbound reply and persists in database
   */
  private static async sendAndRecordReply(conversationId: string, toPhone: string, text: string): Promise<void> {
    const sendResult = await WhatsAppClient.sendMessage({
      to: toPhone,
      text,
    });

    const wamid = sendResult.wamid || `out_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await prisma.message.create({
      data: {
        conversationId,
        wamid,
        direction: MessageDirection.OUTBOUND,
        type: 'text',
        body: text,
        deliveryStatus: sendResult.success ? MessageDeliveryStatus.SENT : MessageDeliveryStatus.FAILED,
        senderType: 'bot',
      },
    });
  }
}
