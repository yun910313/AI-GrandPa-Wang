import "dotenv/config";
import { ConnectionFactory } from './services/ConnectionFactory.js';

async function listUsers() {
    try {
        const pool = await ConnectionFactory.createConnection();
        const result = await pool.request().query('SELECT id, account, password, name FROM users');
        console.log("Existing users in DB:", JSON.stringify(result.recordset, null, 2));
        await pool.close();
        process.exit(0);
    } catch (error) {
        console.error("Query error:", error);
        process.exit(1);
    }
}

listUsers();
