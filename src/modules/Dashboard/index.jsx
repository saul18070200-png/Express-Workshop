import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  ChevronRight
} from 'lucide-react';
import { subscribeToCollection } from '../../lib/firestore';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeAnimals: 0,
    totalInvestment: 0,
    totalSales: 0,
    totalProfit: 0,
    expensesLast30: 0
  });

  const [recentAnimals, setRecentAnimals] = useState([]);
  const [corrales, setCorrales] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubCorrales = subscribeToCollection('corrales', setCorrales);
    
    const unsubAnimals = subscribeToCollection('animales', (data) => {
      const active = data.filter(a => a.estado === 'Activo');
      const sold = data.filter(a => a.estado === 'Vendido');
      
      const investment = active.reduce((acc, curr) => acc + (curr.costo_acumulado || 0), 0);
      const sales = sold.reduce((acc, curr) => acc + (curr.precio_venta || 0), 0);
      const totalCostsSold = sold.reduce((acc, curr) => acc + (curr.costo_acumulado || 0), 0);
      
      setStats(prev => ({
        ...prev,
        activeAnimals: active.length,
        totalInvestment: investment,
        totalSales: sales,
        totalProfit: sales - totalCostsSold
      }));

      setRecentAnimals(data.slice(0, 5));
      
      // Calculate Global Alerts
      const today = new Date();
      const reproductiveAlerts = active.filter(a => {
        const matingDate = a.fecha_contacto ? new Date(a.fecha_contacto) : null;
        const prediction = matingDate ? new Date(matingDate.getTime() + 147 * 24 * 60 * 60 * 1000) : null;
        const birthDate = a.fecha_parto ? new Date(a.fecha_parto) : null;
        const weaningDate = birthDate ? new Date(birthDate.getTime() + 75 * 24 * 60 * 60 * 1000) : null;
        
        const isNearBirth = prediction && !birthDate && (prediction - today) < (7 * 24 * 60 * 60 * 1000);
        const isWeaningDue = weaningDate && (today > weaningDate);
        return isNearBirth || isWeaningDue;
      }).map(a => {
        const matingDate = new Date(a.fecha_contacto);
        const prediction = new Date(matingDate.getTime() + 147 * 24 * 60 * 60 * 1000);
        const birthDate = a.fecha_parto ? new Date(a.fecha_parto) : null;
        const weaningDate = birthDate ? new Date(birthDate.getTime() + 75 * 24 * 60 * 60 * 1000) : null;
        
        return {
          id: a.id,
          tagId: a.tagId,
          type: birthDate ? 'Destete' : 'Parto',
          date: birthDate ? weaningDate : prediction
        };
      });
      setAlerts(reproductiveAlerts);
    });

    const unsubGastos = subscribeToCollection('gastos', (data) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentExpenses = data
        .filter(g => new Date(g.fecha) >= thirtyDaysAgo)
        .reduce((acc, curr) => acc + (curr.monto || 0), 0);
      
      setStats(prev => ({
        ...prev,
        expensesLast30: recentExpenses
      }));
    });

    return () => {
      unsubCorrales();
      unsubAnimals();
      unsubGastos();
    };
  }, []);


  return (
    <div className="space-y-8 animate-in mt-4 md:mt-0 fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 font-medium">Resumen operativo de Ganadera <span className="text-secondary">MP</span></p>
        </div>
        <div className="flex items-center gap-2 p-2 px-4 bg-white rounded-full border border-gray-100 shadow-sm text-xs font-bold text-gray-400">
          <Activity size={14} className="text-primary animate-pulse" />
          ACTUALIZADO EN TIEMPO REAL
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Animales Activos" 
          value={stats.activeAnimals} 
          icon={<Users size={24} />} 
          color="#2D5A27" 
        />
        <StatCard 
          title="Inversión en Corral" 
          value={`$${stats.totalInvestment.toLocaleString()}`} 
          icon={<DollarSign size={24} />} 
          color="#8B5E3C" 
        />
        <StatCard 
          title="Utilidad Realizada" 
          value={`$${stats.totalProfit.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          color={stats.totalProfit >= 0 ? "#2D5A27" : "#A62626"} 
          trend={stats.totalProfit >= 0 ? "positive" : "negative"}
        />
        <StatCard 
          title="Gastos (30 días)" 
          value={`$${stats.expensesLast30.toLocaleString()}`} 
          icon={<Activity size={24} />} 
          color="#D4AF37" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Section - New */}
        <div className={`p-8 rounded-[2rem] border-2 transition-all ${alerts.length > 0 ? 'bg-red-50 border-red-100 shadow-2xl shadow-red-200/50' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${alerts.length > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
              <Activity size={24} />
            </div>
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Alertas Críticas</h3>
          </div>
          
          <div className="space-y-4">
            {alerts.length > 0 ? alerts.map(alert => (
              <div key={alert.id} className={`flex items-center justify-between p-4 bg-white rounded-2xl border shadow-sm transition-all hover:scale-[1.02] ${alert.type === 'Parto' ? 'border-red-100' : 'border-blue-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${alert.type === 'Parto' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {alert.type === 'Parto' ? <Activity size={16} className="animate-pulse" /> : <Users size={16} />}
                  </div>
                  <div>
                    <p className="font-black text-gray-800 text-sm">Borrego #{alert.tagId}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${alert.type === 'Parto' ? 'text-red-500' : 'text-blue-500'}`}>
                      {alert.type}: {alert.date.toISOString().split('T')[0]}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className={alert.type === 'Parto' ? 'text-red-300' : 'text-blue-300'} />
              </div>
            )) : (
              <p className="text-gray-400 font-bold italic text-center py-10 px-4">No hay tareas reproductivas pendientes para esta semana.</p>
            )}
          </div>

          <button className={`mt-8 w-full py-4 font-black rounded-2xl transition-all ${alerts.length > 0 ? 'bg-red-500 text-white shadow-xl shadow-red-200' : 'bg-gray-50 text-gray-300 cursor-not-allowed'}`}>
            GESTIONAR ALERTAS
          </button>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card p-8 glow-container group">
          <div className="glow-circle w-64 h-64 bg-primary/20 -top-32 -right-32" />
          
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-800">Actividad Reciente</h3>
            <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              Ver todo <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {recentAnimals.map(animal => (
              <div key={animal.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Tag: {animal.tagId}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{animal.estado}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary text-lg">${(animal.costo_acumulado || 0).toFixed(2)}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Costo Acum.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="glass-card p-6 flex justify-between items-start group relative">
    <div>
      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">{title}</p>
      <h2 className="text-3xl font-black text-gray-800 leading-none">{value}</h2>
      {trend && (
        <p className={`
          text-[10px] mt-4 flex items-center gap-1 font-black uppercase
          ${trend === 'positive' ? 'text-primary' : 'text-red-500'}
        `}>
          {trend === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend === 'positive' ? 'ROI Positivo' : 'Alerta de Costo'}
        </p>
      )}
    </div>
    <div className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-sm" style={{ backgroundColor: `${color}15`, color: color }}>
      {icon}
    </div>
  </div>
);

const TipItem = ({ text }) => (
  <div className="flex items-center gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
    <span className="text-sm font-semibold text-white/90">{text}</span>
  </div>
);

export default Dashboard;
