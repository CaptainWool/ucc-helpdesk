const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        const res = await pool.query(`
            SELECT 
                confdeltype
            FROM 
                pg_constraint 
            WHERE 
                conname = 'messages_ticket_id_fkey';
        `);
        console.log(res.rows);
        // confdeltype 'c' means CASCADE, 'a' means NO ACTION, 'r' means RESTRICT, 'n' means SET NULL, 'd' means SET DEFAULT
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
