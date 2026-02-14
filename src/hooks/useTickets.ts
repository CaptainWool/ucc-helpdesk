import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Ticket, User } from '../types';

interface UseTicketsOptions extends Partial<UseQueryOptions<Ticket[]>> {
    user?: User | null;
    role?: string;
}

export const useTickets = (options: UseTicketsOptions = {}) => {
    const { user, role, ...queryOptions } = options;

    const isStudent = role === 'student' || user?.role === 'student';

    const queryKey = isStudent
        ? ['tickets', user?.id]
        : ['admin-tickets'];

    return useQuery({
        queryKey,
        queryFn: () => api.tickets.list(),
        initialData: [] as Ticket[],
        enabled: isStudent ? !!user?.id : true,
        refetchInterval: 5000, // 5s polling for very fast updates
        ...queryOptions
    });
};

export const useTicket = (id: string, options: Partial<UseQueryOptions<Ticket>> = {}) => {
    return useQuery({
        queryKey: ['ticket', id],
        queryFn: () => api.tickets.get(id),
        enabled: !!id,
        refetchInterval: 15000, // Faster polling for individual ticket view
        ...options
    });
};

export const useCreateTicket = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    return useMutation({
        mutationFn: (data: any) => api.tickets.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            showSuccess('Ticket created successfully');
        },
        onError: (error: any) => {
            console.error('Create ticket failed:', error);
            showError(error.message || 'Failed to create ticket');
        }
    });
};

import { sendTicketUpdateNotification } from '../lib/emailNotifications';
import { sendSmsNotification, formatStatusUpdateMessage, formatResolutionMessage } from '../lib/smsNotifications';
import { useAuth } from '../contexts/AuthContext';

export const useUpdateTicket = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError, showInfo } = useToast();
    const { profile } = useAuth();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Ticket> }) => api.tickets.update(id, updates),
        onSuccess: async (updatedTicket, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });

            // Trigger notifications if status changed
            if (variables.updates.status && updatedTicket) {
                const studentEmail = updatedTicket.email; // Assuming ticket object has student contact info
                const oldStatus = '...'; // In a real app, we'd compare with previous state
                const newStatus = updatedTicket.status;
                const updatedBy = profile?.email || 'System';

                // 1. Email Notification
                if (updatedTicket.notification_preferences?.email !== false) {
                    await sendTicketUpdateNotification(updatedTicket, 'Previous', newStatus, updatedBy);
                }

                // 2. SMS/WhatsApp Notification
                const phone = updatedTicket.phone_number;
                if (phone) {
                    const isResolved = newStatus === 'Resolved';
                    const message = isResolved
                        ? formatResolutionMessage(updatedTicket.id, updatedTicket.subject)
                        : formatStatusUpdateMessage(updatedTicket.id, updatedTicket.subject, 'Previous', newStatus);

                    if (updatedTicket.notification_preferences?.sms) {
                        await sendSmsNotification(phone, message, 'sms');
                    }

                    if (updatedTicket.notification_preferences?.whatsapp) {
                        showInfo('🚀 Sending realtime WhatsApp update...');
                        await sendSmsNotification(phone, message, 'whatsapp');
                    }
                }
            }
        },
        onError: (error: any) => {
            console.error('Update ticket failed:', error);
            showError(error.message || 'Failed to update ticket');
        }
    });
};

export const useDeleteTicket = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    return useMutation({
        mutationFn: (id: string) => api.tickets.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
        },
        onError: (error: any) => {
            console.error('Delete ticket failed:', error);
            showError('Failed to delete ticket');
        }
    });
};

export const useResolveTicket = () => {
    const { mutateAsync } = useUpdateTicket();
    const { showSuccess } = useToast();

    return {
        resolveTicket: async (id: string) => {
            await mutateAsync({ id, updates: { status: 'Resolved' } });
            showSuccess('Ticket status updated to Resolved');
        }
    };
};

export const useAssignTicket = () => {
    const { mutateAsync } = useUpdateTicket();
    const { showSuccess } = useToast();

    return {
        assignTicket: async (id: string, email: string | null) => {
            await mutateAsync({ id, updates: { assigned_to_email: email } });
            showSuccess(email ? `Assigned to ${email}` : 'Ticket unassigned');
        }
    };
};

export const useAddTicketMessage = () => {
    const queryClient = useQueryClient();
    const { showError } = useToast();

    return useMutation({
        mutationFn: ({ ticketId, message, isInternal }: { ticketId: string, message: string, isInternal?: boolean }) =>
            api.messages.create(ticketId, message, isInternal ? 'agent' : 'student'),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ['messages', variables.ticketId] });
        },
        onError: (error: any) => {
            console.error('Add message failed:', error);
            showError(error.message || 'Failed to send message');
        }
    });
};
