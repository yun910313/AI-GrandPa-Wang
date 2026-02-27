import ElderlyProfileRepository from '../repositories/ElderlyProfileRepository.js';

export class ElderlyProfileService {
    private elderlyProfileRepo: ElderlyProfileRepository;

    constructor() {
        this.elderlyProfileRepo = new ElderlyProfileRepository();
    }

    /**
     * ?²å??€?‰é•·è¼©è???
     */
    async getAllElderlyProfiles() {
        return await this.elderlyProfileRepo.findAll();
    }

    /**
     * ?¹æ? ID ?²å??®ç??·è¼©è³‡æ?
     * @param id ?·è¼© ID
     */
    async getElderlyProfileById(id: string) {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„é•·è¼?ID');
        }
        return await this.elderlyProfileRepo.findById(id);
    }

    /**
     * ?°å??·è¼©è³‡æ?
     * @param data ?·è¼©è³‡æ?
     * @returns ?°å???ID
     */
    async createElderlyProfile(data: any): Promise<string> {
        // ?ºç?è¡Œç‚ºé©—è?
        if (!data.name || !data.age || !data.gender) {
            throw new Error('å§“å??å¹´é½¡è??§åˆ¥?ºå?å¡«æ?ä½?);
        }

        return await this.elderlyProfileRepo.create(data);
    }

    /**
     * ?´æ–°?·è¼©è³‡æ?
     * @param id ?·è¼© ID
     * @param data ?´æ–°?§å®¹
     */
    async updateElderlyProfile(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„é•·è¼?ID ?èƒ½?·è??´æ–°');
        }

        // æ¬„ä?é©—è? (ä¸å?è¨±æ?ç©ºé??µæ?ä½?
        if (data.name === '') {
            throw new Error('å§“å?ä¸å??ºç©º??);
        }

        return await this.elderlyProfileRepo.update(id, data);
    }

    /**
     * ?ªé™¤?·è¼©è³‡æ?
     * @param id ?·è¼© ID
     */
    async deleteElderlyProfile(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„é•·è¼?ID ?èƒ½?·è??ªé™¤');
        }

        return await this.elderlyProfileRepo.delete(id);
    }
}

export default ElderlyProfileService;
