import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { generateRecordNumber } from '../utils/recordNumber';

const router = express.Router();
const prisma = new PrismaClient(); // สร้าง Prisma client สำหรับเชื่อมต่อฐานข้อมูล

// Get all patients
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single patient
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(id) },
      include: {
        appointments: {
          include: {
            clinician: {
              select: { id: true, username: true, role: true }
            }
          },
          orderBy: { startTime: 'desc' }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create patient (Reception and Admin only)
router.post('/', authenticate, authorize('RECEPTION', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, gender, dateOfBirth, allergies, medicalHistory, currentMedications } = req.body;

    // Validation
    if (!firstName || !lastName || !gender || !dateOfBirth) {
      return res.status(400).json({ error: 'Required fields: firstName, lastName, gender, dateOfBirth' });
    }

    // Generate record number
    const recordNumber = await generateRecordNumber('patient');

    const patient = await prisma.patient.create({
      data: {
        recordNumber,
        firstName,
        lastName,
        email,
        phoneNumber,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        allergies,
        medicalHistory,
        currentMedications
      }
    });

    res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update patient (Reception and Admin only)
router.put('/:id', authenticate, authorize('RECEPTION', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, gender, dateOfBirth, allergies, medicalHistory, currentMedications } = req.body;

    const patient = await prisma.patient.update({
      where: { id: parseInt(id) },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        allergies,
        medicalHistory,
        currentMedications
      }
    });

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete patient (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.patient.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;