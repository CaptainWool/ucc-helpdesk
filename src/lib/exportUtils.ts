// Export utilities for tickets
import { api } from './api';
import { Ticket } from '../types';

/**
 * Export tickets to CSV format
 * @param {Ticket[]} tickets - Array of ticket objects
 * @param {string} filename - Optional filename
 */
export const exportToCSV = (tickets: Ticket[], filename: string = 'tickets-export.csv'): void => {
    if (!tickets || tickets.length === 0) {
        alert('No tickets to export');
        return;
    }

    // Define CSV headers
    const headers = [
        'Ticket ID',
        'Email',
        'Student ID',
        'Full Name',
        'Type',
        'Subject',
        'Description',
        'Status',
        'Priority',
        'Created At',
        'Updated At',
        'Resolved At'
    ];

    // Convert tickets to CSV rows
    const rows = tickets.map(ticket => [
        ticket.id,
        ticket.email,
        ticket.student_id || 'N/A',
        ticket.full_name,
        ticket.type,
        ticket.subject,
        `"${(ticket.description || '').replace(/"/g, '""')}"`, // Escape quotes
        ticket.status,
        ticket.priority || 'Medium',
        new Date(ticket.created_at).toLocaleString(),
        new Date((ticket as any).updated_at || ticket.created_at).toLocaleString(),
        ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Exported ${tickets.length} tickets to CSV`);
};

/**
 * Export tickets to PDF format
 * @param {Ticket[]} tickets - Array of ticket objects
 * @param {string} filename - Optional filename
 */
export const exportToPDF = async (tickets: Ticket[], _filename: string = 'tickets-export.pdf'): Promise<void> => {
    if (!tickets || tickets.length === 0) {
        alert('No tickets to export');
        return;
    }

    // Create HTML content for PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>UCC Helpdesk - Tickets Export</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                h1 {
                    color: #2563eb;
                    border-bottom: 2px solid #2563eb;
                    padding-bottom: 10px;
                }
                .meta {
                    color: #666;
                    margin-bottom: 30px;
                }
                .ticket {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }
                .ticket-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                .ticket-id {
                    font-weight: bold;
                    color: #2563eb;
                }
                .status {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-open { background: #dbeafe; color: #1e40af; }
                .status-in-progress { background: #fef3c7; color: #92400e; }
                .status-resolved { background: #d1fae5; color: #065f46; }
                .status-closed { background: #e5e7eb; color: #374151; }
                .ticket-body {
                    margin-top: 10px;
                }
                .field {
                    margin-bottom: 8px;
                }
                .label {
                    font-weight: bold;
                    color: #666;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f3f4f6;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>UCC Helpdesk - Tickets Export</h1>
            <div class="meta">
                <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Total Tickets:</strong> ${tickets.length}</p>
            </div>
            
            ${tickets.map(ticket => `
                <div class="ticket">
                    <div class="ticket-header">
                        <span class="ticket-id">Ticket #${String(ticket.id).substring(0, 8)}</span>
                        <span class="status status-${(ticket.status || '').toLowerCase().replace(' ', '-')}">${ticket.status}</span>
                    </div>
                    <div class="ticket-body">
                        <div class="field"><span class="label">Subject:</span> ${ticket.subject}</div>
                        <div class="field"><span class="label">Type:</span> ${ticket.type}</div>
                        <div class="field"><span class="label">Student:</span> ${ticket.full_name} (${ticket.email})</div>
                        ${ticket.student_id ? `<div class="field"><span class="label">Student ID:</span> ${ticket.student_id}</div>` : ''}
                        <div class="field"><span class="label">Priority:</span> ${ticket.priority || 'Medium'}</div>
                        <div class="field"><span class="label">Description:</span> ${ticket.description}</div>
                        <div class="field"><span class="label">Created:</span> ${new Date(ticket.created_at).toLocaleString()}</div>
                        ${ticket.resolved_at ? `<div class="field"><span class="label">Resolved:</span> ${new Date(ticket.resolved_at).toLocaleString()}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </body>
        </html>
    `;

    // Open print dialog with the HTML content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    }

    console.log(`Prepared ${tickets.length} tickets for PDF export`);
};

/**
 * Export single ticket with full details including messages
 * @param {string} ticketId - Ticket ID
 */
export const exportSingleTicketPDF = async (ticketId: string): Promise<void> => {
    try {
        // Fetch ticket details using api
        const ticket = await api.tickets.get(ticketId);

        // Fetch ticket messages
        const messages = await api.messages.list(ticketId);

        // Create detailed HTML
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Ticket #${String(ticket.id).substring(0, 8)} - UCC Helpdesk</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                    h1 { color: #2563eb; }
                    .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                    .label { font-weight: bold; color: #666; }
                    .message { background: #f9fafb; padding: 10px; margin: 10px 0; border-left: 3px solid #2563eb; }
                    .message-header { font-size: 12px; color: #666; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <h1>Ticket #${String(ticket.id).substring(0, 8)}</h1>
                <div class="section">
                    <p><span class="label">Subject:</span> ${ticket.subject}</p>
                    <p><span class="label">Type:</span> ${ticket.type}</p>
                    <p><span class="label">Status:</span> ${ticket.status}</p>
                    <p><span class="label">Priority:</span> ${ticket.priority || 'Medium'}</p>
                    <p><span class="label">Student:</span> ${ticket.full_name} (${ticket.email})</p>
                    <p><span class="label">Created:</span> ${new Date(ticket.created_at).toLocaleString()}</p>
                    <p><span class="label">Description:</span></p>
                    <p>${ticket.description}</p>
                </div>
                
                ${messages && messages.length > 0 ? `
                    <h2>Conversation History</h2>
                    ${messages.map(msg => `
                        <div class="message">
                            <div class="message-header">
                                <strong>${msg.full_name || msg.sender_role}</strong> - ${new Date(msg.created_at).toLocaleString()}
                            </div>
                            <div>${msg.content}</div>
                        </div>
                    `).join('')}
                ` : ''}
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.onload = () => printWindow.print();
        }

    } catch (error) {
        console.error('Error exporting ticket:', error);
        alert('Failed to export ticket. Please try again.');
    }
};
