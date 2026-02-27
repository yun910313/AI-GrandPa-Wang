import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class ElderlyProfileRepository {
    async findAll(): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .query('SELECT id, name, age, gender, CAST(birthday AS VARCHAR) as birthday, height, weight, blood_type, primary_hospital, safe_zone_address, safe_zone_range, safe_zone_lat, safe_zone_lng, account, password, medical_history FROM elderly_profiles ORDER BY created_at DESC');
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
                .query('SELECT id, name, age, gender, CAST(birthday AS VARCHAR) as birthday, height, weight, blood_type, primary_hospital, safe_zone_address, safe_zone_range, safe_zone_lat, safe_zone_lng, account, password, medical_history FROM elderly_profiles WHERE id = @id');
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
                .query('INSERT INTO elderly_profiles (name, age, gender, blood_type, birthday, height, weight, primary_hospital, safe_zone_address, safe_zone_range, safe_zone_lat, safe_zone_lng, account, password, medical_history) OUTPUT INSERTED.id VALUES (@name, @age, @gender, @blood_type, @birthday, @height, @weight, @primary_hospital, @safe_zone_address, @safe_zone_range, @safe_zone_lat, @safe_zone_lng, @account, @password, @medical_history)');
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
            let query = 'UPDATE elderly_profiles SET name = @name, age = @age, gender = @gender, blood_type = @blood_type, birthday = @birthday, height = @height, weight = @weight, primary_hospital = @primary_hospital, safe_zone_address = @safe_zone_address, safe_zone_range = @safe_zone_range, safe_zone_lat = @safe_zone_lat, safe_zone_lng = @safe_zone_lng, account = @account, medical_history = @medical_history';
            const request = pool.request().input('id', sql.UniqueIdentifier, id).input('name', sql.NVarChar(100), data.name).input('age', sql.Int, data.age).input('gender', sql.NVarChar(20), data.gender).input('blood_type', sql.NVarChar(20), data.blood_type).input('birthday', sql.Date, data.birthday).input('height', sql.NVarChar(50), data.height).input('weight', sql.NVarChar(50), data.weight).input('primary_hospital', sql.NVarChar(255), data.primary_hospital).input('safe_zone_address', sql.NVarChar(sql.MAX), data.safe_zone_address).input('safe_zone_range', sql.Int, data.safe_zone_range || 500).input('medical_history', sql.NVarChar(sql.MAX), data.medical_history).input('safe_zone_lat', sql.Decimal(10, 8), data.safe_zone_lat).input('safe_zone_lng', sql.Decimal(11, 8), data.safe_zone_lng).input('account', sql.NVarChar(50), data.account);
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
            const result = await pool.request().input('id', sql.UniqueIdentifier, id).query('DELETE FROM elderly_profiles WHERE id = @id');
            return (result?.rowsAffected?.[0] || 0) > 0;
        } catch (err) {
            console.error('ElderlyProfileRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default ElderlyProfileRepository;
