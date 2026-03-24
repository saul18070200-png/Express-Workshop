import React, { useState, useEffect } from 'react';
import { Home, Plus, Users, Trash2, ChevronRight, MapPin, Calendar, Beef, Activity, RefreshCw } from 'lucide-react';
import { subscribeToCollection, addDocument, deleteDocument, updateDocument } from '../../lib/firestore';

const CorralesModule = () => {
  const [corrales, setCorrales] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCorral, setNewCorral] = useState({ nombre: '', tipo: 'Engorda' });
  const [animales, setAnimales] = useState([]);

  const [selectedCorral, setSelectedCorral] = useState(null);

  useEffect(() => {
    const unsubCorrales = subscribeToCollection('corrales', setCorrales);
    const unsubAnimals = subscribeToCollection('animales', setAnimales);
    return () => {
      unsubCorrales();
      unsubAnimals();
    };
  }, []);

  const handleAddCorral = async (e) => {
    e.preventDefault();
    if (!newCorral.nombre.trim()) return;
    
    try {
      await addDocument('corrales', { ...newCorral });
      setNewCorral({ nombre: '', tipo: 'Engorda' });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding corral:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este corral?")) {
      await deleteDocument('corrales', id);
    }
  };

  const activeAnimalsInCorral = (corralId) => 
    animales.filter(a => a.corral_id === corralId && a.estado === 'Activo');

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 mt-4 md:mt-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Corrales</h1>
          <p className="text-gray-500 font-medium">Gestión de espacios y lotes</p>
        </div>
        <button className="btn-primary shadow-lg shadow-primary/20" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Nuevo Corral
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {corrales.map(corral => (
          <div key={corral.id} className="glass-card p-8 group relative overflow-hidden">
            <div className="glow-circle w-32 h-32 bg-secondary/20 -top-8 -left-8" />
            
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                <Home size={28} />
              </div>
              <button 
                onClick={() => handleDelete(corral.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2 leading-none">{corral.nombre}</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                corral.tipo === 'Maternales' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                corral.tipo === 'Destetes' ? 'bg-accent/10 text-accent border border-accent/20' :
                'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {corral.tipo || 'Engorda'}
              </span>
              <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                <MapPin size={10} className="text-secondary" />
                <span>Rancho Principal</span>
              </div>
            </div>
            
            <div 
              onClick={() => setSelectedCorral(corral)}
              className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-primary/20 transition-all cursor-pointer hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Users size={18} className="text-primary" />
                <span className="font-black text-gray-700">
                  {activeAnimalsInCorral(corral.id).length} Animales
                </span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
            </div>

            {corral.tipo === 'Maternales' && activeAnimalsInCorral(corral.id).some(a => {
              const today = new Date();
              const matingDate = a.fecha_contacto ? new Date(a.fecha_contacto) : null;
              const prediction = matingDate ? new Date(matingDate.getTime() + 147 * 24 * 60 * 60 * 1000) : null;
              const birthDate = a.fecha_parto ? new Date(a.fecha_parto) : null;
              const weaningDate = birthDate ? new Date(birthDate.getTime() + 75 * 24 * 60 * 60 * 1000) : null;
              
              const isNearBirth = prediction && !birthDate && (prediction - today) < (7 * 24 * 60 * 60 * 1000);
              const isWeaningDue = weaningDate && (today > weaningDate);
              return isNearBirth || isWeaningDue;
            }) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atención Requerida (Parto/Destete)</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedCorral && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <button 
              onClick={() => setSelectedCorral(null)}
              className="absolute top-8 right-8 text-gray-300 hover:text-gray-500 font-black"
            >
              CERRAR
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                <Home size={32} />
              </div>
              <div>
                <h2 className="text-4xl font-black text-primary">{selectedCorral.nombre}</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Detalle de población actual</p>
              </div>
            </div>

            <div className="space-y-4 mt-8 max-h-[60vh] overflow-y-auto pr-4">
              {activeAnimalsInCorral(selectedCorral.id).map(animal => {
                const matingDate = animal.fecha_contacto ? new Date(animal.fecha_contacto) : null;
                const prediction = matingDate ? new Date(matingDate.getTime() + 147 * 24 * 60 * 60 * 1000) : null;
                const birthDate = animal.fecha_parto ? new Date(animal.fecha_parto) : null;
                const weaningDate = birthDate ? new Date(birthDate.getTime() + 75 * 24 * 60 * 60 * 1000) : null;
                const today = new Date();

                const isNearBirth = prediction && !birthDate && (prediction - today) < (7 * 24 * 60 * 60 * 1000);
                const isWeaningDue = weaningDate && (today > weaningDate);

                return (
                  <div key={animal.id} className="p-4 md:p-6 rounded-[2rem] bg-gray-50 border border-gray-100 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-primary shadow-sm text-lg border border-primary/5">
                          {animal.tagId}
                        </div>
                        <div>
                          <p className="font-black text-gray-800 uppercase tracking-tight">{animal.sexo}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{animal.peso_inicial} kg Inicial</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-2 bg-white/50 md:bg-transparent p-3 md:p-0 rounded-2xl border border-gray-100 md:border-transparent">
                        <div className="text-left md:mr-4">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Inversión</p>
                          <p className="font-black text-primary text-xl">${animal.costo_acumulado?.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col gap-2 w-32 md:w-auto">
                          <select 
                            className="p-3 md:p-2 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase text-gray-500 outline-none focus:border-primary/20"
                            onChange={(e) => updateDocument('animales', animal.id, { corral_id: e.target.value })}
                            value={animal.corral_id}
                          >
                            <option disabled value="">Mover a...</option>
                            {corrales.map(c => (
                              <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                          </select>
                          <button 
                            onClick={async () => {
                              if(window.confirm("¿Quitar animal de este corral?")) {
                                await updateDocument('animales', animal.id, { corral_id: null });
                              }
                            }}
                            className="p-2 bg-gray-100 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex items-center justify-center gap-1"
                            title="Quitar del corral"
                          >
                            <Trash2 size={12} /> <span className="text-[8px] font-black uppercase">QUITAR</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {selectedCorral.tipo === 'Maternales' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1 text-secondary">Apareamiento (Fecha Contacto)</label>
                          <input 
                            type="date" 
                            className="w-full p-3 bg-white rounded-xl border border-gray-100 text-xs font-bold text-gray-600 outline-none focus:border-secondary/30 transition-all"
                            value={animal.fecha_contacto || ''}
                            onChange={async (e) => await updateDocument('animales', animal.id, { fecha_contacto: e.target.value })}
                          />
                          {prediction && !birthDate && (
                            <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${isNearBirth ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                              <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase">Parto: {prediction.toISOString().split('T')[0]}</span>
                              </div>
                              {isNearBirth && <div className="w-2 h-2 bg-red-600 rounded-full" />}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 flex flex-col justify-end">
                          {!birthDate ? (
                            <button 
                              onClick={async () => {
                                if(window.confirm("¿Confirmar que el parto ha ocurrido hoy?")) {
                                  await updateDocument('animales', animal.id, { 
                                    fecha_parto: new Date().toISOString().split('T')[0] 
                                  });
                                }
                              }}
                              className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                isNearBirth ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-primary hover:text-white'
                              }`}
                            >
                              <Plus size={16} /> Registrar Parto
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-1 text-primary">Nacimiento (Lactancia)</label>
                              <div className="p-3 bg-white rounded-xl border border-gray-100 text-xs font-bold text-gray-600 flex items-center justify-between">
                                <span>{animal.fecha_parto}</span>
                                <button onClick={() => updateDocument('animales', animal.id, { fecha_parto: null })} className="text-[8px] text-red-400 hover:underline">BORRAR</button>
                              </div>
                              <div className={`p-3 rounded-xl border flex items-center gap-2 ${isWeaningDue ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                                <Beef size={14} />
                                <span className="text-[10px] font-black uppercase">Destete: {weaningDate.toISOString().split('T')[0]}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isNearBirth && !birthDate && (
                          <div className="md:col-span-2 p-3 bg-red-600 rounded-xl text-white flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                            <Activity size={16} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">¡ALERTA CRÍTICA: PARTO INMINENTE!</span>
                          </div>
                        )}

                        {isWeaningDue && (
                          <div className="md:col-span-2 p-3 bg-blue-500 rounded-xl text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                            <Users size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">AVISO: TOCA SEPARAR CRÍAS (DESTETE)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {activeAnimalsInCorral(selectedCorral.id).length === 0 && (
                <p className="text-center py-10 text-gray-400 font-bold italic">No hay animales activos en este corral.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[200] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-primary mb-2">Nuevo Corral</h2>
            <p className="text-gray-500 text-sm font-bold mb-8 italic">Define un nombre único y su clasificación operativa.</p>
            
            <form onSubmit={handleAddCorral} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nombre Identificador</label>
                <input 
                  type="text" 
                  value={newCorral.nombre}
                  onChange={(e) => setNewCorral({...newCorral, nombre: e.target.value})}
                  placeholder="Ej: Corral Norte - Fase 1"
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-black text-gray-700"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Clasificación / Tipo</label>
                <select 
                  value={newCorral.tipo}
                  onChange={(e) => setNewCorral({...newCorral, tipo: e.target.value})}
                  className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all font-black text-gray-700 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%232D5A27%22 stroke-width=%223%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_1.2rem_center] bg-[length:1rem]"
                >
                  <option value="Engorda">Engorda</option>
                  <option value="Destetes">Destetes</option>
                  <option value="Maternales">Maternales</option>
                </select>
              </div>

              <div className="flex gap-4 justify-end pt-4 border-t border-gray-100">
                <button type="button" className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary py-4 px-8 shadow-xl shadow-primary/20">Crear Espacio</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorralesModule;
