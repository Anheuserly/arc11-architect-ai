# 04. AI Engine & Persistent Client Memory

A core feature of the ARC 11 platform is maintaining a persistent memory profile for each client, so the AI remembers their taste, architectural style, plot details, likes, and dislikes across sessions.

---

## 🧠 Client Memory Architecture (`ClientMemoryService`)

Located in [`src/services/client-memory.ts`](../src/services/client-memory.ts).

### Memory Schema (`ClientProfileMemory`):
```typescript
export interface ClientProfileMemory {
  projectType?: string;        // e.g. "Luxury Villa / Bungalow"
  location?: string;           // e.g. "Noida Sector 150"
  plotArea?: string;           // e.g. "300 sq yards"
  floors?: string;             // e.g. "G+2 / Duplex"
  budget?: string;             // e.g. "₹2.5 Cr"
  stylePreferences?: string[]; // ["Modern / Contemporary", "Minimalist", "4 BHK"]
  likes?: string[];            // ["Central Courtyard (Aangan)", "Abundant Natural Light"]
  dislikes?: string[];         // ["Avoid traditional or dark wooden themes"]
  notes?: string[];            // Freeform remarks
  updatedAt?: string;
}
```

### Storage Mechanism:
- Serialized as formatted JSON inside the `Contact.notes` column.
- Key tags (project type, styles, city) are mirrored into `Contact.tags` (`String[]`) and `Contact.city` for fast indexing.

---

## 🔍 How Information is Extracted

Whenever an incoming message arrives, `ClientMemoryService.recordInteractionMemory(contactId, message)` runs:

1. **Styles & Configurations:** Regex and keyword matching for Modern, Minimalist, Classical, Neoclassical, Luxury, Vastu, Industrial, Duplex, 1-7 BHK.
2. **Project Types:** Villa, Bungalow, Farmhouse, Penthouse, Corporate Office, Clinic, Hospitality.
3. **Likes & Must-Haves:** Central courtyard, swimming pool, terrace garden, double-height ceilings, glass facade, elevator, solar/sustainable.
4. **Dislikes & Things to Avoid:** "No vastu", "avoid dark wood", "no carpets", "avoid open kitchen".
5. **Locations:** Delhi NCR, Noida, Gurgaon, Greater Noida, Faridabad, Sector numbers.
6. **Plot Sizes:** `\b(\d+(\s*x\s*\d+)?\s*(sq\s*(yards|yd|ft|m)|sqm|gaz|acres))\b`.
7. **Budgets:** Amounts in Cr, Crore, Lakhs, INR.

---

## 🎯 Automatic Lead Qualification

`ClientMemoryService.autoCaptureLeadIfApplicable(contactId, message)`:
- If a message contains sufficient architectural indicators (project type, plot area, or style + location), it automatically creates or updates a record in `Lead` (`leads` table in PostgreSQL).
- Creates a `LeadEvent` audit entry (`eventType: 'ai_auto_qualified'`).
- The contact immediately receives a "Client & Lead" badge in the dashboard.

---

## 🤖 Memory-Aware AI Response (`AiEngineService`)

Located in [`src/services/ai-engine.ts`](../src/services/ai-engine.ts).

When generating an answer:
1. Recalls `clientMemory` from `Contact.notes`.
2. Injects recalled profile into the system prompt:
   ```
   RECALLED CLIENT MEMORY & PREFERENCES:
   - Client Name: Vikram Kapoor
   - Location/City: Noida Sector 150
   - Project Type: Luxury Villa / Bungalow
   - Plot Area: 300 sq yards
   - Design Style Preferences: Modern / Contemporary, Minimalist, 4 BHK
   - Client Likes/Special Requirements: Central Courtyard (Aangan)
   ```
3. If using OpenAI or Gemini (`AI_PROVIDER="openai"`), the LLM crafts a hyper-personalized response acknowledging their specific villa size and style.
4. If using the high-fidelity rule fallback (`AI_PROVIDER="mock-rules"`), the rule engine dynamically customizes its text with the client's known location and preferred architectural theme.
