import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, Home, Tag, Activity, AlertCircle, Hash } from 'lucide-react';
import { subscribeToCollection, distributeExpenseToCorral } from '../../lib/firestore';

const GastosModule = () => {
  const [gastos, setGastos] = useState([]);
  const [corrales, setCorrales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newGasto, setNewGasto] = useState({
    corral_id: '',
    monto: '',
    tipo: 'Alimento',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubGastos = subscribeToCollection('gastos', (data) => {
      setGastos(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });
    const unsubCorrales = subscribeToCollection('corrales', setCorrales);
    return () => {
      unsubGastos();
      unsubCorrales();
    };
  }, []);

  const handleAddGasto = async (e) => {
    e.preventDefault();
    if (!newGasto.corral_id || !newGasto.monto) return;
    
    setLoading(true);
    try {
      await distributeExpenseToCorral(
        newGasto.corral_id, 
        Number(newGasto.monto), 
        newGasto.tipo, 
        newGasto.fecha
      );
      setIsModalOpen(false);
      setNewGasto({
        corral_id: '',
        monto: '',
        tipo: 'Alimento',
        fecha: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error adding gasto:", error);
      alert("Error al distribuir el gasto. Asegúrate de que haya animales activos en el corral.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 mt-20 md:mt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Gastos</h1>
          <p className="text-gray-500 font-medium">Control y distribución automática</p>
        </div>
        <button className="btn-primary shadow-lg shadow-primary/20 py-3 px-6" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      <div className="table-container bg-white">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Corral Afectado</th>
              <th>Tipo de Gasto</th>
              <th>Monto Total</th>
              <th>Distribución</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map(gasto => (
              <tr key={gasto.id} className="hover:bg-primary/5 transition-colors group">
                <td className="py-6 font-bold text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-secondary" />
                    {gasto.fecha}
                  </div>
                </td>
                <td className="font-black text-gray-800 tracking-tighter uppercase text-lg">
                  {corrales.find(c => c.id === gasto.corral_id)?.nombre || 'N/A'}
                </td>
                <td>
                  <span className="flex items-center gap-2 font-bold text-gray-600">
                    <Tag size={14} className="text-primary/40" />
                    {gasto.tipo}
                  </span>
                </td>
                <td className="font-black text-primary text-2xl tracking-tighter">
                  ${gasto.monto?.toFixed(2)}
                </td>
                <td>
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-full w-fit shadow-sm">
                    <Activity size={12} className="animate-pulse" />
                    DISTRIBUIDO OK
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {gastos.length === 0 && (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 shadow-inner">
              <DollarSign size={40} />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Sin gastos hoy</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <h2 className="text-3xl font-black text-primary mb-2">Registrar Gasto</h2>
            <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-3xl border border-primary/10 mb-8 shadow-inner">
              <AlertCircle className="text-primary mt-1 shrink-0" size={24} />
              <p className="text-primary/70 text-[11px] font-black leading-relaxed uppercase tracking-wide">
                El sistema dividirá este monto automáticamente entre todos los animales activos en el corral.
              </p>
            </div>

            <form onSubmit={handleAddGasto} className="space-y-6">
              <FormGroup label="Seleccionar Corral Target">
                <select className="form-select" value={newGasto.corral_id} onChange={e => setNewGasto({...newGasto, corral_id: e.target.value})} required>
                  <option value="">Seleccione corral...</option>
                  {corrales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </FormGroup>

              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Monto Real ($)">
                  <input type="number" step="0.01" className="form-input" value={newGasto.monto} onChange={e => setNewGasto({...newGasto, monto: e.target.value})} placeholder="0.00" required />
                </FormGroup>
                <FormGroup label="Categoría">
                  <select className="form-select" value={newGasto.tipo} onChange={e => setNewGasto({...newGasto, tipo: e.target.value})}>
                    <option value="Alimento">Alimento</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="Otros">Otros</option>
                  </select>
                </FormGroup>
              </div>

              <FormGroup label="Fecha de Operación">
                <input type="date" className="form-input" value={newGasto.fecha} onChange={e => setNewGasto({...newGasto, fecha: e.target.value})} required />
              </FormGroup>

              <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
                <button type="button" className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setIsModalOpen(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn-primary py-4 px-10 shadow-2xl shadow-primary/30" disabled={loading}>
                  {loading ? 'Procesando...' : 'Distribuir Costo'}
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

export default GastosModule;
