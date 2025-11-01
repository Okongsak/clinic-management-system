import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient(); // สร้าง Prisma client สำหรับเชื่อมต่อฐานข้อมูล

// Get all clinicians (for appointment)
router.get('/clinicians', authenticate, async (req: AuthRequest, res) => {
  try {
    const clinicians = await prisma.user.findMany({
      where: { role: 'CLINICIAN' },
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    res.json(clinicians);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;