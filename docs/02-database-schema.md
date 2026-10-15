# 02. Database Schema & Models

The database is PostgreSQL hosted on a remote Windows VPS. The connection string
is an environment secret and must never be committed:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/arc11architect?schema=public&sslmode=disable"
```

The schema is defined in [`prisma/schema.prisma`](../prisma/schema.prisma). Below are the core models and their responsibilities.

---

## 🗄️ Core Models

### 1. `Contact` (`contacts`)
Represents an individual customer or lead interacting with ARC 11 Architect.
```prisma
model Contact {
  id                String         @id @default(uuid()) @db.Uuid
  waId              String         @unique @map("wa_id") // Clean phone digits (e.g. 919311847555)
  phoneNumber       String         @map("phone_number")
  name              String?
  email             String?
  preferredLanguage String         @default("en") @map("preferred_language")
  city              String?
  notes             String?        // Stores JSON string of ClientProfileMemory (likes, dislikes, styles, plot specs)
  tags              String[]       @default([]) // Extracted tags (e.g. "Luxury Villa", "Modern", "Noida Sector 150")
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")

  conversations     Conversation[]
  leads             Lead[]
  appointments      Appointment[]

  @@index([phoneNumber])
  @@index([createdAt])
  @@map("contacts")
}
```

### 2. `Conversation` (`conversations`)
Represents a continuous chat thread between ARC 11 and a Contact.
```prisma
enum ConversationStatus {
  BOT_ACTIVE       @map("bot_active")       // AI automatically replies
  HUMAN_REQUIRED   @map("human_required")   // Customer requested human or system flagged
  HUMAN_ACTIVE     @map("human_active")     // Human architect has taken over; AI paused
  RESOLVED         @map("resolved")
  ARCHIVED         @map("archived")
}

model Conversation {
  id               String             @id @default(uuid()) @db.Uuid
  contactId        String             @map("contact_id") @db.Uuid
  whatsappNumberId String?            @map("whatsapp_number_id") @db.Uuid
  status           ConversationStatus @default(BOT_ACTIVE)
  assignedAgentId  String?            @map("assigned_agent_id") @db.Uuid
  lastIntent       String?            @map("last_intent")
  unreadCount      Int                @default(0) @map("unread_count")
  lastMessageAt    DateTime           @default(now()) @map("last_message_at")
  createdAt        DateTime           @default(now()) @map("created_at")
  updatedAt        DateTime           @updatedAt @map("updated_at")

  contact          Contact            @relation(fields: [contactId], references: [id], onDelete: Cascade)
  messages         Message[]
  states           ConversationState[]
  handoffs         Handoff[]
  aiSessions       AiSession[]

  @@index([contactId])
  @@index([status])
  @@index([lastMessageAt])
  @@map("conversations")
}
```

### 3. `Message` (`messages`)
Strict idempotency with Meta's unique WhatsApp message ID (`wamid`).
```prisma
enum MessageDirection {
  INBOUND  @map("inbound")
  OUTBOUND @map("outbound")
}

enum MessageDeliveryStatus {
  PENDING   @map("pending")
  SENT      @map("sent")
  DELIVERED @map("delivered")
  READ      @map("read")
  FAILED    @map("failed")
}

model Message {
  id               String                @id @default(uuid()) @db.Uuid
  conversationId   String                @map("conversationId") @db.Uuid
  wamid            String                @unique // Meta WhatsApp Message ID
  direction        MessageDirection
  type             String                @default("text") // text, image, interactive, location
  body             String?               @db.Text
  mediaUrl         String?               @map("media_url")
  deliveryStatus   MessageDeliveryStatus @default(PENDING)
  senderType       String                @default("bot") // bot, customer, human_agent
  createdAt        DateTime              @default(now()) @map("created_at")
  updatedAt        DateTime              @updatedAt @map("updated_at")

  conversation     Conversation          @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  statuses         MessageStatus[]
}
```

### 4. `Lead` (`leads`)
Qualified project opportunities captured from WhatsApp conversations.
```prisma
enum LeadStatus {
  NEW           @map("new")
  CONTACTED     @map("contacted")
  QUALIFIED     @map("qualified")
  SITE_VISIT    @map("site_visit")
  PROPOSAL_SENT @map("proposal_sent")
  WON           @map("won")
  LOST          @map("lost")
}

model Lead {
  id             String        @id @default(uuid()) @db.Uuid
  organizationId String        @map("organization_id") @db.Uuid
  contactId      String        @map("contact_id") @db.Uuid
  projectType    String        @default("Residential") @map("project_type")
  location       String?
  plotArea       String?       @map("plot_area")
  builtUpArea    String?       @map("built_up_area")
  floors         String?
  budget         String?
  requirements   String?       @db.Text
  status         LeadStatus    @default(NEW)
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  contact        Contact       @relation(fields: [contactId], references: [id], onDelete: Cascade)
  events         LeadEvent[]
}
```

---

## ⚡ Entity-Relationship Diagram

```mermaid
erDiagram
    CONTACT ||--o{ CONVERSATION : has
    CONTACT ||--o{ LEAD : initiates
    CONVERSATION ||--o{ MESSAGE : contains
    CONVERSATION ||--o{ CONVERSATION_STATE : tracks
    MESSAGE ||--o{ MESSAGE_STATUS : receipts
    LEAD ||--o{ LEAD_EVENT : logs
```
