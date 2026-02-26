import UserRepository from '../repositories/UserRepository';

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
     * 建立使用者
     * @param data 使用者資料
     * @returns 新增的使用者 ID
     */
    async createUser(data: any): Promise<string> {
        // 基礎行為驗證
        if (!data.account || !data.password || !data.name) {
            throw new Error('帳號、密碼與姓名為必填欄位');
        }

        // 呼叫 Repository 執行寫入
        const insertedId = await this.userRepo.create(data);
        return insertedId;
    }

    /**
     * 修改使用者 (強化驗證)
     * @param id 使用者 ID
     * @param data 更新資料
     */
    async updateUser(id: string, data: any): Promise<boolean> {
        // 1. 驗證規則：檢查使用者是否存在
        const existingUser = await this.userRepo.findById(id);
        if (!existingUser) {
            throw new Error(`找不到 ID 為 ${id} 的使用者，無法執行更新。`);
        }

        // 2. 欄位驗證 (不允許清空關鍵欄位)
        if (data.name === '') {
            throw new Error('姓名不得為空值');
        }

        // 3. 執行更新
        return await this.userRepo.update(id, data);
    }

    /**
     * 刪除使用者 (強化驗證)
     * @param id 使用者 ID
     */
    async deleteUser(id: string): Promise<boolean> {
        // 1. 驗證規則：檢查使用者是否存在
        const existingUser = await this.userRepo.findById(id);
        if (!existingUser) {
            throw new Error(`找不到 ID 為 ${id} 的使用者，無法執行刪除。`);
        }

        // 2. 限制：不允許刪除 admin 預設帳號 (假設 admin account 唯讀)
        if (existingUser.account === 'admin') {
            throw new Error('系統預設管理員帳號不允許刪除。');
        }

        // 3. 執行刪除
        return await this.userRepo.delete(id);
    }

    /**
     * 透過 ID 取得使用者
     */
    async getUserById(id: string) {
        return await this.userRepo.findById(id);
    }
}

export default UserService;
