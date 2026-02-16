import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TicketsView from '../components/admin/TicketsView';

// Mock Lucide icons to avoid SVGR issues in testing if not configured
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="icon-search" />,
    Trash2: () => <div data-testid="icon-trash" />,
    Eye: () => <div data-testid="icon-eye" />,
    User: () => <div data-testid="icon-user" />,
    CheckCircle: () => <div data-testid="icon-check" />,
    Download: () => <div data-testid="icon-download" />,
    ChevronRight: () => <div data-testid="icon-chevron-right" />
}));

const mockTickets = [
    {
        id: '1',
        student_id: '1234',
        subject: 'Test Ticket 1',
        description: 'Description 1',
        status: 'Open',
        priority: 'Medium',
        created_at: new Date().toISOString(),
        type: 'General',
        full_name: 'John Doe',
        assigned_to_email: null,
        sla_deadline: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    },
    {
        id: '2',
        student_id: '5678',
        subject: 'Test Ticket 2',
        description: 'Description 2',
        status: 'Resolved',
        priority: 'High',
        created_at: new Date().toISOString(),
        type: 'Fees',
        full_name: 'Jane Smith',
        assigned_to_email: 'agent@example.com',
        sla_deadline: new Date(Date.now() - 86400000).toISOString() // Yesterday
    }
];

const mockAgents = [
    { id: 'a1', email: 'agent@example.com', full_name: 'Agent Smith' }
];

const mockProfile = { role: 'super_admin' };

describe('TicketsView', () => {
    const defaultProps = {
        tickets: mockTickets,
        searchTerm: '',
        setSearchTerm: vi.fn(),
        filter: 'all',
        setFilter: vi.fn(),
        priorityFilter: 'all',
        setPriorityFilter: vi.fn(),
        selectedTicketIds: [],
        toggleSelectAll: vi.fn(),
        toggleSelectTicket: vi.fn(),
        onBulkDelete: vi.fn(),
        onSelectTicket: vi.fn(),
        onResolve: vi.fn(),
        onDelete: vi.fn(),
        onAssign: vi.fn(),
        onImpersonate: vi.fn(),
        agents: mockAgents,
        profile: mockProfile,
        currentTime: new Date()
    };

    it('renders the list of tickets', () => {
        render(<TicketsView {...defaultProps} />);
        expect(screen.getByText('Test Ticket 1')).toBeInTheDocument();
        expect(screen.getByText('Test Ticket 2')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays "No tickets found" when tickets array is empty', () => {
        render(<TicketsView {...defaultProps} tickets={[]} />);
        expect(screen.getByText('No tickets found')).toBeInTheDocument();
    });

    it('calls setFilter when status filter changes', () => {
        render(<TicketsView {...defaultProps} />);
        const selects = screen.getAllByRole('combobox');
        // Assuming first select is status based on order in JSX
        const statusSelect = selects[0];

        fireEvent.change(statusSelect, { target: { value: 'open' } });
        expect(defaultProps.setFilter).toHaveBeenCalledWith('open');
    });

    it('calls onDelete when delete button is clicked', () => {
        render(<TicketsView {...defaultProps} />);

        // Find delete buttons. They have title="Delete Ticket"
        const deleteButtons = screen.getAllByTitle('Delete Ticket');
        expect(deleteButtons.length).toBeGreaterThan(0);

        fireEvent.click(deleteButtons[0]);
        expect(defaultProps.onDelete).toHaveBeenCalledWith(mockTickets[0].id);
    });

    it('calls setSearchTerm when search input changes', () => {
        render(<TicketsView {...defaultProps} />);
        const input = screen.getByPlaceholderText(/search tickets/i);
        fireEvent.change(input, { target: { value: 'query' } });
        expect(defaultProps.setSearchTerm).toHaveBeenCalledWith('query');
    });
});
