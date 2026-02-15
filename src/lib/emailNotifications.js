// Email notification utility for ticket updates
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Send email notification when ticket status changes
 * @param {Object} ticket - The ticket object
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {string} updatedBy - Email of person who updated
 */
export const sendTicketUpdateNotification = async (ticket, oldStatus, newStatus, updatedBy) => {
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
 * @param {Object} ticket - The ticket object
 * @param {Object} message - The message object
 */
export const sendNewMessageNotification = async (ticket, message) => {
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
            message_from: message.sender_name,
            message_content: message.message,
            tracking_link: `${window.location.origin}/track-ticket?id=${ticket.id}`,
            message: `New message from ${message.sender_name}: ${String(message.message || '').substring(0, 100)}...`
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
 * @param {Object} user - The user object
 */
export const sendWelcomeEmail = async (user) => {
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
