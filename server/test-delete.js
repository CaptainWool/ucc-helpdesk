const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        // Find a ticket to delete
        const tickets = await pool.query("SELECT id FROM tickets LIMIT 1");
        if (tickets.rows.length === 0) {
            console.log("No tickets to delete");
            return;
        }
        const id = tickets.rows[0].id;
        console.log("Attempting to delete ticket:", id);

        // Simulate the server logic
        await pool.query('DELETE FROM messages WHERE ticket_id = $1', [id]);
        const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);

        console.log("Delete result:", result.rows[0]);
    } catch (err) {
        console.error("Delete failed in script:", err);
    } finally {
        await pool.end();
    }
}
run();
