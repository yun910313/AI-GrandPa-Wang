import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory';

export class MedicalRecordRepository {
    /**
     * 獲取所有醫療紀錄
     * @param elderlyId 可選，過濾特定長輩
     */
    async findAll(elderlyId?: string): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            let query = `
                SELECT 
                    id, 
                    CAST(visit_date AS VARCHAR) as date, 
                    hospital_name as hospital, 
                    department, 
                    doctor_name as doctor, 
                    diagnosis, 
                    notes 
                FROM medical_records
            `;

            const request = pool.request();
            if (elderlyId) {
                query += ' WHERE elderly_id = @elderlyId';
                request.input('elderlyId', sql.UniqueIdentifier, elderlyId);
            }

            query += ' ORDER BY visit_date DESC';
            const result = await request.query(query);
            return result.recordset;
        } catch (err) {
            console.error('MedicalRecordRepository.findAll Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 新增醫療紀錄
     * @param data 資料物件
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('visit_date', sql.Date, data.date)
                .input('hospital_name', sql.NVarChar(255), data.hospital)
                .input('department', sql.NVarChar(100), data.department)
                .input('doctor_name', sql.NVarChar(100), data.doctor)
                .input('diagnosis', sql.NVarChar(sql.MAX), data.diagnosis)
                .input('notes', sql.NVarChar(sql.MAX), data.notes)
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id)
                .query(`
                    INSERT INTO medical_records (elderly_id, visit_date, hospital_name, department, doctor_name, diagnosis, notes)
                    OUTPUT INSERTED.id
                    VALUES (@elderly_id, @visit_date, @hospital_name, @department, @doctor_name, @diagnosis, @notes)
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('MedicalRecordRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 更新醫療紀錄
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('visit_date', sql.Date, data.date)
                .input('hospital_name', sql.NVarChar(255), data.hospital)
                .input('department', sql.NVarChar(100), data.department)
                .input('doctor_name', sql.NVarChar(100), data.doctor)
                .input('diagnosis', sql.NVarChar(sql.MAX), data.diagnosis)
                .input('notes', sql.NVarChar(sql.MAX), data.notes)
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id)
                .query(`
                    UPDATE medical_records SET
                        elderly_id = @elderly_id,
                        visit_date = @visit_date,
                        hospital_name = @hospital_name,
                        department = @department,
                        doctor_name = @doctor_name,
                        diagnosis = @diagnosis,
                        notes = @notes
                    WHERE id = @id
                `);
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('MedicalRecordRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 刪除醫療紀錄
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM medical_records WHERE id = @id');
            return result.rowsAffected[0] > 0;
        } catch (err) {
            console.error('MedicalRecordRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default MedicalRecordRepository;
