import MedicationRepository from '../repositories/MedicationRepository.js';

export class MedicationService {
    private medicationRepo: MedicationRepository;

    constructor() {
        this.medicationRepo = new MedicationRepository();
    }

    /**
     * ?²å??€?‰ç”¨?¥è¨­å®?
     */
    async getAllMedications() {
        return await this.medicationRepo.findAll();
    }

    /**
     * ?°å??¨è—¥?é?
     * @param data ?¨è—¥è³‡æ?
     * @returns ?°å??„ç”¨??ID
     */
    async createMedication(data: any): Promise<string> {
        // ?ºç?é©—è?
        if (!data.name || !data.reminder_time || !data.dosage) {
            throw new Error('?¥å??ç¨±?æ??’æ??“è??‘é??ºå?å¡«æ?ä½?);
        }

        return await this.medicationRepo.create(data);
    }

    /**
     * ç·¨è¼¯?¨è—¥è³‡æ?
     * @param id ?¨è—¥ ID
     * @param data ?´æ–°è³‡æ?
     */
    async updateMedication(id: string, data: any): Promise<boolean> {
        // é©—è? ID ?¯å¦å­˜åœ¨ (æ­¤è? repository.update ?ƒæ ¹??ID ?´æ–°)
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„ç”¨??ID ?èƒ½?·è??´æ–°');
        }

        // æ¬„ä?é©—è?
        if (data.name === '') {
            throw new Error('?¥å??ç¨±ä¸å??ºç©º??);
        }

        return await this.medicationRepo.update(id, data);
    }

    /**
     * ?ªé™¤?¨è—¥è³‡æ?
     * @param id ?¨è—¥ ID
     */
    async deleteMedication(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„ç”¨??ID ?èƒ½?·è??ªé™¤');
        }

        return await this.medicationRepo.delete(id);
    }
}

export default MedicationService;
