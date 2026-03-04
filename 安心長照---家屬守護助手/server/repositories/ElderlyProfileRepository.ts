import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class ElderlyProfileRepository {
    async findAll(): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .query('SELECT id, name, age, gender, CAST(birthday AS VARCHAR) as birthday, height, weight, blood_type, primary_hospital, safe_zone_address, safe_zone_range, safe_zone_lat, safe_zone_lng, account, password, medical_history, guardian_id FROM elderly_profiles ORDER BY created_at DESC');
            return result.recordset;
        } catch (err) {
            console.error('ElderlyProfileRepository.findAll Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    async findById(id: string): Promise<any | null> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('SELECT id, name, age, gender, CAST(birthday AS VARCHAR) as birthday, height, weight, blood_type, primary_hospital, safe_zone_address, safe_zone_range, safe_zone_lat, safe_zone_lng, account, password, medical_history, guardian_id FROM elderly_profiles WHERE id = @id');
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('ElderlyProfileRepository.findById Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('name', sql.NVarChar(100), data.name)
                .input('age', sql.Int, data.age)
                .input('gender', sql.NVarChar(20), data.gender)
                .input('blood_type', sql.NVarChar(20), data.blood_type)
                .input('birthday', sql.Date, data.birthday)
                .input('height', sql.NVarChar(50), data.height)
                .input('weight', sql.NVarChar(50), data.weight)
                .input('primary_hospital', sql.NVarChar(255), data.primary_hospital)
                .input('safe_zone_address', sql.NVarChar(sql.MAX), data.safe_zone_address)
                .input('safe_zone_range', sql.Int, data.safe_zone_range || 500)
                .input('medical_history', sql.NVarChar(sql.MAX), data.medical_history)
                .input('safe_zone_lat', sql.Decimal(10, 8), data.safe_zone_lat)
                .input('safe_zone_lng', sql.Decimal(11, 8), data.safe_zone_lng)
                .input('account', sql.NVarChar(50), data.account)
                .input('password', sql.NVarChar(255), data.password)
                .input('guardian_id', sql.UniqueIdentifier, data.guardian_id)
                .query('INSERT INTO elderly_profiles (name, age, gender, blood_type, birthday, height, weight, primary_hospital, safe_zone_address, safe_zone_range, safe_zone_lat, safe_zone_lng, account, password, medical_history, guardian_id, created_at) OUTPUT INSERTED.id VALUES (@name, @age, @gender, @blood_type, @birthday, @height, @weight, @primary_hospital, @safe_zone_address, @safe_zone_range, @safe_zone_lat, @safe_zone_lng, @account, @password, @medical_history, @guardian_id, SYSDATETIMEOFFSET())');
            return result.recordset[0].id;
        } catch (err) {
            console.error('ElderlyProfileRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            let query = `
                UPDATE elderly_profiles SET 
                    name = ISNULL(@name, name), 
                    age = ISNULL(@age, age), 
                    gender = ISNULL(@gender, gender), 
                    blood_type = ISNULL(@blood_type, blood_type), 
                    birthday = ISNULL(@birthday, birthday), 
                    height = ISNULL(@height, height), 
                    weight = ISNULL(@weight, weight), 
                    primary_hospital = ISNULL(@primary_hospital, primary_hospital), 
                    safe_zone_address = ISNULL(@safe_zone_address, safe_zone_address), 
                    safe_zone_range = ISNULL(@safe_zone_range, safe_zone_range), 
                    safe_zone_lat = ISNULL(@safe_zone_lat, safe_zone_lat), 
                    safe_zone_lng = ISNULL(@safe_zone_lng, safe_zone_lng), 
                    account = ISNULL(@account, account), 
                    medical_history = ISNULL(@medical_history, medical_history), 
                    guardian_id = ISNULL(@guardian_id, guardian_id)
            `;
            const request = pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('name', sql.NVarChar(100), data.name)
                .input('age', sql.Int, data.age)
                .input('gender', sql.NVarChar(20), data.gender)
                .input('blood_type', sql.NVarChar(20), data.blood_type)
                .input('birthday', sql.Date, data.birthday)
                .input('height', sql.NVarChar(50), data.height)
                .input('weight', sql.NVarChar(50), data.weight)
                .input('primary_hospital', sql.NVarChar(255), data.primary_hospital)
                .input('safe_zone_address', sql.NVarChar(sql.MAX), data.safe_zone_address)
                .input('safe_zone_range', sql.Int, data.safe_zone_range)
                .input('medical_history', sql.NVarChar(sql.MAX), data.medical_history)
                .input('safe_zone_lat', sql.Decimal(10, 8), data.safe_zone_lat)
                .input('safe_zone_lng', sql.Decimal(11, 8), data.safe_zone_lng)
                .input('account', sql.NVarChar(50), data.account)
                .input('guardian_id', sql.UniqueIdentifier, data.guardian_id);

            if (data.password) { query += ', password = @password'; request.input('password', sql.NVarChar(255), data.password); }
            query += ' WHERE id = @id';
            const result = await request.query(query);
            return (result?.rowsAffected?.[0] || 0) > 0;
        } catch (err) {
            console.error('ElderlyProfileRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            try {
                const request = transaction.request();
                request.input('id', sql.UniqueIdentifier, id);

                // 1. 刪除用藥紀錄 (medication_logs) - 透過 medications 關聯
                await request.query('DELETE FROM medication_logs WHERE medication_id IN (SELECT id FROM medications WHERE elderly_id = @id)');
                // 2. 刪除用藥設定 (medications)
                await request.query('DELETE FROM medications WHERE elderly_id = @id');
                // 3. 刪除緊急聯絡人 (contacts)
                await request.query('DELETE FROM contacts WHERE elderly_id = @id');
                // 4. 刪除生理指標 (vital_signs)
                await request.query('DELETE FROM vital_signs WHERE elderly_id = @id');
                // 5. 刪除就醫紀錄 (medical_records)
                await request.query('DELETE FROM medical_records WHERE elderly_id = @id');
                // 6. 刪除 GPS 日誌 (gps_logs)
                await request.query('DELETE FROM gps_logs WHERE elderly_id = @id');
                // 7. 解除使用者與此長輩的關聯 (避免外鍵約束)
                await request.query('UPDATE users SET elderly_id = NULL WHERE elderly_id = @id');
                // 8. 最後刪除長輩主檔案
                const result = await request.query('DELETE FROM elderly_profiles WHERE id = @id');

                await transaction.commit();
                return (result?.rowsAffected?.[0] || 0) > 0;
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } catch (err) {
            console.error('ElderlyProfileRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default ElderlyProfileRepository;
