import { ConnectionFactory } from '../services/ConnectionFactory';

async function verifyUsersTable() {
    let pool;
    try {
        pool = await ConnectionFactory.createConnection();
        const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users'
    `);
        console.log('Users 資料表欄位結構：');
        console.table(result.recordset);
    } catch (err) {
        console.error('驗證失敗：', err);
    } finally {
        if (pool) await pool.close();
    }
}

verifyUsersTable();
