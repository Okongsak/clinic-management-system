import Box from '@mui/material/Box';
import { BarChart } from '@mui/x-charts/BarChart';

interface BarChartsProps {
  labels: string[];
  dataPatients: number[];
  dataAppointments: number[];
}

const BarCharts = ({ labels, dataPatients, dataAppointments }: BarChartsProps) => {
  console.log({ dataPatients, dataAppointments });
  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <BarChart
        series={[
          { data: dataPatients, label: 'New Patients', id: 'patients' },
          { data: dataAppointments, label: 'Appointments', id: 'appointments' },
        ]}
        xAxis={[{ data: labels }]}
        yAxis={[{ width: 50 }]}
      />
    </Box>
  );
};

export default BarCharts;
