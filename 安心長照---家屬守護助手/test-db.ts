import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'Granpa Wang',
    user: process.env.DB_USER || 'sqlserver',
    password: process.env.DB_PASSWORD || 'sqlserver',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

async function test() {
    console.log('Testing connection with config:', {
        ...config,
        password: '****'
    });
    try {
        const pool = await sql.connect(config);
        console.log('Successfully connected to the database!');
        const dbResult = await pool.request().query('SELECT name FROM sys.databases');
        console.log('Available databases:', dbResult.recordset.map(r => r.name));

        console.log('Switching to Granpa Wang database to check tables...');
        const tableResult = await pool.request().query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
        console.log('Tables in current database:', tableResult.recordset.map(r => r.TABLE_NAME));

        await pool.close();
    } catch (err) {
        console.error('Connection failed!', err);
    }
}

test();
