/**
 * Sidebar.jsx
 * Barra lateral de navegación interactiva y colapsable.
 * OPTIMIZADO: Lee los datos directamente de Props desde el Dashboard. Estructura fija (Logout abajo).
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Icon } from "@iconify/react";

export default function Sidebar({ 
  lastIngreso, 
  lastEgreso, 
  onIngresoClick, 
  onEgresoClick, 
  onActivosClick, 
  onHistorialClick 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("USUARIO");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    const confirmar = window.confirm("¿Seguro que quieres cerrar sesión?");
    if (!confirmar) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside
      className={`sticky top-0 self-start h-screen bg-slate-900 text-slate-300 flex flex-col p-4 shrink-0 shadow-xl border-r border-slate-800 select-none transition-all duration-300 ease-in-out overflow-y-auto ${
        isCollapsed ? "w-24" : "w-72"
      }`}
    >
      {/* BOTÓN HAMBURGUESA */}
      <div className={`flex items-center mb-3 ${isCollapsed ? "justify-center" : "justify-end px-1"}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all active:scale-95 layout-toggle"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <Icon icon="mdi:menu" width="30" height="30" />
        </button>
      </div>

      {/* Perfil de Usuario */}
      <div className="flex flex-col items-center text-center pb-6 border-b border-slate-800/60 mb-5 shrink-0">
        <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-slate-700 shrink-0">
          <Icon icon="mdi:account" className="text-3xl" />
        </div>
        {!isCollapsed && (
          <div className="mt-3.5 transition-all duration-200">
            <h2 className="text-sm font-bold text-white tracking-wide max-w-[200px] truncate px-2" title={userEmail}>
              {userEmail}
            </h2>
            <span className="inline-block text-xs bg-indigo-50/10 text-indigo-400 px-3 py-1 rounded-full font-semibold mt-1.5 border border-indigo-500/20 uppercase tracking-wider">
              Encargado
            </span>
          </div>
        )}
      </div>

      {/* CONTENEDOR INTERMEDIO (Menú + Movimientos) */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1 -mr-1">
        
        {/* Menú de Navegación */}
        <nav className="flex flex-col gap-1.5">
          {!isCollapsed ? (
            <p className="text-xs font-bold text-slate-500 tracking-widest uppercase px-3 mb-2">
              GESTIÓN
            </p>
          ) : (
            <div className="h-2" />
          )}

          {/* Panel de Control */}
          <div
            className={`flex items-center gap-4 py-4 rounded-2xl text-base font-medium transition-all duration-200 cursor-default ${
              isCollapsed ? "justify-center px-0" : "px-4"
            } ${
              location.pathname === "/" || location.pathname === "/dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10 font-semibold"
                : "text-slate-400"
            }`}
            title="Panel de Control"
          >
            <Icon icon="mdi:view-dashboard" width="32" height="32" className="shrink-0" />
            {!isCollapsed && <span>Panel de Control</span>}
          </div>

          {/* Vehículos en Estacionamiento */}
          <button
            onClick={() => onActivosClick && onActivosClick()}
            className={`w-full flex items-center gap-4 py-4 rounded-2xl text-base font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all duration-200 ${
              isCollapsed ? "justify-center px-0" : "px-4"
            }`}
            title="Vehículos en Estacionamiento"
          >
            <Icon icon="mdi:car-multiple" width="32" height="32" className="shrink-0 text-indigo-400" />
            {!isCollapsed && <span className="truncate">Vehículos en Estacionamiento</span>}
          </button>

          {/* Historial */}
          <button
            onClick={() => onHistorialClick && onHistorialClick()}
            className={`w-full flex items-center gap-4 py-4 rounded-2xl text-base font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all duration-200 ${
              isCollapsed ? "justify-center px-0" : "px-4"
            }`}
            title="Historial de Vehículos"
          >
            <Icon icon="mdi:history" width="32" height="32" className="shrink-0 text-amber-400" />
            {!isCollapsed && <span>Historial</span>}
          </button>
        </nav>

        {/* Sección de Últimos Movimientos (Reactivos por Props) */}
        {!isCollapsed ? (
          <div className="flex flex-col gap-1.5 border-t border-slate-800/60 pt-4">
            <p className="text-xs font-bold text-slate-500 tracking-widest uppercase px-3 mb-1">
              Movimientos
            </p>

            <button
              onClick={() => onIngresoClick && onIngresoClick()}
              className="w-full flex items-center gap-4 py-4 px-4 rounded-2xl text-left transition-all duration-200 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              title="Último ingreso"
            >
              <Icon icon="mdi:car-arrow-right" width="32" height="32" className="shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Último ingreso
                </span>
                <span className="block text-sm font-bold text-white truncate">
                  {lastIngreso?.patente || "Sin registros"}
                </span>
              </div>
            </button>

            <button
              onClick={() => onEgresoClick && onEgresoClick()}
              className="w-full flex items-center gap-4 py-4 px-4 rounded-2xl text-left transition-all duration-200 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              title="Último egreso"
            >
              <Icon icon="mdi:exit-to-app" width="32" height="32" className="shrink-0 text-rose-400" />
              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Último egreso
                </span>
                <span className="block text-sm font-bold text-white truncate">
                  {lastEgreso?.patente || "Sin registros"}
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 border-t border-slate-800/60 pt-4 items-center">
            <button
              onClick={() => onIngresoClick && onIngresoClick()}
              className="p-3 rounded-xl text-emerald-400 hover:bg-slate-800/60 transition-all"
              title="Último ingreso"
            >
              <Icon icon="mdi:car-arrow-right" width="28" height="28" />
            </button>
            <button
              onClick={() => onEgresoClick && onEgresoClick()}
              className="p-3 rounded-xl text-rose-400 hover:bg-slate-800/60 transition-all"
              title="Último egreso"
            >
              <Icon icon="mdi:exit-to-app" width="28" height="28" />
            </button>
          </div>
        )}
      </div>

      {/* BOTÓN CERRAR SESIÓN (Anclado abajo) */}
      <div className="mt-auto pt-4 border-t border-slate-800/60 shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-4 py-4 rounded-2xl text-base font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 ${
            isCollapsed ? "justify-center px-0" : "px-4"
          }`}
          title="Cerrar sesión"
        >
          <Icon icon="mdi:logout" width="32" height="32" className="shrink-0" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}