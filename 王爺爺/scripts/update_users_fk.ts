import { ConnectionFactory } from '../services/ConnectionFactory';

/**
 * 為 users 資料表加入指向 elderly_profiles 的外鍵
 */
async function addFkToUsers() {
    let pool;
    try {
        pool = await ConnectionFactory.createConnection();

        console.log('正在嘗試為 users 資料表加入 elderly_id 欄位與外鍵...');

        // 1. 新增 elderly_id 欄位
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[users]') AND name = 'elderly_id')
      BEGIN
          ALTER TABLE [users] ADD elderly_id UNIQUEIDENTIFIER;
          PRINT '已新增 elderly_id 欄位。';
      END
    `);

        // 2. 新增外鍵約束
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Users_Elderly')
      BEGIN
          ALTER TABLE [users] 
          ADD CONSTRAINT FK_Users_Elderly 
          FOREIGN KEY (elderly_id) REFERENCES [elderly_profiles](id) 
          ON DELETE SET NULL;
          PRINT '已新增外鍵約束 FK_Users_Elderly。';
      END
    `);

        console.log('更新完成！');
    } catch (err) {
        console.error('更新資料表失敗：', err);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('已關閉資料庫連線。');
        }
    }
}

addFkToUsers();
