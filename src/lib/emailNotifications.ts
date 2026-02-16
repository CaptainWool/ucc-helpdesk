// Email notification utility for ticket updates
import emailjs from '@emailjs/browser';
import { Ticket, Message, User } from '../types';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export interface NotificationResult {
    success: boolean;
    response?: any;
    error?: any;
}

/**
 * Send email notification when ticket status changes
 */
export const sendTicketUpdateNotification = async (
    ticket: Ticket,
    oldStatus: string,
    newStatus: string,
    updatedBy: string
): Promise<NotificationResult> => {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.warn('EmailJS not configured. Skipping email notification.');
        return { success: false, error: 'EmailJS not configured' };
    }

    try {
        const templateParams = {
            to_email: ticket.email,
            to_name: ticket.full_name,
            ticket_id: String(ticket.id || '').substring(0, 8),
            ticket_subject: ticket.subject,
            old_status: oldStatus,
            new_status: newStatus,
            updated_by: updatedBy,
            tracking_link: `${window.location.origin}/track-ticket?id=${ticket.id}`,
            message: `Your ticket status has been updated from "${oldStatus}" to "${newStatus}".`
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log('Email notification sent:', response);
        return { success: true, response };
    } catch (error) {
        console.error('Failed to send email notification:', error);
        return { success: false, error };
    }
};

/**
 * Send email notification when a new message is added to ticket
 */
export const sendNewMessageNotification = async (
    ticket: Ticket,
    message: Message & { sender_name?: string; message?: string }
): Promise<NotificationResult> => {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.warn('EmailJS not configured. Skipping email notification.');
        return { success: false, error: 'EmailJS not configured' };
    }

    try {
        const templateParams = {
            to_email: ticket.email,
            to_name: ticket.full_name,
            ticket_id: String(ticket.id || '').substring(0, 8),
            ticket_subject: ticket.subject,
            message_from: message.sender_name || 'System',
            message_content: message.content || message.message || '',
            tracking_link: `${window.location.origin}/track-ticket?id=${ticket.id}`,
            message: `New message from ${message.sender_name || 'System'}: ${String(message.content || message.message || '').substring(0, 100)}...`
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log('Email notification sent:', response);
        return { success: true, response };
    } catch (error) {
        console.error('Failed to send email notification:', error);
        return { success: false, error };
    }
};

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (user: User): Promise<NotificationResult> => {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.warn('EmailJS not configured. Skipping email notification.');
        return { success: false, error: 'EmailJS not configured' };
    }

    try {
        const templateParams = {
            to_email: user.email,
            to_name: user.full_name || user.email.split('@')[0],
            dashboard_link: `${window.location.origin}/dashboard`,
            message: 'Welcome to UCC Helpdesk! You can now submit and track support tickets.'
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log('Welcome email sent:', response);
        return { success: true, response };
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return { success: false, error };
    }
};
