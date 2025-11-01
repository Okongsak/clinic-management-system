import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../services/useAuth';
import { createAppointment, updateAppointment, getPatients, getClinicians } from '../services/services';
import type { Appointment, Patient, User } from '../services/services';
import { format } from 'date-fns';

interface AppointmentModalProps {
    appointment: Appointment | null;
    mode: 'create' | 'edit' | 'view';
    onClose: () => void;
}

const AppointmentModal = ({ appointment, mode, onClose }: AppointmentModalProps) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        patientId: '',
        clinicianId: '',
        startDate: '',
        startTime: '',
        endTime: '',
        note: '',
        status: 'PENDING',
        clinicianNote: ''
    });
    const [patients, setPatients] = useState<Patient[]>([]);
    const [clinicians, setClinicians] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [conflictWarning, setConflictWarning] = useState('');

    const isReadOnly = mode === 'view';
    const isClinician = user?.role === 'CLINICIAN';
    const canModifyDetails = user?.role === 'RECEPTION' || user?.role === 'ADMIN';

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (appointment) {
            const startDate = new Date(appointment.startTime);
            const endDate = new Date(appointment.endTime);

            setFormData({
                patientId: appointment.patientId.toString(),
                clinicianId: appointment.clinicianId.toString(),
                startDate: format(startDate, 'yyyy-MM-dd'),
                startTime: format(startDate, 'HH:mm'),
                endTime: format(endDate, 'HH:mm'),
                note: appointment.note || '',
                status: appointment.status,
                clinicianNote: appointment.clinicianNote || ''
            });
        }
    }, [appointment]);

    const fetchData = async () => {
        try {
            const [patientsRes, cliniciansRes] = await Promise.all([
                getPatients(),
                getClinicians()
            ]);
            setPatients(patientsRes.data);
            setClinicians(cliniciansRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const checkConflict = useCallback(() => {
        if (!formData.clinicianId || !formData.startDate || !formData.startTime || !formData.endTime) {
            return;
        }

        const start = new Date(`${formData.startDate}T${formData.startTime}`);
        const end = new Date(`${formData.startDate}T${formData.endTime}`);

        if (end <= start) {
            setConflictWarning('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
        } else {
            setConflictWarning('');
        }
    }, [formData.clinicianId, formData.startDate, formData.startTime, formData.endTime]);

    useEffect(() => {
        checkConflict();
    }, [checkConflict]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
            const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

            if (mode === 'create') {
                await createAppointment({
                    patientId: parseInt(formData.patientId),
                    clinicianId: parseInt(formData.clinicianId),
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    note: formData.note
                });
                await Swal.fire({
                    icon: 'success',
                    title: 'สร้างนัดหมายสำเร็จ',
                    confirmButtonText: 'ตกลง'
                });
            } else if (mode === 'edit' && appointment) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updateData: any = {};

                if (canModifyDetails) {
                    updateData.patientId = parseInt(formData.patientId);
                    updateData.clinicianId = parseInt(formData.clinicianId);
                    updateData.startTime = startDateTime.toISOString();
                    updateData.endTime = endDateTime.toISOString();
                    updateData.note = formData.note;
                }

                if (isClinician) {
                    updateData.status = formData.status;
                    updateData.clinicianNote = formData.clinicianNote;
                }

                await updateAppointment(appointment.id, updateData);
                await Swal.fire({
                    icon: 'success',
                    title: 'แก้ไขนัดหมายสำเร็จ',
                    confirmButtonText: 'ตกลง'
                });
            }

            onClose();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.response?.data?.error || 'ไม่สามารถบันทึกนัดหมายได้',
                confirmButtonText: 'ตกลง'
            });
        } finally {
            setLoading(false);
        }
    };


    const getTitle = () => {
        if (mode === 'create') return 'สร้างนัดหมายใหม่';
        if (mode === 'edit') return 'แก้ไขการนัดหมาย';
        return 'รายละเอียดการนัดหมาย';
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

                    {conflictWarning && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex items-start gap-2">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{conflictWarning}</span>
                        </div>
                    )}

                    {appointment && mode === 'view' && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <div className="text-sm text-blue-800">
                                <strong>รหัสนัดหมาย:</strong> {appointment.recordNumber}
                            </div>
                        </div>
                    )}

                    {/* Patient Selection - only for creation and reception/admin */}
                    {(mode === 'create' || (mode === 'edit' && canModifyDetails)) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ผู้ป่วย <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.patientId}
                                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">เลือกผู้ป่วย</option>
                                {patients.map((patient) => (
                                    <option key={patient.id} value={patient.id}>
                                        {patient.recordNumber} - {patient.firstName} {patient.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {mode === 'view' && appointment && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ผู้ป่วย</label>
                            <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                {appointment.patient.recordNumber} - {appointment.patient.firstName} {appointment.patient.lastName}
                            </div>
                        </div>
                    )}

                    {/* Clinician Selection */}
                    {(mode === 'create' || (mode === 'edit' && canModifyDetails)) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                แพทย์ <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.clinicianId}
                                onChange={(e) => setFormData({ ...formData, clinicianId: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">เลือกแพทย์</option>
                                {clinicians.map((clinician) => (
                                    <option key={clinician.id} value={clinician.id}>
                                        {clinician.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {mode === 'view' && appointment && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">แพทย์</label>
                            <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                {appointment.clinician.username}
                            </div>
                        </div>
                    )}

                    {/* Date and Time */}
                    {(mode === 'create' || (mode === 'edit' && canModifyDetails)) && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    วันที่ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        เวลาเริ่มต้น <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        เวลาสิ้นสุด <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {mode === 'view' && appointment && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่-เวลา</label>
                                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                    {format(new Date(appointment.startTime), 'dd/MM/yyyy HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Reception Note */}
                    {(mode === 'create' || (mode === 'edit' && canModifyDetails) || (mode === 'view' && appointment?.note)) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                หมายเหตุ (เจ้าหน้าที่)
                            </label>
                            <textarea
                                disabled={isReadOnly || !canModifyDetails}
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            />
                        </div>
                    )}

                    {/* Clinician Status and Note */}
                    {(mode === 'edit' && isClinician) && (
                        <>
                            {/* Status select */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="PENDING">รอดำเนินการ</option>
                                    <option value="COMPLETED">เสร็จสิ้น</option>
                                </select>
                            </div>

                            {/* Clinician Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">บันทึกของแพทย์</label>
                                <textarea
                                    value={formData.clinicianNote}
                                    onChange={(e) => setFormData({ ...formData, clinicianNote: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="บันทึกผลการตรวจ, การวินิจฉัย, และคำแนะนำ..."
                                />
                            </div>
                        </>
                    )}

                    {mode === 'view' && appointment && (
                        <>
                            {/* Status display */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
                                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                    {formData.status === 'PENDING' ? 'รอดำเนินการ' : 'เสร็จสิ้น'}
                                </div>
                            </div>

                            {/* Clinician Note display */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">บันทึกของแพทย์</label>
                                <textarea
                                    disabled
                                    value={formData.clinicianNote}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                                />
                            </div>
                        </>
                    )}

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
                                disabled={loading || !!conflictWarning}
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

export default AppointmentModal;