-- 藥物提醒系統資料庫架構 (PostgreSQL/MySQL)

-- 1. 用戶表 (如果尚未存在)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account VARCHAR(50) UNIQUE,         -- 登入帳號
    password VARCHAR(255),             -- 登入密碼
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 藥物基本資訊表
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,          -- 藥品名稱 (例如：鈣片)
    reminder_time TIME NOT NULL,         -- 提醒時間 (例如：12:00:00)
    dosage_amount DECIMAL(10, 2) NOT NULL, -- 每次劑量數值 (例如：2.00)
    dosage_unit VARCHAR(50) NOT NULL,    -- 劑量單位 (例如：顆)
    is_active BOOLEAN DEFAULT TRUE,      -- 是否啟用提醒
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 服藥紀錄表
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'taken', -- 狀態: taken (已服藥), skipped (跳過), delayed (延遲)
    notes TEXT                          -- 備註 (選填)
);

-- 自動更新 updated_at 的觸發器 (PostgreSQL 範例)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_medications_updated_at
-- BEFORE UPDATE ON medications
-- FOR EACH ROW
-- EXECUTE PROCEDURE update_updated_at_column();
