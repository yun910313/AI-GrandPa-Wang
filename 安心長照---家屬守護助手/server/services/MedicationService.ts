import MedicationRepository from '../repositories/MedicationRepository.js';

export class MedicationService {
    private medicationRepo: MedicationRepository;

    constructor() {
        this.medicationRepo = new MedicationRepository();
    }

    /**
     * 獲取所有服用中藥物設定
     */
    async getAllMedications() {
        return await this.medicationRepo.findAll();
    }

    /**
     * 創建用藥資訊
     * @param data 用藥資料
     * @returns 新增的用藥 ID
     */
    async createMedication(data: any): Promise<string> {
        // 基本驗證
        if (!data.name || !data.reminder_time || !data.dosage) {
            throw new Error('藥品名稱、提醒時間及劑量為必填項目');
        }

        return await this.medicationRepo.create(data);
    }

    /**
     * 編輯用藥資訊
     * @param id 用藥 ID
     * @param data 更新資料
     */
    async updateMedication(id: string, data: any): Promise<boolean> {
        // 驗證 ID 是否存在 (此處 repository.update 會根據 ID 更新)
        if (!id) {
            throw new Error('必須提供用藥 ID 才能更新');
        }

        // 欄位驗證
        if (data.name === '') {
            throw new Error('藥品名稱不能為空');
        }

        return await this.medicationRepo.update(id, data);
    }

    /**
     * 刪除用藥資訊
     * @param id 用藥 ID
     */
    async deleteMedication(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供用藥 ID 才能成功刪除');
        }

        return await this.medicationRepo.delete(id);
    }
}

export default MedicationService;
