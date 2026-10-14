import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import "../styles/Reportes.css";

export default function Incidentes({ onClose }) {
  const [patentes, setPatentes] = useState([]);
  const [incidentes, setIncidentes] = useState([]);

  const [patenteBusqueda, setPatenteBusqueda] = useState("");
  const [patenteSeleccionada, setPatenteSeleccionada] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const [loadingPatentes, setLoadingPatentes] = useState(true);
  const [loadingIncidentes, setLoadingIncidentes] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState({
    tipo: "",
    texto: "",
  });

  /*se encarga de cargar las patentes registradas*/
  const cargarPatentes = async () => {
    setLoadingPatentes(true);

    const { data, error } = await supabase
      .from("ingreso")
      .select("patente")
      .order("fecha_ingreso", { ascending: false });

    if (error) {
      console.error("Error cargando patentes:", error);
      setLoadingPatentes(false);
      return;
    }

    const patentesUnicas = [
      ...new Set(
        (data || []).map((vehiculo) => vehiculo.patente).filter(Boolean),
      ),
    ];

    setPatentes(patentesUnicas);
    setLoadingPatentes(false);
  };

  /* carga los incidentes regitrados por el encargado "admin" */
  const cargarIncidentes = async () => {
    setLoadingIncidentes(true);

    const { data, error } = await supabase
      .from("incidente")
      .select(
        `
        id_incidente,
        patente,
        descripcion,
        fecha
      `,
      )
      .order("fecha", { ascending: false });

    if (error) {
      console.error("Error cargando incidentes:", error);
      setLoadingIncidentes(false);
      return;
    }

    setIncidentes(data || []);
    setLoadingIncidentes(false);
  };

  useEffect(() => {
    cargarPatentes();
    cargarIncidentes();

    const canal = supabase
      .channel("incidentes-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ingreso",
        },
        () => {
          cargarPatentes();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidente",
        },
        () => {
          cargarIncidentes();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  /*se encarga de filtrar patentes*/
  const patentesFiltradas = patentes.filter((patente) =>
    patente.toLowerCase().includes(patenteBusqueda.toLowerCase()),
  );

  const seleccionarPatente = (patente) => {
    setPatenteSeleccionada(patente);
    setPatenteBusqueda(patente);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    const fechaFormateada = new Date(fecha);
    return fechaFormateada.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatearHora = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const registrarIncidente = async (e) => {
    e.preventDefault();

    setMensaje({
      tipo: "",
      texto: "",
    });
    if (!patenteSeleccionada) {
      setMensaje({
        tipo: "error",
        texto: "Debes seleccionar una patente registrada.",
      });
      return;
    }

    if (!descripcion.trim()) {
      setMensaje({
        tipo: "error",
        texto: "Debes describir lo ocurrido.",
      });
      return;
    }
    setGuardando(true);

    const { error } = await supabase.from("incidente").insert([
      {
        patente: patenteSeleccionada,
        descripcion: descripcion.trim(),
        fecha: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error registrando incidente:", error);
      setMensaje({
        tipo: "error",
        texto: "No se pudo registrar el incidente.",
      });
      setGuardando(false);
      return;
    }

    setMensaje({
      tipo: "exito",
      texto: "Incidente registrado correctamente.",
    });

    setPatenteBusqueda("");
    setPatenteSeleccionada("");
    setDescripcion("");

    await cargarIncidentes();
    setGuardando(false);
  };

  return (
    <div className="cd-rep min-vh-100 p-4 p-sm-5 d-flex flex-column gap-4">
      <header className="cd-rep__header d-flex align-items-center justify-content-between pb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="cd-rep__header-icon">
            <Icon icon="mdi:shield-alert-outline" />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 className="cd-rep__title mb-0">Incidentes</h1>
              <span className="cd-rep__tag">Operativo</span>
            </div>
            <p className="cd-rep__header-subtitle mt-1 mb-0">
              Control, reporte y seguimiento de novedades ocurridas en el
              establecimiento.
            </p>
          </div>
        </div>
      </header>

      <section className="cd-rep__stats-grid">
        <div className="cd-rep__stat-card">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="cd-rep__stat-label mb-0">Total registrados</p>
              <p className="cd-rep__stat-value mb-0">{incidentes.length}</p>
            </div>
            <div className="cd-rep__stat-icon cd-rep__stat-icon--danger">
              <Icon icon="mdi:alert-outline" />
            </div>
          </div>
          <p className="cd-rep__stat-hint mb-0">
            Incidentes almacenados en el sistema
          </p>
        </div>

        <div className="cd-rep__stat-card">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="cd-rep__stat-label mb-0">Vehículos registrados</p>
              <p className="cd-rep__stat-value mb-0">{patentes.length}</p>
            </div>
            <div className="cd-rep__stat-icon cd-rep__stat-icon--accent">
              <Icon icon="mdi:car-multiple" />
            </div>
          </div>
          <p className="cd-rep__stat-hint mb-0">
            Patentes disponibles para asociar
          </p>
        </div>

        <div className="cd-rep__stat-card">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="cd-rep__stat-label mb-0">Estado del sistema</p>
              <p className="cd-rep__stat-status mb-0">
                <span className="cd-rep__live-dot" />
                Activo
              </p>
            </div>
            <div className="cd-rep__stat-icon cd-rep__stat-icon--success">
              <Icon icon="mdi:check-circle-outline" />
            </div>
          </div>
          <p className="cd-rep__stat-hint mb-0">
            Registro y actualización en tiempo real
          </p>
        </div>
      </section>

      <section className="cd-rep__form-section">
        <div className="cd-rep__form-header d-flex flex-column flex-sm-row gap-3 align-items-sm-center justify-content-sm-between">
          <div className="d-flex align-items-center gap-3">
            <div className="cd-rep__form-header-icon">
              <Icon icon="mdi:alert-plus-outline" />
            </div>
            <div>
              <h2 className="cd-rep__form-title mb-0">
                Registrar nuevo incidente
              </h2>
              <p className="cd-rep__form-subtitle mb-0">
                Ingresa la información correspondiente al evento.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={registrarIncidente} className="p-4">
          <div className="d-flex flex-column gap-4">
            <div className="row g-4">
              <div className="col-md-4 position-relative">
                <label className="cd-rep__label mb-2">
                  Vehículo involucrado
                </label>
                <input
                  type="text"
                  value={patenteBusqueda}
                  onChange={(e) => {
                    setPatenteBusqueda(e.target.value.toUpperCase());
                    setPatenteSeleccionada("");
                  }}
                  placeholder="Escribe la patente..."
                  className="cd-rep__input form-control"
                />

                {patenteBusqueda && !patenteSeleccionada && (
                  <div className="cd-rep__dropdown">
                    {loadingPatentes ? (
                      <div className="cd-rep__dropdown-loading d-flex align-items-center gap-2 px-3 py-3">
                        <Icon icon="mdi:loading" className="cd-rep__spin" />
                        Buscando...
                      </div>
                    ) : patentesFiltradas.length === 0 ? (
                      <div className="cd-rep__dropdown-empty px-3 py-3">
                        No se encontraron coincidencias.
                      </div>
                    ) : (
                      patentesFiltradas.map((patente) => (
                        <button
                          key={patente}
                          type="button"
                          onClick={() => seleccionarPatente(patente)}
                          className="cd-rep__dropdown-item d-flex align-items-center justify-content-between"
                        >
                          <span className="d-flex align-items-center gap-2">
                            <Icon icon="mdi:car-outline" />
                            <span className="fw-bold">{patente}</span>
                          </span>
                          <Icon
                            icon="mdi:arrow-right"
                            className="cd-rep__dropdown-arrow"
                          />
                        </button>
                      ))
                    )}
                  </div>
                )}

                {patenteSeleccionada && (
                  <div className="cd-rep__selected d-flex align-items-center justify-content-between mt-2">
                    <span className="d-flex align-items-center gap-2">
                      <Icon
                        icon="mdi:check-circle"
                        className="cd-rep__selected-check"
                      />
                      <span className="fw-bold">{patenteSeleccionada}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPatenteSeleccionada("");
                        setPatenteBusqueda("");
                      }}
                      className="cd-rep__selected-clear"
                    >
                      <Icon icon="mdi:close" />
                    </button>
                  </div>
                )}
              </div>

              <div className="col-md-8">
                <label className="cd-rep__label mb-2">
                  Descripción del incidente
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Detalla lo ocurrido de la manera más clara posible..."
                  className="cd-rep__textarea form-control"
                />
                <div className="cd-rep__char-count mt-1">
                  {descripcion.length} caracteres
                </div>
              </div>
            </div>

            <div className="cd-rep__submit-row d-flex justify-content-end pt-3">
              <button
                type="submit"
                disabled={guardando}
                className="cd-rep__submit-btn btn"
              >
                {guardando ? (
                  <>
                    <Icon icon="mdi:loading" className="cd-rep__spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:plus" />
                    Registrar incidente
                  </>
                )}
              </button>
            </div>
          </div>

          {mensaje.texto && (
            <div
              className={`cd-rep__alert mt-3 d-flex align-items-center gap-2 ${
                mensaje.tipo === "error"
                  ? "cd-rep__alert--error"
                  : "cd-rep__alert--success"
              }`}
            >
              <Icon
                icon={
                  mensaje.tipo === "error"
                    ? "mdi:alert-circle-outline"
                    : "mdi:check-circle-outline"
                }
                className="flex-shrink-0 fs-5"
              />
              <p className="mb-0">{mensaje.texto}</p>
            </div>
          )}
        </form>
      </section>

      <section className="d-flex flex-column gap-3">
        <div className="cd-rep__history-toggle-row d-flex flex-column flex-sm-row align-items-sm-center justify-content-sm-between gap-3">
          <div>
            <h2 className="cd-rep__form-title mb-0">Historial de incidentes</h2>
            <p className="cd-rep__form-subtitle mb-0">
              Consulta los eventos que fueron registrados anteriormente en el
              sistema.
            </p>
          </div>
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="cd-rep__toggle-btn btn d-flex align-items-center gap-2"
          >
            <Icon icon={mostrarHistorial ? "mdi:chevron-up" : "mdi:history"} />
            {mostrarHistorial ? "Ocultar historial" : "Ver historial"}
          </button>
        </div>

        {mostrarHistorial && (
          <div className="cd-rep__history">
            <div className="cd-rep__history-head d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Icon icon="mdi:clipboard-text-clock-outline" />
                <span className="fw-bold">Registros anteriores</span>
              </div>
              <span className="cd-rep__history-count">
                {incidentes.length} eventos
              </span>
            </div>

            {loadingIncidentes ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2 cd-rep__empty-text">
                <Icon
                  icon="mdi:loading"
                  className="cd-rep__spin cd-rep__spin--lg"
                />
                <p className="small mb-0">Sincronizando registros...</p>
              </div>
            ) : incidentes.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center p-4">
                <Icon
                  icon="mdi:clipboard-check-outline"
                  className="cd-rep__empty-icon mb-2"
                />
                <h3 className="cd-rep__empty-title mb-0">No hay incidentes</h3>
                <p className="cd-rep__empty-text mt-1 mb-0">
                  La lista de incidencias está limpia.
                </p>
              </div>
            ) : (
              <div className="cd-rep__history-list">
                {incidentes.map((incidente) => (
                  <article
                    key={incidente.id_incidente}
                    className="cd-rep__history-item d-flex flex-column flex-sm-row justify-content-between gap-3"
                  >
                    <div className="d-flex align-items-start gap-3 w-100">
                      <div className="cd-rep__history-icon">
                        <Icon icon="mdi:alert-outline" />
                      </div>

                      <div className="d-flex flex-column gap-2 w-100">
                        <div className="d-flex flex-wrap align-items-center gap-3">
                          <span className="cd-rep__history-plate">
                            {incidente.patente}
                          </span>
                          <div className="cd-rep__history-meta d-flex align-items-center gap-1">
                            <Icon icon="mdi:calendar-outline" />
                            {formatearFecha(incidente.fecha)}
                          </div>
                          <div className="cd-rep__history-meta d-flex align-items-center gap-1">
                            <Icon icon="mdi:clock-outline" />
                            {formatearHora(incidente.fecha)}
                          </div>
                        </div>
                        <p className="cd-rep__history-desc mb-0">
                          {incidente.descripcion}
                        </p>
                      </div>
                    </div>

                    <div className="align-self-end align-self-sm-start flex-shrink-0">
                      <span className="cd-rep__history-badge">Incidente</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
