const sql = require('mssql');
require('dotenv').config();

async function migrate() {
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

        console.log('Creating gps_logs table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'gps_logs')
            CREATE TABLE gps_logs (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                elderly_id UNIQUEIDENTIFIER NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                address NVARCHAR(MAX),
                timestamp DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
                FOREIGN KEY (elderly_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
            )
        `);

        console.log('Adding lat/lng columns to elderly_profiles...');
        const tableInfo = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'elderly_profiles'");
        const columns = tableInfo.recordset.map(r => r.COLUMN_NAME);

        if (!columns.includes('safe_zone_lat')) {
            await pool.request().query("ALTER TABLE elderly_profiles ADD safe_zone_lat DECIMAL(10, 8)");
        }
        if (!columns.includes('safe_zone_lng')) {
            await pool.request().query("ALTER TABLE elderly_profiles ADD safe_zone_lng DECIMAL(11, 8)");
        }

        console.log('Migration complete.');
        await pool.close();
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
