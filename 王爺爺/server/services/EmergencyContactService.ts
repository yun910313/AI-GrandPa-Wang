import EmergencyContactRepository from '../repositories/EmergencyContactRepository.js';

export class EmergencyContactService {
    private contactRepo: EmergencyContactRepository;

    constructor() {
        this.contactRepo = new EmergencyContactRepository();
    }

    /**
     * ?²å??€?‰ç??¥è¯çµ¡äºº
     */
    async getAllEmergencyContacts() {
        return await this.contactRepo.findAll();
    }

    /**
     * ?°å?ç·Šæ€¥è¯çµ¡äºº
     * @param data ?¯çµ¡äººè???
     * @returns ?°å???ID
     */
    async createEmergencyContact(data: any): Promise<string> {
        // ?ºç?è¡Œç‚ºé©—è?
        if (!data.name || !data.relationship || !data.phone) {
            throw new Error('å§“å??é?ä¿‚è??»è©±?ºå?å¡«æ?ä½?);
        }

        return await this.contactRepo.create(data);
    }

    /**
     * ?´æ–°ç·Šæ€¥è¯çµ¡äºº
     * @param id ?¯çµ¡äº?ID
     * @param data ?´æ–°?§å®¹
     */
    async updateEmergencyContact(id: string, data: any): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„è¯çµ¡äºº ID ?èƒ½?·è??´æ–°');
        }

        // æ¬„ä?é©—è? (ä¸å?è¨±å??œéµæ¬„ä?è¨­ç‚ºç©?
        if (data.name === '' || data.phone === '') {
            throw new Error('å§“å??‡é›»è©±ä?å¾—ç‚ºç©ºå€?);
        }

        return await this.contactRepo.update(id, data);
    }

    /**
     * ?ªé™¤ç·Šæ€¥è¯çµ¡äºº
     * @param id ?¯çµ¡äº?ID
     */
    async deleteEmergencyContact(id: string): Promise<boolean> {
        if (!id) {
            throw new Error('å¿…é??ä??‰æ??„è¯çµ¡äºº ID ?èƒ½?·è??ªé™¤');
        }

        return await this.contactRepo.delete(id);
    }
}

export default EmergencyContactService;
