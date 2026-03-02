const fs = require('fs');
const path = require('path');

const servicesDir = 'c:/Users/yun/Desktop/GrandPa Wang/AI-GrandPa-Wang/安心長照---家屬守護助手/server/services';

const files = {
    'ElderlyProfileService.ts': `import ElderlyProfileRepository from '../repositories/ElderlyProfileRepository.js';

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
     * 根據 ID 獲取特定長輩資料
     * @param id 長輩 ID
     */
    async getElderlyProfileById(id: string) {
        if (!id) {
            throw new Error('必須提供長輩 ID');
        }
        return await this.elderlyProfileRepo.findById(id);
    }

    /**
     * 創建長輩資料
     * @param data 長輩資料
     * @returns 新增的 ID
     */
    async createElderlyProfile(data: any): Promise<string> {
        // 基本行為驗證
        if (!data.name || !data.age || !data.gender) {
            throw new Error('姓名、年齡及性別為必填項目');
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
            throw new Error('必須提供長輩 ID 才能執行更新');
        }

        // 欄位驗證 (不允許姓名為空字串)
        if (data.name === '') {
            throw new Error('姓名不能為空');
        }

        return await this.elderlyProfileRepo.update(id, data);
    }

    /**
     * 刪除長輩資料
     * @param id 長輩 ID
     */
    async deleteElderlyProfile(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供長輩 ID 才能執行刪除');
        }

        return await this.elderlyProfileRepo.delete(id);
    }
}

export default ElderlyProfileService;
`,
    'EmergencyContactService.ts': `import EmergencyContactRepository from '../repositories/EmergencyContactRepository.js';

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
`,
    'MedicalRecordService.ts': `import MedicalRecordRepository from '../repositories/MedicalRecordRepository.js';

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
`,
    'MedicationLogService.ts': `import MedicationLogRepository from '../repositories/MedicationLogRepository.js';

export class MedicationLogService {
    private logRepo: MedicationLogRepository;

    constructor() {
        this.logRepo = new MedicationLogRepository();
    }

    /**
     * 獲取特定藥物的用藥紀錄
     * @param medicationId 藥物 ID
     */
    async getMedicationLogsByMedication(medicationId: string) {
        if (!medicationId) {
            throw new Error('必須提供藥物 ID 以獲取紀錄');
        }
        return await this.logRepo.findByMedication(medicationId);
    }

    /**
     * 創建用藥紀錄
     * @param data 紀錄內容
     * @returns 新增的 ID
     */
    async createMedicationLog(data: any): Promise<string> {
        // 基本行為驗證
        if (!data.medication_id) {
            throw new Error('藥物 ID (medication_id) 為必填項目');
        }

        return await this.logRepo.create(data);
    }

    /**
     * 更新用藥紀錄
     * @param id 紀錄 ID
     * @param data 更新內容
     */
    async updateMedicationLog(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供用藥紀錄 ID 才能成功更新');
        }

        return await this.logRepo.update(id, data);
    }

    /**
     * 刪除用藥紀錄
     * @param id 紀錄 ID
     */
    async deleteMedicationLog(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供用藥紀錄 ID 才能成功刪除');
        }

        return await this.logRepo.delete(id);
    }
}

export default MedicationLogService;
`,
    'MedicationService.ts': `import MedicationRepository from '../repositories/MedicationRepository.js';

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
`,
    'VitalSignService.ts': `import VitalSignRepository from '../repositories/VitalSignRepository.js';

export class VitalSignService {
    private vitalSignRepo: VitalSignRepository;

    constructor() {
        this.vitalSignRepo = new VitalSignRepository();
    }

    /**
     * 獲取所有生理指標紀錄
     * @param elderlyId 長輩 ID (可定位特定長輩)
     */
    async getAllVitalSigns(elderlyId?: string) {
        return await this.vitalSignRepo.findAll(elderlyId);
    }

    /**
     * 獲取最新一筆生理指標
     * @param elderlyId 長輩 ID
     */
    async getLatestVitalSign(elderlyId?: string) {
        return await this.vitalSignRepo.findLatest(elderlyId);
    }

    /**
     * 創建生理指標紀錄
     * @param data 生理指標資料
     * @returns 新增的 ID
     */
    async createVitalSign(data: any): Promise<string> {
        // 基本行為驗證
        if (!data.elderly_id) {
            throw new Error('長輩 ID (elderly_id) 為必填項目');
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
            throw new Error('必須提供指標紀錄 ID 才能執行更新');
        }

        return await this.vitalSignRepo.update(id, data);
    }

    /**
     * 刪除生理指標紀錄
     * @param id 紀錄 ID
     */
    async deleteVitalSign(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('必須提供指標紀錄 ID 才能執行刪除');
        }

        return await this.vitalSignRepo.delete(id);
    }
}

export default VitalSignService;
`
};

for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(servicesDir, filename), content, 'utf8');
    console.log('Fixed ' + filename);
}
console.log('All services fixed.');
