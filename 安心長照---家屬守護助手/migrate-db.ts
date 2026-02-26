import sql from 'mssql';
import { ConnectionFactory } from './src/services/ConnectionFactory.js';
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
    let pool;
    try {
        pool = await ConnectionFactory.createConnection();

        console.log('正在為 medical_records 新增 elderly_id 欄位...');
        // 檢查欄位是否存在，不存在才新增
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE Name = N'elderly_id' 
                AND Object_ID = Object_ID(N'medical_records')
            )
            BEGIN
                ALTER TABLE medical_records 
                ADD elderly_id UNIQUEIDENTIFIER;
                PRINT '成功新增 elderly_id 欄位。';
            END
            ELSE
            BEGIN
                PRINT 'elderly_id 欄位已存在。';
            END
        `);

        // medication表也可能需要新增 elderly_id 欄位，順便檢查並新增
        console.log('正在為 medications 新增 elderly_id 欄位...');
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE Name = N'elderly_id' 
                AND Object_ID = Object_ID(N'medications')
            )
            BEGIN
                ALTER TABLE medications 
                ADD elderly_id UNIQUEIDENTIFIER;
                PRINT '成功新增 elderly_id 欄位。';
            END
            ELSE
            BEGIN
                PRINT 'medications 資料表的 elderly_id 欄位已存在。';
            END
        `);

    } catch (err) {
        console.error('執行失敗：', err);
    } finally {
        if (pool) await pool.close();
    }
}

migrate();
