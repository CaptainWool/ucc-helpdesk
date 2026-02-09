# Additional Features Implementation Guide

This guide covers the new features added to the UCC Helpdesk platform.

---

## Feature 1: Email Notifications

### Overview
Automatic email notifications for ticket updates, new messages, and welcome emails.

### Setup

1. **Verify EmailJS Configuration**

Check your `.env` file has:
```env
VITE_EMAILJS_SERVICE_ID=service_rtvypwa
VITE_EMAILJS_TEMPLATE_ID=template_j2chccb
VITE_EMAILJS_PUBLIC_KEY=ms0UP5TqkfTulsI-p
```

2. **EmailJS Template Setup**

In your EmailJS dashboard, create a template with these variables:
- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name
- `{{ticket_id}}` - Ticket ID
- `{{ticket_subject}}` - Ticket subject
- `{{message}}` - Notification message
- `{{tracking_link}}` - Link to track ticket

### Usage

#### Send Ticket Update Notification

```javascript
import { sendTicketUpdateNotification } from '../lib/emailNotifications';

// When updating ticket status
await sendTicketUpdateNotification(
    ticket,
    'Open',      // old status
    'Resolved',  // new status
    'admin@ucc.edu.gh'
);
```

#### Send New Message Notification

```javascript
import { sendNewMessageNotification } from '../lib/emailNotifications';

// When adding a message to ticket
await sendNewMessageNotification(ticket, message);
```

#### Send Welcome Email

```javascript
import { sendWelcomeEmail } from '../lib/emailNotifications';

// After user signup
await sendWelcomeEmail(user);
```

### Integration Points

Add email notifications to:
1. **AdminDashboard.jsx** - When updating ticket status
2. **TrackTicket.jsx** - When adding messages
3. **StudentSignUp.jsx** - After successful signup

---

## Feature 2: Export to CSV

### Overview
Export tickets to CSV format for analysis in Excel or Google Sheets.

### Usage

```javascript
import { exportToCSV } from '../lib/exportUtils';

// Export all tickets
exportToCSV(tickets, 'all-tickets.csv');

// Export filtered tickets
const openTickets = tickets.filter(t => t.status === 'Open');
exportToCSV(openTickets, 'open-tickets.csv');
```

### CSV Format

The exported CSV includes:
- Ticket ID
- Email
- Student ID
- Full Name
- Type
- Subject
- Description
- Status
- Priority
- Created At
- Updated At
- Resolved At

### Add Export Button to Admin Dashboard

```javascript
import { Download } from 'lucide-react';
import { exportToCSV } from '../lib/exportUtils';

<Button onClick={() => exportToCSV(tickets)}>
    <Download size={18} /> Export to CSV
</Button>
```

---

## Feature 3: Export to PDF

### Overview
Export tickets to PDF format for printing or archiving.

### Usage

#### Export Multiple Tickets

```javascript
import { exportToPDF } from '../lib/exportUtils';

// Export all tickets
exportToPDF(tickets, 'all-tickets.pdf');

// Export filtered tickets
const resolvedTickets = tickets.filter(t => t.status === 'Resolved');
exportToPDF(resolvedTickets, 'resolved-tickets.pdf');
```

#### Export Single Ticket with Conversation

```javascript
import { exportSingleTicketPDF } from '../lib/exportUtils';

// Export ticket with full conversation history
await exportSingleTicketPDF(ticketId);
```

### Add Export Button to Track Ticket Page

```javascript
import { FileText } from 'lucide-react';
import { exportSingleTicketPDF } from '../lib/exportUtils';

<Button onClick={() => exportSingleTicketPDF(ticket.id)}>
    <FileText size={18} /> Export to PDF
</Button>
```

---

## Feature 4: Advanced Ticket Filtering

### Implementation

Add to AdminDashboard.jsx:

```javascript
const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    dateRange: 'all'
});

const filteredTickets = tickets.filter(ticket => {
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    if (filters.type !== 'all' && ticket.type !== filters.type) return false;
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    
    if (filters.dateRange === 'today') {
        const today = new Date().toDateString();
        const ticketDate = new Date(ticket.created_at).toDateString();
        if (today !== ticketDate) return false;
    }
    
    if (filters.dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(ticket.created_at) < weekAgo) return false;
    }
    
    return true;
});
```

