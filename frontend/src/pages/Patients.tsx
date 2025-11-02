import { useState, useEffect } from "react";
import { Plus, Edit2, Eye, Trash2, X, Search } from "lucide-react";
import Swal from "sweetalert2";
import DataTable from "react-data-table-component";
import { useAuth } from "../services/useAuth";
import { getPatients, deletePatient } from "../services/services";
import type { Patient } from "../services/services";
import { format } from "date-fns";
import PatientModal from "../components/PatientModal";

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientsModal, setShowPatientsModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("view");

  // Filter state
  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  // Permission flags
  const canModify = user?.role === "RECEPTION" || user?.role === "ADMIN";
  const canDelete = user?.role === "ADMIN";

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await getPatients();
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatients = () => {
    setSelectedPatient(null);
    setModalMode("create");
    setShowPatientsModal(true);
  };

  const handleEditPatients = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalMode("edit");
    setShowPatientsModal(true);
  };

  const handleViewPatients = (patient: Patient) => {
    setSelectedPatient(patient);
    setModalMode("view");
    setShowPatientsModal(true);
  };

  const handleDeletePatients = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "คุณแน่ใจหรือไม่?",
      text: "คุณต้องการลบผู้ป่วยนี้หรือไม่?",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await deletePatient(id);
        Swal.fire({
          icon: "success",
          title: "ลบผู้ป่วยสำเร็จ",
          confirmButtonText: "ตกลง",
        });
        fetchPatients();
      } catch (error) {
        console.error("Error deleting patient:", error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาดในการลบผู้ป่วย",
          confirmButtonText: "ตกลง",
        });
      }
    }
  };

  const handleModalClose = () => {
    setShowPatientsModal(false);
    setSelectedPatient(null);
    fetchPatients();
  };

  // Filtered patients based on filterText
  const filteredPatients = patients.filter((patient) => {
    const text = filterText.toLowerCase();
    return (
      patient.firstName.toLowerCase().includes(text) ||
      patient.lastName.toLowerCase().includes(text) ||
      patient.recordNumber.toLowerCase().includes(text) ||
      patient.phoneNumber?.toLowerCase().includes(text) ||
      patient.email?.toLowerCase().includes(text)
    );
  });

  const columns = [
    {
      name: "รหัสผู้ป่วย",
      selector: (row: Patient) => row.recordNumber,
      sortable: true,
    },
    {
      name: "ชื่อ-นามสกุล",
      selector: (row: Patient) => `${row.firstName} ${row.lastName}`,
      sortable: true,
    },
    {
      name: "เบอร์โทรศัพท์",
      selector: (row: Patient) => row.phoneNumber,
      sortable: true,
    },
    {
      name: "อีเมล",
      selector: (row: Patient) => row.email,
      sortable: true,
    },
    {
      name: "เพศ",
      selector: (row: Patient) => row.gender,
      sortable: true,
    },
    {
      name: "วันเกิด",
      selector: (row: Patient) =>
        format(new Date(row.dateOfBirth), "dd/MM/yyyy"),
      sortable: true,
    },
    {
      name: "การดำเนินการ",
      cell: (row: Patient) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewPatients(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Eye size={16} />
          </button>
          {canModify && (
            <button
              onClick={() => handleEditPatients(row)}
              className="text-green-600 hover:text-green-800"
            >
              <Edit2 size={16} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => handleDeletePatients(row.id)}
              className="text-red-600 hover:text-red-800"
            >
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
          placeholder="ชื่อผู้ป่วย รหัสผู้ป่วย เบอร์โทรศัพท์ อีเมล"
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
              setFilterText("");
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
        <h1 className="text-2xl font-bold text-gray-900">ข้อมูลผู้ป่วย</h1>
        {canModify && (
          <button
            onClick={handleCreatePatients}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus />
            เพิ่มผู้ป่วยใหม่
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredPatients}
          pagination
          paginationResetDefaultPage={resetPaginationToggle}
          highlightOnHover
          striped
          subHeader
          subHeaderComponent={SubHeaderComponent}
          noDataComponent={
            <div className="my-8 mx-auto text-gray-500 text-center">
              ไม่มีข้อมูลผู้ป่วย
            </div>
          }
        />
      </div>

      {showPatientsModal && (
        <PatientModal
          patient={selectedPatient}
          mode={modalMode}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Patients;
