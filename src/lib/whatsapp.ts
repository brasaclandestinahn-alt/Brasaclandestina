/**
 * Brasa Clandestina - WhatsApp Link Generator (Senior Implementation)
 * Generates traceable links with UTM parameters for conversion tracking.
 */
export function buildWhatsAppLink(productName: string, source: string = "web_menu"): string {
    const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || "50499999999";
    
    // Clean number (only digits)
    const cleanNumber = waNumber.replace(/\D/g, '');
    
    const message = encodeURIComponent(
      `🔥 ¡Hola Brasa Clandestina! Me gustaría pedir: ${productName}.`
    );
    
    // UTM tracking parameters for GA4/Meta
    const utm = `utm_source=brasaclandestina&utm_medium=cta&utm_campaign=${source}`;
    
    return `https://wa.me/${cleanNumber}?text=${message}&${utm}`;
}
