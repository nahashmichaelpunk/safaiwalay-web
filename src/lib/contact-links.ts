/** Business WhatsApp line — single source of truth for wa.me, tel:, and in-app display. */
export const WHATSAPP_BUSINESS_E164 = '918600275796' as const;

export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_BUSINESS_E164}` as const;

export const WHATSAPP_TEL_HREF = `tel:+${WHATSAPP_BUSINESS_E164}` as const;

/** Optional pre-filled first message in the WhatsApp chat. */
const WHATSAPP_DEFAULT_MESSAGE =
  "Hi! I'd like to know more about SafaiWalay's cleaning services." as const;

export function getWhatsAppChatUrl(
  options?: { message?: string }
): string {
  const text = options?.message ?? WHATSAPP_DEFAULT_MESSAGE;
  const query = new URLSearchParams({ text });
  return `${WHATSAPP_CHAT_URL}?${query.toString()}`;
}
