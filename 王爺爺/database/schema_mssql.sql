-- 藥物提醒系統資料庫架構 (T-SQL / MS SQL Server)

-- 1. 用戶表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        elderly_id UNIQUEIDENTIFIER,         -- 關聯長輩 ID
        account NVARCHAR(50) UNIQUE,        -- 登入帳號
        password NVARCHAR(255),               -- 登入密碼
        name NVARCHAR(100) NOT NULL,
        role_identity NVARCHAR(50),           -- 身分角色
        phone NVARCHAR(20),                  -- 電話
        email NVARCHAR(255) UNIQUE,         -- 電子郵件
        address NVARCHAR(MAX),               -- 居住地址
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_Users_Elderly FOREIGN KEY (elderly_id) REFERENCES [elderly_profiles](id) ON DELETE SET NULL
    );
END
GO

-- 2. 藥物基本資訊表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[medications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [medications] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(255) NOT NULL,          -- 藥品名稱
        reminder_time TIME NOT NULL,         -- 提醒時間
        dosage_amount DECIMAL(10, 2) NOT NULL, -- 每次劑量數值
        dosage_unit NVARCHAR(50) NOT NULL,    -- 劑量單位
        is_active BIT DEFAULT 1,             -- 是否啟用提醒 (0=False, 1=True)
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        CONSTRAINT FK_Medications_Users FOREIGN KEY (user_id) REFERENCES [users](id) ON DELETE CASCADE
    );
END
GO

-- 3. 服藥紀錄表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[medication_logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [medication_logs] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        medication_id UNIQUEIDENTIFIER NOT NULL,
        taken_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        status NVARCHAR(20) DEFAULT 'taken', -- 狀態: taken, skipped, delayed
        notes NVARCHAR(MAX),                 -- 備註
        CONSTRAINT FK_Logs_Medications FOREIGN KEY (medication_id) REFERENCES [medications](id) ON DELETE CASCADE
    );
END
GO

-- 4. 聯絡人資料表 (無外鍵)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[contacts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [contacts] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,          -- 姓名
        relationship NVARCHAR(50) NOT NULL,    -- 關係
        phone NVARCHAR(20) NOT NULL,           -- 電話
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 5. 就醫紀錄表 (無外鍵)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[medical_records]') AND type in (N'U'))
BEGIN
    CREATE TABLE [medical_records] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        visit_date DATE NOT NULL,              -- 就醫日期
        hospital_name NVARCHAR(255) NOT NULL,  -- 醫院名稱
        department NVARCHAR(100) NOT NULL,     -- 科別
        doctor_name NVARCHAR(100),             -- 主治醫師
        diagnosis NVARCHAR(MAX),               -- 診斷結果
        notes NVARCHAR(MAX),                   -- 備註事項
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO

-- 6. 長輩資料表 (無外鍵)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[elderly_profiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [elderly_profiles] (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,          -- 姓名
        age INT,                             -- 年齡
        gender NVARCHAR(20),                 -- 性別
        birthday DATE,                       -- 出生日期
        height NVARCHAR(50),                 -- 身高
        weight NVARCHAR(50),                 -- 體重
        blood_type NVARCHAR(20),             -- 血型
        primary_hospital NVARCHAR(255),      -- 主要就診醫院
        safe_zone_address NVARCHAR(MAX),     -- 電子圍籬安全地址
        safe_zone_range INT DEFAULT 500,     -- 電子圍籬範圍 (公尺)
        medical_history NVARCHAR(MAX),       -- 過往病史
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET()
    );
END
GO
