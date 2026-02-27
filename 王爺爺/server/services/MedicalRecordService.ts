import MedicalRecordRepository from '../repositories/MedicalRecordRepository.js';

export class MedicalRecordService {
    private medicalRecordRepo: MedicalRecordRepository;

    constructor() {
        this.medicalRecordRepo = new MedicalRecordRepository();
    }

    /**
     * ?²å??€?‰å°±?«ç???
     */
    async getAllMedicalRecords() {
        return await this.medicalRecordRepo.findAll();
    }

    /**
     * ?°å?å°±é†«ç´€??
     * @param data ç´€?„è???
     * @returns ?°å??„ç???ID
     */
    async createMedicalRecord(data: any): Promise<string> {
        // ?ºç?é©—è?
        if (!data.date || !data.hospital || !data.diagnosis) {
            throw new Error('å°±é†«?¥æ??å°±?«é™¢?€?‡è¨º?·ç??œç‚ºå¿…å¡«æ¬„ä?');
        }

        return await this.medicalRecordRepo.create(data);
    }

    /**
     * ç·¨è¼¯å°±é†«ç´€??
     * @param id ç´€??ID
     * @param data ?´æ–°?§å®¹
     */
    async updateMedicalRecord(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„å°±?«ç???ID ?èƒ½?·è??´æ–°');
        }

        // æ¬„ä?é©—è? (ä¸å?è¨±æ?ç©ºé??µæ?ä½?
        if (data.hospital === '' || data.diagnosis === '') {
            throw new Error('å°±é†«?¢æ??‡è¨º?·ç??œä?å¾—ç‚ºç©ºå€?);
        }

        return await this.medicalRecordRepo.update(id, data);
    }

    /**
     * ?ªé™¤å°±é†«ç´€??
     * @param id ç´€??ID
     */
    async deleteMedicalRecord(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„å°±?«ç???ID ?èƒ½?·è??ªé™¤');
        }

        return await this.medicalRecordRepo.delete(id);
    }
}

export default MedicalRecordService;
