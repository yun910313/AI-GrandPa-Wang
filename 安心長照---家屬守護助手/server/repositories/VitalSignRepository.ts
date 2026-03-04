import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class VitalSignRepository {
    /**
     * 獲取所有生理指標紀錄
     */
    async findAll(elderlyId?: string): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            let query = 'SELECT id, elderly_id, CONVERT(VARCHAR(33), timestamp, 126) as timestamp, heart_rate, systolic, diastolic, blood_oxygen, temperature, steps FROM vital_signs';

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
     * 獲取最新的一筆生理指標
     */
    async findLatest(elderlyId?: string): Promise<any | null> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();

            // 如果沒有提供 elderlyId，先抓出最新一筆紀錄的 elderly_id
            let targetId = elderlyId;
            if (!targetId) {
                const latestRecord = await pool.request().query('SELECT TOP 1 elderly_id FROM vital_signs ORDER BY timestamp DESC');
                if (latestRecord.recordset.length > 0) {
                    targetId = latestRecord.recordset[0].elderly_id;
                } else {
                    return null;
                }
            }

            const request = pool.request();
            request.input('elderlyId', sql.UniqueIdentifier, targetId);

            const query = `
                SELECT 
                    (SELECT TOP 1 id FROM vital_signs WHERE elderly_id = @elderlyId ORDER BY timestamp DESC) as id,
                    @elderlyId as elderly_id,
                    (SELECT TOP 1 CONVERT(VARCHAR(33), timestamp, 126) FROM vital_signs WHERE elderly_id = @elderlyId ORDER BY timestamp DESC) as timestamp,
                    (SELECT TOP 1 heart_rate FROM vital_signs WHERE elderly_id = @elderlyId AND heart_rate IS NOT NULL ORDER BY timestamp DESC) as heart_rate,
                    (SELECT TOP 1 systolic FROM vital_signs WHERE elderly_id = @elderlyId AND systolic IS NOT NULL ORDER BY timestamp DESC) as systolic,
                    (SELECT TOP 1 diastolic FROM vital_signs WHERE elderly_id = @elderlyId AND diastolic IS NOT NULL ORDER BY timestamp DESC) as diastolic,
                    (SELECT TOP 1 blood_oxygen FROM vital_signs WHERE elderly_id = @elderlyId AND blood_oxygen IS NOT NULL ORDER BY timestamp DESC) as blood_oxygen,
                    (SELECT TOP 1 temperature FROM vital_signs WHERE elderly_id = @elderlyId AND temperature IS NOT NULL ORDER BY timestamp DESC) as temperature,
                    (SELECT TOP 1 steps FROM vital_signs WHERE elderly_id = @elderlyId AND steps IS NOT NULL ORDER BY timestamp DESC) as steps
            `;

            const result = await request.query(query);
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('VitalSignRepository.findLatest Error:', err);
            return null;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 新增生理指標
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
                .input('steps', sql.Int, data.steps || 0)
                .query(`
                    INSERT INTO vital_signs (elderly_id, timestamp, heart_rate, systolic, diastolic, blood_oxygen, temperature, steps)
                    OUTPUT INSERTED.id
                    VALUES (@elderly_id, SYSDATETIMEOFFSET(), @heart_rate, @systolic, @diastolic, @blood_oxygen, @temperature, @steps)
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
     * 更新生理指標
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
                .input('steps', sql.Int, data.steps)
                .query(`
                    UPDATE vital_signs SET
                        heart_rate = @heart_rate,
                        systolic = @systolic,
                        diastolic = @diastolic,
                        blood_oxygen = @blood_oxygen,
                        temperature = @temperature,
                        steps = @steps
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
     * 刪除生理指標
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
