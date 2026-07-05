/**
 * ParkingMap.jsx
 * --------------
 * Mapa visual en tiempo real del estacionamiento Carpe Diem.
 *
 * Muestra los 32 espacios del estacionamiento distribuidos en dos columnas
 * laterales y un pasillo central. Los colores de cada espacio reflejan
 * su estado actual obtenido desde Supabase con suscripción en tiempo real.
 *
 * Colores de estado:
 *   - Verde  → disponible
 *   - Rojo   → ocupado
 *   - Amarillo → reservado
 *
 * Espacios XL (para vehículos grandes): 1, 2, 3, 17, 18, 19, 20
 * Espacios L  (normales):               resto
 *
 * Props:
 *   onSpotClick (función, opcional) → se ejecuta al hacer clic en un espacio.
 *     Recibe el objeto del espacio desde Supabase: { id_espacio, estado, patente, ... }
 *     Si no se pasa, el mapa es solo de lectura.
 */

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ParkingMap({ onSpotClick }) {
  // Lista de espacios cargados desde Supabase
  const [espacios, setEspacios] = useState([]);

  useEffect(() => {
    /**
     * Carga inicial de todos los espacios del estacionamiento
     * ordenados por id_espacio.
     */
    const fetchEspacios = async () => {
      const { data } = await supabase
        .from("espacios")
        .select("*")
        .order("id_espacio");
      if (data) setEspacios(data);
    };

    fetchEspacios();

    /**
     * Suscripción en tiempo real a cambios en la tabla "espacios".
     * Cuando Supabase emite un evento (INSERT, UPDATE, DELETE),
     * actualiza solo el espacio afectado en el estado local.
     */
    const channel = supabase
      .channel("espacios-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "espacios",
        },
        (payload) => {
          setEspacios((prev) =>
            prev.map((e) =>
              e.id_espacio === payload.new.id_espacio ? payload.new : e,
            ),
          );
        },
      )
      .subscribe();

    // Limpieza: cancela la suscripción al desmontar el componente
    return () => supabase.removeChannel(channel);
  }, []);

  /**
   * Determina si un espacio es de tipo XL (vehículo grande).
   * @param {number} n - Número de espacio
   * @returns {boolean}
   */
  const isXL = (n) => [1, 2, 3, 17, 18, 19, 20].includes(n);

  /**
   * Retorna las clases de color Tailwind según el estado del espacio.
   * @param {string} estado - "disponible" | "ocupado" | "reservado"
   * @returns {string} - Clases de Tailwind CSS
   */
  const getColor = (estado) => {
    if (estado === "ocupado") return "bg-red-400 border-red-500 text-white";
    if (estado === "reservado")
      return "bg-yellow-300 border-yellow-500 text-yellow-900";
    return "bg-green-100 border-green-400 text-green-800"; // disponible
  };

  // Espacios de la columna izquierda (del 32 al 17, de arriba hacia abajo)
  const leftSpots = [
    32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
  ];

  // Espacios de la columna derecha (del 1 al 16, de arriba hacia abajo)
  const rightSpots = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  /**
   * Busca en el estado local el objeto de un espacio por su número.
   * @param {number} id - Número de espacio
   * @returns {object|undefined}
   */
  const getEspacio = (id) =>
    espacios.find((e) => Number(e.id_espacio) === Number(id));

  return (
    <div className="bg-[#d8e8d3] rounded-[35px] p-8 shadow-2xl flex gap-8 items-start">
      {/* Columna izquierda (espacios 17–32) */}
      <div className="flex flex-col gap-2">
        {leftSpots.map((n) => {
          const e = getEspacio(n);
          return (
            <div
              key={n}
              onClick={() => onSpotClick && onSpotClick(e)}
              className={`w-20 h-11 rounded-xl flex flex-col items-center justify-center border text-xs font-semibold cursor-pointer transition-all ${getColor(e?.estado)}`}
            >
              {/* Etiqueta XL o L según tipo de espacio */}
              <span>{isXL(n) ? `XL ${n}` : `L ${n}`}</span>

              {/* Patente del vehículo si el espacio está ocupado */}
              {e?.patente && (
                <span className="text-[9px] opacity-75">{e.patente}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Pasillo central (representación visual del área de circulación) */}
      <div className="w-[200px] min-h-[600px] rounded-[30px] border-[5px] border-green-700 flex flex-col items-center justify-start pt-8 gap-2">
        {/* 6 cajones internos (zona techada o referencia visual) */}
        {[1, 2, 3, 4, 5, 6].map((x) => (
          <div key={x} className="w-20 h-16 bg-gray-100 border rounded-md" />
        ))}
      </div>

      {/* Columna derecha (espacios 1–16) */}
      <div className="flex flex-col gap-2">
        {rightSpots.map((n) => {
          const e = getEspacio(n);
          return (
            <div
              key={n}
              onClick={() => onSpotClick && onSpotClick(e)}
              className={`w-20 h-11 rounded-xl flex flex-col items-center justify-center border text-xs font-semibold cursor-pointer transition-all ${getColor(e?.estado)}`}
            >
              <span>{isXL(n) ? `XL ${n}` : `L ${n}`}</span>
              {e?.patente && (
                <span className="text-[9px] opacity-75">{e.patente}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
