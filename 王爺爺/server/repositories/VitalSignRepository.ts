import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class VitalSignRepository {
    /**
     * ?²å??€?‰ç??†æ?æ¨™ç???
     */
    async findAll(elderlyId?: string): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            let query = 'SELECT id, elderly_id, CAST(timestamp AS VARCHAR) as timestamp, heart_rate, systolic, diastolic, blood_oxygen, temperature FROM vital_signs';

            const request = pool.request();
            if (elderlyId) {
                query += ' WHERE elderly_id = @elderlyId';
                request.input('elderlyId', sql.UniqueIdentifier, elderlyId);
            }

            query += ' ORDER BY timestamp DESC';
            const result = await request.query(query);
            return result.recordset;
        } catch (err) {
            console.error('VitalSignRepository.findAll Error:', err);
            return [];
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?²å??€?°ç?ä¸€ç­†ç??†æ?æ¨?
     */
    async findLatest(elderlyId?: string): Promise<any | null> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            let query = 'SELECT TOP 1 id, elderly_id, CAST(timestamp AS VARCHAR) as timestamp, heart_rate, systolic, diastolic, blood_oxygen, temperature FROM vital_signs';

            const request = pool.request();
            if (elderlyId) {
                query += ' WHERE elderly_id = @elderlyId';
                request.input('elderlyId', sql.UniqueIdentifier, elderlyId);
            }

            query += ' ORDER BY timestamp DESC';
            const result = await request.query(query);
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.warn('VitalSignRepository: vital_signs table might not exist yet.');
            return null;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?°å??Ÿç??‡æ?
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id)
                .input('heart_rate', sql.Int, data.heart_rate)
                .input('systolic', sql.Int, data.systolic)
                .input('diastolic', sql.Int, data.diastolic)
                .input('blood_oxygen', sql.Int, data.blood_oxygen)
                .input('temperature', sql.Decimal(4, 1), data.temperature)
                .query(`
                    INSERT INTO vital_signs (elderly_id, timestamp, heart_rate, systolic, diastolic, blood_oxygen, temperature)
                    OUTPUT INSERTED.id
                    VALUES (@elderly_id, SYSDATETIMEOFFSET(), @heart_rate, @systolic, @diastolic, @blood_oxygen, @temperature)
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('VitalSignRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?´æ–°?Ÿç??‡æ?
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('heart_rate', sql.Int, data.heart_rate)
                .input('systolic', sql.Int, data.systolic)
                .input('diastolic', sql.Int, data.diastolic)
                .input('blood_oxygen', sql.Int, data.blood_oxygen)
                .input('temperature', sql.Decimal(4, 1), data.temperature)
                .query(`
                    UPDATE vital_signs SET
                        heart_rate = @heart_rate,
                        systolic = @systolic,
                        diastolic = @diastolic,
                        blood_oxygen = @blood_oxygen,
                        temperature = @temperature
                    WHERE id = @id
                `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('VitalSignRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * ?ªé™¤?Ÿç??‡æ?
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM vital_signs WHERE id = @id');
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('VitalSignRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default VitalSignRepository;
