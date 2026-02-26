import { ConnectionFactory } from '../services/ConnectionFactory';

async function checkExistingSchema() {
    let pool;
    try {
        pool = await ConnectionFactory.createConnection();
        console.log('--- 正在檢查 Granpa Wang 擁有的資料表 ---');
        const tablesRes = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        const tables = tablesRes.recordset.map((r: any) => r.TABLE_NAME);
        console.log('資料表列表:', tables);

        for (const table of tables) {
            console.log(`\n--- [${table}] 欄位詳情 ---`);
            const columnsRes = await pool.request().query(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`);
            console.table(columnsRes.recordset);
        }

    } catch (err) {
        console.error('檢查資料庫失敗：', err);
    } finally {
        if (pool) await pool.close();
    }
}

checkExistingSchema();
