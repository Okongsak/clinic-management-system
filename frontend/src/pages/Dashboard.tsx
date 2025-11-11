import { useEffect, useState } from 'react';
import { getPatients, getAppointments } from '../services/services';
import { Heart, Calendar, Users, UserPlus } from 'lucide-react';
import BarCharts from '../components/Barchart';
import PieCharts from '../components/Piechart';
import type { Patient, Appointment } from '../services/services';

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resPatients, resAppointments] = await Promise.all([
          getPatients(),
          getAppointments(),
        ]);
        setPatients(resPatients.data);
        setAppointments(resAppointments.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-center">Loading...</p>;

  // คำนวณเดือน
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Bar Chart Data
  const patientCountByMonth = months.map((_, i) =>
    patients.filter(p => new Date(p.createdAt).getMonth() === i).length
  );

  const appointmentCountByMonth = months.map((_, i) =>
    appointments.filter(a => new Date(a.createdAt).getMonth() === i).length
  );

  // Pie Chart Data
  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  // New Patients This Month
  const now = new Date();
  const newPatientsThisMonth = patients.filter(p => {
    const created = new Date(p.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="bg-gray-100">
      <div className="px-4 py-5 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8">

        {/* Summary Cards */}
        <div className="grid gap-8 row-gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 bg-white rounded shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-2">
              <Heart className="w-8 h-8 text-red-500" />
              <p className="text-xl font-bold text-center">Patients</p>
            </div>
            <p className="text-gray-600 text-lg text-center">{patients.length}</p>
          </div>

          <div className="p-5 bg-white rounded shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-2">
              <UserPlus className="w-8 h-8 text-purple-500" />
              <p className="text-xl font-bold text-center">New Patients</p>
            </div>
            <p className="text-gray-600 text-lg text-center">{newPatientsThisMonth}</p>
          </div>

          <div className="p-5 bg-white rounded shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-8 h-8 text-green-500" />
              <p className="text-xl font-bold text-center">Appointments</p>
            </div>
            <p className="text-gray-600 text-lg text-center">{appointments.length}</p>
          </div>

          <div className="p-5 bg-white rounded shadow-sm flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-8 h-8 text-blue-500" />
              <p className="text-xl font-bold text-center">Doctors</p>
            </div>
            <p className="text-gray-600 text-lg text-center">
              {new Set(appointments.map(a => a.clinicianId)).size}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-4 row-gap-5 lg:grid-cols-3 mt-8">
          <div className="p-5 bg-white rounded shadow-sm lg:col-span-2">
            <BarCharts
              labels={months}
              dataPatients={patientCountByMonth}
              dataAppointments={appointmentCountByMonth}
            />
          </div>

          <div className="p-5 bg-white rounded shadow-sm flex justify-center items-center">
            <PieCharts
              pendingCount={pendingCount}
              completedCount={completedCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
