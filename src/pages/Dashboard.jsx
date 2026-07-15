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

export default function Dashboard() {
  const [lastIngreso, setLastIngreso] = useState(null);
  const [lastEgreso, setLastEgreso] = useState(null);
  const [showActivosModal, setShowActivosModal] = useState(false);
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
    const { data } = await supabase
      .from("ingreso")
      .select(
        `
        id_ingreso, patente, id_espacio, fecha_ingreso, hora_ingreso,
        vehiculo ( categoria_vehiculo ( nombre_categoria, valor_hora ) )
      `,
      )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sonidoActivo]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onOpenVehiculosServicio={() => setShowActivosModal(true)} />

      {/* Columna izquierda: último ingreso arriba, último egreso abajo */}
      <div className="w-[400px] shrink-0 h-screen flex flex-col p-6 gap-4 overflow-y-auto bg-gray-50">
        <div className="flex-1 flex flex-col">
          <h2 className="text-sm font-bold text-gray-400 tracking-widest mb-3">
            ÚLTIMO INGRESO
          </h2>
          <UltimoMovimiento tipo="ingreso" data={lastIngreso} />
        </div>

        <div className="flex-1 flex flex-col">
          <h2 className="text-sm font-bold text-gray-400 tracking-widest mb-3">
            ÚLTIMO EGRESO
          </h2>
          <UltimoMovimiento tipo="egreso" data={lastEgreso} />
        </div>
      </div>

      {/* Columna derecha: mapa del estacionamiento (ocupa el resto) */}
      <div className="flex-1 h-screen relative bg-white flex flex-col">
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={() => setSonidoActivo((s) => !s)}
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-600 px-4 py-3 rounded-xl transition-all shadow-md border"
            title={sonidoActivo ? "Silenciar notificaciones" : "Activar notificaciones"}
          >
            <Icon
              icon={sonidoActivo ? "mdi:volume-high" : "mdi:volume-off"}
              className="text-xl"
            />
          </button>
        </div>

        <h1 className="text-xl font-bold text-gray-700 text-center pt-6">
          Mapa del estacionamiento
        </h1>

        <div className="flex-1 min-h-0 p-6">
          <ParkingMap onSpotClick={handleSpotClick} />
        </div>

        <p className="text-center text-sm text-gray-400 pb-4">
          Haz clic en un espacio para cambiar su estado manualmente
        </p>
      </div>

      {showActivosModal && (
        <VehiculosActivosModal onClose={() => setShowActivosModal(false)} />
      )}
    </div>
  );
}