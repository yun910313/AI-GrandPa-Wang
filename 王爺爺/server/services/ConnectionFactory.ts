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

            console.log(`Ê≠?ú®??é•?∞‰º∫?çÂô®: ${config.server}, Ë≥áÊ?Â∫? ${config.database}...`);
            const pool = await sql.connect(config);
            console.log('Ë≥áÊ?Â∫´ÈÄ?é•?êÂ?Ôº?);
            return pool;
        } catch (err) {
            console.error('Ë≥áÊ?Â∫´ÈÄ?é•Â§±Ê?Ôº?, err);
            throw err;
        }
    }
}

export default ConnectionFactory;
