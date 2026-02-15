import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string().uuid().or(z.string()), // UUID usually, but string safe
    email: z.string().email(),
    full_name: z.string(),
    role: z.enum(['student', 'agent', 'super_admin', 'master']),
    student_id: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    is_banned: z.boolean().optional(),
    revoked_at: z.string().nullable().optional(),
    has_completed_tour: z.boolean().optional(),
    staff_id: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    expertise: z.string().nullable().optional(),
    created_at: z.string().optional(),
    ban_expires_at: z.string().nullable().optional(),
    revocation_reason: z.string().nullable().optional(),
    plaintext_password: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    notification_preferences: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        whatsapp: z.boolean().default(false)
    }).optional()
});

export const MessageSchema = z.object({
    id: z.string(),
    ticket_id: z.string(),
    sender_id: z.string().nullable().optional(),
    content: z.string(),
    created_at: z.string(),
    is_ai: z.boolean().optional(),
    sender_role: z.string().optional(),
    sender_name: z.string().optional()
});

export const TicketSchema = z.object({
    id: z.string(),
    subject: z.string(),
    description: z.string(),
    status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
    priority: z.enum(['Urgent', 'High', 'Medium', 'Low']),
    type: z.string(), // Flexible to allow 'portal', 'fees', etc.
    created_at: z.string(),
    student_id: z.string().nullable().optional(),
    assigned_to_email: z.string().nullable().optional(),
    assigned_agent: z.object({
        full_name: z.string(),
        email: z.string()
    }).optional().nullable(),
    sla_deadline: z.string().nullable().optional(),
    full_name: z.string().nullable().optional(),
    student_id_ref: z.string().nullable().optional(),
    resolved_at: z.string().nullable().optional(),
    messages: z.array(MessageSchema).optional(),
    email: z.string().optional(),
    phone_number: z.string().nullable().optional(),
    notification_preferences: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        whatsapp: z.boolean().default(false)
    }).optional(),
    attachment_url: z.string().nullable().optional()
});

export const StatsSchema = z.object({
    total_tickets: z.number(),
    pending_tickets: z.number(),
    resolved_tickets: z.number(),
    avg_response_time: z.number().or(z.string()).optional()
});

export const FAQSchema = z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
    category: z.string(),
    helpful_count: z.number().optional(),
    unhelpful_count: z.number().optional()
});
