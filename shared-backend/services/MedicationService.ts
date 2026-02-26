import MedicationRepository from '../repositories/MedicationRepository';

export class MedicationService {
    private medicationRepo: MedicationRepository;

    constructor() {
        this.medicationRepo = new MedicationRepository();
    }

    /**
     * 獲取所有用藥設定
     */
    async getAllMedications() {
        return await this.medicationRepo.findAll();
    }

    /**
     * 新增用藥提醒
     * @param data 用藥資料
     * @returns 新增的用藥 ID
     */
    async createMedication(data: any): Promise<string> {
        // 基礎驗證
        if (!data.name || !data.reminder_time || !data.dosage) {
            throw new Error('藥品名稱、提醒時間與劑量為必填欄位');
        }

        return await this.medicationRepo.create(data);
    }

    /**
     * 編輯用藥資料
     * @param id 用藥 ID
     * @param data 更新資料
     */
    async updateMedication(id: string, data: any): Promise<boolean> {
        // 驗證 ID 是否存在 (此處 repository.update 會根據 ID 更新)
        if (!id) {
            throw new Error('必須提供有效的用藥 ID 才能執行更新');
        }

        // 欄位驗證
        if (data.name === '') {
            throw new Error('藥品名稱不得為空值');
        }

        return await this.medicationRepo.update(id, data);
    }

    /**
     * 刪除用藥資料
     * @param id 用藥 ID
     */
    async deleteMedication(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的用藥 ID 才能執行刪除');
        }

        return await this.medicationRepo.delete(id);
    }
}

export default MedicationService;
