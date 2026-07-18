import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";

export default function Sidebar({ onOpenVehiculosServicio, onOpenHistorial, onOpenReportes, onOpenMapa, }) {
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
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center shadow-sm ring-4 ring-slate-700/40">
          <Icon icon="mdi:shield-account" className="text-3xl text-slate-100" />
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
      <div className="px-3 py-6 flex-1 overflow-y-auto space-y-7">
        <div className="space-y-2">
          {!colapsado && (
            <h3 className="group flex items-center gap-3 px-2 mb-3 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
              <span className="h-px w-6 bg-slate-300 group-hover:w-10 group-hover:bg-emerald-400 transition-all duration-300" />

              <span className="group-hover:text-emerald-600 transition-colors duration-300">
                Acceso Rápido
              </span>

              <span className="h-px flex-1 bg-slate-200 group-hover:bg-emerald-300 transition-colors duration-300" />
            </h3>
          )}
          <button
            onClick={() => openPage("/entrada")}
            className={`group relative overflow-hidden w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 hover:scale-[1.02] text-white font-semibold shadow-sm shadow-emerald-900/40 transition-all duration-300 ${colapsado ? "justify-center" : ""}`}>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-white/15 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300">
              <Icon
                icon="mdi:car-arrow-right"
                className="text-lg group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            {!colapsado && (
              <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                Entrada
              </span>
            )}
          </button>
          <button
            onClick={() => openPage("/salida")}
            className={`group relative overflow-hidden w-full flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-95 hover:scale-[1.02] text-white font-semibold shadow-sm shadow-rose-900/40 transition-all duration-300 ${colapsado ? "justify-center" : ""}`}>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-white/15 group-hover:bg-white/25 group-hover:scale-110 transition-all duration-300">
              <Icon
                icon="mdi:exit-to-app"
                className="text-lg group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            {!colapsado && (
              <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                Salida
              </span>
            )}
          </button>
        </div>

        <hr className="border-slate-700" />

        {/* Sidebar de Gestión */}
        <div className="space-y-3">
          {!colapsado && (
            <h3 className="group flex items-center gap-3 px-2 mb-4 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
              <span className="h-px w-6 bg-slate-300 group-hover:w-10 group-hover:bg-emerald-400 transition-all duration-300" />

              <span className="group-hover:text-emerald-600 transition-colors duration-300">
                Gestión
              </span>

              <span className="h-px flex-1 bg-slate-200 group-hover:bg-emerald-300 transition-colors duration-300" />
            </h3>
          )}

          <button
            onClick={onOpenMapa}
            className={`group relative overflow-hidden w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:translate-x-1 hover:shadow-sm transition-all duration-300 ${colapsado ? "justify-center" : ""
              }`}
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full bg-emerald-400 group-hover:h-7 transition-all duration-300" />

            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 group-hover:scale-110 transition-all duration-300">
              <Icon
                icon="mdi:map-search"
                className="text-base group-hover:scale-110 transition-transform duration-300"
              />
            </span>

            {!colapsado && (
              <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                Mapa
              </span>
            )}
          </button>

          <button
            onClick={onOpenVehiculosServicio}
            className={`group relative overflow-hidden w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:translate-x-1 hover:shadow-sm transition-all duration-300 ${colapsado ? "justify-center" : ""
              }`}
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full bg-blue-400 group-hover:h-7 transition-all duration-300" />

            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 group-hover:scale-110 transition-all duration-300">
              <Icon
                icon="mdi:car-multiple"
                className="text-base group-hover:scale-110 transition-transform duration-300"
              />
            </span>

            {!colapsado && (
              <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                Vehículos en servicio
              </span>
            )}
          </button>

          <button
            onClick={onOpenReportes}
            className={`group relative overflow-hidden w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:translate-x-1 hover:shadow-sm transition-all duration-300 ${colapsado ? "justify-center" : ""
              }`}
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full bg-violet-400 group-hover:h-7 transition-all duration-300" />

            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 group-hover:bg-violet-500/30 group-hover:scale-110 transition-all duration-300">
              <Icon
                icon="mdi:file-chart-outline"
                className="text-base group-hover:scale-110 transition-transform duration-300"
              />
            </span>

            {!colapsado && (
              <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                Registros de incidentes
              </span>
            )}
          </button>

          <button
            onClick={onOpenHistorial}
            className={`group relative overflow-hidden w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 hover:translate-x-1 hover:shadow-sm transition-all duration-300 ${colapsado ? "justify-center" : ""
              }`}
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-r-full bg-amber-400 group-hover:h-7 transition-all duration-300" />

            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 group-hover:scale-110 transition-all duration-300">
              <Icon
                icon="mdi:history"
                className="text-base group-hover:scale-110 transition-transform duration-300"
              />
            </span>

            {!colapsado && (
              <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                Historial
              </span>
            )}
          </button>
        </div>

        <hr className="border-slate-700" />

        {/* Acciones */}
        <div className="space-y-1.5">
          {!colapsado && (
            <h3 className="group flex items-center gap-3 px-2 mb-3 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
              <span className="h-px w-6 bg-slate-300 group-hover:w-10 group-hover:bg-emerald-400 transition-all duration-300" />

              <span className="group-hover:text-emerald-600 transition-colors duration-300">
                Acceso rapido
              </span>

              <span className="h-px flex-1 bg-slate-200 group-hover:bg-emerald-300 transition-colors duration-300" />
            </h3>
          )}
          <button
            onClick={handleLogout}
            className={`group relative overflow-hidden w-full flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 hover:translate-x-1 active:scale-95 rounded-2xl px-3 py-2.5 transition-all duration-300 ${colapsado ? "justify-center" : ""}`}
          >
            {/* Efecto de brillo */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-rose-400/10 to-transparent" />

            <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 group-hover:bg-rose-500/25 group-hover:scale-110 transition-all duration-300">
              <Icon
                icon="mdi:logout"
                className="text-base group-hover:translate-x-1 transition-transform duration-300"
              />
            </span>

            {!colapsado && (
              <span className="relative font-medium group-hover:translate-x-1 transition-transform duration-300">
                Cerrar sesión
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}