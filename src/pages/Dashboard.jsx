/**
 * Dashboard.jsx
 * Página principal del sistema CarpeDiem para el encargado del estacionamiento.
 *
 * Muestra:
 *   - Sidebar de navegación
 *   - Mapa del estacionamiento en tiempo real (ParkingMap)
 *   - Botones de acceso rápido a las páginas de Entrada y Salida
 *     (se abren en una nueva pestaña para uso en terminales táctiles)
 *
 * Funcionalidad manual:
 *   El encargado puede hacer clic en cualquier espacio del mapa para
 *   cambiar su estado manualmente (ciclo: disponible → ocupado → reservado → disponible).
 *   Esto actualiza directamente la tabla "espacios" en Supabase.
 */

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import ParkingMap from "../components/ParkingMap";
import UltimoMovimiento from "../components/lastmove";
import VehiculosActivosModal from "../components/ActVehicles";
import HistorialReportes from "../components/HistorialReportes";
import Reportes from "../components/Reportes";

export default function Dashboard() {
  const [lastIngreso, setLastIngreso] = useState(null);
  const [lastEgreso, setLastEgreso] = useState(null);
  const [showActivosModal, setShowActivosModal] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showReportes, setShowReportes] = useState(false);
  const [sonidoActivo, setSonidoActivo] = useState(true);
  const audioCtxRef = useRef(null);

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
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq("id_espacio", espacio.id_espacio);

    if (error) console.error("Error Supabase:", error);
  };

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const reproducirSonido = (tipo) => {
    if (!sonidoActivo) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const notas = tipo === "ingreso" ? [660, 880] : [660, 440];
      notas.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.15);
      });
    } catch (e) {
      console.error("No se pudo reproducir el sonido:", e);
    }
  };

  const fetchUltimoIngreso = async () => {
    const { data: ingresos, error } = await supabase
      .from("ingreso")
      .select(`
      id_ingreso,
      patente,
      id_espacio,
      fecha_ingreso,
      hora_ingreso,
      vehiculo (
        categoria_vehiculo (
          nombre_categoria,
          valor_hora
        )
      )
    `)
      .order("fecha_ingreso", { ascending: false })
      .order("hora_ingreso", { ascending: false })
      .limit(20);

    if (error || !ingresos?.length) {
      setLastIngreso(null);
      return;
    }

    for (const ingreso of ingresos) {
      const { data: salida } = await supabase
        .from("salida")
        .select("id_salida")
        .eq("id_ingreso", ingreso.id_ingreso)
        .maybeSingle();

      if (!salida) {
        setLastIngreso({
          ...ingreso,
          categoria: ingreso.vehiculo?.categoria_vehiculo?.nombre_categoria,
          valorHora: ingreso.vehiculo?.categoria_vehiculo?.valor_hora,
          activo: true,
        });

        return;
      }
    }

    setLastIngreso(null);
  };

  const fetchUltimoEgreso = async () => {
    const { data } = await supabase
      .from("salida")
      .select(
        `
        id_salida, tiempo_total, costo_total, fecha_salida, hora_salida,
        ingreso ( patente )
      `,
      )
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ingreso" },
        () => {
          fetchUltimoIngreso();
          reproducirSonido("ingreso");
        },
      )
      .subscribe();

    const canalSalida = supabase
      .channel("dashboard-salida-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "salida" },
        () => {
          fetchUltimoEgreso();
          fetchUltimoIngreso();
          reproducirSonido("egreso");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalIngreso);
      supabase.removeChannel(canalSalida);
    };

  }, [sonidoActivo]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#eef3ef] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.10),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(238,243,239,1))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-40" />

      <div className="relative z-20 shrink-0">
        <Sidebar
          onOpenMapa={() => {
            setShowActivosModal(false);
            setShowHistorial(false);
            setShowReportes(false);
          }}

          onOpenVehiculosServicio={() => {
            setShowActivosModal((v) => !v);
            setShowHistorial(false);
            setShowReportes(false);
          }}
          onOpenHistorial={() => {
            setShowHistorial((v) => !v);
            setShowActivosModal(false);
            setShowReportes(false);
          }}
          onOpenReportes={() => {
            setShowReportes((v) => !v);
            setShowActivosModal(false);
            setShowHistorial(false);
          }}
        />
      </div>

      <div className="relative z-10 flex-1 min-w-0 h-screen flex flex-col px-3 py-3 sm:px-5 lg:px-6 lg:py-4">
        <div className="mb-3 flex items-center justify-between gap-4 rounded-[28px] border border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
          <div className="group min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 transition-all duration-300 group-hover:border-emerald-200 group-hover:bg-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse transition-transform duration-300 group-hover:scale-125" />
              Centro de control
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 transition-all duration-300 group-hover:text-emerald-700 sm:text-[2.5rem]">
              ESTACIONAMIENTO CARPEDIEM
            </h1>
            <div className="mt-4 h-1 w-16 rounded-full bg-emerald-500 transition-all duration-500 group-hover:w-28" />
          </div>

          <button
            onClick={() => setSonidoActivo((s) => !s)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-md"
            title={sonidoActivo ? "Silenciar notificaciones" : "Activar notificaciones"}
          >
            <Icon
              icon={sonidoActivo ? "mdi:volume-high" : "mdi:volume-off"}
              className="text-xl"
            />
            {sonidoActivo ? "Sonido activo" : "Silenciado"}
          </button>
        </div>

        <div className="flex-1 min-h-0 flex gap-4 xl:gap-5">
          <div className="flex-1 min-w-0 flex flex-col">
            {!showActivosModal && !showHistorial && !showReportes && (
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                    Mapa del estacionamiento
                  </h2>
                  <p className="text-sm text-slate-500">
                    Haz clic en un espacio para cambiar su estado manualmente
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 md:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Vista en vivo
                </div>
              </div>
            )}

            <div className="flex-1 min-h-0 min-w-0">
              {showActivosModal ? (
                <VehiculosActivosModal onClose={() => setShowActivosModal(false)} />
              ) : showHistorial ? (
                <HistorialReportes onClose={() => setShowHistorial(false)} />
              ) : showReportes ? (
                <Reportes onClose={() => setShowReportes(false)} />
              ) : (
                <div className="h-full min-h-[calc(100vh-180px)] overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.18)]">
                  <div className="h-full min-h-0 p-0">
                    <ParkingMap onSpotClick={handleSpotClick} />
                  </div>
                </div>
              )}
            </div>

            {!showActivosModal && !showHistorial && !showReportes && (
              <p className="pt-3 text-center text-sm text-slate-400">
                Operación continua y cambios en tiempo real.
              </p>
            )}
          </div>

          {!showActivosModal && !showHistorial && !showReportes && (
            <aside className="w-[340px] shrink-0 h-full flex flex-col gap-4 overflow-y-auto rounded-[30px] border border-slate-200/80 bg-white/85 p-4 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.16)] backdrop-blur">
              <div className="rounded-[26px] bg-emerald-50/80 border border-emerald-100 p-3.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon icon="mdi:car-arrow-right" className="text-base" />
                  </div>
                  <h2 className="text-[11px] font-bold text-emerald-700 tracking-[0.18em] uppercase">
                    Último ingreso
                  </h2>
                </div>
                <UltimoMovimiento tipo="ingreso" data={lastIngreso} />
              </div>

              <div className="rounded-[26px] bg-rose-50/80 border border-rose-100 p-3.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <Icon icon="mdi:car-arrow-left" className="text-base" />
                  </div>
                  <h2 className="text-[11px] font-bold text-rose-600 tracking-[0.18em] uppercase">
                    Último egreso
                  </h2>
                </div>
                <UltimoMovimiento tipo="egreso" data={lastEgreso} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
