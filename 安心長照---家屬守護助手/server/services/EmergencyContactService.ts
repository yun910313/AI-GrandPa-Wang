import EmergencyContactRepository from '../repositories/EmergencyContactRepository.js';

export class EmergencyContactService {
    private contactRepo: EmergencyContactRepository;

    constructor() {
        this.contactRepo = new EmergencyContactRepository();
    }

    /**
     * 獲取所有緊急聯絡人
     */
    async getAllContacts() {
        return await this.contactRepo.findAll();
    }

    /**
     * 創建緊急聯絡人
     * @param data 聯絡人資料
     * @returns 新增的 ID
     */
    async createContact(data: any): Promise<string> {
        // 驗證
        if (!data.name || !data.phone || !data.relationship) {
            throw new Error('姓名、電話及關係為必填項目');
        }

        return await this.contactRepo.create(data);
    }

    /**
     * 更新緊急聯絡人
     * @param id 聯絡人 ID
     * @param data 更新內容
     */
    async updateContact(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供聯絡人 ID 才能更新');
        }

        return await this.contactRepo.update(id, data);
    }

    /**
     * 刪除緊急聯絡人
     * @param id 聯絡人 ID
     */
    async deleteContact(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供聯絡人 ID 才能刪除');
        }

        return await this.contactRepo.delete(id);
    }
}

export default EmergencyContactService;
