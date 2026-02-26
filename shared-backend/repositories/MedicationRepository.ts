import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory';

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
                    id, 
                    name, 
                    CAST(dosage_amount AS VARCHAR) + dosage_unit as dosage,
                    dosage_amount,
                    dosage_unit,
                    CAST(reminder_time AS VARCHAR(5)) as reminder_time,
                    is_active
                FROM medications
            `;
            const request = pool.request();
            if (elderlyId) {
                query += ' WHERE elderly_id = @elderlyId';
                request.input('elderlyId', sql.UniqueIdentifier, elderlyId);
            }
            query += ' ORDER BY reminder_time ASC';
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

            // 嘗試從字串拆分劑量 (例如 "5mg" -> 5, "mg")
            let amount = 0;
            let unit = '';
            const match = data.dosage?.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
            if (match) {
                amount = parseFloat(match[1]);
                unit = match[2] || '';
            } else {
                unit = data.dosage || '';
            }

            const result = await pool.request()
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id || '00000000-0000-0000-0000-000000000000')
                .input('name', sql.NVarChar(255), data.name)
                .input('reminder_time', sql.Time, data.reminder_time)
                .input('dosage_amount', sql.Decimal(10, 2), amount)
                .input('dosage_unit', sql.NVarChar(50), unit)
                .input('is_active', sql.Bit, 1)
                .query(`
                    INSERT INTO medications (elderly_id, name, reminder_time, dosage_amount, dosage_unit, is_active)
                    OUTPUT INSERTED.id
                    VALUES (@elderly_id, @name, @reminder_time, @dosage_amount, @dosage_unit, @is_active)
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

            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id || '00000000-0000-0000-0000-000000000000')
                .input('name', sql.NVarChar(255), data.name)
                .input('reminder_time', sql.Time, data.reminder_time)
                .input('dosage_amount', sql.Decimal(10, 2), amount)
                .input('dosage_unit', sql.NVarChar(50), unit)
                .query(`
                    UPDATE medications SET
                        elderly_id = @elderly_id,
                        name = @name,
                        reminder_time = @reminder_time,
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
