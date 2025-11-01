import express from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { generateRecordNumber } from "../utils/recordNumber";

const router = express.Router();
const prisma = new PrismaClient(); // สร้าง Prisma client สำหรับเชื่อมต่อฐานข้อมูล

// GET appointments
// ดึงรายการนัดหมายทั้งหมด (role-based filtering)
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    let whereClause: Prisma.AppointmentWhereInput = {};

    // CLINICIAN: จะเห็นเฉพาะนัดหมายของตัวเอง
    if (user.role === "CLINICIAN") {
      whereClause.clinicianId = user.id;
    }
    // RECEPTION, ADMIN: จะเห็นทั้งหมด

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        clinician: {
          select: { id: true, username: true, role: true },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET appointments by id
// ดึงนัดหมายเดียวตาม id
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
        clinician: {
          select: { id: true, username: true, role: true },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Clinician: เห็นเฉพาะของตัวเอง
    if (user.role === "CLINICIAN" && appointment.clinicianId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    // Admin/Reception: เห็นทุกนัด

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ตรวจสอบว่าเวลานัดใหม่ชนกับนัดเดิมของ clinician หรือไม่
async function hasConflict(
  clinicianId: number,
  startTime: Date,
  endTime: Date,
  excludeId?: number
): Promise<boolean> {
  const conflicts = await prisma.appointment.findMany({
    where: {
      clinicianId,
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        // startTime, endTime: เวลาของนัดใหม่
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        // New appointment ends during existing appointment
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
        },
        // excludeId: ถ้าเป็น update ให้ข้าม id ของนัดเดิม
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
  });

  return conflicts.length > 0;
}

// สร้างนัดหมายใหม่ (เฉพาะ RECEPTION และ ADMIN)
router.post(
  "/",
  authenticate,
  authorize("RECEPTION", "ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const { clinicianId, patientId, startTime, endTime, note } = req.body;

      // ตรวจสอบข้อมูลครบถ้วน
      if (!clinicianId || !patientId || !startTime || !endTime) {
        return res.status(400).json({
          error: "Required fields: clinicianId, patientId, startTime, endTime",
        });
      }

      // ตรวจสอบเวลา start/end
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (end <= start) {
        return res
          .status(400)
          .json({ error: "End time must be after start time" });
      }

      // ตรวจสอบ clinician ถูกต้องและ role เป็น CLINICIAN
      const clinician = await prisma.user.findUnique({
        where: { id: parseInt(clinicianId) },
      });

      if (!clinician || clinician.role !== "CLINICIAN") {
        return res.status(400).json({ error: "Invalid clinician" });
      }

      // ตรวจสอบเวลาไม่ชนกับนัดเดิม
      const conflict = await hasConflict(parseInt(clinicianId), start, end);
      if (conflict) {
        return res.status(409).json({
          error: "Appointment time conflicts with existing appointment",
        });
      }

      // สร้าง recordNumber อัตโนมัติ
      const recordNumber = await generateRecordNumber("appointment");

      const appointment = await prisma.appointment.create({
        data: {
          recordNumber,
          clinicianId: parseInt(clinicianId),
          createdById: req.user!.id,
          patientId: parseInt(patientId),
          startTime: start,
          endTime: end,
          note,
        },
        include: {
          patient: true,
          clinician: {
            select: { id: true, username: true, role: true },
          },
          createdBy: {
            select: { id: true, username: true, role: true },
          },
        },
      });

      res.status(201).json(appointment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// แก้ไขนัดหมาย
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    let updateData: Prisma.AppointmentUpdateInput = {};

    // RECEPTION / ADMIN: แก้ข้อมูลทั่วไป (clinician, patient, note, start/end)
    if (user.role === "RECEPTION" || user.role === "ADMIN") {
      const { clinicianId, patientId, startTime, endTime, note } = req.body;

      if (startTime || endTime) {
        const start = startTime ? new Date(startTime) : appointment.startTime;
        const end = endTime ? new Date(endTime) : appointment.endTime;

        if (end <= start) {
          return res
            .status(400)
            .json({ error: "End time must be after start time" });
        }

        const newClinicianId = clinicianId
          ? parseInt(clinicianId)
          : appointment.clinicianId;
        const conflict = await hasConflict(
          newClinicianId,
          start,
          end,
          appointment.id
        );
        if (conflict) {
          return res.status(409).json({
            error: "Appointment time conflicts with existing appointment",
          });
        }

        updateData.startTime = start;
        updateData.endTime = end;
      }

      if (clinicianId !== undefined) {
        updateData.clinician = { connect: { id: parseInt(clinicianId) } };
      }
      if (patientId !== undefined) {
        updateData.patient = { connect: { id: parseInt(patientId) } };
      }
      if (note !== undefined) {
        updateData.note = note;
      }
    }

    // CLINICIAN: แก้ status และ clinicianNote ของนัดตัวเอง
    if (user.role === "CLINICIAN") {
      if (appointment.clinicianId !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { status, clinicianNote } = req.body;

      if (status !== undefined) {
        if (!["PENDING", "COMPLETED"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }
        updateData.status = status;
      }
      if (clinicianNote !== undefined) {
        updateData.clinicianNote = clinicianNote;
      }
    }

    // update appointment เข้า DB
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        patient: true,
        clinician: {
          select: { id: true, username: true, role: true },
        },
        createdBy: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ลบนัดหมาย (Admin เท่านั้น)
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      await prisma.appointment.delete({
        where: { id: parseInt(id) },
      });

      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
