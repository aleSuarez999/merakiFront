import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import Box from './Box';
import { orgStatuses } from '../utils/api';

const COLORS = {
  online: '#00C49F',
  alerting: '#FFBB28',
  offline: '#FF8042',
  dormant: '#8884d8'
};

function OrgStatusChart({ org }) {
  const [orgStatus, setOrgStatus] = useState({});

  useEffect(() => {
    orgStatuses(org.id)
      .then((data) => {
        if (data?.counts?.byStatus) {
          setOrgStatus(data.counts.byStatus);
        }
      })
      .catch((error) => console.error(error.message));
  }, [org]);

  const chartData = Object.entries(orgStatus)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key,
      value,
      fill: COLORS[key] || '#ccc'
    }));

  return (
    <Box className="status__body">
      {chartData.length > 0 ? (
        <PieChart width={150} height={90}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={50}
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      ) : (
        <p>No hay datos de estado disponibles.</p>
      )}
    </Box>
  );
}

export default OrgStatusChart;
