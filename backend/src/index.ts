import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import appointmentRoutes from './routes/appointments';
import userRoutes from './routes/users';

// โหลดค่าตัวแปรจากไฟล์ .env มาไว้ใน process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // กำหนด port สำหรับรันเซิร์ฟเวอร์

// Middleware
// เปิดใช้งาน CORS (Cross-Origin Resource Sharing)
// เพื่อให้ frontend ที่อยู่คนละ origin สามารถเรียก API จาก backend ได้
app.use(cors({
  origin: 'http://localhost:5173',  // ต้นทางที่อนุญาตให้เข้าถึง API
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // เมธอดที่อนุญาต
  credentials: true                 // อนุญาตให้ส่ง cookie / header authentication มาด้วย
}));

// แปลงข้อมูล JSON ที่ส่งมาจาก request body ให้เป็น object ใน req.body
app.use(express.json());

// Routeระบบ Auth (register / login / reset password)
app.use('/api/auth', authRoutes);

// Routeการจัดการผู้ป่วย (Patients)
app.use('/api/patients', patientRoutes);

// Routeการจัดการนัดหมาย (Appointments)
app.use('/api/appointments', appointmentRoutes);

// Routeการจัดการผู้ใช้ (Users)
app.use('/api/users', userRoutes);

// ใช้สำหรับตรวจสอบว่า server ยังทำงานอยู่ไหม
// ตัวอย่าง: ถ้าเข้า /health แล้วได้ {"status": "ok"} แปลว่า server ยังปกติ
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// จัดการ error ทั้งหมดที่เกิดขึ้นในระบบ
// ถ้ามี error จาก route ไหน ๆ แล้วไม่ได้ถูกจับ จะมาถึงที่นี่
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack); // แสดง stack trace ใน console เพื่อ debug
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error' // ส่งข้อความ error กลับให้ client
  });
});

// เริ่มต้นรัน Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
