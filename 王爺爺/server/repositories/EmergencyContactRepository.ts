import sql from 'mssql';
import { ConnectionFactory } from '../services/ConnectionFactory.js';

export class EmergencyContactRepository {
    /**
     * 獲取長輩的緊急聯絡人
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
     * 批次同步聯絡人與排序 (根據長輩 ID) - 改進版：保留 ID 以避免跨端衝突
     */
    async syncAll(elderlyId: string, contacts: any[]): Promise<boolean> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();

            // 獲取該長輩的 guardian_id
            const elderlyRes = await pool.request()
                .input('eid', sql.UniqueIdentifier, elderlyId)
                .query('SELECT guardian_id FROM elderly_profiles WHERE id = @eid');
            const guardianId = elderlyRes.recordset[0]?.guardian_id;

            // 1. 獲取傳入資料中的所有有效 ID
            const incomingIds = contacts
                .filter(c => c.id && typeof c.id === 'string' && c.id.length > 10)
                .map(c => c.id);

            // 2. 刪除不在傳入名單中的現有聯絡人
            const deleteRequest = pool.request();
            deleteRequest.input('eid', sql.UniqueIdentifier, elderlyId);
            let deleteQuery = 'DELETE FROM contacts WHERE elderly_id = @eid';
            if (incomingIds.length > 0) {
                // 注意：這裡簡單處理，若 ID 數量極多建議用臨時表或 XML
                const idParams = incomingIds.map((id, index) => `@id${index}`);
                incomingIds.forEach((id, index) => deleteRequest.input(`id${index}`, sql.UniqueIdentifier, id));
                deleteQuery += ` AND id NOT IN (${idParams.join(',')})`;
            }
            await deleteRequest.query(deleteQuery);

            // 3. 逐一更新或新增
            for (let i = 0; i < contacts.length; i++) {
                const c = contacts[i];
                const request = pool.request()
                    .input('name', sql.NVarChar(100), c.name)
                    .input('relationship', sql.NVarChar(50), c.relationship)
                    .input('phone', sql.NVarChar(20), c.phone)
                    .input('guardian_id', sql.UniqueIdentifier, guardianId)
                    .input('elderly_id', sql.UniqueIdentifier, elderlyId)
                    .input('sort_order', sql.Int, i + 1);

                if (c.id && typeof c.id === 'string' && c.id.length > 10) {
                    // 更新現有紀錄
                    await request
                        .input('id', sql.UniqueIdentifier, c.id)
                        .query(`
                            UPDATE contacts SET 
                                name = @name, 
                                relationship = @relationship, 
                                phone = @phone, 
                                sort_order = @sort_order,
                                guardian_id = ISNULL(@guardian_id, guardian_id)
                            WHERE id = @id
                        `);
                } else {
                    // 新增紀錄
                    await request.query(`
                        INSERT INTO contacts (name, relationship, phone, guardian_id, elderly_id, sort_order, created_at)
                        VALUES (@name, @relationship, @phone, @guardian_id, @elderly_id, @sort_order, SYSDATETIMEOFFSET())
                    `);
                }
            }
            return true;
        } catch (err) {
            console.error('EmergencyContactRepository.syncAll Error:', err);
            throw err;
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * 新增緊急聯絡人 (保留原本 API 結構)
     */
    async create(data: any): Promise<string> {
        let pool;
        try {
            pool = await ConnectionFactory.createConnection();
            const result = await pool.request()
                .input('name', sql.NVarChar(100), data.name)
                .input('relationship', sql.NVarChar(50), data.relationship)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('guardian_id', sql.UniqueIdentifier, data.guardian_id)
                .input('elderly_id', sql.UniqueIdentifier, data.elderly_id)
                .input('sort_order', sql.Int, data.sort_order || 0)
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
                        name = ISNULL(@name, name),
                        relationship = ISNULL(@relationship, relationship),
                        phone = ISNULL(@phone, phone),
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
