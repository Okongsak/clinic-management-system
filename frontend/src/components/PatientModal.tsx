import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Swal from 'sweetalert2';
import { createPatient, updatePatient } from '../services/services';
import type { Patient } from '../services/services';
import { format } from 'date-fns';

interface PatientModalProps {
  patient: Patient | null;
  mode: 'create' | 'edit' | 'view';
  onClose: () => void;
}

const PatientModal = ({ patient, mode, onClose }: PatientModalProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'Male',
    dateOfBirth: '',
    allergies: '',
    medicalHistory: '',
    currentMedications: ''
  });
  const [loading, setLoading] = useState(false);

  const isReadOnly = mode === 'view';

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        gender: patient.gender,
        dateOfBirth: format(new Date(patient.dateOfBirth), 'yyyy-MM-dd'),
        allergies: patient.allergies || '',
        medicalHistory: patient.medicalHistory || '',
        currentMedications: patient.currentMedications || ''
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // เช็ค email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: 'warning',
        title: 'รูปแบบอีเมลไม่ถูกต้อง',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    setLoading(true);

    try {
      if (mode === 'create') {
        await createPatient(formData);
        await Swal.fire({
          icon: 'success',
          title: 'เพิ่มผู้ป่วยสำเร็จ',
          confirmButtonText: 'ตกลง'
        });
      } else if (mode === 'edit' && patient) {
        await updatePatient(patient.id, formData);
        await Swal.fire({
          icon: 'success',
          title: 'แก้ไขข้อมูลผู้ป่วยสำเร็จ',
          confirmButtonText: 'ตกลง'
        });
      }
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.response?.data?.error || 'ไม่สามารถบันทึกผู้ป่วยได้',
        confirmButtonText: 'ตกลง'
      });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'create') return 'เพิ่มผู้ป่วยใหม่';
    if (mode === 'edit') return 'แก้ไขข้อมูลผู้ป่วย';
    return 'รายละเอียดผู้ป่วย';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {patient && mode === 'view' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>รหัสผู้ป่วย:</strong> {patient.recordNumber}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เพศ <span className="text-red-500">*</span>
              </label>
              <select
                required
                disabled={isReadOnly}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="Male">ชาย</option>
                <option value="Female">หญิง</option>
                <option value="Other">อื่นๆ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันเกิด <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isReadOnly}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              อาการแพ้
            </label>
            <textarea
              disabled={isReadOnly}
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ประวัติการรักษา
            </label>
            <textarea
              disabled={isReadOnly}
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ยาที่ใช้ในปัจจุบัน
            </label>
            <textarea
              disabled={isReadOnly}
              value={formData.currentMedications}
              onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {isReadOnly ? 'ปิด' : 'ยกเลิก'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default PatientModal;