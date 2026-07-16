/**
 * Sidebar.jsx
 * Barra lateral de navegación interactiva y colapsable.
 * OPTIMIZADO: Lee los datos directamente de Props desde el Dashboard. Estructura fija (Logout abajo).
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { Icon } from "@iconify/react";

export default function Sidebar({ onOpenVehiculosServicio }) {
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
    const confirmar = window.confirm("¿Seguro que quieres cerrar sesión?");
    if (!confirmar) return;
    await supabase.auth.signOut();
    navigate("/login");
  };

  const openPage = (path) => window.open(path, "_blank");

  return (
    <aside
      className={`h-screen bg-gray-100 shadow-md flex flex-col shrink-0 transition-all duration-300 ${colapsado ? "w-20" : "w-64"
        }`}
    >
      {/* Encabezado del perfil */}
      <div className="bg-emerald-500 text-white flex flex-col items-center py-8 relative">
        <button
          onClick={() => setColapsado((c) => !c)}
          className="absolute top-3 right-3 text-white/80 hover:text-white"
          title={colapsado ? "Expandir menú" : "Colapsar menú"}
        >
          <Icon
            icon={colapsado ? "mdi:chevron-right" : "mdi:chevron-left"}
            className="text-xl"
          />
        </button>
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl text-emerald-600">
          👤
        </div>
        {!colapsado && (
          <>
            <h2 className="mt-3 text-lg font-bold text-center px-2 truncate max-w-full">
              {userEmail}
            </h2>
            <p className="text-emerald-100 text-sm">Encargado</p>
          </>
        )}
      </div>

      {/* Navegación */}
      <div className="px-3 py-6 flex-1 overflow-y-auto">
        {/* Accesos rápidos: Entrada / Salida */}
        {!colapsado && (
          <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-3 px-2">
            ACCESO RÁPIDO
          </h3>
        )}

        <button
          onClick={() => openPage("/entrada")}
          title="Entrada"
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-2 bg-green-500 hover:bg-green-600 text-white font-semibold transition ${colapsado ? "justify-center" : ""
            }`}
        >
          <Icon icon="mdi:car-arrow-right" className="text-xl shrink-0" />
          {!colapsado && <span>Entrada</span>}
        </button>

        <button
          onClick={() => openPage("/salida")}
          title="Salida"
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-6 bg-red-500 hover:bg-red-600 text-white font-semibold transition ${colapsado ? "justify-center" : ""
            }`}
        >
          <Icon icon="mdi:exit-to-app" className="text-xl shrink-0" />
          {!colapsado && <span>Salida</span>}
        </button>

        <hr className="mb-6" />

        {!colapsado && (
          <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-3 px-2">
            GESTIÓN
          </h3>
        )}

        <Link
          to="/gestion-entrada-salida"
          title="Información Vehicular"
          className={`flex items-center gap-3 rounded-xl px-3 py-3 mb-2 transition ${location.pathname === "/gestion-entrada-salida"
              ? "bg-emerald-200 text-emerald-900"
              : "hover:bg-gray-200 text-gray-700"
            } ${colapsado ? "justify-center" : ""}`}
        >
          <Icon icon="mdi:card-account-details" className="text-xl shrink-0" />
          {!colapsado && <span>Información Vehicular</span>}
        </Link>

        <button
          onClick={onOpenVehiculosServicio}
          title="Vehículos en servicio"
          className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 mb-2 transition hover:bg-gray-200 text-gray-700 ${colapsado ? "justify-center" : ""
            }`}
        >
          <Icon icon="mdi:car-multiple" className="text-xl shrink-0 text-blue-600" />
          {!colapsado && <span>Vehículos en servicio</span>}
        </button>

        <hr className="my-6" />

        {!colapsado && (
          <h3 className="text-gray-400 text-xs font-bold tracking-widest mb-3 px-2">
            ACCIONES
          </h3>
        )}

        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`w-full flex items-center gap-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl px-3 py-3 transition ${colapsado ? "justify-center" : ""
            }`}
        >
          <Icon icon="mdi:logout" className="text-xl shrink-0" />
          {!colapsado && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}