const sql = require('mssql');
require('dotenv').config();

async function seed() {
    try {
        const pool = await sql.connect({
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        });

        const wangId = '38ADFFAD-F972-4909-B800-D4DD588164F0';

        console.log('Updating Wang profile with safe zone...');
        await pool.request()
            .input('id', sql.UniqueIdentifier, wangId)
            .query(`
                UPDATE elderly_profiles SET
                    safe_zone_address = N'高雄市前金區中正四路',
                    safe_zone_range = 500,
                    safe_zone_lat = 22.6273,
                    safe_zone_lng = 120.3014
                WHERE id = @id
            `);

        console.log('Adding GPS log for Wang (Outside safe zone)...');
        await pool.request()
            .input('elderly_id', sql.UniqueIdentifier, wangId)
            .query(`
                INSERT INTO gps_logs (elderly_id, latitude, longitude, address, timestamp)
                VALUES (@elderly_id, 22.6350, 120.3100, N'高雄市三民區建國三路', SYSDATETIMEOFFSET())
            `);

        console.log('Seed complete.');
        await pool.close();
    } catch (err) {
        console.error('Seed failed:', err);
    }
}

seed();
