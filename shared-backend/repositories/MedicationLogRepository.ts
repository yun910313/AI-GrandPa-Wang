import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory';

export class MedicationLogRepository {
    /**
     * 獲取特定用藥的服藥紀錄
     * @param medicationId 用藥 UUID
     */
    async findByMedication(medicationId: string): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('medicationId', sql.UniqueIdentifier, medicationId)
                .query('SELECT id, medication_id, taken_at, status, notes FROM medication_logs WHERE medication_id = @medicationId ORDER BY taken_at DESC');
            return result.recordset;
        } catch (err) {
            console.error('MedicationLogRepository.findByMedication Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 新增服藥紀錄
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('medication_id', sql.UniqueIdentifier, data.medication_id)
                .input('status', sql.NVarChar(20), data.status || 'taken')
                .input('notes', sql.NVarChar(sql.MAX), data.notes)
                .query(`
                    INSERT INTO medication_logs (medication_id, taken_at, status, notes)
                    OUTPUT INSERTED.id
                    VALUES (@medication_id, SYSDATETIMEOFFSET(), @status, @notes)
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('MedicationLogRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 更新服藥紀錄
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('status', sql.NVarChar(20), data.status)
                .input('notes', sql.NVarChar(sql.MAX), data.notes)
                .query(`
                    UPDATE medication_logs SET
                        status = @status,
                        notes = @notes
                    WHERE id = @id
                `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('MedicationLogRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 刪除服藥紀錄
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM medication_logs WHERE id = @id');
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('MedicationLogRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default MedicationLogRepository;
