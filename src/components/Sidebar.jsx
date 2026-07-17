/**
 * Sidebar.jsx
 * Barra lateral de navegación del sistema CarpeDiem.
 *
 * Muestra:
 *   - Avatar y email del usuario autenticado
 *   - Rol fijo "Encargado"
 *   - Enlace a la sección de Gestión (Información Vehicular)
 *   - Botón de cierre de sesión
 *
 * Al cerrar sesión, llama a supabase.auth.signOut() y redirige a /login.
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";

export default function Sidebar({ onOpenVehiculosServicio, onOpenHistorial, onOpenReportes,onOpenMapa, }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("USUARIO");
  const [colapsado, setColapsado] = useState(false);
  

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
    await supabase.auth.signOut();
    navigate("/login");
  };

  const openPage = (path) => window.open(path, "_blank");

  return (
    <aside
      className={`h-screen bg-slate-900 shadow-md flex flex-col shrink-0 transition-all duration-300 ${colapsado ? "w-20" : "w-64"
        }`}
    >
      {/* Encabezado del perfil */}
      <div className="bg-slate-800 text-white flex flex-col items-center py-8 relative border-b border-slate-700">
        <button
          onClick={() => setColapsado((c) => !c)}
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
          title={colapsado ? "Expandir menú" : "Colapsar menú"}
        >
          <Icon
            icon={colapsado ? "mdi:chevron-right" : "mdi:chevron-left"}
            className="text-xl"
          />
        </button>
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-3xl text-slate-200 shadow-sm ring-4 ring-slate-700/40">
          👤
        </div>
        {!colapsado && (
          <>
            <h2 className="mt-3 text-lg font-bold text-center px-2 truncate max-w-full text-white">
              {userEmail}
            </h2>
            <p className="text-slate-400 text-sm">Encargado</p>
          </>
        )}
      </div>

      {/* Navegación */}
        <div className="px-3 py-6 flex-1 overflow-y-auto space-y-7">

          {/* Accesos rápidos */}
          <div className="space-y-2">
            {!colapsado && (
              <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] px-2 mb-2">
                Acceso Rápido
              </h3>
            )}
            <button
              onClick={() => openPage("/entrada")}
              className={`group w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.97] text-white font-semibold shadow-sm shadow-emerald-900/40 transition-all duration-200 ${colapsado ? "justify-center" : ""}`}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/15 group-hover:bg-white/20 transition-colors">
                <Icon icon="mdi:car-arrow-right" className="text-lg" />
              </span>
              {!colapsado && <span>Entrada</span>}
            </button>

            <button
              onClick={() => openPage("/salida")}
              className={`group w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-[0.97] text-white font-semibold shadow-sm shadow-rose-900/40 transition-all duration-200 ${colapsado ? "justify-center" : ""}`}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/15 group-hover:bg-white/20 transition-colors">
                <Icon icon="mdi:exit-to-app" className="text-lg" />
              </span>
              {!colapsado && <span>Salida</span>}
            </button>
          </div>

          <hr className="border-slate-700" />

          {/* Gestión */}
          <div className="space-y-1.5">
            {!colapsado && (
              <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] px-2 mb-2">
                Gestión
              </h3>
            )}

          {/* Boton mapa */}
            <button
            onClick={onOpenMapa}
            className={`group w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 text-slate-300 hover:bg-slate-800 hover:shadow-sm ${
          colapsado ? "justify-center" : ""
          }`}
          >
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
          <Icon icon="mdi:map-search" className="text-base" />
          </span>
          {!colapsado && <span>Mapa</span>}
          </button>

            <button
              onClick={onOpenVehiculosServicio}
              className={`group w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 text-slate-300 hover:bg-slate-800 hover:shadow-sm ${colapsado ? "justify-center" : ""}`}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                <Icon icon="mdi:car-multiple" className="text-base" />
              </span>
              {!colapsado && <span>En servicio</span>}
            </button>

            <button
              onClick={onOpenHistorial}
              className={`group w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 text-slate-300 hover:bg-slate-800 hover:shadow-sm ${colapsado ? "justify-center" : ""}`}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                <Icon icon="mdi:history" className="text-base" />
              </span>
              {!colapsado && <span>Historial</span>}
            </button>

            <button
              onClick={onOpenReportes}
              className={`group w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200 text-slate-300 hover:bg-slate-800 hover:shadow-sm ${colapsado ? "justify-center" : ""}`}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30 transition-colors">
                <Icon icon="mdi:file-chart-outline" className="text-base" />
              </span>
              {!colapsado && <span>Reportes</span>}
            </button>
          </div>

          <hr className="border-slate-700" />

          {/* Acciones */}
          <div className="space-y-1.5">
            {!colapsado && (
              <h3 className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] px-2 mb-2">
                Acciones
              </h3>
            )}
            <button
              onClick={handleLogout}
              className={`group w-full flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 rounded-2xl px-3 py-2.5 transition-all duration-200 ${colapsado ? "justify-center" : ""}`}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 group-hover:bg-rose-500/25 transition-colors">
                <Icon icon="mdi:logout" className="text-base" />
              </span>
              {!colapsado && <span className="font-medium">Cerrar sesión</span>}
            </button>
          </div>
        </div>
    </aside>
  );
}