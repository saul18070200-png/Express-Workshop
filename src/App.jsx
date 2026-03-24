import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Home, Beef, PieChart, DollarSign, Settings, Menu, X } from 'lucide-react';
import './index.css';
import CorralesModule from './modules/Corrales';
import AnimalesModule from './modules/Animales';
import GastosModule from './modules/Gastos';
import VentasModule from './modules/Ventas';
import Dashboard from './modules/Dashboard';

// Main layout component
const Navbar = ({ isOpen, setIsOpen }) => {
  const closeNav = () => {
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[100]">
        <div className="flex items-center gap-2 text-primary">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
          <h1 className="text-xl font-bold tracking-tight">Ganadera MP</h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <nav className={`
        fixed md:sticky top-0 md:top-6 left-0 h-screen md:h-[calc(100vh-48px)] 
        w-72 m-0 md:m-6 p-6 glass-card z-50 transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col gap-8 glow-container
      `}>
        {/* Glow Effect */}
        <div className="glow-circle w-32 h-32 bg-primary top-0 -left-16" />
        <div className="glow-circle w-32 h-32 bg-secondary top-1/2 -right-16" />

        <div className="hidden md:flex items-center gap-3 text-primary">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain drop-shadow-md" />
          <h2 className="text-2xl font-black tracking-tighter text-nowrap">GANADERA <span className="text-secondary">MP</span></h2>
        </div>
        
        <div className="flex flex-col gap-2">
          <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={closeNav} />
          <NavLink to="/corrales" icon={<Home size={20} />} label="Corrales" onClick={closeNav} />
          <NavLink to="/animales" icon={<Beef size={20} />} label="Animales" onClick={closeNav} />
          <NavLink to="/gastos" icon={<DollarSign size={20} />} label="Gastos" onClick={closeNav} />
          <NavLink to="/ventas" icon={<PieChart size={20} />} label="Ventas" onClick={closeNav} />
        </div>

        <div className="mt-auto p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">Estado del Sistema</p>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Conectado
          </div>
        </div>
      </nav>
    </>
  );
};

const NavLink = ({ to, icon, label, onClick }) => (
  <Link to={to} onClick={onClick} className="nav-link group overflow-hidden relative">
    <div className="absolute inset-0 bg-primary/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
    <span className="text-primary relative z-10 group-hover:scale-110 transition-transform">{icon}</span>
    <span className="relative z-10 text-gray-700 group-hover:text-primary transition-colors">{label}</span>
  </Link>
);

function App() {
  const [isNavOpen, setIsNavOpen] = React.useState(false);

  return (
    <Router>
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50">
        <Navbar isOpen={isNavOpen} setIsOpen={setIsNavOpen} />
        
        {/* Mobile Overlay */}
        {isNavOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[40] md:hidden"
            onClick={() => setIsNavOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-8 pt-6 overflow-x-hidden w-full" onClick={() => setIsNavOpen(false)}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/corrales" element={<CorralesModule />} />
            <Route path="/animales" element={<AnimalesModule />} />
            <Route path="/gastos" element={<GastosModule />} />
            <Route path="/ventas" element={<VentasModule />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
