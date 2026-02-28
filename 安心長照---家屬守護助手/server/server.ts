import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Authentication Routes
  app.post("/api/login", async (req, res) => {
    try {
      const { account, password } = req.body;
      const user = await userService.authenticate(account, password);
      if (user) {
        res.json({ success: true, user: { id: user.id, username: user.account, name: user.name } });
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

  app.get("/api/test-results", (req, res) => {
    // 暫無資料表，先回傳空陣列
    res.json([]);
  });

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
      const { associated_user_id, ...elderlyData } = req.body;
      const id = await elderlyRepo.create({ ...elderlyData, guardian_id: associated_user_id });

      // 如果有提供關聯的使用者 ID，則更新使用者的 elderly_id (保留相容性)
      if (associated_user_id) {
        await userService.linkElderlyId(associated_user_id, id);
      }

      res.json({ success: true, id });
    } catch (error: any) {
      console.error("POST /api/elderly-profile error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.put("/api/elderly-profile/:id", async (req, res) => {
    try {
      const { associated_user_id, ...updateData } = req.body;
      const success = await elderlyRepo.update(req.params.id, { ...updateData, guardian_id: associated_user_id });
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

  app.post("/api/emergency-contacts/update-orders", async (req, res) => {
    try {
      const { orders } = req.body;
      const success = await contactRepo.updateOrders(orders);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`================================================`);
    console.log(`🚀 伺服器啟動成功！「環境已合併」`);
    console.log(`🌐 前端網址與 API 皆在: http://localhost:${PORT}`);
    console.log(`📁 專案目錄: 安心長照---家屬守護助手`);
    console.log(`================================================`);
  });
}

startServer();
