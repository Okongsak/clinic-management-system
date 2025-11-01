import { useState, useEffect } from 'react';
import { Plus, Edit2, Eye, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../services/useAuth';
import { getAppointments, deleteAppointment } from '../services/services';
import type { Appointment } from '../services/services';
import { format } from 'date-fns';
import AppointmentModal from '../components/AppointmentModal';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  const canCreateDelete = user?.role === 'RECEPTION' || user?.role === 'ADMIN';
  const canModify = user?.role === 'RECEPTION' || user?.role === 'ADMIN';
  const isClinician = user?.role === 'CLINICIAN';

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedAppointment(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleView = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalMode('view');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบนัดหมายนี้หรือไม่?',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      try {
        await deleteAppointment(id);
        Swal.fire({
          icon: 'success',
          title: 'ลบนัดหมายสำเร็จ',
          confirmButtonText: 'ตกลง'
        });
        fetchAppointments();
      } catch (error) {
        console.error('Error deleting appointment:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาดในการลบนัดหมาย',
          confirmButtonText: 'ตกลง'
        });
      }
    }
  };


  const handleModalClose = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    fetchAppointments();
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
    };
    const labels = {
      PENDING: 'รอดำเนินการ',
      COMPLETED: 'เสร็จสิ้น',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">การนัดหมาย</h1>
        {canCreateDelete && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus />
            สร้างนัดหมายใหม่
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  รหัสนัด
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  ผู้ป่วย
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  แพทย์
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  วันที่-เวลา
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {appointment.recordNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {appointment.clinician.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{format(new Date(appointment.startTime), 'dd/MM/yyyy')}</div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(appointment.startTime), 'HH:mm')} - {format(new Date(appointment.endTime), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(appointment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(appointment)}
                        className="text-blue-600 hover:text-blue-800"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={18} />
                      </button>
                      {(canModify || (isClinician && appointment.clinicianId === user.id)) && (
                        <button
                          onClick={() => handleEdit(appointment)}
                          className="text-green-600 hover:text-green-800"
                          title="แก้ไข"
                        >
                          <Edit2 size={18} />
                        </button>
                      )}
                      {canCreateDelete && (
                        <button
                          onClick={() => handleDelete(appointment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {appointments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ไม่มีข้อมูลการนัดหมาย
          </div>
        )}
      </div>

      {showModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          mode={modalMode}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default Appointments;