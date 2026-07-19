import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ProtectedRoute({ children }) {

  const [session, setSession] = useState(undefined);

  useEffect(() => {
   
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  // Mientras se verifica la sesión, muestra un spinner centrado
  if (session === undefined)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verificando sesión...</p>
        </div>
      </div>
    );

  // Si no hay sesión activa, redirige al login
  if (!session) return <Navigate to="/login" />;

  // Sesión válida: renderiza el contenido protegido
  return children;
}