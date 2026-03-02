import UserRepository from '../repositories/UserRepository.js';

export class UserService {
    private userRepo: UserRepository;

    constructor() {
        this.userRepo = new UserRepository();
    }

    /**
     * 驗證使用者登入
     * @param account 帳號
     * @param password 密碼
     */
    async authenticate(account: string, password: string): Promise<any | null> {
        return await this.userRepo.findByCredentials(account, password);
    }

    /**
     * 創建使用者
     * @param data 使用者資料
     * @returns 新增的使用者 ID
     */
    async createUser(data: any): Promise<string> {
        // 基本資料驗證
        if (!data.account || !data.password || !data.name) {
            throw new Error('帳號、密碼及名稱為必填項目');
        }

        // 呼叫 Repository 執行寫入
        const insertedId = await this.userRepo.create(data);
        return insertedId;
    }

    /**
     * 更新使用者 (基本驗證)
     * @param id 使用者 ID
     * @param data 更新資料
     */
    async updateUser(id: string, data: any): Promise<boolean> {
        // 1. 驗證邏輯：檢查使用者是否存在
        const existingUser = await this.userRepo.findById(id);
        if (!existingUser) {
            throw new Error(`找不到 ID 為 ${id} 的使用者，無法執行更新`);
        }

        // 2. 欄位驗證 (不允許名稱為空值)
        if (data.name === '') {
            throw new Error('名稱不能為空字串');
        }

        // 3. 執行更新
        return await this.userRepo.update(id, data);
    }

    /**
     * 刪除使用者 (基本驗證)
     * @param id 使用者 ID
     */
    async deleteUser(id: string): Promise<boolean> {
        // 1. 驗證邏輯：檢查使用者是否存在
        const existingUser = await this.userRepo.findById(id);
        if (!existingUser) {
            throw new Error(`找不到 ID 為 ${id} 的使用者，無法執行刪除`);
        }

        // 2. 安全限制：不允許刪除 admin 預設帳號
        if (existingUser.account === 'admin') {
            throw new Error('系統預設管理員帳號不允許刪除');
        }

        // 3. 執行刪除
        return await this.userRepo.delete(id);
    }

    /**
     * 根據 ID 獲取使用者
     */
    async getUserById(id: string) {
        return await this.userRepo.findById(id);
    }

    /**
     * 關聯使用者與其照護的長輩
     */
    async linkElderlyId(userId: string, elderlyId: string) {
        return await this.userRepo.updateElderlyId(userId, elderlyId);
    }
}

export default UserService;
