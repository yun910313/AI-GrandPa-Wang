import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class MedicationRepository {
    /**
     * 獲取所有用藥設定
     */
    async findAll(elderlyId?: string): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            let query = `
                SELECT 
                    m.id, 
                    m.name, 
                    CAST(m.dosage_amount AS VARCHAR) + m.dosage_unit as dosage,
                    m.dosage_amount,
                    m.dosage_unit,
                    CAST(m.reminder_time AS VARCHAR(5)) as reminder_time,
                    m.is_active,
                    CASE WHEN ml.id IS NOT NULL THEN 1 ELSE 0 END AS is_taken
                FROM medications m
                LEFT JOIN (
                    SELECT medication_id, MIN(id) as id
                    FROM medication_logs 
                    WHERE CAST(taken_at AS DATE) = CAST(SYSDATETIMEOFFSET() AS DATE)
                    GROUP BY medication_id
                ) ml ON m.id = ml.medication_id
            `;
            const request = pool.request();
            if (elderlyId) {
                query += ' WHERE m.elderly_id = @elderlyId';
                request.input('elderlyId', sql.UniqueIdentifier, elderlyId);
            }
            query += ' ORDER BY m.reminder_time ASC';
            const result = await request.query(query);
            return result.recordset;
        } catch (err) {
            console.error('MedicationRepository.findAll Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 新增用藥
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();

            let amount = 0;
            let unit = '';
            const match = data.dosage?.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
            if (match) {
                amount = parseFloat(match[1]);
                unit = match[2] || '';
            } else {
                unit = data.dosage || '';
            }

            const timeStr = data.reminder_time ? (data.reminder_time.length === 5 ? `${data.reminder_time}:00` : data.reminder_time) : '08:00:00';

            const result = await pool.request()
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id || '00000000-0000-0000-0000-000000000000')
                .input('user_id', sql.UniqueIdentifier, data.user_id || '00000000-0000-0000-0000-000000000000')
                .input('name', sql.NVarChar(255), data.name)
                .input('reminder_time_str', sql.VarChar(10), timeStr)
                .input('dosage_amount', sql.Decimal(10, 2), amount)
                .input('dosage_unit', sql.NVarChar(50), unit)
                .input('is_active', sql.Bit, 1)
                .query(`
                    INSERT INTO medications (elderly_id, user_id, name, reminder_time, dosage_amount, dosage_unit, is_active)
                    OUTPUT INSERTED.id
                    VALUES (@elderly_id, @user_id, @name, CAST(@reminder_time_str AS TIME), @dosage_amount, @dosage_unit, @is_active)
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('MedicationRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 更新用藥
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();

            let amount = 0;
            let unit = '';
            const match = data.dosage?.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
            if (match) {
                amount = parseFloat(match[1]);
                unit = match[2] || '';
            } else {
                unit = data.dosage || '';
            }

            const timeStr = data.reminder_time ? (data.reminder_time.length === 5 ? `${data.reminder_time}:00` : data.reminder_time) : '08:00:00';

            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id || '00000000-0000-0000-0000-000000000000')
                .input('name', sql.NVarChar(255), data.name)
                .input('reminder_time_str', sql.VarChar(10), timeStr)
                .input('dosage_amount', sql.Decimal(10, 2), amount)
                .input('dosage_unit', sql.NVarChar(50), unit)
                .query(`
                    UPDATE medications SET
                        elderly_id = @elderly_id,
                        name = @name,
                        reminder_time = CAST(@reminder_time_str AS TIME),
                        dosage_amount = @dosage_amount,
                        dosage_unit = @dosage_unit,
                        updated_at = SYSDATETIMEOFFSET()
                    WHERE id = @id
                `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('MedicationRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 刪除用藥
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM medications WHERE id = @id');
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('MedicationRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default MedicationRepository;
