import { ConnectionFactory } from '../services/ConnectionFactory';

/**
 * 檢查資料庫狀態腳本
 * 
 * 列出所有資料表以驗證是否成功建立。
 */
async function checkDatabase() {
    let pool;
    try {
        pool = await ConnectionFactory.createConnection();

        console.log('查詢資料庫中的資料表...');

        // 查詢所有使用者建立的資料表
        const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

        if (result.recordset.length > 0) {
            console.log('已找到以下資料表：');
            result.recordset.forEach(row => {
                console.log(`- ${row.TABLE_NAME}`);
            });
        } else {
            console.log('資料庫中沒有找到任何資料表。');
        }

    } catch (err) {
        console.error('檢查資料庫失敗：', err);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

checkDatabase();
