import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class GPSLogRepository {
    async findLatest(elderlyId: string): Promise<any | null> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('elderlyId', sql.UniqueIdentifier, elderlyId)
                .query('SELECT TOP 1 id, elderly_id, latitude, longitude, address, CONVERT(VARCHAR(33), timestamp, 126) as timestamp FROM gps_logs WHERE elderly_id = @elderlyId ORDER BY timestamp DESC');
            return result.recordset.length > 0 ? result.recordset[0] : null;
        } catch (err) {
            console.error('GPSLogRepository.findLatest Error:', err);
            return null;
        } finally {
            if (pool) await pool.close();
        }
    }

    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id)
                .input('latitude', sql.Decimal(10, 8), data.latitude)
                .input('longitude', sql.Decimal(11, 8), data.longitude)
                .input('address', sql.NVarChar(sql.MAX), data.address)
                .query(`
                    INSERT INTO gps_logs (elderly_id, latitude, longitude, address, timestamp)
                    OUTPUT INSERTED.id
                    VALUES (@elderly_id, @latitude, @longitude, @address, SYSDATETIMEOFFSET())
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('GPSLogRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default GPSLogRepository;
