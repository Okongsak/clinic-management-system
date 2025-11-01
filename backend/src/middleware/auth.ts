import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

// Custom Request Interface
// ขยาย Request ของ Express ให้มี property `user` เพื่อเก็บข้อมูลผู้ใช้หลังจากตรวจสอบ token แล้ว
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: Role; // role ของผู้ใช้: ADMIN / CLINICIAN / RECEPTION
  };
}

// Middleware: authenticate
// ตรวจสอบ JWT token ที่ client ส่งมา ถ้า token ถูกต้อง จะเพิ่ม `req.user` เพื่อให้ route ต่อไปใช้ข้อมูลผู้ใช้ได้
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // ดึง token จาก header Authorization (รูปแบบ: "Bearer <token>")
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // ถ้าไม่มี token ให้ตอบ 401 Unauthorized
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // ตรวจสอบความถูกต้องของ token ด้วย JWT_SECRET
    // ถ้า valid จะได้ข้อมูล payload กลับมา
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      username: string;
      email: string;
      role: Role;
    };

    // เก็บข้อมูลผู้ใช้ใน request เพื่อให้ route ถัดไปเข้าถึงได้
    req.user = decoded;

    // ไปต่อ middleware หรือ route handler ถัดไป
    next();
  } catch (error) {
    // ถ้า token ไม่ถูกต้อง หรือหมดอายุ ตอบ 401 Unauthorized
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware: authorize
// ตรวจสอบสิทธิ์ผู้ใช้ตาม role โดยใช้งานร่วมกับ authenticate เช่น authorize(Role.ADMIN) เฉพาะผู้ใช้ ADMIN เท่านั้นถึงเข้าถึง route ได้
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // ถ้ายังไม่มี user (authenticate ไม่ผ่าน) ตอบ 401 Unauthorized
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // ตรวจสอบ role ของผู้ใช้
    // ถ้า role ของ user ไม่อยู่ใน roles ที่กำหนด ตอบ 403 Forbidden
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // ถ้า role ถูกต้อง ให้ไปต่อ route handler ถัดไป
    next();
  };
};
