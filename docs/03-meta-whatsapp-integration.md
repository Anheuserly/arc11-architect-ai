# 03. Meta WhatsApp Cloud API Integration

ARC 11 Architect operates officially on the Meta WhatsApp Cloud API (Graph API v21.0).

---

## 🔑 Meta Credentials & Environment Variables

These variables are defined in `.env`:

```env
# Meta App & Account IDs
META_APP_ID="1366869258359438"
META_APP_SECRET="5fa2f7f41f89ac2cc36b6f0ee4238014"
META_ACCESS_TOKEN="EAATbKQyZAUo4BSrWN3Cla0ZCNqumdqo8vkHYZCFbZCtEf9RDiG2DPtXZAsn6foroOIySYffzJqqll8dyQerVdDVyio7T7kUV0DXCFGBoJp3aX1PXEAf0s4RQamSQ8sInQ1aI2ZAt9TInOgQuK9Te47kC7aN3tCJFQvGoJ44GSLfzfmsy6SsNIiDWPr4NUPewZDZD"

# WhatsApp Business Account & Phone Number
WHATSAPP_BUSINESS_ACCOUNT_ID="1427614785976785"
WHATSAPP_PHONE_NUMBER_ID="1374779232381161"
WHATSAPP_PHONE_DISPLAY="+91 93118 47555"

# Webhook Verification
WHATSAPP_VERIFY_TOKEN="arc11_architect_webhook_token_secure_2026"
META_WEBHOOK_SECRET="5fa2f7f41f89ac2cc36b6f0ee4238014"
```

---

## 🌐 Webhook Configuration on Meta Developer Portal

To receive live inbound messages from customer mobile phones into the portal:

1. **Callback URL:** `https://<your-public-domain-or-tunnel>/api/webhooks/whatsapp`
2. **Verify Token:** `arc11_architect_webhook_token_secure_2026`
3. **Webhook Subscribed Fields:**
   - `messages` (Mandatory: incoming texts, media, locations, button clicks)
   - `message_template_status_update`

### Webhook Route Implementation:
- **`GET /api/webhooks/whatsapp`:** Handles Meta challenge handshake (`hub.challenge`).
- **`POST /api/webhooks/whatsapp`:**
  - Verifies `x-hub-signature-256` using `META_APP_SECRET`.
  - Dispatches delivery status updates (`sent`, `delivered`, `read`, `failed`) into `prisma.messageStatus`.
  - Extracts sender name, clean phone number, and message text.
  - Hands off to `MessageProcessorService.processIncomingMessage(...)`.

---

## 📤 Sending Outbound Messages (`WhatsAppClient`)

Located in [`src/services/whatsapp-client.ts`](../src/services/whatsapp-client.ts):

```typescript
const result = await WhatsAppClient.sendMessage({
  to: '919876543210',
  text: 'Hello from ARC 11 Architect!',
});
```

### Key Behaviors:
1. **24-Hour Customer Service Window:**  
   Meta allows freeform text replies only within 24 hours of the customer's last message. If outside the window, Meta requires pre-approved template messages.
2. **Graceful Error Handling:**  
   If sending fails (e.g. invalid phone number or expired 24-hr session), the service records `MessageDeliveryStatus.FAILED` in PostgreSQL and surfaces a notice banner in the UI.

---

## 🧪 Testing Inbound Flow Without a Public Domain

The application includes an internal simulation flag in `POST /api/messages/send`:
```json
{
  "toPhone": "919999888877",
  "recipientName": "Vikram Kapoor",
  "messageText": "Hi, I want a 4BHK villa design in Noida Sector 150 on 300 sq yards.",
  "isSimulateIncoming": true
}
```
Setting `isSimulateIncoming: true` routes the payload through the exact same pipeline as a live WhatsApp webhook (`processIncomingMessage`), updating `contacts`, `conversations`, `leads`, and client memory.
