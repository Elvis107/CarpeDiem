/**
 * Dashboard.jsx
 * Página principal del sistema CarpeDiem para el encargado del estacionamiento.
 * OPTIMIZADO: Diseño limpio a pantalla completa, sin desbordamientos ni cortes visuales.
 */

import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import ParkingMap from "../components/ParkingMap";
import VehiculosActivosModal from "../components/ActVehicles";

export default function Dashboard() {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [lastIngreso, setLastIngreso] = useState(null);
  const [lastEgreso, setLastEgreso] = useState(null);
  const [showActivosModal, setShowActivosModal] = useState(false);
  
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [showEgresoModal, setShowEgresoModal] = useState(false);

  const openPage = (path) => window.open(path, "_blank");

  const handleSpotClick = async (espacio) => {
    if (!espacio) return;

    const ciclo = {
      disponible: "ocupado",
      ocupado: "reservado",
      reservado: "disponible",
    };

    const nuevoEstado = ciclo[espacio.estado] || "disponible";

    const { error } = await supabase
      .from("espacios")
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id_espacio", espacio.id_espacio);

    if (error) console.error("Error Supabase:", error);
  };

  const fetchUltimoIngreso = async () => {
    const { data } = await supabase
      .from("ingreso")
      .select(`
        id_ingreso, patente, id_espacio, fecha_ingreso, hora_ingreso,
        vehiculo ( categoria_vehiculo ( nombre_categoria, valor_hora ) )
      `)
      .order("fecha_ingreso", { ascending: false })
      .order("hora_ingreso", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const { data: salidaExistente } = await supabase
        .from("salida")
        .select("id_salida")
        .eq("id_ingreso", data.id_ingreso)
        .maybeSingle();

      setLastIngreso({
        ...data,
        categoria: data.vehiculo?.categoria_vehiculo?.nombre_categoria,
        valorHora: data.vehiculo?.categoria_vehiculo?.valor_hora,
        activo: !salidaExistente,
      });
    }
  };

  const fetchUltimoEgreso = async () => {
    const { data } = await supabase
      .from("salida")
      .select(`
        id_salida, tiempo_total, costo_total, fecha_salida, hora_salida,
        ingreso ( patente )
      `)
      .order("fecha_salida", { ascending: false })
      .order("hora_salida", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLastEgreso({ ...data, patente: data.ingreso?.patente });
    }
  };

  useEffect(() => {
    fetchUltimoIngreso();
    fetchUltimoEgreso();

    const canalIngreso = supabase
      .channel("dashboard-ingreso-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ingreso" }, fetchUltimoIngreso)
      .subscribe();

    const canalSalida = supabase
      .channel("dashboard-salida-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "salida" }, () => {
        fetchUltimoEgreso();
        fetchUltimoIngreso();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalIngreso);
      supabase.removeChannel(canalSalida);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] overflow-hidden antialiased font-sans text-slate-600">
      {/* Sidebar con las acciones asignadas y datos reactivos */}
  <Sidebar
    lastIngreso={lastIngreso}
    lastEgreso={lastEgreso}
    onIngresoClick={() => setShowIngresoModal(true)}
    onEgresoClick={() => setShowEgresoModal(true)}
    onActivosClick={() => setShowActivosModal(true)}
    onHistorialClick={() => {
    alert("Historial: Aquí renderizaremos la tabla con los registros históricos próximamente.");
  }}
      onLogout={async () => {
    // Si usas la autenticación de Supabase, descomenta la siguiente línea:
    // await supabase.auth.signOut();
    alert("Cerrando sesión...");
  }}
      />
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* CABECERA PREMIUM */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 h-24 px-8 shrink-0 flex items-center justify-between sticky top-0 z-20 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 shadow-inner">
                <Icon icon="mdi:view-dashboard" className="text-xl" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                  Panel de Control
                </h1>
                <p className="text-xs text-slate-400 font-medium">Estado del estacionamiento en tiempo real</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openPage("/entrada")}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 hover:-translate-y-0.5 active:translate-y-0 text-white text-base font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-indigo-600/20 tracking-wide"
            >
              <Icon icon="mdi:car-arrow-right" className="text-3xl" />
              Registrar Entrada
            </button>
            
            <button
              onClick={() => openPage("/salida")}
              className="flex items-center gap-3 bg-white hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 text-slate-700 text-base font-bold px-7 py-3.5 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md border border-slate-200 tracking-wide"
            >
              <Icon icon="mdi:exit-to-app" className="text-3xl text-slate-400" />
              Registrar Salida
            </button>
          </div>
        </header>

        {/* ÁREA DE TRABAJO PRINCIPAL */}
        <main className="flex-1 p-4 md:p-6 min-h-0 w-full max-w-[1600px] mx-auto flex flex-col">
          
          {/* MAPA CENTRAL TOTALMENTE LIMPIO Y SEGURO CONTRA CORTES */}
          <section className="bg-white border border-slate-200/70 rounded-3xl p-4 w-full h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="w-full flex-1 bg-[#f8fafc]/90 rounded-2xl border border-slate-200/50 flex justify-center items-start md:items-center overflow-y-auto shadow-inner p-4">
              <ParkingMap onSpotClick={handleSpotClick} />
            </div>
          </section>

        </main>
      </div>

      {/* ======================================================== */}
      {/* MODALS DE MOVIMIENTOS E INFORMACIÓN                        */}
      {/* ======================================================== */}

      {/* 1. MODAL DETALLE ÚLTIMO INGRESO */}
      {showIngresoModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 p-10 shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <Icon icon="mdi:login" className="text-2xl" />
                <h3 className="font-bold text-xl text-slate-800">Detalle Último Ingreso</h3>
              </div>
              <button 
                onClick={() => setShowIngresoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>
            
            {lastIngreso ? (
              <div className="space-y-3.5 py-2">
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Patente Vehículo</span>
                  <span className="text-4xl font-mono font-black text-slate-800 tracking-wider block mt-1.5 uppercase">{lastIngreso.patente}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block">Fecha:</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{lastIngreso.fecha_ingreso}</span>
                  </div>
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block">Hora Entrada:</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{lastIngreso.hora_ingreso} hrs</span>
                  </div>
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block">Categoría:</span>
                    <span className="font-bold text-indigo-600 block mt-0.5">{lastIngreso.categoria || "Normal"}</span>
                  </div>
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block">Tarifa por Hora:</span>
                    <span className="font-bold text-emerald-600 block mt-0.5">${lastIngreso.valorHora || "N/A"}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2 py-2 border-t border-slate-100 text-xs font-bold uppercase">
                  <span className={`w-2.5 h-2.5 rounded-full ${lastIngreso.activo ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                  <span className={lastIngreso.activo ? "text-emerald-600" : "text-slate-500"}>
                    {lastIngreso.activo ? "Vehículo actualmente en el recinto" : "Servicio Finalizado"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No hay registros de ingresos disponibles.</p>
            )}
            
            <button 
              onClick={() => setShowIngresoModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors mt-2"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      {/* 2. MODAL DETALLE ÚLTIMO EGRESO */}
      {showEgresoModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 p-10 shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Icon icon="mdi:logout" className="text-2xl" />
                <h3 className="font-bold text-xl text-slate-800">Detalle Último Egreso</h3>
              </div>
              <button 
                onClick={() => setShowEgresoModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>
            
            {lastEgreso ? (
              <div className="space-y-3.5 py-2">
                <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Patente Vehículo</span>
                  <span className="text-4xl font-mono font-black text-slate-800 tracking-wider block mt-1.5 uppercase">{lastEgreso.patente}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block">Fecha Salida:</span>
                    <span className="font-bold text-slate-700 block mt-0.5">{lastEgreso.fecha_salida}</span>
                  </div>
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-400 font-semibold block">Hora Salida:</span>
                    <span className="font-bold text-slate-700 block mt-0.5">
                      {String(lastEgreso.hora_salida).split(".")[0]} hrs
                    </span>
                  </div>
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 col-span-2 flex justify-between items-center px-4 py-3">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">Tiempo Transcurrido:</span>
                      <span className="font-bold text-slate-700 text-base block mt-0.5">
                        {(() => {
                          const minutos = Number(lastEgreso.tiempo_total) || 0;
                          const horas = Math.floor(minutos / 60);
                          const minRestantes = minutos % 60;
                          return `${horas}h ${minRestantes}m`;
                        })()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold block">Total Cobrado:</span>
                      <span className="font-black text-emerald-600 text-lg block mt-0.5">${Number(lastEgreso.costo_total).toLocaleString("es-CL")}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No hay registros de egresos disponibles.</p>
            )}
            
            <button 
              onClick={() => setShowEgresoModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm transition-colors mt-2"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      {/* Modal de Vehículos Activos */}
      {showActivosModal && (
        <VehiculosActivosModal onClose={() => setShowActivosModal(false)} />
      )}
    </div>
  );
}