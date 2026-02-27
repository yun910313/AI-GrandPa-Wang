import sql from 'mssql';
import { DbConfig } from '../config/DbConfig.js';

export class ConnectionFactory {
    static async createConnection(): Promise<sql.ConnectionPool> {
        try {
            const config: sql.config = {
                server: DbConfig.server,
                database: DbConfig.database,
                user: DbConfig.user,
                password: DbConfig.password,
                options: {
                    encrypt: DbConfig.options.encrypt,
                    trustServerCertificate: DbConfig.options.trustServerCertificate,
                },
            };

            console.log(`嘗試連線至伺服器: ${config.server}, 資料庫: ${config.database}...`);
            const pool = await sql.connect(config);
            console.log('資料庫連線成功');
            return pool;
        } catch (err) {
            console.error('資料庫連線失敗', err);
            throw err;
        }
    }
}

export default ConnectionFactory;
