import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";

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
        (data || [])
          .map((vehiculo) => vehiculo.patente)
          .filter(Boolean)
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
      .select(`
        id_incidente,
        patente,
        descripcion,
        fecha
      `)
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
        }
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  /*se encarga de filtrar patentes*/
  const patentesFiltradas = patentes.filter((patente) =>
    patente
      .toLowerCase()
      .includes(patenteBusqueda.toLowerCase())
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

    const { error } = await supabase
      .from("incidente")
      .insert([
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
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-800 antialiased p-6 sm:p-8 flex flex-col gap-6">
      <header className="w-full flex flex-row items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Icon icon="mdi:shield-alert-outline" className="text-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                Incidentes
              </h1>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600">
                Operativo
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Control, reporte y seguimiento de novedades ocurridas en el establecimiento.
            </p>
          </div>
        </div>
      </header>
      <section className="w-full grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total registrados
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900">
                {incidentes.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500 shadow-sm">
              <Icon icon="mdi:alert-outline" className="text-xl" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Incidentes almacenados en el sistema</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Vehículos registrados
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900">
                {patentes.length}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-500 shadow-sm">
              <Icon icon="mdi:car-multiple" className="text-xl" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Patentes disponibles para asociar</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estado del sistema
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-black text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Activo
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 shadow-sm">
              <Icon icon="mdi:check-circle-outline" className="text-xl" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Registro y actualización en tiempo real</p>
        </div>
      </section>
      <section className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-visible">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Icon icon="mdi:alert-plus-outline" className="text-xl" />
            </div>
            <div>
              <h2 className="text-md font-bold text-slate-900">Registrar nuevo incidente</h2>
              <p className="text-xs text-slate-500">Ingresa la información correspondiente al evento.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
            <Icon icon="mdi:information-outline" className="text-sm" />
            La información quedará guardada de forma permanente
          </div>
        </div>

        <form onSubmit={registrarIncidente} className="p-6">
          <div className="flex flex-col gap-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative flex flex-col">
                <label className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Vehículo involucrado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={patenteBusqueda}
                    onChange={(e) => {
                      setPatenteBusqueda(e.target.value.toUpperCase());
                      setPatenteSeleccionada("");
                    }}
                    placeholder="Escribe la patente..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold uppercase tracking-wider text-slate-800 outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-100"
                  />
                </div>
                {patenteBusqueda && !patenteSeleccionada && (
                  <div className="absolute left-0 right-0 top-[72px] z-30 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    {loadingPatentes ? (
                      <div className="flex items-center gap-3 px-3 py-3 text-xs text-slate-500">
                        <Icon icon="mdi:loading" className="animate-spin text-lg text-rose-500" />
                        Buscando...
                      </div>
                    ) : patentesFiltradas.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-slate-500 italic">
                        No se encontraron coincidencias.
                      </div>
                    ) : (
                      patentesFiltradas.map((patente) => (
                        <button
                          key={patente}
                          type="button"
                          onClick={() => seleccionarPatente(patente)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-rose-50/70"
                        >
                          <div className="flex items-center gap-3">
                            <Icon icon="mdi:car-outline" className="text-slate-500" />
                            <span className="font-bold text-slate-800">{patente}</span>
                          </div>
                          <Icon icon="mdi:arrow-right" className="text-slate-300 text-sm" />
                        </button>
                      ))
                    )}
                  </div>
                )}
                {patenteSeleccionada && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:check-circle" className="text-emerald-500" />
                      <span className="font-black text-slate-800">{patenteSeleccionada}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPatenteSeleccionada("");
                        setPatenteBusqueda("");
                      }}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Icon icon="mdi:close" />
                    </button>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex flex-col">
                <label className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
                  Descripción del incidente
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Detalla lo ocurrido de la manera más clara posible..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none transition-all focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-100"
                />
                <div className="mt-1 text-right text-[11px] text-slate-400 font-medium">
                  {descripcion.length} caracteres
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="submit"
                disabled={guardando}
                className="flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin" />
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
              className={`mt-3 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold ${
                mensaje.tipo === "error"
                  ? "border border-rose-200 bg-rose-50 text-rose-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <Icon
                icon={mensaje.tipo === "error" ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"}
                className="text-lg shrink-0"
              />
              <p>{mensaje.texto}</p>
            </div>
          )}
        </form>
      </section>
      <section className="w-full flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-md font-bold text-slate-900">Historial de incidentes</h2>
            <p className="text-xs text-slate-500">Consulta los eventos que fueron registrados anteriormente en el sistema.</p>
          </div>
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 shadow-sm"
          >
            <Icon icon={mostrarHistorial ? "mdi:chevron-up" : "mdi:history"} className="text-lg" />
            {mostrarHistorial ? "Ocultar historial" : "Ver historial"}
          </button>
        </div>

        {mostrarHistorial && (
          <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:clipboard-text-clock-outline" className="text-slate-500" />
                <span className="font-bold text-slate-700 text-xs">Registros anteriores</span>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                {incidentes.length} eventos
              </span>
            </div>

            {loadingIncidentes ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Icon icon="mdi:loading" className="animate-spin text-3xl text-rose-500" />
                <p className="text-xs">Sincronizando registros...</p>
              </div>
            ) : incidentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center p-6">
                <Icon icon="mdi:clipboard-check-outline" className="text-4xl text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No hay incidentes</h3>
                <p className="text-xs text-slate-400 mt-0.5">La lista de incidencias está limpia.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {incidentes.map((incidente) => (
                  <article
                    key={incidente.id_incidente}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50"
                  >
                    <div className="flex items-start gap-3.5 w-full">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100">
                        <Icon icon="mdi:alert-outline" className="text-lg" />
                      </div>

                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-black tracking-widest text-white">
                            {incidente.patente}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Icon icon="mdi:calendar-outline" />
                            {formatearFecha(incidente.fecha)}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Icon icon="mdi:clock-outline" />
                            {formatearHora(incidente.fecha)}
                          </div>
                        </div>
                        <p className="text-xs leading-5 text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 mt-0.5 w-full">
                          {incidente.descripcion}
                        </p>
                      </div>
                    </div>

                    <div className="self-end sm:self-start shrink-0">
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
                        Incidente
                      </span>
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