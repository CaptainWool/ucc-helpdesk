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
    has_completed_tour: z.boolean().optional()
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
    // assigned_agent might be joined data
    assigned_agent: z.object({
        full_name: z.string(),
        email: z.string()
    }).optional().nullable(),
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
