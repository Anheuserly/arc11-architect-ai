# 03. Meta WhatsApp Cloud API Integration

ARC 11 Architect operates officially on the Meta WhatsApp Cloud API (Graph API v21.0).

---

## 🔑 Meta Credentials & Environment Variables

These variables are defined only in the deployment environment (or local ignored
`.env`). Never paste their real values into source control, documentation, issue
trackers, or chat messages.

```env
# Meta App & Account IDs / secrets
META_APP_ID="YOUR_META_APP_ID"
META_APP_SECRET="YOUR_META_APP_SECRET"
META_ACCESS_TOKEN="YOUR_SYSTEM_USER_ACCESS_TOKEN"

# WhatsApp Business Account & Phone Number
WHATSAPP_BUSINESS_ACCOUNT_ID="YOUR_WABA_ID"
WHATSAPP_PHONE_NUMBER_ID="YOUR_PHONE_NUMBER_ID"
WHATSAPP_PHONE_DISPLAY="YOUR_BUSINESS_PHONE_NUMBER"

# Webhook Verification
WHATSAPP_VERIFY_TOKEN="GENERATE_A_RANDOM_VERIFY_TOKEN"
META_WEBHOOK_SECRET="YOUR_META_APP_SECRET"
```

---

## 🌐 Webhook Configuration on Meta Developer Portal

To receive live inbound messages from customer mobile phones into the portal:

1. **Callback URL:** `https://<your-public-domain-or-tunnel>/api/webhooks/whatsapp`
2. **Verify Token:** the private value configured as `WHATSAPP_VERIFY_TOKEN`.
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
