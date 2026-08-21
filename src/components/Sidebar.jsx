import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import "../assets/css/Sidebar.css";

export default function Sidebar({ onOpenVehiculosServicio, onOpenHistorial, onOpenReportes, onOpenMapa, }) {
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
    <aside className={`cd-sidebar d-flex flex-column flex-shrink-0 ${colapsado ? "cd-sidebar--collapsed" : ""}`}>
      {/* Encabezado del perfil */}
      <div className="cd-sidebar__header d-flex flex-column align-items-center py-4 position-relative">
        <button
          onClick={() => setColapsado((c) => !c)}
          className="cd-sidebar__toggle btn btn-sm position-absolute top-0 end-0 m-2"
          title={colapsado ? "Expandir menú" : "Colapsar menú"}
        >
          <Icon icon={colapsado ? "mdi:chevron-right" : "mdi:chevron-left"} className="fs-5" />
        </button>

        <div className="cd-sidebar__avatar d-flex align-items-center justify-content-center rounded-circle">
          <Icon icon="mdi:shield-account" className="fs-2" />
        </div>

        {!colapsado && (
          <>
            <h2 className="mt-3 fs-6 fw-bold text-center px-2 text-truncate w-100 text-white mb-0">
              {userEmail}
            </h2>
            <p className="cd-sidebar__role small mb-0">Encargado</p>
          </>
        )}
      </div>

      <div className="px-2 py-4 flex-grow-1 overflow-auto">
        {/* Acceso rápido */}
        <div className="mb-4">
          {!colapsado && <h3 className="cd-sidebar__section-title">Acceso Rápido</h3>}

          <button
            onClick={() => openPage("/entrada")}
            className={`cd-sidebar__quick-btn cd-sidebar__quick-btn--in btn w-100 d-flex align-items-center gap-2 mb-2 ${colapsado ? "justify-content-center" : ""}`}
          >
            <span className="cd-sidebar__icon-box">
              <Icon icon="mdi:car-arrow-right" className="fs-6" />
            </span>
            {!colapsado && <span>Entrada</span>}
          </button>

          <button
            onClick={() => openPage("/salida")}
            className={`cd-sidebar__quick-btn cd-sidebar__quick-btn--out btn w-100 d-flex align-items-center gap-2 ${colapsado ? "justify-content-center" : ""}`}
          >
            <span className="cd-sidebar__icon-box">
              <Icon icon="mdi:exit-to-app" className="fs-6" />
            </span>
            {!colapsado && <span>Salida</span>}
          </button>
        </div>

        <hr className="cd-sidebar__divider" />

        {/* Gestión */}
        <div className="mb-4">
          {!colapsado && <h3 className="cd-sidebar__section-title">Gestión</h3>}

          <button
            onClick={onOpenMapa}
            className={`cd-sidebar__nav-btn btn w-100 d-flex align-items-center gap-2 mb-1 ${colapsado ? "justify-content-center" : ""}`}
          >
            <span className="cd-sidebar__icon-box cd-sidebar__icon-box--accent">
              <Icon icon="mdi:map-search" className="fs-6" />
            </span>
            {!colapsado && <span>Mapa</span>}
          </button>

          <button
            onClick={onOpenVehiculosServicio}
            className={`cd-sidebar__nav-btn btn w-100 d-flex align-items-center gap-2 mb-1 ${colapsado ? "justify-content-center" : ""}`}
          >
            <span className="cd-sidebar__icon-box cd-sidebar__icon-box--accent">
              <Icon icon="mdi:car-multiple" className="fs-6" />
            </span>
            {!colapsado && <span>Vehículos en servicio</span>}
          </button>

          <button
            onClick={onOpenReportes}
            className={`cd-sidebar__nav-btn btn w-100 d-flex align-items-center gap-2 mb-1 ${colapsado ? "justify-content-center" : ""}`}
          >
            <span className="cd-sidebar__icon-box cd-sidebar__icon-box--accent">
              <Icon icon="mdi:file-chart-outline" className="fs-6" />
            </span>
            {!colapsado && <span>Registros de incidentes</span>}
          </button>

          <button
            onClick={onOpenHistorial}
            className={`cd-sidebar__nav-btn btn w-100 d-flex align-items-center gap-2 ${colapsado ? "justify-content-center" : ""}`}
          >
            <span className="cd-sidebar__icon-box cd-sidebar__icon-box--accent">
              <Icon icon="mdi:history" className="fs-6" />
            </span>
            {!colapsado && <span>Historial</span>}
          </button>
        </div>

        <hr className="cd-sidebar__divider" />

        {/* Acciones */}
        <div>
          <button
            onClick={handleLogout}
            className={`cd-sidebar__logout-btn btn w-100 d-flex align-items-center gap-2 ${colapsado ? "justify-content-center" : ""}`}
          >
            <span className="cd-sidebar__icon-box cd-sidebar__icon-box--danger">
              <Icon icon="mdi:logout" className="fs-6" />
            </span>
            {!colapsado && <span className="fw-medium">Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}