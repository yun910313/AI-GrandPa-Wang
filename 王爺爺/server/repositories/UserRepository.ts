import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class UserRepository {
    /**
     * é©—è?ä½¿ç”¨?…ç™»??
     * @param account å¸³è?
     * @param password å¯†ç¢¼
     */
    async findByCredentials(account: string, password: string): Promise<any | null> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('account', sql.NVarChar(50), account)
                .input('password', sql.NVarChar(255), password)
                .query('SELECT TOP 1 id, account, name FROM users WHERE account = @account AND password = @password');

            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('UserRepository.findByCredentials Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?¹æ? ID ?¥è©¢ä½¿ç”¨??
     * @param id ä½¿ç”¨??UUID
     */
    async findById(id: string): Promise<any | null> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('SELECT id, account, name, email, role_identity, phone, address FROM users WHERE id = @id');

            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('UserRepository.findById Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?°å?ä½¿ç”¨??
     * @param data ä½¿ç”¨?…è???
     * @returns ?°å??„ä½¿?¨è€?ID
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('name', sql.NVarChar(100), data.name)
                .input('account', sql.NVarChar(50), data.account)
                .input('password', sql.NVarChar(255), data.password)
                .input('role_identity', sql.NVarChar(50), data.role_identity)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('address', sql.NVarChar(sql.MAX), data.address)
                .query(`
                    INSERT INTO users (name, account, password, role_identity, phone, address, created_at)
                    OUTPUT INSERTED.id
                    VALUES (@name, @account, @password, @role_identity, @phone, @address, SYSDATETIMEOFFSET())
                `);

            return result.recordset[0].id;
        } catch (err) {
            console.error('UserRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?´æ–°ä½¿ç”¨??
     * @param id ä½¿ç”¨??ID
     * @param data ?´æ–°è³‡æ?
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('name', sql.NVarChar(100), data.name)
                .input('role_identity', sql.NVarChar(50), data.role_identity)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('email', sql.NVarChar(100), data.email)
                .input('address', sql.NVarChar(sql.MAX), data.address)
                .query(`
                    UPDATE users SET 
                        name = @name, 
                        role_identity = @role_identity, 
                        phone = @phone, 
                        email = @email,
                        address = @address 
                    WHERE id = @id
                `);

            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('UserRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?ªé™¤ä½¿ç”¨??
     * @param id ä½¿ç”¨??ID
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM users WHERE id = @id');

            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('UserRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default UserRepository;
