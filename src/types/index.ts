import { z } from 'zod';
import { UserSchema, TicketSchema, MessageSchema, StatsSchema, FAQSchema } from '../lib/schemas';

export type User = z.infer<typeof UserSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type FAQ = z.infer<typeof FAQSchema>;

export type Role = User['role'];
export type TicketStatus = Ticket['status'];
export type TicketPriority = Ticket['priority'];

export interface AuthContextType {
    user: User | null;
    profile: User | null;
    loading: boolean;
    impersonating: boolean;
    signUp: (data: any) => Promise<{ data: any; error: any }>;
    signIn: (credentials: { email: string; password: string }) => Promise<{ data: any; error: any }>;
    masterLogin: () => void;
    studentLogin: () => void;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    impersonateUser: (userId: string) => Promise<void>;
    stopImpersonating: () => void;
}
