import { PieChart } from '@mui/x-charts/PieChart';

interface PieChartsProps {
  pendingCount: number;
  completedCount: number;
}

const PieCharts = ({ pendingCount, completedCount }: PieChartsProps) => {
  return (
    <PieChart
      series={[
        {
          data: [
            { id: 0, value: pendingCount, label: 'Pending' },
            { id: 1, value: completedCount, label: 'Completed' },
          ],
        },
      ]}
      width={250}
      height={250}
    />
  );
};

export default PieCharts;
