import { prisma } from '@/lib/prisma';

export interface ClientProfileMemory {
  projectType?: string;
  location?: string;
  plotArea?: string;
  floors?: string;
  stylePreferences?: string[];
  likes?: string[];
  dislikes?: string[];
  budget?: string;
  timeline?: string;
  notes?: string[];
  updatedAt?: string;
}

export class ClientMemoryService {
  /**
   * Retrieves or initializes client memory profile from contact.notes
   */
  public static parseMemory(notesText: string | null | undefined): ClientProfileMemory {
    if (!notesText) {
      return {
        stylePreferences: [],
        likes: [],
        dislikes: [],
        notes: [],
      };
    }

    try {
      if (notesText.trim().startsWith('{') && notesText.trim().endsWith('}')) {
        return JSON.parse(notesText);
      }
    } catch {
      // Fallback if not pure JSON
    }

    return {
      stylePreferences: [],
      likes: [],
      dislikes: [],
      notes: [notesText],
    };
  }

  /**
   * Serializes client memory profile to string for storing in contact.notes
   */
  public static serializeMemory(memory: ClientProfileMemory): string {
    return JSON.stringify(memory, null, 2);
  }

  /**
   * Extracts architectural insights, likes, dislikes, preferences from user message
   */
  public static extractInsights(message: string): Partial<ClientProfileMemory> {
    const text = message.trim();
    const lower = text.toLowerCase();
    const extracted: Partial<ClientProfileMemory> = {};
    const styles: string[] = [];
    const likes: string[] = [];
    const dislikes: string[] = [];

    // 1. Style preferences
    if (lower.includes('modern') || lower.includes('contemporary')) styles.push('Modern / Contemporary');
    if (lower.includes('minimalist') || lower.includes('minimal')) styles.push('Minimalist');
    if (lower.includes('classical') || lower.includes('neo classical') || lower.includes('neoclassical')) styles.push('Classical / Neoclassical');
    if (lower.includes('luxury') || lower.includes('ultra luxury') || lower.includes('premium')) styles.push('Luxury High-End');
    if (lower.includes('vastu') || lower.includes('vaastu')) styles.push('100% Vastu Compliant');
    if (lower.includes('industrial') || lower.includes('exposed brick')) styles.push('Industrial / Exposed Brick');
    if (lower.includes('traditional') || lower.includes('vernacular') || lower.includes('haveli')) styles.push('Traditional / Vernacular');
    if (lower.includes('scandinavian') || lower.includes('japandi')) styles.push('Scandinavian / Japandi');

    // 2. Project types & configurations
    if (lower.match(/\b(1|2|3|4|5|6|7)\s*(bhk|bedroom|bed)\b/i)) {
      const bhkMatch = lower.match(/\b(1|2|3|4|5|6|7)\s*(bhk|bedroom|bed)\b/i);
      if (bhkMatch) styles.push(`${bhkMatch[1].toUpperCase()} BHK`);
    }
    if (lower.includes('villa') || lower.includes('bungalow') || lower.includes('kothi')) extracted.projectType = 'Luxury Villa / Bungalow';
    if (lower.includes('farmhouse') || lower.includes('farm house')) extracted.projectType = 'Farmhouse Estate';
    if (lower.includes('duplex') || lower.includes('triplex')) styles.push('Duplex Layout');
    if (lower.includes('penthouse')) extracted.projectType = 'Penthouse Residence';
    if (lower.includes('commercial') || lower.includes('office') || lower.includes('workspace')) extracted.projectType = 'Commercial / Corporate Office';
    if (lower.includes('clinic') || lower.includes('hospital')) extracted.projectType = 'Healthcare / Clinic';
    if (lower.includes('restaurant') || lower.includes('cafe')) extracted.projectType = 'Hospitality / Cafe';

    // 3. Likes & Special Features
    if (lower.includes('courtyard') || lower.includes('aangan')) likes.push('Central Courtyard (Aangan)');
    if (lower.includes('pool') || lower.includes('swimming pool')) likes.push('Private Swimming Pool');
    if (lower.includes('garden') || lower.includes('terrace garden') || lower.includes('landscape')) likes.push('Terrace / Landscape Garden');
    if (lower.includes('double height') || lower.includes('high ceiling')) likes.push('Double-height Living Ceiling');
    if (lower.includes('natural light') || lower.includes('sunlight') || lower.includes('large windows') || lower.includes('glass facade')) likes.push('Abundant Natural Light & Glass Facade');
    if (lower.includes('home theatre') || lower.includes('theatre room')) likes.push('Private Home Theatre');
    if (lower.includes('lift') || lower.includes('elevator')) likes.push('Provision for Home Elevator');
    if (lower.includes('solar') || lower.includes('sustainable') || lower.includes('green building')) likes.push('Sustainable / Solar Energy');

    // 4. Dislikes & Avoidances
    if (lower.includes('no vastu') || lower.includes('dont want vastu') || lower.includes("don't care about vastu")) dislikes.push('No strict Vastu required');
    if (lower.includes('hate traditional') || lower.includes('no traditional') || lower.includes('avoid dark') || lower.includes('dont want dark')) dislikes.push('Avoid traditional or dark wooden themes');
    if (lower.includes('no carpets') || lower.includes('avoid clutter') || lower.includes('clutter free')) dislikes.push('Prefers clutter-free, easy-maintenance finishes');
    if (lower.includes('avoid open kitchen') || lower.includes('closed kitchen')) dislikes.push('Avoid open kitchen (prefers closed/semi-closed kitchen)');

    // 5. Locations (Delhi NCR, Noida, Gurgaon, Greater Noida, etc.)
    const locMatch = text.match(/(?:in|at|around|for|location|site:?)\s+([A-Z][a-zA-Z\s]{2,25}(?:Noida|Gurgaon|Delhi|Faridabad|Ghaziabad|NCR|Sector\s*\d+|DLF|South Delhi|Dwarka|Greater Noida))/i);
    if (locMatch) {
      extracted.location = locMatch[1].trim();
    } else {
      if (lower.includes('delhi ncr') || lower.includes('delhi')) extracted.location = 'Delhi NCR';
      else if (lower.includes('gurgaon') || lower.includes('gurugram')) extracted.location = 'Gurugram';
      else if (lower.includes('greater noida')) extracted.location = 'Greater Noida';
      else if (lower.includes('noida')) extracted.location = 'Noida';
      else if (lower.includes('faridabad')) extracted.location = 'Faridabad';
    }

    // 6. Plot size / Area
    const plotMatch = text.match(/\b(\d+(?:\s*x\s*\d+)?\s*(?:sq\s*(?:yards?|yd|ft|feet|m)|sqm|gaz|gaj|acres?))\b/i);
    if (plotMatch) {
      extracted.plotArea = plotMatch[0].trim();
    }

    // 7. Budget
    const budgetMatch = text.match(/(?:budget|cost)\s*(?::|is|around|approx|of)?\s*([₹$]?\s*\d+(?:\.\d+)?\s*(?:crores?|lakhs?|cr|l|k)?)/i);
    if (budgetMatch) {
      extracted.budget = budgetMatch[1].trim();
    }

    // 8. Timeline / desired start or completion date
    const timelineMatch = text.match(/(?:timeline|completion|complete|start|starting|within|by)\s*(?:is|around|in|by|from)?\s*([\w\s-]{2,40}(?:days?|weeks?|months?|year|years?|asap|immediately|diwali|december|january|february|march|april|may|june|july|august|september|october|november)?)/i);
    if (timelineMatch && /(day|week|month|year|asap|immediate|diwali|january|february|march|april|may|june|july|august|september|october|november|december)/i.test(timelineMatch[0])) {
      extracted.timeline = timelineMatch[0].trim();
    }

    if (styles.length > 0) extracted.stylePreferences = styles;
    if (likes.length > 0) extracted.likes = likes;
    if (dislikes.length > 0) extracted.dislikes = dislikes;

    return extracted;
  }

