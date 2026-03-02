// ⚠️ 使用函式動態讀取，避免 ES Module import hoisting 造成 dotenv 未載入的問題
export function getDbConfig() {
    return {
        server: process.env.DB_SERVER || '192.168.1.107',
        database: process.env.DB_DATABASE || 'Granpa Wang',
        user: process.env.DB_USER || 'sqlserver',
        password: process.env.DB_PASSWORD || 'sqlserver',
        options: {
            encrypt: true,
            trustServerCertificate: true,
        },
    };
}

// 向後相容的靜態匯出（server.ts 啟動後 dotenv 已載入，此時才安全）
export const DbConfig = getDbConfig();

export default DbConfig;
