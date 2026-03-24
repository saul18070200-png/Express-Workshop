import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, TrendingUp, Hash, Tag, Activity, ArrowRight, Activity as ActivityIcon } from 'lucide-react';
import { subscribeToCollection, sellAnimal } from '../../lib/firestore';

const VentasModule = () => {
  const [ventas, setVentas] = useState([]);
  const [animales, setAnimales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newVenta, setNewVenta] = useState({
    animal_id: '',
    precio_venta: '',
    peso_final: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubVentas = subscribeToCollection('ventas', (data) => {
      setVentas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });
    const unsubAnimals = subscribeToCollection('animales', setAnimales, []);
    return () => {
      unsubVentas();
      unsubAnimals();
    };
  }, []);

  const activeAnimals = animales.filter(a => a.estado === 'Activo');

  const handleSell = async (e) => {
    e.preventDefault();
    if (!newVenta.animal_id || !newVenta.precio_venta || !newVenta.peso_final) return;
    
    setLoading(true);
    const animal = getAnimalInfo(newVenta.animal_id);
    const totalCost = animal.costo_acumulado || 0;

    try {
      await sellAnimal(
        newVenta.animal_id,
        Number(newVenta.precio_venta),
        newVenta.fecha,
        Number(newVenta.peso_final),
        totalCost
      );
      setIsModalOpen(false);
      setNewVenta({
        animal_id: '',
        precio_venta: '',
        peso_final: '',
        fecha: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error selling animal:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAnimalInfo = (id) => animales.find(a => a.id === id) || {};
  
  // Real-time calculation helper
  const selectedAnimal = getAnimalInfo(newVenta.animal_id);
  const currentPricePerKilo = Number(newVenta.precio_kilo_venta || 0);
  const currentWeight = Number(newVenta.peso_final || 0);
  const calculatedTotal = currentPricePerKilo * currentWeight;
  const netProfit = calculatedTotal - (selectedAnimal.costo_acumulado || 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Utilidad</h1>
          <p className="text-gray-500 font-medium">Análisis de ventas y ganancias reales</p>
        </div>
        <button className="btn-primary shadow-lg shadow-primary/20 py-3 px-8" onClick={() => setIsModalOpen(true)}>
          <ShoppingCart size={20} /> Registrar Venta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {ventas.map(venta => {
          const animal = getAnimalInfo(venta.animal_id);
          const totalCost = (venta.costo_total_acumulado || animal.costo_acumulado || 0);
          const profit = venta.precio - totalCost;
          const isPositive = profit >= 0;

          return (
            <div key={venta.id} className="glass-card p-0 overflow-hidden group">
              <div className="p-4 md:p-6 bg-primary/5 flex items-center justify-between border-b border-white/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-primary shadow-sm group-hover:rotate-12 transition-transform">
                    <Hash size={18} md:size={20} />
                  </div>
                  <div>
                    <span className="font-black text-primary tracking-tighter text-base md:text-lg">Lote {animal.tagId || '?' }</span>
                    <p className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">{animal.sexo || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/80 px-3 md:px-4 py-1 md:py-2 rounded-full border border-gray-100 shadow-sm">{venta.fecha}</span>
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-6 md:space-y-10">
                <div className="flex justify-between items-center md:px-4 relative">
                  <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Costo Total</p>
                    <p className="text-xl md:text-2xl font-black text-gray-700 tracking-tighter">${totalCost.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-2">P. Venta</p>
                    <p className="text-xl md:text-2xl font-black text-primary tracking-tighter">${venta.precio?.toLocaleString()}</p>
                  </div>
                </div>

                <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-1 md:gap-2 border shadow-lg transition-all group-hover:shadow-2xl ${
                  isPositive ? 'bg-green-50/50 border-green-100 shadow-green-900/5' : 'bg-red-50/50 border-red-100 shadow-red-900/5'
                }`}>
                  <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isPositive ? 'text-green-600' : 'text-red-600'}`}>Net Profit per Unit</span>
                  <div className="flex items-center gap-2 md:gap-3">
                    {isPositive ? <TrendingUp size={24} md:size={32} className="text-green-600" /> : <ActivityIcon size={24} md:size={32} className="text-red-600" />}
                    <h4 className={`text-3xl md:text-5xl font-black tracking-tighter ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                      {isPositive ? '+' : ''}${profit.toFixed(2)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4 text-nowrap lg:text-wrap">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <h2 className="text-4xl font-black text-primary mb-2">Registrar Venta</h2>
            <p className="text-gray-400 font-bold mb-10 italic uppercase tracking-tighter text-sm">Cierre de ciclo y cálculo de ROI operativo.</p>
            
            <form onSubmit={(e) => {
                e.preventDefault();
                const total = Number(newVenta.peso_final) * Number(newVenta.precio_kilo_venta);
                handleSell({ preventDefault: () => {}, target: { value: total } }); // Pass total precio
              }} className="space-y-6">
              
              <FormGroup label="Seleccionar Animal (Lote)">
                <select className="form-select" value={newVenta.animal_id} onChange={e => setNewVenta({...newVenta, animal_id: e.target.value})} required>
                  <option value="">Seleccione animal...</option>
                  {activeAnimals.map(a => <option key={a.id} value={a.id}>{a.tagId} - ${a.costo_acumulado?.toFixed(0)} INV.</option>)}
                </select>
              </FormGroup>

              <div className="grid grid-cols-2 gap-6">
                <FormGroup label="Peso Báscula (kg)">
                  <input type="number" step="0.1" className="form-input" value={newVenta.peso_final} 
                    onChange={e => {
                        const val = e.target.value;
                        setNewVenta(prev => ({...prev, peso_final: val, precio_venta: Number(val) * Number(prev.precio_kilo_venta || 0)}));
                    }} placeholder="0.0" required />
                </FormGroup>
                <FormGroup label="Precio por Kg ($)">
                  <input type="number" step="0.01" className="form-input" value={newVenta.precio_kilo_venta || ''} 
                    onChange={e => {
                        const val = e.target.value;
                        setNewVenta(prev => ({...prev, precio_kilo_venta: val, precio_venta: Number(val) * Number(prev.peso_final || 0)}));
                    }} placeholder="0.00" required />
                </FormGroup>
              </div>

              {newVenta.animal_id && (
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Inversión Total (Costo + Gastos)</span>
                      <span className="font-black text-gray-700">${selectedAnimal.costo_acumulado?.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">Precio de Venta Calculado</span>
                      <span className="font-black text-primary">${calculatedTotal.toFixed(2)}</span>
                   </div>
                   <div className="h-px bg-primary/10 w-full" />
                   <div className="flex justify-between items-center">
                      <span className="font-black text-primary uppercase tracking-widest text-[10px]">Utilidad Neta Esperada</span>
                      <span className={`text-xl font-black ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${netProfit.toFixed(2)}
                      </span>
                   </div>
                </div>
              )}

              <FormGroup label="Fecha de Transacción">
                <input type="date" className="form-input" value={newVenta.fecha} onChange={e => setNewVenta({...newVenta, fecha: e.target.value})} required />
              </FormGroup>

              <div className="flex gap-4 justify-end pt-8 border-t border-gray-100">
                <button type="button" className="px-8 py-3 font-bold text-gray-300 hover:text-gray-500 transition-colors" onClick={() => setIsModalOpen(false)} disabled={loading}>CANCELAR</button>
                <button type="submit" 
                    onClick={() => {
                        // Manual price update before submission
                        setNewVenta(prev => ({...prev, precio_venta: Number(prev.peso_final) * Number(prev.precio_kilo_venta)}));
                    }}
                    className="btn-primary py-4 px-12 shadow-2xl shadow-primary/30" disabled={loading}>
                  {loading ? 'PROCESANDO...' : 'CONFIRMAR VENTA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const FormGroup = ({ label, children }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    {children}
  </div>
);

export default VentasModule;