  /**
   * Updates contact memory and returns updated memory object
   */
  public static async recordInteractionMemory(contactId: string, message: string): Promise<ClientProfileMemory> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return { stylePreferences: [], likes: [], dislikes: [], notes: [] };
    }

    const currentMemory = this.parseMemory(contact.notes);
    const newInsights = this.extractInsights(message);

    // Merge insights
    if (newInsights.projectType) currentMemory.projectType = newInsights.projectType;
    if (newInsights.location) currentMemory.location = newInsights.location;
    if (newInsights.plotArea) currentMemory.plotArea = newInsights.plotArea;
    if (newInsights.budget) currentMemory.budget = newInsights.budget;
    if (newInsights.timeline) currentMemory.timeline = newInsights.timeline;

    if (newInsights.stylePreferences && newInsights.stylePreferences.length > 0) {
      currentMemory.stylePreferences = Array.from(
        new Set([...(currentMemory.stylePreferences || []), ...newInsights.stylePreferences])
      );
    }

    if (newInsights.likes && newInsights.likes.length > 0) {
      currentMemory.likes = Array.from(
        new Set([...(currentMemory.likes || []), ...newInsights.likes])
      );
    }

    if (newInsights.dislikes && newInsights.dislikes.length > 0) {
      currentMemory.dislikes = Array.from(
        new Set([...(currentMemory.dislikes || []), ...newInsights.dislikes])
      );
    }

    currentMemory.updatedAt = new Date().toISOString();

    // Also update tags for easy querying
    const tagsToAdd: string[] = [];
    if (currentMemory.projectType) tagsToAdd.push(currentMemory.projectType);
    if (currentMemory.location) tagsToAdd.push(currentMemory.location);
    if (currentMemory.stylePreferences) tagsToAdd.push(...currentMemory.stylePreferences);

    const mergedTags = Array.from(new Set([...(contact.tags || []), ...tagsToAdd]));

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        notes: this.serializeMemory(currentMemory),
        tags: mergedTags,
        city: currentMemory.location || contact.city,
      },
    });

    return currentMemory;
  }

  /**
   * Auto-captures a lead if the user message contains substantial project requirements
   */
  public static async autoCaptureLeadIfApplicable(contactId: string, message: string): Promise<boolean> {
    const insights = this.extractInsights(message);
    const hasEnoughData = (insights.projectType || insights.plotArea || insights.stylePreferences?.length) && 
      (message.length > 25 || insights.location || insights.plotArea);

    if (!hasEnoughData) return false;

    // Check if lead already exists recently for this contact
    const existingLead = await prisma.lead.findFirst({
      where: { contactId },
      orderBy: { createdAt: 'desc' },
    });

    const org = await prisma.organization.findFirst();
    if (!org) return false;

    // If an existing lead was created within the last 2 hours, update it with new specs
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (existingLead && existingLead.createdAt > twoHoursAgo) {
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          projectType: insights.projectType || existingLead.projectType,
          location: insights.location || existingLead.location,
          plotArea: insights.plotArea || existingLead.plotArea,
          budget: insights.budget || existingLead.budget,
          timeline: insights.timeline || existingLead.timeline,
          requirements: `${existingLead.requirements ? existingLead.requirements + ' | ' : ''}${message}`.slice(0, 1000),
        },
      });
      return true;
    }

    // Otherwise create a fresh lead
    const newLead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        contactId,
        projectType: insights.projectType || 'Custom Architecture & Design',
        location: insights.location || 'NCR / Inquired via WhatsApp',
        plotArea: insights.plotArea || 'To be specified',
        floors: insights.floors || 'To be discussed',
        budget: insights.budget,
        timeline: insights.timeline,
        requirements: message,
      },
    });

    await prisma.leadEvent.create({
      data: {
        leadId: newLead.id,
        eventType: 'ai_auto_qualified',
        description: `Lead intelligently extracted by AI from message: "${message.slice(0, 100)}..."`,
        actorName: 'ARC 11 AI Engine',
      },
    });

    return true;
  }
}
