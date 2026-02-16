import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

interface TicketEmailData {
    fullName: string;
    email: string;
    id: string;
    subject: string;
}

export const sendTicketEmail = async (ticketData: TicketEmailData) => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn('EmailJS credentials missing. Check .env file.');
        return;
    }

    try {
        const response = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
                to_name: ticketData.fullName,
                to_email: ticketData.email,
                ticket_id: ticketData.id,
                subject: ticketData.subject,
                message: `Your ticket has been received. Track status at: /track-ticket`,
            },
            PUBLIC_KEY
        );
        console.log('Email sent successfully!', response.status, response.text);
        return response;
    } catch (err) {
        console.error('Failed to send email:', err);
        throw err;
    }
};
