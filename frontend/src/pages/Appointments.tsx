import { useState, useEffect } from 'react';
import { Plus, Edit2, Eye, Trash2, X, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import DataTable from "react-data-table-component";
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
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  // Filter state
  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  // Permission flags
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

  const handleCreateAppointments = () => {
    setSelectedAppointment(null);
    setModalMode('create');
    setShowAppointmentsModal(true);
  };

  const handleEditAppointments = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalMode('edit');
    setShowAppointmentsModal(true);
  };

  const handleViewAppointments = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalMode('view');
    setShowAppointmentsModal(true);
  };

  const handleDeleteAppointments = async (id: number) => {
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
          confirmButtonText: 'ตกลง',
        });
        fetchAppointments();
      } catch (error) {
        console.error('Error deleting appointment:', error);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาดในการลบนัดหมาย',
          confirmButtonText: 'ตกลง',
        });
      }
    }
  };

  const handleModalClose = () => {
    setShowAppointmentsModal(false);
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

  // Filtered appointments based on filterText
  const filteredAppointments = appointments.filter((a) => {
    const search = filterText.toLowerCase();
    const patientName = `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase();
    const clinician = a.clinician.username.toLowerCase();
    const record = a.recordNumber.toLowerCase();
    const date = format(new Date(a.startTime), 'dd/MM/yyyy').toLowerCase();

    return (
      patientName.includes(search) ||
      clinician.includes(search) ||
      record.includes(search) ||
      date.includes(search)
    );
  });

  const columns = [
    {
      name: "รหัสนัด",
      selector: (row: Appointment) => row.recordNumber,
      sortable: true,
    },
    {
      name: "ผู้ป่วย",
      selector: (row: Appointment) => `${row.patient.firstName} ${row.patient.lastName}`,
      sortable: true,
    },
    {
      name: "แพทย์",
      selector: (row: Appointment) => row.clinician.username,
      sortable: true,
    },
    {
      name: "วันที่-เวลา",
      cell: (row: Appointment) => (
        <div>
          {format(new Date(row.startTime), 'dd/MM/yyyy')}
          <div className="text-xs text-gray-400">
            {format(new Date(row.startTime), 'HH:mm')} - {format(new Date(row.endTime), 'HH:mm')}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      name: "สถานะ",
      cell: (row: Appointment) => getStatusBadge(row.status),
    },
    {
      name: "การดำเนินการ",
      cell: (row: Appointment) => (
        <div className="flex gap-2">
          <button onClick={() => handleViewAppointments(row)} className="text-blue-600 hover:text-blue-800">
            <Eye size={16} />
          </button>
          {(canModify || (isClinician && row.clinicianId === user.id)) && (
            <button onClick={() => handleEditAppointments(row)} className="text-green-600 hover:text-green-800">
              <Edit2 size={16} />
            </button>
          )}
          {canCreateDelete && (
            <button onClick={() => handleDeleteAppointments(row.id)} className="text-red-600 hover:text-red-800">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Subheader component for filtering
  const SubHeaderComponent = (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="ชื่อผู้ป่วย แพทย์ รหัสนัด วันที่"
          className="border rounded-lg pl-9 pr-9 py-2 text-sm w-80"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        {/* clear filter btn */}
        {filterText && (
          <X
            size={16}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
            onClick={() => {
              setFilterText('');
              setResetPaginationToggle(!resetPaginationToggle);
            }}
          />
        )}
      </div>
    </div>
  );

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
            onClick={handleCreateAppointments}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus />
            สร้างนัดหมายใหม่
          </button>
        )}
      </div>

      {/* กล่องตาราง */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredAppointments}
          pagination
          paginationResetDefaultPage={resetPaginationToggle}
          highlightOnHover
          striped
          subHeader
          subHeaderComponent={SubHeaderComponent}
          noDataComponent={
            <div className="my-8 mx-auto text-gray-500 text-center">
              ไม่มีข้อมูลการนัดหมาย
            </div>
          }
        />
      </div>

      {showAppointmentsModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          mode={modalMode}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Appointments;
