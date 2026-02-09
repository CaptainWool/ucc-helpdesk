# 🚀 UCC Helpdesk - Deployment Guide

This project consists of three parts that need to be deployed:
1.  **Database**: PostgreSQL
2.  **Backend API**: Node.js & Express
3.  **Frontend**: React (Vite)

We recommend using **Render** for the Backend/Database and **Vercel** for the Frontend. Both have generous free tiers.

---

## Part 1: Database & Backend (Render)

### 1. Database Setup (Render or Neon)
You need a PostgreSQL database.
1.  Sign up at [dashboard.render.com](https://dashboard.render.com/).
2.  Click **New +** -> **PostgreSQL**.
3.  Name: `ucc-helpdesk-db`.
4.  Region: Frankfurt (or closest to you).
5.  Plan: **Free**.
6.  Click **Create Database**.
7.  **Copy the "Internal Database URL"** (starts with `postgres://...`) - save this for the next step.

### 2. Backend Deployment
1.  In Render Dashboard, click **New +** -> **Web Service**.
2.  Connect your GitHub repository.
3.  **Name**: `ucc-helpdesk-api`.
4.  **Region**: Same as your database.
5.  **Branch**: `main`.
6.  **Root Directory**: Leave blank (or put `.` ).
7.  **Runtime**: **Node**.
8.  **Build Command**: `cd server && npm install`.
9.  **Start Command**: `cd server && node server.js`.
10. **Environment Variables** (Scroll down to "Advanced"):
    -   Add `DATABASE_URL` -> Value: (The URL you copied from Step 1)
    -   Add `JWT_SECRET` -> Value: (Generate a random string)
    -   Add `PORT` -> Value: `3000` (Optional, Render sets this automatically)
11. Click **Create Web Service**.

Wait for the deployment to finish. Once live, Render will give you a public URL (e.g., `https://ucc-helpdesk-api.onrender.com`). **Copy this URL.**

---

## Part 2: Frontend (Vercel)

### 1. Frontend Deployment
1.  Go to [vercel.com](https://vercel.com/) and sign up/login.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Framework Preset**: Select **Vite**.
5.  **Root Directory**: Leave as `./`.
6.  **Environment Variables**:
    You need to add the following variables. *Crucially, you must point the API to your new Render backend.*

    -   `VITE_API_URL`: **(Paste your Render Backend URL here)** e.g., `https://ucc-helpdesk-api.onrender.com`
    -   `VITE_GEMINI_API_KEY`: (Your Gemini API Key)
    -   `VITE_EMAILJS_SERVICE_ID`: (Your EmailJS Service ID)
    -   `VITE_EMAILJS_TEMPLATE_ID`: (Your EmailJS Template ID)
    -   `VITE_EMAILJS_PUBLIC_KEY`: (Your EmailJS Public Key)

7.  Click **Deploy**.

Vercel will build your frontend and give you a live URL (e.g., `https://ucc-helpdesk.vercel.app`).

---

## Part 3: Final Configuration

1.  **Update Database Schema**:
    Your cloud database is currently empty. You need to run the `server/schema.sql` script on it.
    -   In the Render Dashboard (Database view), go to the **"Connect"** tab.
    -   Use the "External Connection" string to connect via a tool like **pgAdmin** or **DBeaver** on your laptop.
    -   Once connected, execute the SQL commands from `server/schema.sql` to create the tables.

2.  **Verify Connection**:
    -   Open your Vercel App URL.
    -   Try to Sign Up.
    -   If successful, your Frontend is talking to your Backend, which is writing to your Database!

---

## Troubleshooting

-   **CORS Errors**: If the frontend says "Network Error" or "CORS", you might need to update the `cors` configuration in `server/server.js` to explicitly allow your Vercel domain.
    -   *Current code allows all origins (`cors()`), so this should work out of the box.*
-   **Database Connection Error**: Double check the `DATABASE_URL` in the Render Web Service settings. Ensure it matches the Internal URL of your Render Database.
