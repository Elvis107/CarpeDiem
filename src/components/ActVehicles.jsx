/**
 * VehiculosActivosModal.jsx
 * -------------------------
 * Modal del Dashboard que lista todos los vehículos dentro del estacionamiento.
 * Layout Extra Grande (XL): Altura y anchura forzadas para evitar colapsos visuales.
 */

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { calcularTiempoYCosto } from "./timecost";

export default function VehiculosActivosModal({ onClose }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0); // Fuerza re-render cada segundo para actualizar contadores

  const cargarActivos = async () => {
    setLoading(true);

    const { data: ingresos } = await supabase
      .from("ingreso")
      .select(`
        id_ingreso, 
        patente, 
        id_espacio, 
        fecha_ingreso, 
        hora_ingreso,
        vehiculo ( categoria_vehiculo ( nombre_categoria, valor_hora ) )
      `)
      .order("hora_ingreso", { ascending: false });

    const { data: salidas } = await supabase
      .from("salida")
      .select("id_ingreso");

    const idsConSalida = new Set((salidas || []).map((s) => s.id_ingreso));
    const abiertos = (ingresos || []).filter((i) => !idsConSalida.has(i.id_ingreso));

    setActivos(abiertos);
    setLoading(false);
  };

  useEffect(() => {
    cargarActivos();

    const canal = supabase
      .channel("activos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingreso" }, cargarActivos)
      .on("postgres_changes", { event: "*", schema: "public", table: "salida" }, cargarActivos)
      .subscribe();

    const interval = setInterval(() => setTick((t) => t + 1), 1000);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
      
      {/* CONTENEDOR XL: Forzamos un alto del 75vh y un min-height para que se vea largo y estilizado */}
      <div className="bg-white rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] w-[92vw] max-w-6xl h-[75vh] min-h-[550px] overflow-hidden flex flex-col border border-slate-100">
        
        {/* CABECERA GIGANTE */}
        <div className="flex items-center justify-between px-8 py-6 shrink-0 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Vehículos en el Estacionamiento
            </h2>
            <span className="bg-indigo-50 text-indigo-600 text-sm font-black px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm">
              {activos.length} activos
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-all flex items-center justify-center active:scale-95"
          >
            <Icon icon="mdi:close" className="text-2xl" />
          </button>
        </div>

        {/* CUERPO INTERNO CON SCROLL INDEPENDIENTE */}
        <div className="flex-1 overflow-y-auto w-full scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Icon icon="mdi:loading" className="text-5xl text-indigo-500 animate-spin" />
              <p className="text-base font-bold text-slate-400">Sincronizando registros...</p>
            </div>
          ) : activos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <Icon icon="mdi:car-off" className="text-4xl" />
              </div>
              <p className="text-base font-bold text-slate-400">
                No hay vehículos dentro del establecimiento en este momento.
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left table-auto">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Patente</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Espacio</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ingreso</th>
                  <th className="px-6 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Tiempo Acumulado</th>
                  <th className="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Costo Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activos.map((v) => {
                  const valorHora = v.vehiculo?.categoria_vehiculo?.valor_hora;
                  const { horas, mins, segundos, costo } = calcularTiempoYCosto(
                    v.fecha_ingreso,
                    v.hora_ingreso,
                    valorHora
                  );

                  const esGrande = v.vehiculo?.categoria_vehiculo?.nombre_categoria?.toLowerCase() === "grande";

                  return (
                    <tr 
                      key={v.id_ingreso} 
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* PATENTE */}
                      <td className="px-8 py-5.5">
                        <span className="inline-block font-mono font-black text-base tracking-wider text-slate-800 uppercase bg-slate-50 border-2 border-slate-200 px-3.5 py-1.5 rounded-xl shadow-inner text-center min-w-[115px]">
                          {v.patente}
                        </span>
                      </td>

                      {/* CATEGORÍA */}
                      <td className="px-6 py-5.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl border ${
                          esGrande 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          <Icon icon={esGrande ? "mdi:truck" : "mdi:car"} className="text-base" />
                          {v.vehiculo?.categoria_vehiculo?.nombre_categoria || "—"}
                        </span>
                      </td>

                      {/* ESPACIO */}
                      <td className="px-6 py-5.5">
                        {v.id_espacio ? (
                          <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
                            {v.id_espacio}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic bg-slate-50 border border-slate-200/40 px-3 py-1.5 rounded-xl">
                            No asignado
                          </span>
                        )}
                      </td>

                      {/* HORA INGRESO */}
                      <td className="px-6 py-5.5">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-bold">
                          <Icon icon="mdi:clock-outline" className="text-slate-400 text-lg" />
                          {v.hora_ingreso?.slice(0, 5)} hrs
                        </div>
                      </td>

                      {/* TIEMPO */}
                      <td className="px-6 py-5.5">
                        <span className="font-mono font-black text-sm bg-slate-900 text-slate-100 px-3 py-1.5 rounded-xl shadow-sm border border-slate-800 tracking-wider">
                          {String(horas).padStart(2, "0")}:
                          {String(mins).padStart(2, "0")}:
                          {String(segundos).padStart(2, "0")}
                        </span>
                      </td>

                      {/* COSTO TOTAL (Alineado a la derecha con margen seguro) */}
                      <td className="px-8 py-5.5 text-right">
                        <span className="text-lg font-black text-emerald-600 tracking-tight whitespace-nowrap">
                          ${costo.toLocaleString("es-CL")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
      </div>
    </div>
  );
}