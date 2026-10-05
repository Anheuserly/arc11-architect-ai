import { prisma } from '@/lib/prisma';

export interface AiGeneratorOptions {
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  contextCategory?: string;
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
   * Generates grounded response adhering strictly to AI Safety Rules
   */
  public static async generateResponse(options: AiGeneratorOptions): Promise<string> {
    const provider = process.env.AI_PROVIDER || 'mock-rules';
    const openaiKey = process.env.OPENAI_API_KEY;

    const knowledgeContext = await this.retrieveKnowledgeContext(options.userMessage);

    const systemPrompt = `You are the official automated assistant for "ARC 11 Architect", a premier architectural, interior design, and planning consultancy.
You operate on WhatsApp representing ARC 11 Architect.

STRICT SAFETY AND FIDELITY RULES:
1. Always identify as ARC 11 Architect.
2. NEVER invent prices, rates, fee structures, or guarantees.
3. NEVER fabricate credentials, project history, or licenses.
4. If asked about exact costs, explain that architectural fees depend on site area, scope of drawings, and municipal guidelines, and offer to arrange an architect consultation.
5. Keep responses concise, warm, professional, and easy to read on WhatsApp (use bullet points or numbered lists where helpful).
6. Ground your answers strictly in the provided official knowledge. If uncertain, state clearly: "I don't have enough specific details on that right now. Let me connect you with an ARC 11 Architect team member."

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

    // Default High-Fidelity Rule-Based Knowledge Engine
    return this.generateRuleBasedFallback(options.userMessage);
  }

  private static generateRuleBasedFallback(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('quote') || lower.includes('fee')) {
      return 'At ARC 11 Architect, architectural and design fees depend on site parameters, built-up area, and drawing requirements.\n\nWe provide tailored proposals after reviewing your site details. Would you like to share your project location and plot area to get started?';
    }

    if (lower.includes('3d') || lower.includes('elevation') || lower.includes('render') || lower.includes('walkthrough')) {
      return 'Yes! We create high-resolution 3D exterior elevations, daytime & evening lighting views, and realistic 3D interior walkthroughs so you can visualize your project before construction starts.';
    }

    if (lower.includes('interior') || lower.includes('decor') || lower.includes('furniture')) {
      return 'Our interior design services cover turnkey residential and commercial spaces, including space planning, custom furniture detailing, false ceilings, lighting layouts, and curated material finishes.';
    }

    if (lower.includes('commercial') || lower.includes('office') || lower.includes('retail')) {
      return 'We design high-efficiency commercial developments including corporate offices, retail spaces, boutique outlets, and institutional buildings tailored for operational flow and aesthetic impact.';
    }

    if (lower.includes('portfolio') || lower.includes('work') || lower.includes('projects')) {
      return 'We have designed luxury villas, duplex homes, modern apartments, corporate workspaces, and renovation projects across the region. Share your project type and our team will share relevant portfolio references.';
    }

    return 'Thank you for reaching out to ARC 11 Architect. We are dedicated to delivering thoughtful architecture and interior solutions.\n\nPlease let us know what you would like to explore or reply "Menu" to see our core services.';
  }
}
