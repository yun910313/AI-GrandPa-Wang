import { ConnectionFactory } from '../services/ConnectionFactory';

/**
 * 更新聯絡人資料表腳本
 * 
 * 僅執行新增 contacts 資料表的指令。
 */
async function updateContactsTable() {
    let pool;
    try {
        // 1. 建立連線
        pool = await ConnectionFactory.createConnection();

        console.log('正在嘗試建立 contacts 資料表 (無外鍵)...');

        // 2. 執行 SQL
        const sqlCommand = `
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[contacts]') AND type in (N'U'))
      BEGIN
          CREATE TABLE [contacts] (
              id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
              name NVARCHAR(100) NOT NULL,
              relationship NVARCHAR(50) NOT NULL,
              phone NVARCHAR(20) NOT NULL,
              created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
          );
          PRINT 'Contacts 資料表已成功建立。';
      END
      ELSE
      BEGIN
          PRINT 'Contacts 資料表已存在，跳過建立。';
      END
    `;

        await pool.request().query(sqlCommand);

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

// 執行
updateContactsTable();
