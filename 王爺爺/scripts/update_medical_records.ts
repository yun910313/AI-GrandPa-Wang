import { ConnectionFactory } from '../services/ConnectionFactory';

/**
 * 更新就醫紀錄資料表腳本
 * 
 * 僅執行新增 medical_records 資料表的指令。
 */
async function updateMedicalRecordsTable() {
    let pool;
    try {
        // 1. 建立連線
        pool = await ConnectionFactory.createConnection();

        console.log('正在嘗試建立 medical_records 資料表 (無外鍵)...');

        // 2. 執行 SQL
        const sqlCommand = `
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[medical_records]') AND type in (N'U'))
      BEGIN
          CREATE TABLE [medical_records] (
              id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
              visit_date DATE NOT NULL,
              hospital_name NVARCHAR(255) NOT NULL,
              department NVARCHAR(100) NOT NULL,
              doctor_name NVARCHAR(100),
              diagnosis NVARCHAR(MAX),
              notes NVARCHAR(MAX),
              created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
          );
          PRINT 'Medical Records 資料表已成功建立。';
      END
      ELSE
      BEGIN
          PRINT 'Medical Records 資料表已存在，跳過建立。';
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
updateMedicalRecordsTable();
