import MedicalRecordRepository from '../repositories/MedicalRecordRepository.js';

export class MedicalRecordService {
    private medicalRepo: MedicalRecordRepository;

    constructor() {
        this.medicalRepo = new MedicalRecordRepository();
    }

    /**
     * 獲取所有就醫紀錄
     * @param elderlyId 長輩 ID (可定位特定長輩)
     */
    async getAllMedicalRecords(elderlyId?: string) {
        return await this.medicalRepo.findAll(elderlyId);
    }

    /**
     * 創建就醫紀錄
     * @param data 紀錄內容
     * @returns 新增的 ID
     */
    async createMedicalRecord(data: any): Promise<string> {
        // 基本行為驗證
        if (!data.date || !data.hospital || !data.diagnosis) {
            throw new Error('日期、醫院及診斷結果為必填項目');
        }

        return await this.medicalRepo.create(data);
    }

    /**
     * 更新就醫紀錄
     * @param id 紀錄 ID
     * @param data 更新內容
     */
    async updateMedicalRecord(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供紀錄 ID 才能執行更新');
        }

        return await this.medicalRepo.update(id, data);
    }

    /**
     * 刪除就醫紀錄
     * @param id 紀錄 ID
     */
    async deleteMedicalRecord(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供紀錄 ID 才能執行刪除');
        }

        return await this.medicalRepo.delete(id);
    }
}

export default MedicalRecordService;
