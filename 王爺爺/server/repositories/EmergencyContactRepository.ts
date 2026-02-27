import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class EmergencyContactRepository {
    /**
     * ?��??�?��??�聯絡人
     */
    async findAll(): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .query('SELECT id, name, relationship, phone FROM contacts ORDER BY created_at DESC');
            return result.recordset;
        } catch (err) {
            console.error('EmergencyContactRepository.findAll Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?��?緊急聯絡人
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('name', sql.NVarChar(100), data.name)
                .input('relationship', sql.NVarChar(50), data.relationship)
                .input('phone', sql.NVarChar(20), data.phone)
                .query(`
                    INSERT INTO contacts (name, relationship, phone)
                    OUTPUT INSERTED.id
                    VALUES (@name, @relationship, @phone)
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('EmergencyContactRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?�新緊急聯絡人
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('name', sql.NVarChar(100), data.name)
                .input('relationship', sql.NVarChar(50), data.relationship)
                .input('phone', sql.NVarChar(20), data.phone)
                .query(`
                    UPDATE contacts SET
                        name = @name,
                        relationship = @relationship,
                        phone = @phone
                    WHERE id = @id
                `);
            return (result.rowsAffected?.[0] ?? 0) > 0;
        } catch (err) {
            console.error('EmergencyContactRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?�除緊急聯絡人
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM contacts WHERE id = @id');
            return (result.rowsAffected?.[0] ?? 0) > 0;
        } catch (err) {
            console.error('EmergencyContactRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default EmergencyContactRepository;
