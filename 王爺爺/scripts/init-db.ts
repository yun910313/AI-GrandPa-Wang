import fs from 'fs';
import path from 'path';
import { ConnectionFactory } from '../services/ConnectionFactory';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 初始化資料庫腳本
 * 
 * 讀取 schema_mssql.sql 並在 MS SQL Server 中執行。
 */
async function initializeDatabase() {
    let pool;
    try {
        // 1. 建立連線
        pool = await ConnectionFactory.createConnection();

        // 2. 讀取 SQL 檔案
        const schemaPath = path.resolve(__dirname, '../database/schema_mssql.sql');
        const sqlCommands = fs.readFileSync(schemaPath, 'utf8');

        // 3. 執行 SQL (拆分 GO 關鍵字，因為 mssql 不直接支援 GO)
        const commands = sqlCommands.split(/\bGO\b/i);

        console.log('正在開始執行 SQL 指令建立資料表...');

        for (const command of commands) {
            const trimmedCommand = command.trim();
            if (trimmedCommand) {
                await pool.request().query(trimmedCommand);
            }
        }

        console.log('資料庫初始化完成！已成功建立資料表。');
    } catch (err) {
        console.error('初始化資料庫失敗：', err);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('已關閉資料庫連線。');
        }
    }
}

// 執行腳本
initializeDatabase();
