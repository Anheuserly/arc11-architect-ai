import { prisma } from '@/lib/prisma';
import { ClientMemoryService, ClientProfileMemory } from './client-memory';

export interface AiGeneratorOptions {
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  contextCategory?: string;
  clientMemory?: ClientProfileMemory;
  contactName?: string;
}

export class AiEngineService {
  /**
   * Retrieves high-confidence ground truth from approved ARC 11 FAQs, Services, and Knowledge Base
   */
  public static async retrieveKnowledgeContext(query: string): Promise<string> {
    const qLower = query.toLowerCase();

    // 1. Fetch matching services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      take: 4,
    });

    // 2. Fetch matching FAQs
    const faqs = await prisma.faq.findMany({
      where: { isActive: true },
      take: 6,
    });

    let context = 'APPROVED ARC 11 ARCHITECT OFFICIAL KNOWLEDGE:\n\n';

    context += 'SERVICES OFFERED:\n';
    for (const s of services) {
      context += `- ${s.title} (${s.category}): ${s.description}\n  Key Features: ${s.keyFeatures.join(', ')}\n`;
    }

    context += '\nFREQUENTLY ASKED QUESTIONS:\n';
    for (const f of faqs) {
      if (f.keywords.some((kw) => qLower.includes(kw.toLowerCase())) || qLower.includes(f.question.toLowerCase())) {
        context += `Q: ${f.question}\nA: ${f.answer}\n`;
      }
    }

    return context;
  }

  /**
   * Generates grounded response adhering strictly to AI Safety Rules with Persistent Memory injection
   */
  public static async generateResponse(options: AiGeneratorOptions): Promise<string> {
    const provider = process.env.AI_PROVIDER || 'mock-rules';
    const openaiKey = process.env.OPENAI_API_KEY;

    const knowledgeContext = await this.retrieveKnowledgeContext(options.userMessage);

    let memoryContext = '';
    if (options.clientMemory) {
      const m = options.clientMemory;
      const memLines: string[] = [];
      if (options.contactName) memLines.push(`Client Name: ${options.contactName}`);
      if (m.location) memLines.push(`Location/City: ${m.location}`);
      if (m.projectType) memLines.push(`Project Type: ${m.projectType}`);
      if (m.plotArea) memLines.push(`Plot Area: ${m.plotArea}`);
      if (m.budget) memLines.push(`Budget: ${m.budget}`);
      if (m.timeline) memLines.push(`Desired timeline: ${m.timeline}`);
      if (m.stylePreferences && m.stylePreferences.length > 0) memLines.push(`Design Style Preferences: ${m.stylePreferences.join(', ')}`);
      if (m.likes && m.likes.length > 0) memLines.push(`Client Likes/Special Requirements: ${m.likes.join(', ')}`);
      if (m.dislikes && m.dislikes.length > 0) memLines.push(`Client Dislikes/Things to Avoid: ${m.dislikes.join(', ')}`);

      if (memLines.length > 0) {
        memoryContext = `\nRECALLED CLIENT MEMORY & PREFERENCES:\n${memLines.map(l => `- ${l}`).join('\n')}\n(Use this memory to provide deeply personalized answers. Acknowledge their known preferences when relevant.)\n`;
      }
    }

    const systemPrompt = `You are the official automated architectural consultant for "ARC 11 Architect", a premier architectural, interior design, and planning consultancy based in India (Delhi NCR / Pan-India).
You operate on WhatsApp representing ARC 11 Architect.

STRICT SAFETY AND FIDELITY RULES:
1. Always identify as ARC 11 Architect.
2. NEVER invent exact prices, rates, fee structures, or construction costs.
3. NEVER fabricate credentials, project history, or licenses.
4. If asked about exact costs, explain that architectural fees depend on site area, scope of drawings, and municipal guidelines, and offer to arrange an architect consultation.
5. Keep responses concise, warm, professional, and easy to read on WhatsApp (use bullet points or numbered lists where helpful).
6. Ground your answers strictly in the provided official knowledge.
${memoryContext}
${knowledgeContext}`;

    // If OpenAI API key is supplied, call OpenAI
    if (provider === 'openai' && openaiKey && !openaiKey.startsWith('placeholder_')) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...(options.conversationHistory || []),
              { role: 'user', content: options.userMessage },
            ],
            temperature: 0.3,
            max_tokens: 350,
          }),
        });

        const data = await response.json();
        if (response.ok && data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content.trim();
        }
      } catch (err) {
        console.error('[AiEngineService] OpenAI provider error:', err);
      }
    }

    // Smart Rule-Based & Knowledge Engine with Memory Personalization
    return this.generateMemoryAwareRuleResponse(options.userMessage, options.clientMemory, options.contactName);
  }

  private static generateMemoryAwareRuleResponse(
    text: string, 
    memory?: ClientProfileMemory,
    clientName?: string
  ): string {
    const lower = text.toLowerCase();
    const salutation = clientName && clientName !== 'Valued Client' ? `${clientName}, ` : '';

    // If client has recognized style or location in memory
    const knownStyle = memory?.stylePreferences?.[0];
    const knownLoc = memory?.location;

    if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('quote') || lower.includes('fee')) {
      return `${salutation}at ARC 11 Architect, architectural and design fees depend on site parameters, built-up area, and drawing requirements.\n\nWe provide tailored proposals after reviewing your site details. ${knownLoc ? `Since your project is in *${knownLoc}*, our team can prepare a site-specific proposal.` : 'Would you like to share your project location and plot area to get started?'}`;
    }

    if (lower.includes('timeline') || lower.includes('how long') || lower.includes('duration') || lower.includes('complete')) {
      return `${salutation}the design timeline is planned after reviewing the project size, scope, approvals required, and level of detailing. ${memory?.plotArea ? `For your *${memory.plotArea}* project` : 'For your project'}, our architect can outline a realistic design-and-approval programme once we know the location and requirements. Would you like us to arrange that discussion?`;
    }

    if (lower.includes('size') || lower.includes('area') || lower.includes('plot dimension') || lower.includes('plot size')) {
      return `${salutation}we can work with compact plots through larger residences and commercial spaces. Please share the plot dimensions or built-up area (for example, 30×50 ft, 200 sq yd, or 2,500 sq ft), and we will advise on the most suitable planning approach.`;
    }

    if (lower.includes('location') || lower.includes('city') || lower.includes('where are you')) {
      return `${salutation}ARC 11 Architect works across Delhi NCR and Pan-India. Share your site city or locality so our team can account for local conditions and applicable approval requirements—without promising any specific municipal outcome.`;
    }

    if (lower.includes('3d') || lower.includes('elevation') || lower.includes('render') || lower.includes('walkthrough')) {
      return `Yes${salutation ? `, ${salutation.replace(', ', '')}` : ''}! We create high-resolution 3D exterior elevations, daytime & evening lighting views, and realistic 3D interior walkthroughs so you can visualize your project before construction starts.${knownStyle ? ` We can render this in your preferred *${knownStyle}* theme.` : ''}`;
    }

    if (lower.includes('interior') || lower.includes('decor') || lower.includes('furniture')) {
      return `Our interior design services cover turnkey residential and commercial spaces, including space planning, custom furniture detailing, false ceilings, lighting layouts, and curated material finishes.${knownStyle ? ` We specialize in *${knownStyle}* interiors tailored to your taste.` : ''}`;
    }

    if (lower.includes('commercial') || lower.includes('office') || lower.includes('retail')) {
      return 'We design high-efficiency commercial developments including corporate offices, retail spaces, boutique outlets, and institutional buildings tailored for operational flow and aesthetic impact.';
    }

    if (lower.includes('portfolio') || lower.includes('work') || lower.includes('projects')) {
      return `We have designed luxury villas, duplex homes, modern apartments, corporate workspaces, and renovation projects across Delhi NCR and beyond. ${knownStyle ? `We would love to share projects featuring *${knownStyle}* concepts.` : 'Share your project type and our team will share relevant portfolio references.'}`;
    }

    // If client shared specific architectural project intent in general text
    if (lower.includes('design') || lower.includes('villa') || lower.includes('bhk') || lower.includes('house') || lower.includes('plot') || lower.includes('construct')) {
      let ack = `Thank you${salutation ? ` ${salutation.replace(', ', '')}` : ''} for sharing your vision with ARC 11 Architect.`;
      if (knownStyle) ack += ` We have noted your preference for *${knownStyle}* architecture.`;
      if (knownLoc) ack += ` Location: *${knownLoc}*.`;
      ack += `\n\nOur team has recorded these requirements in our project pipeline. An architect will reach out to discuss your floor plan and initial design concepts.\n\nFeel free to share any sketches, floor plans, or reference photos right here!`;
      return ack;
    }

    return `Thank you for reaching out to ARC 11 Architect. We are dedicated to delivering thoughtful architecture and interior solutions.\n\nPlease let us know what you would like to explore or reply "Menu" to see our core services.`;
  }
}
