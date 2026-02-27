import MedicationLogRepository from '../repositories/MedicationLogRepository.js';

export class MedicationLogService {
    private logRepo: MedicationLogRepository;

    constructor() {
        this.logRepo = new MedicationLogRepository();
    }

    /**
     * ?²å??¹å??¥ç‰©?„æ??¥ç???
     * @param medicationId ?¥ç‰© ID
     */
    async getMedicationLogsByMedication(medicationId: string) {
        if (!medicationId) {
            throw new Error('å¿…é??ä??‰æ??„è—¥??ID ä»¥ç²?–ç???);
        }
        return await this.logRepo.findByMedication(medicationId);
    }

    /**
     * ?°å??è—¥ç´€??
     * @param data ç´€?„è???
     * @returns ?°å???ID
     */
    async createMedicationLog(data: any): Promise<string> {
        // ?ºç?è¡Œç‚ºé©—è?
        if (!data.medication_id) {
            throw new Error('?¥ç‰© ID (medication_id) ?ºå?å¡«æ?ä½?);
        }

        return await this.logRepo.create(data);
    }

    /**
     * ?´æ–°?è—¥ç´€??
     * @param id ç´€??ID
     * @param data ?´æ–°?§å®¹
     */
    async updateMedicationLog(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„æ??¥ç???ID ?èƒ½?·è??´æ–°');
        }

        return await this.logRepo.update(id, data);
    }

    /**
     * ?ªé™¤?è—¥ç´€??
     * @param id ç´€??ID
     */
    async deleteMedicationLog(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„æ??¥ç???ID ?èƒ½?·è??ªé™¤');
        }

        return await this.logRepo.delete(id);
    }
}

export default MedicationLogService;
