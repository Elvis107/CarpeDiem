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
import { supabase } from "../supabaseClient";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Email del usuario autenticado (fallback "USUARIO" mientras carga)
  const [userEmail, setUserEmail] = useState("USUARIO");

  useEffect(() => {
    // Obtiene el email del usuario autenticado desde Supabase
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    };

    getUser();
  }, []);

  /**
   * Cierra la sesión del usuario en Supabase
   * y redirige al login.
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <aside className="w-64 h-screen bg-gray-100 shadow-md">
      {/* Encabezado del perfil: avatar + email + rol */}
      <div className="bg-emerald-500 text-white flex flex-col items-center py-10">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl text-emerald-600">
          👤
        </div>
        <h2 className="mt-4 text-xl font-bold text-center px-2">{userEmail}</h2>
        <p className="text-emerald-100 text-sm">Encargado</p>
      </div>

      {/* Navegación */}
      <div className="px-5 py-8">
        {/* Sección: Gestión */}
        <h3 className="text-gray-400 text-sm font-bold tracking-widest mb-4">
          GESTIÓN
        </h3>

        {/* Enlace activo resaltado con fondo verde */}
        <Link
          to="/gestion-entrada-salida"
          className={`block rounded-xl px-5 py-4 mb-8 transition ${
            location.pathname === "/gestion-entrada-salida"
              ? "bg-emerald-200 text-emerald-900"
              : "hover:bg-gray-200"
          }`}
        >
          Informacion Vehicular
        </Link>

        <hr className="mb-8" />

        {/* Sección: Acciones */}
        <h3 className="text-gray-400 text-sm font-bold tracking-widest mb-4">
          ACCIONES
        </h3>

        <button
          onClick={handleLogout}
          className="text-red-500 hover:text-red-700 px-5 py-4"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
