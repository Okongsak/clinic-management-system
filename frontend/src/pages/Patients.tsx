import { useState, useEffect } from 'react';
import { Plus, Edit2, Eye, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../services/useAuth';
import { getPatients, deletePatient } from '../services/services';
import type { Patient } from '../services/services';
import { format } from 'date-fns';
import PatientModal from '../components/PatientModal';

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  const canModify = user?.role === 'RECEPTION' || user?.role === 'ADMIN';
  const canDelete = user?.role === 'ADMIN';

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await getPatients();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPatient(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalMode('view');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'คุณแน่ใจหรือไม่?',
      text: 'คุณต้องการลบผู้ป่วยนี้หรือไม่?',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    });

    if (!result.isConfirmed) {
      try {
        await deletePatient(id);
        Swal.fire({
          icon: 'success',
          title: 'ลบผู้ป่วยสำเร็จ',
          confirmButtonText: 'ตกลง'
        });
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาดในการลบผู้ป่วย',
          confirmButtonText: 'ตกลง'
        });
      }
    };
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedPatient(null);
    fetchPatients();
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
        <h1 className="text-2xl font-bold text-gray-900">ข้อมูลผู้ป่วย</h1>
        {canModify && (
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus />
            เพิ่มผู้ป่วยใหม่
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  รหัสผู้ป่วย
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  ชื่อ-นามสกุล
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  เบอร์โทรศัพท์
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  อีเมล
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  เพศ
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  วันเกิด
                </th>
                <th className="px-6 py-3 text-left text-md font-bold text-black-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {patient.recordNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.gender}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(patient)}
                        className="text-blue-600 hover:text-blue-800"
                        title="ดูรายละเอียด"
                      >
                        <Eye size={16} />
                      </button>
                      {canModify && (
                        <button
                          type="button"
                          onClick={() => handleEdit(patient)}
                          className="text-green-600 hover:text-green-800"
                          title="แก้ไข"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(patient.id)}
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

        {patients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            ไม่มีข้อมูลผู้ป่วย
          </div>
        )}
      </div>

      {showModal && (
        <PatientModal
          patient={selectedPatient}
          mode={modalMode}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

export default Patients;