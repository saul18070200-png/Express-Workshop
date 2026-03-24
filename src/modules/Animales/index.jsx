import React, { useState, useEffect } from 'react';
import { Beef, Plus, Search, Filter, Hash, Weight, Calendar, DollarSign, ChevronRight, Home, Users, Trash2, Layers } from 'lucide-react';
import { subscribeToCollection, addDocument, deleteDocument, updateDocument } from '../../lib/firestore';

const AnimalesModule = () => {
  const [animales, setAnimales] = useState([]);
  const [corrales, setCorrales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnimal, setNewAnimal] = useState({
    tagId: '',
    peso_inicial: '',
    sexo: 'Macho',
    precio_compra: '',
    corral_id: '',
    estado: 'Activo',
    fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkAnimals, setBulkAnimals] = useState([]);
  const [bulkCorralId, setBulkCorralId] = useState('');

  const [activeTab, setActiveTab] = useState('Activo');
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  const handleEditClick = (animal) => {
    setSelectedAnimal(animal);
    setEditForm(animal);
    setIsEditModalOpen(true);
  };

  const handleUpdateAnimal = async (e) => {
    e.preventDefault();
    if (!editForm.tagId) return;
    try {
      await updateDocument('animales', selectedAnimal.id, {
        ...editForm,
        peso_inicial: Number(editForm.peso_inicial),
        precio_compra: Number(editForm.precio_compra),
        costo_acumulado: Number(editForm.precio_compra) // Ensure cost is updated if price changes
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating animal:", error);
    }
  };

  useEffect(() => {
    const unsubAnimals = subscribeToCollection('animales', setAnimales);
    const unsubCorrales = subscribeToCollection('corrales', setCorrales);
    return () => {
      unsubAnimals();
      unsubCorrales();
    };
  }, []);

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    if (!bulkCorralId) return;
    
    try {
      const promises = bulkAnimals.map(animal => {
        if (!animal.tagId) return null;
        return addDocument('animales', {
          tagId: animal.tagId,
          sexo: animal.sexo,
          peso_inicial: Number(animal.peso_inicial),
          precio_compra: Number(animal.precio_compra),
          costo_acumulado: Number(animal.precio_compra),
          corral_id: bulkCorralId,
          estado: 'Activo',
          fecha_ingreso: new Date().toISOString().split('T')[0]
        });
      }).filter(p => p !== null);

      await Promise.all(promises);
      setIsBulkModalOpen(false);
      setBulkAnimals([]);
    } catch (error) {
      console.error("Error in bulk add:", error);
    }
  };

  const initBulkAnimals = (count) => {
    const animals = [];
    for (let i = 0; i < count; i++) {
      animals.push({ tagId: '', peso_inicial: '', precio_compra: '', sexo: 'Macho' });
    }
    setBulkAnimals(animals);
    setBulkCount(count);
  };

  const filteredAnimals = animales.filter(a => a.estado === activeTab);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 mt-20 md:mt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Inventario</h1>
          <p className="text-gray-500 font-medium">Control individual de borregos</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-500 flex items-center gap-2 hover:bg-gray-50 transition-all" onClick={() => {
            initBulkAnimals(5);
            setIsBulkModalOpen(true);
          }}>
            <Layers size={20} className="text-secondary" /> Alta por Lote
          </button>
          <button className="btn-primary shadow-lg shadow-primary/20 py-3 px-6" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Alta Individual
          </button>
        </div>
      </div>

      {/* Tabs and Toolbar */}
      <div className="space-y-4">
        <div className="flex gap-2 p-1.5 bg-gray-100/50 backdrop-blur-sm rounded-2xl w-fit border border-gray-200">
          <button 
            onClick={() => setActiveTab('Activo')}
            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'Activo' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Activos ({animales.filter(a => a.estado === 'Activo').length})
          </button>
          <button 
            onClick={() => setActiveTab('Vendido')}
            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'Vendido' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Vendidos ({animales.filter(a => a.estado === 'Vendido').length})
          </button>
        </div>

        <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por ID / Tag..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent focus:border-primary/10 focus:bg-white outline-none transition-all font-semibold"
            />
          </div>
          <button className="w-full md:w-auto px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Filter size={18} /> Filtrar
          </button>
        </div>
      </div>

      <div className="table-container bg-white">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Tag ID</th>
              <th>Corral</th>
              <th>Sexo</th>
              <th>Peso {activeTab === 'Activo' ? 'Ini.' : 'Fin.'}</th>
              {activeTab === 'Vendido' && <th>Ganal.</th>}
              <th>{activeTab === 'Activo' ? 'Costo Total' : 'Venta'}</th>
              {activeTab === 'Vendido' && <th>Utilidad</th>}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnimals.map(animal => (
              <tr key={animal.id} className="hover:bg-primary/5 transition-colors group">
                <td className="font-black text-primary py-6 underline-offset-4 decoration-primary/30 group-hover:underline">
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-secondary" />
                    {animal.tagId}
                  </div>
                </td>
                <td className="font-bold text-gray-600">
                  {corrales.find(c => c.id === animal.corral_id)?.nombre || 'Sin corral'}
                </td>
                <td>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${animal.sexo === 'Hembra' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                    {animal.sexo}
                  </span>
                </td>
                <td className="font-mono font-bold text-gray-500">
                  {activeTab === 'Activo' ? animal.peso_inicial : animal.peso_final} kg
                </td>
                {activeTab === 'Vendido' && (
                  <td className="font-mono font-bold text-green-600">
                    +{(animal.peso_final - animal.peso_inicial).toFixed(1)} kg
                  </td>
                )}
                <td className="font-black text-gray-800 text-lg">
                  ${activeTab === 'Activo' 
                    ? animal.costo_acumulado?.toFixed(2) 
                    : animal.precio_venta?.toFixed(2)}
                </td>
                {activeTab === 'Vendido' && (
                  <td className={`font-black text-lg ${animal.precio_venta - animal.costo_acumulado >= 0 ? 'text-primary' : 'text-red-500'}`}>
                    ${(animal.precio_venta - animal.costo_acumulado).toFixed(2)}
                  </td>
                )}
                <td className="px-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditClick(animal)}
                      className="p-2 text-gray-300 hover:text-primary transition-colors bg-gray-50 rounded-lg"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button 
                      onClick={async () => {
                        if(window.confirm(`¿Estás seguro de eliminar permanentemente al animal con TAG: ${animal.tagId}?`)) {
                          await deleteDocument('animales', animal.id);
                        }
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 rounded-lg"
                      title="Eliminar registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAnimals.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-200">
              <Beef size={40} />
            </div>
            <h4 className="text-xl font-bold text-gray-400">No hay animales en esta categoría</h4>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black text-primary mb-2 text-center md:text-left">Alta de Animal</h2>
            <p className="text-gray-400 font-semibold mb-8 text-center md:text-left">Ingresa los datos base para iniciar el seguimiento.</p>
            
            <form onSubmit={handleAddAnimal} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Tag / ID Único" icon={<Hash size={18} />}>
                  <input type="text" value={newAnimal.tagId} onChange={e => setNewAnimal({...newAnimal, tagId: e.target.value})} placeholder="Ej: B-204" className="form-input" required />
                </InputGroup>
                
                <InputGroup label="Corral" icon={<Home size={18} />}>
                  <select value={newAnimal.corral_id} onChange={e => setNewAnimal({...newAnimal, corral_id: e.target.value})} className="form-input" required>
                    <option value="">Seleccione...</option>
                    {corrales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </InputGroup>

                <InputGroup label="Peso Inicial (kg)" icon={<Weight size={18} />}>
                  <input type="number" value={newAnimal.peso_inicial} onChange={e => setNewAnimal({...newAnimal, peso_inicial: e.target.value})} className="form-input" required />
                </InputGroup>

                <InputGroup label="Precio Compra ($)" icon={<DollarSign size={18} />}>
                  <input type="number" value={newAnimal.precio_compra} onChange={e => setNewAnimal({...newAnimal, precio_compra: e.target.value})} className="form-input" required />
                </InputGroup>

                <div className="md:col-span-2 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Precio calculado por Kilo</p>
                    <p className="text-2xl font-black text-primary">
                      ${(newAnimal.precio_compra && newAnimal.peso_inicial) 
                        ? (Number(newAnimal.precio_compra) / Number(newAnimal.peso_inicial)).toFixed(2) 
                        : '0.00'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest uppercase tracking-widest">Inversión Inicial</p>
                    <p className="text-xl font-bold text-gray-700">${Number(newAnimal.precio_compra || 0).toLocaleString()}</p>
                  </div>
                </div>

                <InputGroup label="Sexo" icon={<Users size={18} />}>
                  <select value={newAnimal.sexo} onChange={e => setNewAnimal({...newAnimal, sexo: e.target.value})} className="form-input">
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </InputGroup>

                <InputGroup label="Fecha de Ingreso" icon={<Calendar size={18} />}>
                  <input type="date" value={newAnimal.fecha_ingreso} onChange={e => setNewAnimal({...newAnimal, fecha_ingreso: e.target.value})} className="form-input" required />
                </InputGroup>
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
                <button type="button" className="px-8 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary py-4 px-10 shadow-2xl shadow-primary/30">Registrar Animal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-primary">Alta por Lote</h2>
                <p className="text-gray-400 font-semibold italic">Ingreso de múltiples animales en un solo movimiento.</p>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">¿Cuántos animales ingresan?</span>
                <input 
                  type="number"
                  min="1"
                  max="50"
                  value={bulkCount} 
                  onChange={(e) => initBulkAnimals(Number(e.target.value))}
                  className="w-20 bg-white border border-gray-200 rounded-xl px-4 py-2 font-black text-primary outline-none focus:border-primary/30 text-center"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-8 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <InputGroup label="Corral Destino" icon={<Home size={18} />}>
                  <select value={bulkCorralId} onChange={e => setBulkCorralId(e.target.value)} className="form-input" required>
                    <option value="">Seleccione corral para todo el lote...</option>
                    {corrales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </InputGroup>
                <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Inversión Promedio</p>
                    <p className="text-2xl font-black text-secondary">
                      ${(bulkAnimals.reduce((acc, curr) => acc + Number(curr.precio_compra || 0), 0) / (bulkAnimals.filter(a => a.tagId).length || 1)).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-secondary/60 uppercase tracking-widest">Total del Lote</p>
                    <p className="text-xl font-bold text-gray-700">${bulkAnimals.reduce((acc, curr) => acc + Number(curr.precio_compra || 0), 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 mb-2">
                  <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tag / ID</div>
                  <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sexo</div>
                  <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Peso (kg)</div>
                  <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio Compra ($)</div>
                </div>
                {bulkAnimals.map((animal, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/10 transition-colors">
                    <div className="col-span-3">
                      <input 
                        placeholder={`# Tag Animal ${idx+1}`}
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none focus:border-primary/30"
                        value={animal.tagId}
                        onChange={(e) => {
                          const newArr = [...bulkAnimals];
                          newArr[idx].tagId = e.target.value;
                          setBulkAnimals(newArr);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <select 
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                        value={animal.sexo}
                        onChange={(e) => {
                          const newArr = [...bulkAnimals];
                          newArr[idx].sexo = e.target.value;
                          setBulkAnimals(newArr);
                        }}
                      >
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="number"
                        placeholder="Peso kg"
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                        value={animal.peso_inicial}
                        onChange={(e) => {
                          const newArr = [...bulkAnimals];
                          newArr[idx].peso_inicial = e.target.value;
                          setBulkAnimals(newArr);
                        }}
                      />
                    </div>
                    <div className="col-span-4">
                      <input 
                        type="number"
                        placeholder="Precio $"
                        className="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm font-bold outline-none"
                        value={animal.precio_compra}
                        onChange={(e) => {
                          const newArr = [...bulkAnimals];
                          newArr[idx].precio_compra = e.target.value;
                          setBulkAnimals(newArr);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
              <button type="button" className="px-8 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setIsBulkModalOpen(false)}>Cancelar</button>
              <button onClick={handleBulkAdd} className="btn-primary py-4 px-10 shadow-2xl shadow-primary/30">Registrar Lote Completo</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[250] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-primary mb-2">Editar Animal</h2>
            <p className="text-gray-400 font-semibold mb-8">Modifica los datos del registro individual.</p>
            
            <form onSubmit={handleUpdateAnimal} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Tag / ID Único" icon={<Hash size={18} />}>
                  <input type="text" value={editForm.tagId} onChange={e => setEditForm({...editForm, tagId: e.target.value})} className="form-input" required />
                </InputGroup>
                
                <InputGroup label="Corral" icon={<Home size={18} />}>
                  <select value={editForm.corral_id} onChange={e => setEditForm({...editForm, corral_id: e.target.value})} className="form-input" required>
                    <option value="">Seleccione...</option>
                    {corrales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </InputGroup>

                <InputGroup label="Peso Inicial (kg)" icon={<Weight size={18} />}>
                  <input type="number" value={editForm.peso_inicial} onChange={e => setEditForm({...editForm, peso_inicial: e.target.value})} className="form-input" required />
                </InputGroup>

                <InputGroup label="Precio Compra ($)" icon={<DollarSign size={18} />}>
                  <input type="number" value={editForm.precio_compra} onChange={e => setEditForm({...editForm, precio_compra: e.target.value})} className="form-input" required />
                </InputGroup>

                <InputGroup label="Sexo" icon={<Users size={18} />}>
                  <select value={editForm.sexo} onChange={e => setEditForm({...editForm, sexo: e.target.value})} className="form-input">
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                  </select>
                </InputGroup>

                <InputGroup label="Fecha de Ingreso" icon={<Calendar size={18} />}>
                  <input type="date" value={editForm.fecha_ingreso} onChange={e => setEditForm({...editForm, fecha_ingreso: e.target.value})} className="form-input" required />
                </InputGroup>
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
                <button type="button" className="px-8 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary py-4 px-10 shadow-2xl shadow-primary/30">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const InputGroup = ({ label, icon, children }) => (
  <div className="relative">
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">
        {icon}
      </div>
      {children}
    </div>
  </div>
);

export default AnimalesModule;
