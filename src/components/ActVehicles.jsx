import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { calcularTiempoYCosto } from "./timecost";

export default function VehiculosActivosModal({ onClose }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const cargarActivos = async () => {
    setLoading(true);

    const { data: ingresos } = await supabase
      .from("ingreso")
      .select(`
        id_ingreso, patente, id_espacio, fecha_ingreso, hora_ingreso,
        vehiculo ( categoria_vehiculo ( nombre_categoria, valor_hora ) )
      `)
      .order("hora_ingreso", { ascending: false });

    const { data: salidas } = await supabase
      .from("salida")
      .select("id_ingreso");

    const idsConSalida = new Set((salidas || []).map((s) => s.id_ingreso));
    setActivos((ingresos || []).filter((i) => !idsConSalida.has(i.id_ingreso)));
    setLoading(false);
  };

  useEffect(() => {
    cargarActivos();

    const canal = supabase
      .channel("activos-realtime")
      .on("postgres_changes",{ event:"*", schema:"public", table:"ingreso" }, cargarActivos)
      .on("postgres_changes",{ event:"*", schema:"public", table:"salida" }, cargarActivos)
      .subscribe();

    const interval = setInterval(() => setTick((t) => t + 1), 1000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(canal);
    };
  }, []);

  return (
    <div className="bg-white rounded-none shadow-md border border-gray-100 w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-4 px-8 py-5 border-b min-w-0">
        <h2 className="text-3xl font-bold text-gray-800 truncate">
          Vehículos en el estacionamiento ({activos.length})
        </h2>

        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 shrink-0">
            <Icon icon="mdi:close" className="text-2xl" />
          </button>
        )}
      </div>

      <div className="overflow-auto px-8 py-4 min-w-0">
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando...</p>
        ) : activos.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay vehículos dentro del estacionamiento</p>
        ) : (
          <table className="w-full text-lg min-w-[600px]">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-3 text-xl font-bold">Patente</th>
                <th>Categoría</th>
                <th>Espacio</th>
                <th>Ingreso</th>
                <th>Tiempo</th>
                <th>Costo est.</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((v) => {
                const valorHora = v.vehiculo?.categoria_vehiculo?.valor_hora;
                const { horas, mins, segundos, costo } = calcularTiempoYCosto(
                  v.fecha_ingreso,
                  v.hora_ingreso,
                  valorHora
                );

                return (
                  <tr key={v.id_ingreso} className="border-b last:border-0">
                    <td className="py-4 text-xl font-bold text-gray-800">{v.patente}</td>
                    <td>{v.vehiculo?.categoria_vehiculo?.nombre_categoria ?? "—"}</td>
                    <td>{v.id_espacio}</td>
                    <td>{v.hora_ingreso?.slice(0,5)}</td>
                    <td className="font-mono text-lg font-semibold">
                      {String(horas).padStart(2,"0")}:
                      {String(mins).padStart(2,"0")}:
                      {String(segundos).padStart(2,"0")}
                    </td>
                    <td className="text-xl font-bold text-emerald-600">
                      ${costo.toLocaleString("es-CL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
