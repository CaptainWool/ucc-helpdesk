# Migration Guide: Supabase to PostgreSQL

You have requested to migrate from Supabase to a standard PostgreSQL backend.
I have set up the backend structure and updated key frontend components.

## 1. Backend Setup (New)

A new `server` directory has been created.

### Step 1: Install Dependencies
Open a terminal in the `server` folder:
```bash
cd server
npm install
```

### Step 2: Set up PostgreSQL Database
1.  Make sure you have PostgreSQL installed and running locally.
2.  Create a new database (e.g., `ucc_helpdesk`).
3.  Run the schema script to create tables:
    You can use a tool like pgAdmin or run:
    ```bash
    psql -U your_username -d ucc_helpdesk -f schema.sql
    ```

### Step 3: Configure Environment
1.  Rename `.env.example` to `.env` in the `server` folder.
2.  Update `DATABASE_URL` with your connection string:
    `postgresql://username:password@localhost:5432/ucc_helpdesk`
3.  Set a secure `JWT_SECRET`.

### Step 4: Run the Server
```bash
npm run dev
```
The server will run on http://localhost:3000.

## 2. Frontend Changes

I have already updated the following:
*   **API Wrapper**: `src/lib/api.js` created to handle backend calls.
*   **Auth Context**: Switched to `src/contexts/AuthContext.jsx` (New Postgres version). The old one is backed up as `AuthContextSupabase.jsx`.
*   **Student Dashboard**: Updated to use the new API.
*   **Submit Ticket**: Updated to use the new API.

### 3. Remaining Tasks

You need to manually update the remaining components to complete the migration. Use `StudentDashboard.jsx` as a reference.

**Files to Update:**
*   `src/components/TicketChat.jsx`: Replace `supabase` subscription with polling or just API calls.
*   `src/pages/AdminDashboard.jsx`: Replace `supabase` queries with `api.tickets.list()` and `api.users.getUsers()`.
*   `src/pages/TrackTicket.jsx`: Update to use `api.tickets.get(id)`.

## 4. Troubleshooting

*   **App not loading**: Ensure the backend server is running on port 3000.
*   **Login fails**: The new database is empty. You need to Register a new user via the endpoint or seed the database.
*   **CORS errors**: The backend is configured to allow CORS, but check console logs.

## 5. Reverting

If you want to go back to Supabase:
1.  Delete `src/contexts/AuthContext.jsx`.
2.  Rename `src/contexts/AuthContextSupabase.jsx` back to `src/contexts/AuthContext.jsx`.
3.  Revert changes in `StudentDashboard.jsx` and `SubmitTicket.jsx`.
