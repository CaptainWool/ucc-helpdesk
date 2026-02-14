import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';

export const useUsers = (role?: string, options: Partial<UseQueryOptions<User[]>> = {}) => {
    return useQuery({
        queryKey: ['users', role],
        queryFn: () => api.auth.getUsers(role),
        initialData: [] as User[],
        ...options
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    const { showSuccess, showError } = useToast();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: any }) => api.auth.updateUser(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showSuccess('User updated successfully');
        },
        onError: (error: any) => {
            console.error('Update user failed:', error);
            showError('Failed to update user');
        }
    });
};

export const useUpdateAvatar = () => {
    const { showSuccess, showError } = useToast();

    return useMutation({
        mutationFn: ({ id, file }: { id: string, file: File }) => api.auth.updateAvatar(id, file),
        onSuccess: () => {
            showSuccess('Profile picture updated successfully!');
        },
        onError: (error: any) => {
            console.error('Avatar update failed:', error);
            showError('Failed to update profile picture. Please try again.');
        }
    });
};
