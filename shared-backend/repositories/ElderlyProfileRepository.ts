import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class ElderlyProfileRepository {
    /**
     * 獲取所有長輩資料
     */
    async findAll(): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .query('SELECT id, name, age, gender, CAST(birthday AS VARCHAR) as birthday, height, weight, blood_type, primary_hospital, safe_zone_address, safe_zone_range, medical_history FROM elderly_profiles ORDER BY created_at DESC');
            return result.recordset;
        } catch (err) {
            console.error('ElderlyProfileRepository.findAll Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 根據 ID 獲取單筆長輩資料
     * @param id UUID
     */
    async findById(id: string): Promise<any | null> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('SELECT id, name, age, gender, CAST(birthday AS VARCHAR) as birthday, height, weight, blood_type, primary_hospital, safe_zone_address, safe_zone_range, medical_history FROM elderly_profiles WHERE id = @id');
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('ElderlyProfileRepository.findById Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 新增長輩資料
     * @param data 資料物件
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            // Let's use NEWID() in the query and OUTPUT the inserted ID.
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
                .query(`
                    INSERT INTO elderly_profiles (name, age, gender, blood_type, birthday, height, weight, primary_hospital, safe_zone_address, safe_zone_range, medical_history)
                    OUTPUT INSERTED.id
                    VALUES (@name, @age, @gender, @blood_type, @birthday, @height, @weight, @primary_hospital, @safe_zone_address, @safe_zone_range, @medical_history)
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('ElderlyProfileRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 更新長輩資料
     * @param id UUID
     * @param data 資料物件
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
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
                .input('safe_zone_range', sql.Int, data.safe_zone_range || 500)
                .input('medical_history', sql.NVarChar(sql.MAX), data.medical_history)
                .query(`
                    UPDATE elderly_profiles SET
                        name = @name, age = @age, gender = @gender, blood_type = @blood_type,
                        birthday = @birthday, height = @height, weight = @weight,
                        primary_hospital = @primary_hospital, safe_zone_address = @safe_zone_address,
                        safe_zone_range = @safe_zone_range, medical_history = @medical_history
                    WHERE id = @id
                `);
            const affectedRows = result?.rowsAffected?.[0];
            return affectedRows !== undefined ? affectedRows > 0 : false;
        } catch (err) {
            console.error('ElderlyProfileRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 刪除長輩資料
     * @param id UUID
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM elderly_profiles WHERE id = @id');
            const affectedRows = result?.rowsAffected?.[0];
            return affectedRows !== undefined ? affectedRows > 0 : false;
        } catch (err) {
            console.error('ElderlyProfileRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default ElderlyProfileRepository;
