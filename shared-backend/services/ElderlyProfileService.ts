import ElderlyProfileRepository from '../repositories/ElderlyProfileRepository';

export class ElderlyProfileService {
    private elderlyProfileRepo: ElderlyProfileRepository;

    constructor() {
        this.elderlyProfileRepo = new ElderlyProfileRepository();
    }

    /**
     * 獲取所有長輩資料
     */
    async getAllElderlyProfiles() {
        return await this.elderlyProfileRepo.findAll();
    }

    /**
     * 根據 ID 獲取單筆長輩資料
     * @param id 長輩 ID
     */
    async getElderlyProfileById(id: string) {
        if (!id) {
            throw new Error('必須提供有效的長輩 ID');
        }
        return await this.elderlyProfileRepo.findById(id);
    }

    /**
     * 新增長輩資料
     * @param data 長輩資料
     * @returns 新增的 ID
     */
    async createElderlyProfile(data: any): Promise<string> {
        // 基礎行為驗證
        if (!data.name || !data.age || !data.gender) {
            throw new Error('姓名、年齡與性別為必填欄位');
        }

        return await this.elderlyProfileRepo.create(data);
    }

    /**
     * 更新長輩資料
     * @param id 長輩 ID
     * @param data 更新內容
     */
    async updateElderlyProfile(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的長輩 ID 才能執行更新');
        }

        // 欄位驗證 (不允許清空關鍵欄位)
        if (data.name === '') {
            throw new Error('姓名不得為空值');
        }

        return await this.elderlyProfileRepo.update(id, data);
    }

    /**
     * 刪除長輩資料
     * @param id 長輩 ID
     */
    async deleteElderlyProfile(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的長輩 ID 才能執行刪除');
        }

        return await this.elderlyProfileRepo.delete(id);
    }
}

export default ElderlyProfileService;
