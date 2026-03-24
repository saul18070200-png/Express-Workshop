import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Premium custom confirm dialog.
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *   setConfirm({ message: '...', onConfirm: () => doThing() });
 *   <ConfirmModal state={confirm} setState={setConfirm} />
 */
const ConfirmModal = ({ state, setState }) => {
  if (!state) return null;

  const { message, onConfirm, danger = true, title = 'Confirmar acción', confirmLabel = 'Sí, confirmar', cancelLabel = 'Cancelar' } = state;

  const handleConfirm = () => {
    setState(null);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[500] p-4">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Glow accent */}
        <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 ${danger ? 'bg-red-500' : 'bg-primary'}`} />

        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg ${danger ? 'bg-red-50 border border-red-100' : 'bg-primary/10 border border-primary/10'}`}>
          <AlertTriangle size={28} className={danger ? 'text-red-500' : 'text-primary'} />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">{message}</p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setState(null)}
            className="flex-1 py-3 px-5 border-2 border-gray-100 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 px-5 rounded-2xl font-black text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 ${
              danger
                ? 'bg-red-500 shadow-red-200 hover:bg-red-600'
                : 'bg-primary shadow-primary/20 hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
