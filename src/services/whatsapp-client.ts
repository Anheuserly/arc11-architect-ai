import crypto from 'crypto';

export interface WhatsAppOutgoingMessageOptions {
  to: string;
  type?: 'text' | 'interactive';
  text?: string;
  interactive?: any;
}

export class WhatsAppClient {
  private static apiVersion = 'v21.0';

  /**
   * Validates Meta Webhook SHA-256 signature
   */
  public static verifySignature(rawBody: string, signatureHeader?: string | null): boolean {
    const appSecret = process.env.META_APP_SECRET || process.env.META_WEBHOOK_SECRET;
    if (!appSecret || !signatureHeader) {
      // In dev mode without configured secret, allow testing
      if (process.env.NODE_ENV !== 'production') return true;
      return false;
    }

    try {
      const signatureParts = signatureHeader.split('sha256=');
      if (signatureParts.length !== 2) return false;
      const expectedSignature = signatureParts[1];

      const hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(rawBody, 'utf-8');
      const calculatedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(calculatedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (err) {
      console.error('[WhatsAppClient] Signature verification error:', err);
      return false;
    }
  }

  /**
   * Sends a message via Meta WhatsApp Cloud API
   */
  public static async sendMessage(options: WhatsAppOutgoingMessageOptions): Promise<{
    success: boolean;
    wamid?: string;
    error?: any;
  }> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken || accessToken.startsWith('placeholder_')) {
      console.warn('[WhatsAppClient] Meta credentials not configured. Mocking outbound delivery.');
      return {
        success: true,
        wamid: `mock_out_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: options.to.replace(/[^\d]/g, ''),
    };

    if (options.type === 'interactive' && options.interactive) {
      payload.type = 'interactive';
      payload.interactive = options.interactive;
    } else {
      payload.type = 'text';
      payload.text = {
        preview_url: false,
        body: options.text || '',
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[WhatsAppClient] Meta API error response:', data);
        return { success: false, error: data };
      }

      const wamid = data.messages?.[0]?.id;
      return { success: true, wamid };
    } catch (error) {
      console.error('[WhatsAppClient] Failed to send WhatsApp message:', error);
      return { success: false, error };
    }
  }
}