### Filter UI

```javascript
<div className="filters">
    <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
        <option value="all">All Status</option>
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
    </select>
    
    <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
        <option value="all">All Types</option>
        <option value="portal">Portal Issues</option>
        <option value="fees">Fee Clarifications</option>
        <option value="academic">General Inquiries</option>
    </select>
    
    <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})}>
        <option value="all">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
    </select>
    
    <select value={filters.dateRange} onChange={(e) => setFilters({...filters, dateRange: e.target.value})}>
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
    </select>
</div>
```

---

## Feature 5: Bulk Operations (Admin)

### Implementation

Add to AdminDashboard.jsx:

```javascript
const [selectedTickets, setSelectedTickets] = useState([]);

const handleBulkStatusUpdate = async (newStatus) => {
    const updates = selectedTickets.map(ticketId =>
        supabase
            .from('tickets')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', ticketId)
    );
    
    await Promise.all(updates);
    setSelectedTickets([]);
    fetchTickets(); // Refresh
};

const handleBulkAssign = async (agentId) => {
    const updates = selectedTickets.map(ticketId =>
        supabase
            .from('tickets')
            .update({ assigned_to: agentId })
            .eq('id', ticketId)
    );
    
    await Promise.all(updates);
    setSelectedTickets([]);
    fetchTickets();
};
```

### Bulk Operations UI

```javascript
{selectedTickets.length > 0 && (
    <div className="bulk-actions">
        <span>{selectedTickets.length} tickets selected</span>
        <Button onClick={() => handleBulkStatusUpdate('In Progress')}>
            Mark as In Progress
        </Button>
        <Button onClick={() => handleBulkStatusUpdate('Resolved')}>
            Mark as Resolved
        </Button>
        <Button onClick={() => setSelectedTickets([])}>
            Clear Selection
        </Button>
    </div>
)}
```

---

## Feature 6: Ticket Search

### Implementation

```javascript
const [searchQuery, setSearchQuery] = useState('');

const searchedTickets = filteredTickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.includes(searchQuery)
);
```

### Search UI

```javascript
<div className="search-bar">
    <Search size={18} />
    <input
        type="text"
        placeholder="Search by subject, description, email, or ID..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
    />
</div>
```

---

## Feature 7: Analytics Enhancements

### Average Resolution Time

```javascript
const calculateAverageResolutionTime = (tickets) => {
    const resolvedTickets = tickets.filter(t => t.resolved_at);
    if (resolvedTickets.length === 0) return 'N/A';
    
    const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.resolved_at);
        return sum + (resolved - created);
    }, 0);
    
    const avgMs = totalTime / resolvedTickets.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));
    
    return `${avgHours} hours`;
};
```

### Tickets by Category Chart

```javascript
const ticketsByCategory = {
    portal: tickets.filter(t => t.type === 'portal').length,
    fees: tickets.filter(t => t.type === 'fees').length,
    academic: tickets.filter(t => t.type === 'academic').length,
    other: tickets.filter(t => t.type === 'other').length
};
```

---

## Testing the New Features

### Test Email Notifications

1. Update a ticket status in admin dashboard
2. Check the recipient's email inbox
3. Verify email contains correct information

### Test CSV Export

1. Go to admin dashboard
2. Click "Export to CSV"
3. Open the downloaded file in Excel
4. Verify all data is present

### Test PDF Export

1. Go to a ticket details page
2. Click "Export to PDF"
3. Verify PDF opens in new tab
4. Print or save the PDF

### Test Bulk Operations

1. Select multiple tickets using checkboxes
2. Click "Mark as Resolved"
3. Verify all selected tickets updated

---

## Next Steps

1. ✅ Integrate email notifications into existing pages
2. ✅ Add export buttons to admin dashboard
3. ✅ Test all new features thoroughly
4. ✅ Deploy to production
5. ✅ Monitor usage and gather feedback
