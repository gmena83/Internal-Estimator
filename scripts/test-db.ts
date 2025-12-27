import "dotenv/config";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

async function testConnection() {
    console.log("Testing DB Connection...");
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

    // Masked log
    if (process.env.DATABASE_URL) {
        console.log("DATABASE_URL starts with:", process.env.DATABASE_URL.substring(0, 10) + "...");
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        const client = await pool.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT NOW()');
        console.log("Query result:", res.rows[0]);
        client.release();
    } catch (err: any) {
        console.error("Connection failed:", err.message);
        console.error("Code:", err.code);
        console.error("Detail:", err.detail);
    } finally {
        await pool.end();
    }
}

testConnection();
