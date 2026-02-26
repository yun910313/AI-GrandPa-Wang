import { ConnectionFactory } from '../services/ConnectionFactory';

/**
 * 更新長輩資料表腳本
 * 
 * 執行新增 elderly_profiles 資料表的指令。
 */
async function updateElderlyProfilesTable() {
    let pool;
    try {
        pool = await ConnectionFactory.createConnection();

        console.log('正在嘗試建立 elderly_profiles 資料表 (無外鍵)...');

        const sqlCommand = `
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[elderly_profiles]') AND type in (N'U'))
      BEGIN
          CREATE TABLE [elderly_profiles] (
              id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
              name NVARCHAR(100) NOT NULL,
              age INT,
              gender NVARCHAR(20),
              birthday DATE,
              height NVARCHAR(50),
              weight NVARCHAR(50),
              blood_type NVARCHAR(20),
              primary_hospital NVARCHAR(255),
              safe_zone_address NVARCHAR(MAX),
              safe_zone_range INT DEFAULT 500,
              medical_history NVARCHAR(MAX),
              created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
          );
          PRINT 'Elderly Profiles 資料表已成功建立。';
      END
      ELSE
      BEGIN
          PRINT 'Elderly Profiles 資料表已存在，跳過建立。';
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

updateElderlyProfilesTable();
