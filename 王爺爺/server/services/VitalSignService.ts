import VitalSignRepository from '../repositories/VitalSignRepository.js';

export class VitalSignService {
    private vitalSignRepo: VitalSignRepository;

    constructor() {
        this.vitalSignRepo = new VitalSignRepository();
    }

    /**
     * ?²å??€?‰ç??†æ?æ¨™ç???
     * @param elderlyId ?·è¼© ID (?¯å?ä½ç‰¹å®šé•·è¼?
     */
    async getAllVitalSigns(elderlyId?: string) {
        return await this.vitalSignRepo.findAll(elderlyId);
    }

    /**
     * ?²å??€?°ç?ä¸€ç­†ç??†æ?æ¨?
     * @param elderlyId ?·è¼© ID
     */
    async getLatestVitalSign(elderlyId?: string) {
        return await this.vitalSignRepo.findLatest(elderlyId);
    }

    /**
     * ?°å??Ÿç??‡æ?ç´€??
     * @param data ?Ÿç??‡æ?è³‡æ?
     * @returns ?°å???ID
     */
    async createVitalSign(data: any): Promise<string> {
        // ?ºç?è¡Œç‚ºé©—è?
        if (!data.elderly_id) {
            throw new Error('?·è¼© ID (elderly_id) ?ºå?å¡«æ?ä½?);
        }

        return await this.vitalSignRepo.create(data);
    }

    /**
     * ?´æ–°?Ÿç??‡æ?ç´€??
     * @param id ç´€??ID
     * @param data ?´æ–°?§å®¹
     */
    async updateVitalSign(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„ç??†æ?æ¨?ID ?èƒ½?·è??´æ–°');
        }

        return await this.vitalSignRepo.update(id, data);
    }

    /**
     * ?ªé™¤?Ÿç??‡æ?ç´€??
     * @param id ç´€??ID
     */
    async deleteVitalSign(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„ç??†æ?æ¨?ID ?èƒ½?·è??ªé™¤');
        }

        return await this.vitalSignRepo.delete(id);
    }
}

export default VitalSignService;
