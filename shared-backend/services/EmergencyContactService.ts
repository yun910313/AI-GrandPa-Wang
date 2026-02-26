import EmergencyContactRepository from '../repositories/EmergencyContactRepository';

export class EmergencyContactService {
    private contactRepo: EmergencyContactRepository;

    constructor() {
        this.contactRepo = new EmergencyContactRepository();
    }

    /**
     * 獲取所有緊急聯絡人
     */
    async getAllEmergencyContacts() {
        return await this.contactRepo.findAll();
    }

    /**
     * 新增緊急聯絡人
     * @param data 聯絡人資料
     * @returns 新增的 ID
     */
    async createEmergencyContact(data: any): Promise<string> {
        // 基礎行為驗證
        if (!data.name || !data.relationship || !data.phone) {
            throw new Error('姓名、關係與電話為必填欄位');
        }

        return await this.contactRepo.create(data);
    }

    /**
     * 更新緊急聯絡人
     * @param id 聯絡人 ID
     * @param data 更新內容
     */
    async updateEmergencyContact(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的聯絡人 ID 才能執行更新');
        }

        // 欄位驗證 (不允許將關鍵欄位設為空)
        if (data.name === '' || data.phone === '') {
            throw new Error('姓名與電話不得為空值');
        }

        return await this.contactRepo.update(id, data);
    }

    /**
     * 刪除緊急聯絡人
     * @param id 聯絡人 ID
     */
    async deleteEmergencyContact(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供有效的聯絡人 ID 才能執行刪除');
        }

        return await this.contactRepo.delete(id);
    }
}

export default EmergencyContactService;
