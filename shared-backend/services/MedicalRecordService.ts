import MedicalRecordRepository from '../repositories/MedicalRecordRepository';

export class MedicalRecordService {
    private medicalRecordRepo: MedicalRecordRepository;

    constructor() {
        this.medicalRecordRepo = new MedicalRecordRepository();
    }

    /**
     * 獲取所有就醫紀錄
     */
    async getAllMedicalRecords() {
        return await this.medicalRecordRepo.findAll();
    }

    /**
     * 新增就醫紀錄
     * @param data 紀錄資料
     * @returns 新增的紀錄 ID
     */
    async createMedicalRecord(data: any): Promise<string> {
        // 基礎驗證
        if (!data.date || !data.hospital || !data.diagnosis) {
            throw new Error('就醫日期、就醫院所與診斷結果為必填欄位');
        }

        return await this.medicalRecordRepo.create(data);
    }

    /**
     * 編輯就醫紀錄
     * @param id 紀錄 ID
     * @param data 更新內容
     */
    async updateMedicalRecord(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的就醫紀錄 ID 才能執行更新');
        }

        // 欄位驗證 (不允許清空關鍵欄位)
        if (data.hospital === '' || data.diagnosis === '') {
            throw new Error('就醫院所與診斷結果不得為空值');
        }

        return await this.medicalRecordRepo.update(id, data);
    }

    /**
     * 刪除就醫紀錄
     * @param id 紀錄 ID
     */
    async deleteMedicalRecord(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的就醫紀錄 ID 才能執行刪除');
        }

        return await this.medicalRecordRepo.delete(id);
    }
}

export default MedicalRecordService;
