import sql from 'mssql';
import { getDbConfig } from '../config/DbConfig.js';

export class ConnectionFactory {
    static async createConnection(): Promise<sql.ConnectionPool> {
        try {
            const dbConf = getDbConfig(); // 每次連線時動態讀取，確保 dotenv 已載入
            const config: sql.config = {
                server: dbConf.server,
                database: dbConf.database,
                user: dbConf.user,
                password: dbConf.password,
                options: {
                    encrypt: dbConf.options.encrypt,
                    trustServerCertificate: dbConf.options.trustServerCertificate,
                },
                connectionTimeout: 15000,
                requestTimeout: 30000,
            };

            console.log(`正在連接資料庫伺服器: ${config.server}, 資料庫: ${config.database}...`);
            const pool = await sql.connect(config);
            console.log('資料庫連接成功');
            return pool;
        } catch (err) {
            console.error('資料庫連接失敗:', err);
            throw err;
        }
    }
}

export default ConnectionFactory;

