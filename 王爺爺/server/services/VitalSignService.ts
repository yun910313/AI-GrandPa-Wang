import VitalSignRepository from '../repositories/VitalSignRepository.js';

export class VitalSignService {
    private vitalSignRepo: VitalSignRepository;

    constructor() {
        this.vitalSignRepo = new VitalSignRepository();
    }

    /**
     * 獲取所有生理指標紀錄
     * @param elderlyId 長輩 ID (選填)
     */
    async getAllVitalSigns(elderlyId?: string) {
        return await this.vitalSignRepo.findAll(elderlyId);
    }

    /**
     * 獲取最新一筆生理指標紀錄
     * @param elderlyId 長輩 ID
     */
    async getLatestVitalSign(elderlyId?: string) {
        return await this.vitalSignRepo.findLatest(elderlyId);
    }

    /**
     * 新增生理指標紀錄
     * @param data 生理指標資料
     * @returns 新增的 ID
     */
    async createVitalSign(data: any): Promise<string> {
        // 基本資料驗證
        if (!data.elderly_id) {
            throw new Error('長輩 ID (elderly_id) 為必填項');
        }

        return await this.vitalSignRepo.create(data);
    }

    /**
     * 更新生理指標紀錄
     * @param id 紀錄 ID
     * @param data 更新內容
     */
    async updateVitalSign(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須指定紀錄 ID 才能進行更新');
        }

        return await this.vitalSignRepo.update(id, data);
    }

    /**
     * 刪除生理指標紀錄
     * @param id 紀錄 ID
     */
    async deleteVitalSign(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須指定紀錄 ID 才能進行刪除');
        }

        return await this.vitalSignRepo.delete(id);
    }
}

export default VitalSignService;