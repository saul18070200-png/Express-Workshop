import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, Tag, Activity, AlertCircle, Trash2, Edit3, X } from 'lucide-react';
import { subscribeToCollection, distributeExpenseToCorral, deleteDocument, updateDocument } from '../../lib/firestore';
import ConfirmModal from '../../components/ConfirmModal';

const TIPOS = ['Alimento', 'Medicina', 'Limpieza', 'Otros'];

const tipoColor = {
  Alimento:  'bg-green-50 text-green-700 border-green-100',
  Medicina:  'bg-blue-50 text-blue-700 border-blue-100',
  Limpieza:  'bg-yellow-50 text-yellow-700 border-yellow-100',
  Otros:     'bg-gray-50 text-gray-600 border-gray-200',
};

const GastosModule = () => {
  const [gastos, setGastos]             = useState([]);
  const [corrales, setCorrales]         = useState([]);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editGasto, setEditGasto]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [newGasto, setNewGasto]         = useState({
    corral_id: '', monto: '', tipo: 'Alimento',
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const unsubGastos   = subscribeToCollection('gastos', (data) => {
      setGastos(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });
    const unsubCorrales = subscribeToCollection('corrales', setCorrales);
    return () => { unsubGastos(); unsubCorrales(); };
  }, []);

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAddGasto = async (e) => {
    e.preventDefault();
    if (!newGasto.corral_id || !newGasto.monto) return;
    setLoading(true);
    try {
      await distributeExpenseToCorral(
        newGasto.corral_id, Number(newGasto.monto), newGasto.tipo, newGasto.fecha
      );
      setIsModalOpen(false);
      setNewGasto({ corral_id: '', monto: '', tipo: 'Alimento', fecha: new Date().toISOString().split('T')[0] });
    } catch {
      alert('Error al distribuir el gasto. Asegúrate de que haya animales activos en el corral.');
    } finally { setLoading(false); }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editGasto) return;
    setLoading(true);
    try {
      await updateDocument('gastos', editGasto.id, {
        corral_id: editGasto.corral_id,
        monto:     Number(editGasto.monto),
        tipo:      editGasto.tipo,
        fecha:     editGasto.fecha,
      });
      setEditGasto(null);
    } catch { alert('Error al guardar los cambios.'); }
    finally { setLoading(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (gasto) => {
    setConfirmState({
      title: 'Eliminar Gasto',
      message: `¿Eliminar el gasto de $${gasto.monto?.toFixed(2)} del ${gasto.fecha}? No se revertirá la distribución en animales.`,
      onConfirm: () => deleteDocument('gastos', gasto.id),
    });
  };

  // ── Resumen por tipo ──────────────────────────────────────────────────────
  const totalesPorTipo = TIPOS.reduce((acc, tipo) => {
    acc[tipo] = gastos.filter(g => g.tipo === tipo).reduce((s, g) => s + (g.monto || 0), 0);
    return acc;
  }, {});

  const totalGeneral = gastos.reduce((s, g) => s + (g.monto || 0), 0);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 mt-4 md:mt-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Gastos</h1>
          <p className="text-gray-500 font-medium">Control, distribución y edición de costos operativos</p>
        </div>
        <button className="btn-primary shadow-lg shadow-primary/20 py-3 px-6" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Registrar Gasto
        </button>
      </div>

      {/* Resumen KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIPOS.map(tipo => (
          <div key={tipo} className={`p-5 rounded-3xl border flex flex-col gap-1 ${tipoColor[tipo]}`}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{tipo}</p>
            <p className="text-2xl font-black">${totalesPorTipo[tipo].toLocaleString('es-MX', {minimumFractionDigits:2})}</p>
          </div>
        ))}
      </div>

      {/* Total general */}
      <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary rounded-2xl text-white"><DollarSign size={20}/></div>
          <p className="font-black text-primary uppercase tracking-widest text-sm">Inversión Total en Gastos</p>
        </div>
        <p className="text-3xl font-black text-primary">${totalGeneral.toLocaleString('es-MX', {minimumFractionDigits:2})}</p>
      </div>

      {/* Desktop Table */}
      <div className="table-container bg-white hidden md:block">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Corral</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.map(gasto => (
              <tr key={gasto.id} className="hover:bg-primary/5 transition-colors group">
                <td className="py-6 font-bold text-gray-400">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-secondary"/>{gasto.fecha}</div>
                </td>
                <td className="font-black text-gray-800 uppercase">
                  {corrales.find(c => c.id === gasto.corral_id)?.nombre || <span className="text-red-400 text-xs">Sin corral</span>}
                </td>
                <td>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${tipoColor[gasto.tipo] || tipoColor.Otros}`}>
                    {gasto.tipo}
                  </span>
                </td>
                <td className="font-black text-primary text-2xl">${gasto.monto?.toFixed(2)}</td>
                <td>
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-full w-fit">
                    <Activity size={12} className="animate-pulse"/>DISTRIBUIDO
                  </div>
                </td>
                <td className="px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditGasto({...gasto})} className="p-2 bg-gray-50 text-gray-400 hover:text-primary rounded-xl transition-colors" title="Editar">
                      <Edit3 size={16}/>
                    </button>
                    <button onClick={() => handleDelete(gasto)} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors" title="Eliminar">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {gastos.map(gasto => (
          <div key={gasto.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <Calendar size={11}/> {gasto.fecha}
                </p>
                <h3 className="text-lg font-black text-gray-800">
                  {corrales.find(c => c.id === gasto.corral_id)?.nombre || <span className="text-red-400 text-sm">Sin corral asignado</span>}
                </h3>
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${tipoColor[gasto.tipo] || tipoColor.Otros}`}>
                  {gasto.tipo}
                </span>
              </div>
              <div className="flex gap-2 ml-2">
                <button onClick={() => setEditGasto({...gasto})} className="p-3 bg-gray-50 rounded-xl text-primary"><Edit3 size={18}/></button>
                <button onClick={() => handleDelete(gasto)} className="p-3 bg-red-50 rounded-xl text-red-500"><Trash2 size={18}/></button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inversión</p>
              <p className="text-2xl font-black text-primary">${gasto.monto?.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {gastos.length === 0 && (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
          <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 shadow-inner">
            <DollarSign size={40}/>
          </div>
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Sin gastos registrados</p>
        </div>
      )}

      {/* ── MODAL: Nuevo Gasto ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"/>
            <h2 className="text-3xl font-black text-primary mb-2">Registrar Gasto</h2>
            <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
              <AlertCircle className="text-primary mt-1 shrink-0" size={20}/>
              <p className="text-primary/70 text-[11px] font-black leading-relaxed uppercase tracking-wide">
                El monto se divide automáticamente entre los animales activos del corral seleccionado.
              </p>
            </div>
            <form onSubmit={handleAddGasto} className="space-y-5">
              <FormGroup label="Corral">
                <select className="form-select" value={newGasto.corral_id} onChange={e => setNewGasto({...newGasto, corral_id: e.target.value})} required>
                  <option value="">Seleccione corral...</option>
                  {corrales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </FormGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup label="Monto ($)">
                  <input type="number" step="0.01" className="form-input" value={newGasto.monto} onChange={e => setNewGasto({...newGasto, monto: e.target.value})} placeholder="0.00" required/>
                </FormGroup>
                <FormGroup label="Categoría">
                  <select className="form-select" value={newGasto.tipo} onChange={e => setNewGasto({...newGasto, tipo: e.target.value})}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </FormGroup>
              </div>
              <FormGroup label="Fecha">
                <input type="date" className="form-input" value={newGasto.fecha} onChange={e => setNewGasto({...newGasto, fecha: e.target.value})} required/>
              </FormGroup>
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
                <button type="button" className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600" onClick={() => setIsModalOpen(false)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn-primary py-4 px-10 shadow-xl shadow-primary/30" disabled={loading}>
                  {loading ? 'Procesando...' : 'Distribuir Costo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Editar Gasto ────────────────────────────────────────────── */}
      {editGasto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[250] p-4">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-primary">Editar Gasto</h2>
              <button onClick={() => setEditGasto(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl mb-6">
              <p className="text-yellow-700 text-[11px] font-black uppercase tracking-wide leading-relaxed">
                ⚠️ Editar el monto NO redistribuye el costo entre animales. Solo actualiza el registro del gasto.
              </p>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-5">
              <FormGroup label="Corral">
                <select className="form-select" value={editGasto.corral_id} onChange={e => setEditGasto({...editGasto, corral_id: e.target.value})} required>
                  <option value="">Seleccione corral...</option>
                  {corrales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </FormGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup label="Monto ($)">
                  <input type="number" step="0.01" className="form-input" value={editGasto.monto} onChange={e => setEditGasto({...editGasto, monto: e.target.value})} required/>
                </FormGroup>
                <FormGroup label="Categoría">
                  <select className="form-select" value={editGasto.tipo} onChange={e => setEditGasto({...editGasto, tipo: e.target.value})}>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </FormGroup>
              </div>
              <FormGroup label="Fecha">
                <input type="date" className="form-input" value={editGasto.fecha} onChange={e => setEditGasto({...editGasto, fecha: e.target.value})} required/>
              </FormGroup>
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
                <button type="button" className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600" onClick={() => setEditGasto(null)} disabled={loading}>Cancelar</button>
                <button type="submit" className="btn-primary py-4 px-10 shadow-xl shadow-primary/30" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal state={confirmState} setState={setConfirmState} />

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
