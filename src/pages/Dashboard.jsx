import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import ParkingMap from "../components/ParkingMap";
import UltimoMovimiento from "../components/lastmove";
import VehiculosActivosModal from "../components/ActVehicles";
import HistorialReportes from "../components/HistorialReportes";
import Reportes from "../components/Reportes";
import Estadisticas from "../components/Statistics";
import RegistroVehicularesBeneficiados from "../components/VehicleRegistration";
import RegistroCredenciales from "../components/CredentialRegistration";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [lastIngreso, setLastIngreso] = useState(null);
  const [lastEgreso, setLastEgreso] = useState(null);
  // Sección activa del panel central: "mapa" | "vehiculos" | "historial" | "reportes"
  const [seccionActiva, setSeccionActiva] = useState("mapa");
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

  const seccionAlterna = seccionActiva !== "mapa";

  return (
    <div className="cd-dash position-relative d-flex vh-100 overflow-hidden">
      <div className="cd-dash__bg-glow" />
      <div className="cd-dash__bg-grid" />

      <div className="position-relative z-2 flex-shrink-0">
        <Sidebar
          onOpenMapa={() => setSeccionActiva("mapa")}
          onOpenVehiculosServicio={() => setSeccionActiva("vehiculos")}
          onOpenHistorial={() => setSeccionActiva("historial")}
          onOpenReportes={() => setSeccionActiva("reportes")}
          onOpenEstadisticas={() => setSeccionActiva("estadisticas")}
          onOpenRegistrosVehiculares={() => setSeccionActiva("registro_vehiculares")}
          onOpenRegistroCredenciales={() => setSeccionActiva("registro_credenciales")}
        />
      </div>

      <div className="position-relative z-1 flex-grow-1 min-w-0 vh-100 d-flex flex-column px-3 py-2 px-lg-4 py-lg-2 overflow-auto">
        {/* Header */}
        <div className="cd-dash__header d-flex align-items-center justify-content-between gap-4 mb-3">
          <div className="cd-dash__title-group min-w-0">
            <div className="cd-dash__badge d-inline-flex align-items-center gap-2">
              <span className="cd-dash__badge-dot" />
              Centro de control
            </div>

            <h1 className="cd-dash__title mt-3 mb-0">ESTACIONAMIENTO CARPEDIEM</h1>
            <div className="cd-dash__title-bar mt-3" />
          </div>

          <button
            onClick={() => setSonidoActivo((s) => !s)}
            className="cd-dash__sound-btn btn d-inline-flex align-items-center gap-2"
            title={sonidoActivo ? "Silenciar notificaciones" : "Activar notificaciones"}
          >
            <Icon icon={sonidoActivo ? "mdi:volume-high" : "mdi:volume-off"} className="fs-5" />
            {sonidoActivo ? "Sonido activo" : "Silenciado"}
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-grow-1 min-h-0 d-flex gap-4">
          <div className="flex-grow-1 min-w-0 min-h-0 d-flex flex-column">
            {!seccionAlterna && (
              <div className="mb-2 d-flex align-items-center justify-content-between gap-3 px-1">
                <div>
                  <h2 className="cd-dash__section-title mb-0">Mapa del estacionamiento</h2>
                  <p className="cd-dash__section-subtitle mb-0">
                    Haz clic en un espacio para cambiar su estado manualmente
                  </p>
                </div>
                <div className="cd-dash__live-pill d-none d-md-inline-flex align-items-center gap-2">
                  <span className="cd-dash__live-dot" />
                  Vista en vivo
                </div>
              </div>
            )}

            <div className="flex-grow-1 min-h-0 min-w-0">
              {seccionActiva === "vehiculos" ? (
                <VehiculosActivosModal 
                onClose={() => setSeccionActiva("mapa")} 
                />

              ) : seccionActiva === "historial" ? (
                <HistorialReportes
                 onClose={() => setSeccionActiva("mapa")} 
                 />

              ) : seccionActiva === "reportes" ? (
                <Reportes
                 onClose={() => setSeccionActiva("mapa")} 
                 />

              ) : seccionActiva === "estadisticas" ? (
                <Estadisticas
                 onClose={() => setSeccionActiva("mapa")} 
                 />

              ) : seccionActiva === "registro_vehiculares" ? (
                <RegistroVehicularesBeneficiados
                 onClose={() => setSeccionActiva("mapa")} 
                 />
              
              ) : seccionActiva === "registro_credenciales" ? (
                <RegistroCredenciales
                 onClose={() => setSeccionActiva("mapa")} 
                 />


              ) : (
                <div className="cd-dash__map-card h-100">
                  <div className="h-100 min-h-0 p-0">
                    <ParkingMap onSpotClick={handleSpotClick} />
                  </div>
                </div>
              )}
            </div>

            {!seccionAlterna && (
              <p className="cd-dash__footnote pt-3 mb-0 text-center">
                Operación continua y cambios en tiempo real.
              </p>
            )}
          </div>

          {!seccionAlterna && (
            <aside className="cd-dash__aside flex-shrink-0 h-100 min-h-0 d-flex flex-column gap-3 overflow-auto p-3">
              <div className="cd-dash__stat-card cd-dash__stat-card--in p-3">
                <div className="mb-3 d-flex align-items-center gap-2">
                  <div className="cd-dash__stat-icon cd-dash__stat-icon--in">
                    <Icon icon="mdi:car-arrow-right" />
                  </div>
                  <h2 className="cd-dash__stat-title cd-dash__stat-title--in mb-0">Último ingreso</h2>
                </div>
                <UltimoMovimiento tipo="ingreso" data={lastIngreso} />
              </div>

              <div className="cd-dash__stat-card cd-dash__stat-card--out p-3">
                <div className="mb-3 d-flex align-items-center gap-2">
                  <div className="cd-dash__stat-icon cd-dash__stat-icon--out">
                    <Icon icon="mdi:car-arrow-left" />
                  </div>
                  <h2 className="cd-dash__stat-title cd-dash__stat-title--out mb-0">Último egreso</h2>
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