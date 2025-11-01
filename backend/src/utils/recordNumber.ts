import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // สร้าง Prisma client สำหรับเชื่อมต่อฐานข้อมูล

// ฟังก์ชันแบบ async คืนค่าเป็น Promise<string>
// รับ parameter type เพื่อบอกว่าจะสร้างรหัสของ patient หรือ appointment
export async function generateRecordNumber(type: 'patient' | 'appointment'): Promise<string> {
  /* กำหนด prefix สำหรับรหัส เช่น PAT สำหรับผู้ป่วย, APT สำหรับนัดหมาย
  กำหนด ชื่อ counter ในตาราง Counter เช่น patient_counter หรือ appointment_counter */
  const prefix = type === 'patient' ? 'PAT' : 'APT';
  const counterName = type === 'patient' ? 'patient_counter' : 'appointment_counter';

  // ใช้ transaction เพื่อให้การเพิ่ม counter เป็น atomic คือถ้ามีคนเรียกพร้อมกัน ไม่เกิดเลขซ้ำ
  const result = await prisma.$transaction(async (tx) => {
    // ตรวจสอบว่ามี counter สำหรับ type นั้นในฐานข้อมูลหรือยัง ถ้าไม่มี สร้างใหม่เริ่มต้น value = 0
    let counter = await tx.counter.findUnique({
      where: { name: counterName }
    });

    if (!counter) {
      counter = await tx.counter.create({
        data: {
          name: counterName,
          value: 0
        }
      });
    }

    // เพิ่มค่า counter ทีละ 1 (increment: 1) คืนค่าเป็นตัวเลขใหม่หลังจาก increment
    const updatedCounter = await tx.counter.update({
      where: { name: counterName },
      data: { value: { increment: 1 } }
    });

    return updatedCounter.value;
  });

  // แปลงตัวเลขเป็น string และเติม leading zeros ให้ครบ 3 หลัก รวมกับ prefix คืนค่าเป็นรหัส เช่น PAT-001, APT-002
  const formattedNumber = result.toString().padStart(3, '0');
  return `${prefix}-${formattedNumber}`;
}