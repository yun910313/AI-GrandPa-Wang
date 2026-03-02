const sql = require('mssql');
require('dotenv').config();

async function run() {
    try {
        await sql.connect({
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        });
        const wangElderlyId = '38ADFFAD-F972-4909-B800-D4DD588164F0';
        await sql.query(`
            IF NOT EXISTS (SELECT 1 FROM users WHERE account = 'wang')
            BEGIN
                INSERT INTO users (name, account, password, role_identity, elderly_id, email, phone, created_at)
                VALUES (N'王爺爺', 'wang', 'wang', N'elderly', '${wangElderlyId}', 'wang@example.com', '0912345678', SYSDATETIMEOFFSET())
            END
            ELSE
            BEGIN
                UPDATE users SET elderly_id = '${wangElderlyId}' WHERE account = 'wang'
            END
        `);
        console.log('User wang setup complete.');
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}
run();
