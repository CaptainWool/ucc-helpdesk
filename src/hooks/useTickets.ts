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
        refetchInterval: 30000, // 30s polling for real-time updates
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

export const useUpdateTicket = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Ticket> }) => api.tickets.update(id, updates),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
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
