/**
 * SMS/WhatsApp Notification Utility
 * In a real-world scenario, this would interface with Twilio, MessageBird, or a similar provider.
 */

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

interface NotificationResult {
    success: boolean;
    message?: string;
    error?: any;
}

/**
 * Send a notification via SMS or WhatsApp
 * @param to - The recipient's phone number
 * @param content - The message content
 * @param channel - 'sms' or 'whatsapp'
 */
export const sendSmsNotification = async (to: string, content: string, channel: 'sms' | 'whatsapp' = 'sms'): Promise<NotificationResult> => {
    // If not configured, we simulate it in the console for development
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        console.group(`[SIMULATED ${channel.toUpperCase()} NOTIFICATION]`);
        console.info(`To: ${to}`);
        console.info(`Message: ${content}`);
        console.groupEnd();

        // Return success for simulation purposes
        return { success: true, message: 'Simulated successfully' };
    }

    try {
        // This is where the real Twilio API call would happen
        // For example: using a backend proxy or internal service
        const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, content, channel })
        });

        if (!response.ok) throw new Error('Failed to send notification');

        return { success: true };
    } catch (error) {
        console.error(`${channel.toUpperCase()} Notification failed:`, error);
        return { success: false, error };
    }
};

/**
 * Format a status update message
 */
export const formatStatusUpdateMessage = (ticketId: string, subject: string, oldStatus: string, newStatus: string): string => {
    return `📋 UCC Helpdesk: Ticket #${ticketId.substring(0, 8)} (${subject}) has been updated:\n\nStatus: ${newStatus}\n\nTrack here: ${window.location.origin}/track-ticket?id=${ticketId}`;
};

/**
 * Format a resolution message
 */
export const formatResolutionMessage = (ticketId: string, subject: string): string => {
    return `✅ UCC Helpdesk: Great news! Your ticket #${ticketId.substring(0, 8)} (${subject}) has been RESOLVED.\n\nWe hope this helps! If you still need assistance, feel free to reply or log in to the portal.\n\nView Details: ${window.location.origin}/track-ticket?id=${ticketId}`;
};
