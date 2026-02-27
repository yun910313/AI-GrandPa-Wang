import UserRepository from '../repositories/UserRepository.js';

export class UserService {
    private userRepo: UserRepository;

    constructor() {
        this.userRepo = new UserRepository();
    }

    /**
     * é©—è?ä½¿ç”¨?…ç™»??
     * @param account å¸³è?
     * @param password å¯†ç¢¼
     */
    async authenticate(account: string, password: string): Promise<any | null> {
        return await this.userRepo.findByCredentials(account, password);
    }

    /**
     * å»ºç?ä½¿ç”¨??
     * @param data ä½¿ç”¨?…è???
     * @returns ?°å??„ä½¿?¨è€?ID
     */
    async createUser(data: any): Promise<string> {
        // ?ºç?è¡Œç‚ºé©—è?
        if (!data.account || !data.password || !data.name) {
            throw new Error('å¸³è??å?ç¢¼è?å§“å??ºå?å¡«æ?ä½?);
        }

        // ?¼å« Repository ?·è?å¯«å…¥
        const insertedId = await this.userRepo.create(data);
        return insertedId;
    }

    /**
     * ä¿®æ”¹ä½¿ç”¨??(å¼·å?é©—è?)
     * @param id ä½¿ç”¨??ID
     * @param data ?´æ–°è³‡æ?
     */
    async updateUser(id: string, data: any): Promise<boolean> {
        // 1. é©—è?è¦å?ï¼šæª¢?¥ä½¿?¨è€…æ˜¯?¦å???
        const existingUser = await this.userRepo.findById(id);
        if (!existingUser) {
            throw new Error(`?¾ä???ID ??${id} ?„ä½¿?¨è€…ï??¡æ??·è??´æ–°?‚`);
        }

        // 2. æ¬„ä?é©—è? (ä¸å?è¨±æ?ç©ºé??µæ?ä½?
        if (data.name === '') {
            throw new Error('å§“å?ä¸å??ºç©º??);
        }

        // 3. ?·è??´æ–°
        return await this.userRepo.update(id, data);
    }

    /**
     * ?ªé™¤ä½¿ç”¨??(å¼·å?é©—è?)
     * @param id ä½¿ç”¨??ID
     */
    async deleteUser(id: string): Promise<boolean> {
        // 1. é©—è?è¦å?ï¼šæª¢?¥ä½¿?¨è€…æ˜¯?¦å???
        const existingUser = await this.userRepo.findById(id);
        if (!existingUser) {
            throw new Error(`?¾ä???ID ??${id} ?„ä½¿?¨è€…ï??¡æ??·è??ªé™¤?‚`);
        }

        // 2. ?åˆ¶ï¼šä??è¨±?ªé™¤ admin ?è¨­å¸³è? (?‡è¨­ admin account ?¯è?)
        if (existingUser.account === 'admin') {
            throw new Error('ç³»çµ±?è¨­ç®¡ç??¡å¸³?Ÿä??è¨±?ªé™¤??);
        }

        // 3. ?·è??ªé™¤
        return await this.userRepo.delete(id);
    }

    /**
     * ?é? ID ?–å?ä½¿ç”¨??
     */
    async getUserById(id: string) {
        return await this.userRepo.findById(id);
    }
}

export default UserService;
