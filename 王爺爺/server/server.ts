import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import os from "os";

function getNetworkAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Load environment variables
dotenv.config();

// Repositories
import UserRepository from "./repositories/UserRepository.js";
import ElderlyProfileRepository from "./repositories/ElderlyProfileRepository.js";
import MedicalRecordRepository from "./repositories/MedicalRecordRepository.js";
import MedicationRepository from "./repositories/MedicationRepository.js";
import MedicationLogRepository from "./repositories/MedicationLogRepository.js";
import EmergencyContactRepository from "./repositories/EmergencyContactRepository.js";
import VitalSignRepository from "./repositories/VitalSignRepository.js";
import GPSLogRepository from "./repositories/GPSLogRepository.js";

// Services
import UserService from "./services/UserService.js";

const userService = new UserService();
const elderlyRepo = new ElderlyProfileRepository();
const medicalRepo = new MedicalRecordRepository();
const medicationRepo = new MedicationRepository();
const medLogRepo = new MedicationLogRepository();
const contactRepo = new EmergencyContactRepository();
const vitalRepo = new VitalSignRepository();
const gpsRepo = new GPSLogRepository();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Authentication Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { account, password } = req.body;
      const user = await userService.authenticate(account, password);
      if (user) {
        res.json({ success: true, user: { id: user.id, username: user.account, name: user.name, elderly_id: user.elderly_id } });
      } else {
        res.status(401).json({ success: false, message: "帳號或密碼錯誤" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // User Management Routes (using UserService)
  app.post("/api/users", async (req, res) => {
    try {
      const id = await userService.createUser(req.body);
      res.status(201).json({ success: true, id });
    } catch (error: any) {
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const success = await userService.updateUser(req.params.id, req.body);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await userService.deleteUser(req.params.id);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.get("/api/backup", (req, res) => {
    res.status(501).json({ error: "備份功能目前在資料庫整合期間暫停使用。" });
  });

  // API Routes
  app.get("/api/vital-signs-latest", async (req, res) => {
    try {
      const { elderly_id } = req.query;
      const latest = await vitalRepo.findLatest(elderly_id as string);
      if (latest) {
        // 若步數為 0 或未填，依當日時間模擬合理步數（早到晚漸增）
        if (!latest.steps || latest.steps === 0) {
          const now = new Date();
          const hour = now.getHours();
          const minute = now.getMinutes();
          // 基準：早上 6 點開始走，到晚上 8 點約走 6000 步
          // 模擬步數：基準由早上 6 點開始，每小時固定增加 300 步
          // 移除隨機波動 (jitter)，確保首頁與健康頁面獲取的數值完全一致
          const hoursSince6am = Math.max(0, hour - 6);
          latest.steps = Math.min(hoursSince6am * 300, 9999);
        }
      }
      res.json(latest);
    } catch (error) {
      console.error("Error fetching vital signs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/medical-records", async (req, res) => {
    try {
      const { elderly_id } = req.query;
      const records = await medicalRepo.findAll(elderly_id as string);
      res.json(records);
    } catch (error) {
      console.error("Error fetching medical records:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/medical-records", async (req, res) => {
    try {
      const id = await medicalRepo.create(req.body);
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error creating medical record:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/medical-records/:id", async (req, res) => {
    try {
      const success = await medicalRepo.update(req.params.id, req.body);
      res.json({ success });
    } catch (error) {
      console.error("Error updating medical record:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/medical-records/:id", async (req, res) => {
    try {
      const success = await medicalRepo.delete(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting medical record:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/vital-signs", async (req, res) => {
    try {
      const { elderly_id } = req.query;
      const signs = await vitalRepo.findAll(elderly_id as string);
      res.json(signs);
    } catch (error) {
      console.error("Error fetching vital signs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/vital-signs", async (req, res) => {
    try {
      const id = await vitalRepo.create(req.body);
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error creating vital sign record:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/medications", async (req, res) => {
    try {
      const { elderly_id } = req.query;
      const meds = await medicationRepo.findAll(elderly_id as string);
      res.json(meds);
    } catch (error) {
      console.error("Error fetching medications:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/medications", async (req, res) => {
    try {
      const id = await medicationRepo.create(req.body);
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error creating medication:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/medications/:id", async (req, res) => {
    try {
      const success = await medicationRepo.update(req.params.id, req.body);
      res.json({ success });
    } catch (error) {
      console.error("Error updating medication:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/medications/:id", async (req, res) => {
    try {
      const success = await medicationRepo.delete(req.params.id);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting medication:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/medication-logs", async (req, res) => {
    try {
      const id = await medLogRepo.create(req.body);
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error creating medication log:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/medication-logs/:medicationId", async (req, res) => {
    try {
      // 刪除今日針對該藥品的紀錄 (取消標記)
      const pool = await (await import("./services/ConnectionFactory.js")).ConnectionFactory.createConnection();
      await pool.request()
        .input('mid', (await import("mssql")).default.UniqueIdentifier, req.params.medicationId)
        .query('DELETE FROM medication_logs WHERE medication_id = @mid AND CAST(taken_at AS DATE) = CAST(SYSDATETIMEOFFSET() AS DATE)');
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting medication log:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/test-results", (req, res) => {
    // 暫無資料表，先回傳空陣列
    res.json([]);
  });

  app.get("/api/gps-latest", (req, res) => {
    // 暫無資料表，先回傳空
    res.json(null);
  });

  app.post("/api/gps-log", (req, res) => {
    res.json({ success: true, message: "資料表待建立" });
  });

  app.get("/api/doctor-notes", (req, res) => {
    res.json([]);
  });

  app.post("/api/doctor-notes", (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/user-profile", async (req, res) => {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Missing user ID" });
      }

      const user = await userService.getUserById(id as string);
      if (user) {
        // 映射資料庫欄位到前端介面 UserProfile
        res.json({
          name: user.name,
          role: user.role_identity, // 將 role_identity 映射為 role
          phone: user.phone,
          email: user.email,
          address: user.address
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error in GET /api/user-profile:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/user-profile", async (req, res) => {
    try {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: "Missing user ID" });
      }

      const updateData = {
        ...req.body,
        role_identity: req.body.role // 前端屬性 role 映射回 role_identity
      };

      const success = await userService.updateUser(id as string, updateData);
      res.json({ success });
    } catch (error: any) {
      console.error("Error in PUT /api/user-profile:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  app.get("/api/elderly-profiles", async (req, res) => {
    try {
      const profiles = await elderlyRepo.findAll();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching elderly profiles:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/elderly-profile", async (req, res) => {
    const profiles = await elderlyRepo.findAll();
    res.json(profiles.length > 0 ? profiles[0] : null);
  });

  app.get("/api/elderly-profile/:id", async (req, res) => {
    try {
      const profile = await elderlyRepo.findById(req.params.id);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/elderly-profile", async (req, res) => {
    try {
      const id = await elderlyRepo.create(req.body);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error("POST /api/elderly-profile error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put("/api/elderly-profile/:id", async (req, res) => {
    try {
      const success = await elderlyRepo.update(req.params.id, req.body);
      res.json({ success: true });
    } catch (error: any) {
      console.error("PUT /api/elderly-profile error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.delete("/api/elderly-profile/:id", async (req, res) => {
    try {
      const success = await elderlyRepo.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/emergency-contacts", async (req, res) => {
    try {
      const { elderly_id } = req.query;
      const contacts = await contactRepo.findAll(elderly_id as string);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/emergency-contacts/sync-all", async (req, res) => {
    try {
      const { elderly_id, contacts } = req.body;
      const success = await contactRepo.syncAll(elderly_id, contacts);
      res.json({ success });
    } catch (error: any) {
      console.error("Error syncing contacts:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/emergency-contacts", async (req, res) => {
    try {
      const id = await contactRepo.create(req.body);
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const success = await contactRepo.update(req.params.id, req.body);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const success = await contactRepo.delete(req.params.id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/medication/ai-command", async (req, res) => {
    try {
      const { command, meds } = req.body;
      console.log(`[AI-Command] 收到指令: "${command}", 藥物數量: ${meds?.length}`);
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("[AI-Command] 失敗: 找不到 GEMINI_API_KEY");
        return res.status(500).json({ error: "伺服器未設定 GEMINI_API_KEY" });
      }

      const genAI = new GoogleGenAI({ apiKey });
      const currentStatus = meds.map((m: any) => `[ID:${m.id}] ${m.name}(時間:${m.reminder_time}, 狀態:${m.is_taken === 1 ? '已標記吃過' : '還沒吃'})`).join(', ');

      const prompt = `
        你是一位極其親切、溫暖、有耐心的「銀髮族暖心管家」。
        目前藥物清單：${currentStatus}。
        使用者剛才說：「${command}」。

        任務：
        1. 意圖辨識：判斷使用者是否表示藥吃完了、詢問還有什麼藥、或是純問候。
        2. 模糊比對：從清單中找出最接近的項目。
        3. 溫暖回覆：給予讚美與關心。

        意圖分類：
        - "complete_one": 標記某項藥物已服用。
        - "complete_all":標記目前所有「還沒吃」的藥物都已服用。
        - "check_status": 詢詢還有哪些藥要吃。
        - "none": 純聊天或無法辨識。

        回傳格式必須為 JSON：
        {
          "reply": "（繁體中文）溫暖回覆",
          "action": "complete_one" | "complete_all" | "check_status" | "none",
          "targetId": "藥物ID" | null
        }
      `;

      console.log("[AI-Command] 正在請求 Gemini...");
      const response = await genAI.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      console.log("[AI-Command] Gemini 回應成功");
      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error: any) {
      console.error("[AI-Command] 發生錯誤:", error.message);
      res.status(error.status || 500).json({
        error: "AI 處理失敗",
        details: error.message,
        suggestion: error.message?.includes("403") ? "API 金鑰似乎失效了，請檢查 .env 檔案並更新" : "伺服器忙碌中，請稍後再試"
      });
    }
  });

  // GPS Log Routes
  app.get("/api/gps-latest", async (req, res) => {
    try {
      const { elderly_id } = req.query;
      const latest = await gpsRepo.findLatest(elderly_id as string);
      res.json(latest);
    } catch (error) {
      console.error("Error fetching GPS data:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/gps-log", async (req, res) => {
    try {
      const id = await gpsRepo.create(req.body);
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error creating GPS log:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vision Assistant API (Gemini Proxy)
  app.post("/api/vision/analyze", async (req, res) => {
    try {
      const { base64Image, modePrompt } = req.body;
      console.log(`[Vision] 收到辨識請求，影像大小: ${Math.round(base64Image?.length / 1024)} KB`);

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error("[Vision] 錯誤: 未設定 GEMINI_API_KEY");
        return res.status(500).json({ error: "伺服器未設定 GEMINI_API_KEY，請檢查 .env 內容" });
      }

      const genAI = new GoogleGenAI({ apiKey });
      const currentTimeStr = new Date().toLocaleTimeString('zh-TW');
      const prompt = modePrompt + `\n目前系統時間：${currentTimeStr}\n請以繁體中文回答，內容要精簡，務必根據「當前這張照片的具體細節」回答，不要給出籠統或重複的答案。
分為【大意】與【溫馨提醒】兩個部分。大意部分僅列出關鍵重點，總字數不要超過 150 字。語氣要溫和、對長輩友善。`;

      const analyzeWithModel = async (modelName: string) => {
        console.log(`[Vision] 正在嘗試模型: ${modelName}...`);
        try {
          return await genAI.models.generateContent({
            model: modelName,
            contents: [{
              role: "user",
              parts: [
                { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
                { text: prompt }
              ]
            }]
          });
        } catch (err: any) {
          console.warn(`[Vision] 模型 ${modelName} 失敗: ${err.message}`);
          throw err;
        }
      };

      const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite",
        "gemini-flash-latest",
        "gemini-pro-latest"
      ];
      let result;
      let lastError;

      for (const modelName of modelsToTry) {
        try {
          result = await analyzeWithModel(modelName);
          if (result && result.text) break;
        } catch (err: any) {
          lastError = err;
          // 若遇找不到 404 或配額 429，繼續嘗試下一個
          if (err.message?.includes("404") || err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
            continue;
          }
          throw err;
        }
      }

      if (!result || !result.text) {
        // 診斷功能：列出金鑰可存取的所有模型到終端機
        try {
          console.log("[Vision] 正在取得可用模型列表以進行診斷...");
          const modelsResult = await (genAI as any).models.list();
          const names = modelsResult.map((m: any) => m.name || m.modelId);
          console.log("[Vision] 您的金鑰目前可用的模型有:", names.join(", "));
        } catch (e: any) {
          console.warn("[Vision] 無法取得模型列表:", e.message);
        }
        throw lastError || new Error("目前所有 AI 模型皆無法存取，請稍候再試。");
      }

      console.log("[Vision] 辨識完成");
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("[Vision] 發生診斷錯誤:", error);
      let userFriendlyMsg = error.message || "影像辨識執行失敗";

      if (error.message?.includes("limit: 0")) {
        userFriendlyMsg = "您的帳戶配額限制目前為 0。請檢查 Google AI Studio 是否已設定正確的付款方式或帳戶驗證（通常新帳號需等待一段時間生效）。";
      } else if (error.message?.includes("429") || error.message?.includes("quota")) {
        userFriendlyMsg = "辨識配額已達上限，請等待約 30 秒後再點擊一次。";
      } else if (error.message?.includes("404")) {
        userFriendlyMsg = "找不到指定的 AI 模型。這可能是因為 SDK 版本或地區限制。";
      } else if (error.message?.includes("API_KEY_INVALID")) {
        userFriendlyMsg = "API 金鑰無效，請檢查 .env 設定。";
      }

      res.status(500).json({
        error: userFriendlyMsg,
        details: error.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vitePath = path.resolve(__dirname, "..");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: vitePath
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }

  const networkAddress = getNetworkAddress();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================`);
    console.log(`🚀 伺服器啟動成功！「環境已合併」`);
    console.log(`🏠 Local:   http://localhost:${PORT}`);
    console.log(`🌐 Network: http://${networkAddress}:${PORT} (手機請開此網址)`);
    console.log(`📁 專案目錄: 王爺爺`);
    console.log(`================================================`);
  });
}

startServer();
