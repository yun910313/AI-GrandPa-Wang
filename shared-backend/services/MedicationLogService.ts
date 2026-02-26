import MedicationLogRepository from '../repositories/MedicationLogRepository';

export class MedicationLogService {
    private logRepo: MedicationLogRepository;

    constructor() {
        this.logRepo = new MedicationLogRepository();
    }

    /**
     * 獲取特定藥物的服藥紀錄
     * @param medicationId 藥物 ID
     */
    async getMedicationLogsByMedication(medicationId: string) {
        if (!medicationId) {
            throw new Error('必須提供有效的藥物 ID 以獲取紀錄');
        }
        return await this.logRepo.findByMedication(medicationId);
    }

    /**
     * 新增服藥紀錄
     * @param data 紀錄資料
     * @returns 新增的 ID
     */
    async createMedicationLog(data: any): Promise<string> {
        // 基礎行為驗證
        if (!data.medication_id) {
            throw new Error('藥物 ID (medication_id) 為必填欄位');
        }

        return await this.logRepo.create(data);
    }

    /**
     * 更新服藥紀錄
     * @param id 紀錄 ID
     * @param data 更新內容
     */
    async updateMedicationLog(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的服藥紀錄 ID 才能執行更新');
        }

        return await this.logRepo.update(id, data);
    }

    /**
     * 刪除服藥紀錄
     * @param id 紀錄 ID
     */
    async deleteMedicationLog(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的服藥紀錄 ID 才能執行刪除');
        }

        return await this.logRepo.delete(id);
    }
}

export default MedicationLogService;
