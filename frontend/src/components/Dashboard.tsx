import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { dashboardService, type BalanceTrend } from '../api/dashboardService';

const BalanceTrendChart: React.FC = () => {
  const [data, setData] = useState<BalanceTrend[]>([]);

  useEffect(() => {
    dashboardService.getBalanceTrend()
      .then(res => setData(res))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3>Tendência de Saldo Atualizado</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="date" stroke="#888888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
            <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Saldo']} />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#007bff" 
              strokeWidth={3} 
              dot={{ r: 4 }}
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};