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
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import ParkingMap from "../components/ParkingMap";
import UltimoMovimiento from "../components/lastmove";
import VehiculosActivosModal from "../components/ActVehicles";

export default function Dashboard() {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [lastIngreso, setLastIngreso] = useState(null);
  const [lastEgreso, setLastEgreso] = useState(null);
  const [showActivosModal, setShowActivosModal] = useState(false);

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
        fetchUltimoIngreso,
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
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalIngreso);
      supabase.removeChannel(canalSalida);
    };
  }, []);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 h-screen bg-gray-50 overflow-y-auto relative">
        {/* Botones arriba a la derecha */}
        <div className="absolute top-6 right-6 flex gap-3 z-10">
          <button
            onClick={() => openPage("/entrada")}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-base font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <Icon icon="mdi:car-arrow-right" className="text-xl" />
            Entrada
          </button>
          <button
            onClick={() => openPage("/salida")}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-base font-semibold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <Icon icon="mdi:exit-to-app" className="text-xl" />
            Salida
          </button>
        </div>

        <div className="flex flex-col items-center justify-center min-h-screen py-20 gap-8">
          <h1 className="text-xl font-bold text-gray-700">
            Mapa del estacionamiento
          </h1>

          {/* Mapa */}
          <ParkingMap onSpotClick={handleSpotClick} />
          <p className="text-sm text-gray-400 -mt-4">
            Haz clic en un espacio para cambiar su estado manualmente
          </p>

          {/* Paneles de último ingreso / egreso + acceso a vehículos activos */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <UltimoMovimiento tipo="ingreso" data={lastIngreso} />
            <UltimoMovimiento tipo="egreso" data={lastEgreso} />

            <button
              onClick={() => setShowActivosModal(true)}
              className="rounded-2xl p-5 shadow-md border bg-blue-50 border-blue-200 flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-all"
            >
              <Icon
                icon="mdi:car-multiple"
                className="text-3xl text-blue-600"
              />
              <span className="font-bold text-gray-700">
                Ver vehículos en el estacionamiento
              </span>
            </button>
          </div>
        </div>
      </div>

      {showActivosModal && (
        <VehiculosActivosModal onClose={() => setShowActivosModal(false)} />
      )}
    </div>
  );
}
