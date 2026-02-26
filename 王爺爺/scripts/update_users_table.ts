import { ConnectionFactory } from '../services/ConnectionFactory';

/**
 * 更新使用者資料表結構腳本
 * 
 * 偵測並新增缺失的欄位：role_identity, phone, address。
 */
async function updateUsersTable() {
    let pool;
    try {
        pool = await ConnectionFactory.createConnection();

        console.log('正在檢查並更新 users 資料表結構...');

        // 1. 檢查並新增 role_identity
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[users]') AND name = 'role_identity')
      BEGIN
          ALTER TABLE [users] ADD role_identity NVARCHAR(50);
          PRINT '已新增 role_identity 欄位。';
      END
    `);

        // 2. 檢查並新增 phone
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[users]') AND name = 'phone')
      BEGIN
          ALTER TABLE [users] ADD phone NVARCHAR(20);
          PRINT '已新增 phone 欄位。';
      END
    `);

        // 3. 檢查並新增 address
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[users]') AND name = 'address')
      BEGIN
          ALTER TABLE [users] ADD address NVARCHAR(MAX);
          PRINT '已新增 address 欄位。';
      END
    `);

        // 4. 檢查並更新帳號欄位 (從 username 改為 account)
        await pool.request().query(`
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[users]') AND name = 'username')
      BEGIN
          EXEC sp_rename 'users.username', 'account', 'COLUMN';
          PRINT '已將 username 欄位重命名為 account。';
      END
      ELSE IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[users]') AND name = 'account')
      BEGIN
          ALTER TABLE [users] ADD account NVARCHAR(50);
          PRINT '已新增 account 欄位。';
      END
    `);

        // 5. 檢查並新增 password
        await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[users]') AND name = 'password')
      BEGIN
          ALTER TABLE [users] ADD password NVARCHAR(255);
          PRINT '已新增 password 欄位。';
      END
    `);

        console.log('users 資料表結構更新完成！');
    } catch (err) {
        console.error('更新使用者資料表失敗：', err);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.close();
            console.log('已關閉資料庫連線。');
        }
    }
}

updateUsersTable();
