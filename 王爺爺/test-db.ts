import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
    server: process.env.DB_SERVER || '192.168.1.107',
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
        const result = await pool.request().query('SELECT name FROM sys.databases');
        console.log('Available databases:', result.recordset.map(r => r.name));
        await pool.close();
    } catch (err) {
        console.error('Connection failed!', err);
    }
}

test();
