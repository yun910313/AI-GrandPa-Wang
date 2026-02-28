import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class EmergencyContactRepository {
    /**
     * 獲取所有緊急聯絡人 (根據長輩 ID 篩選)
     */
    async findAll(elderlyId?: string): Promise<any[]> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            let query = 'SELECT id, name, relationship, phone, sort_order, guardian_id, elderly_id FROM contacts';
            const request = pool.request();

            if (elderlyId) {
                request.input('elderlyId', sql.UniqueIdentifier, elderlyId);
                query += ' WHERE elderly_id = @elderlyId';
            }

            query += ' ORDER BY sort_order ASC, created_at DESC';
            const result = await request.query(query);
            return result.recordset;
        } catch (err) {
            console.error('EmergencyContactRepository.findAll Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 新增緊急聯絡人
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            // 獲取該長輩目前最高的 sort_order
            const maxOrderRes = await pool.request()
                .input('eid', sql.UniqueIdentifier, data.elderly_id)
                .query('SELECT MAX(sort_order) as maxOrder FROM contacts WHERE elderly_id = @eid');
            const nextOrder = (maxOrderRes.recordset[0].maxOrder || 0) + 1;

            const result = await pool.request()
                .input('name', sql.NVarChar(100), data.name)
                .input('relationship', sql.NVarChar(50), data.relationship)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('guardian_id', sql.UniqueIdentifier, data.guardian_id)
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id)
                .input('sort_order', sql.Int, nextOrder)
                .query(`
                    INSERT INTO contacts (name, relationship, phone, guardian_id, elderly_id, sort_order, created_at)
                    OUTPUT INSERTED.id
                    VALUES (@name, @relationship, @phone, @guardian_id, @elderly_id, @sort_order, SYSDATETIMEOFFSET())
                `);
            return result.recordset[0].id;
        } catch (err) {
            console.error('EmergencyContactRepository.create Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 更新緊急聯絡人
     */
    async update(id: string, data: any): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('name', sql.NVarChar(100), data.name)
                .input('relationship', sql.NVarChar(50), data.relationship)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('sort_order', sql.Int, data.sort_order)
                .query(`
                    UPDATE contacts SET
                        name = @name,
                        relationship = @relationship,
                        phone = @phone,
                        sort_order = ISNULL(@sort_order, sort_order)
                    WHERE id = @id
                `);
            return (result.rowsAffected?.[0] ?? 0) > 0;
        } catch (err) {
            console.error('EmergencyContactRepository.update Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 批次更新排序
     */
    async updateOrders(orders: { id: string, sort_order: number }[]): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            for (const item of orders) {
                await pool.request()
                    .input('id', sql.UniqueIdentifier, item.id)
                    .input('sort_order', sql.Int, item.sort_order)
                    .query('UPDATE contacts SET sort_order = @sort_order WHERE id = @id');
            }
            return true;
        } catch (err) {
            console.error('EmergencyContactRepository.updateOrders Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 刪除緊急聯絡人
     */
    async delete(id: string): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM contacts WHERE id = @id');
            return (result.rowsAffected?.[0] ?? 0) > 0;
        } catch (err) {
            console.error('EmergencyContactRepository.delete Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }
}

export default EmergencyContactRepository;
