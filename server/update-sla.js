const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateExistingSLA() {
    try {
        const query = `
            UPDATE tickets 
            SET sla_deadline = created_at + (
                CASE 
                    WHEN priority = 'Urgent' THEN interval '4 hours' 
                    WHEN priority = 'High' THEN interval '24 hours' 
                    WHEN priority = 'Low' THEN interval '72 hours' 
                    ELSE interval '48 hours' 
                END
            ) 
            WHERE sla_deadline IS NULL
        `;
        const res = await pool.query(query);
        console.log(`Updated ${res.rowCount} tickets with SLA deadlines.`);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await pool.end();
    }
}

updateExistingSLA();
