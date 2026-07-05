import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { calcularTiempoYCosto } from "./timecost";

export default function VehiculosActivosModal({ onClose }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0); // fuerza re-render para refrescar el tiempo/costo

  const cargarActivos = async () => {
    setLoading(true);

    const { data: ingresos } = await supabase
      .from("ingreso")
      .select(
        `
        id_ingreso, patente, id_espacio, fecha_ingreso, hora_ingreso,
        vehiculo ( categoria_vehiculo ( nombre_categoria, valor_hora ) )
      `,
      )
      .order("hora_ingreso", { ascending: false });

    const { data: salidas } = await supabase
      .from("salida")
      .select("id_ingreso");

    const idsConSalida = new Set((salidas || []).map((s) => s.id_ingreso));
    const abiertos = (ingresos || []).filter(
      (i) => !idsConSalida.has(i.id_ingreso),
    );

    setActivos(abiertos);
    setLoading(false);
  };

  useEffect(() => {
    cargarActivos();

    const canal = supabase
      .channel("activos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingreso" },
        cargarActivos,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "salida" },
        cargarActivos,
      )
      .subscribe();

    const interval = setInterval(() => setTick((t) => t + 1), 1000);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Vehículos en el estacionamiento ({activos.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
          >
            <Icon icon="mdi:close" className="text-2xl" />
          </button>
        </div>

        <div className="overflow-y-auto px-8 py-4">
          {loading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : activos.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No hay vehículos dentro del estacionamiento
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b">
                  <th className="py-2">Patente</th>
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
                    valorHora,
                  );

                  return (
                    <tr key={v.id_ingreso} className="border-b last:border-0">
                      <td className="py-3 font-semibold text-gray-800">
                        {v.patente}
                      </td>
                      <td>
                        {v.vehiculo?.categoria_vehiculo?.nombre_categoria ||
                          "—"}
                      </td>
                      <td>{v.id_espacio}</td>
                      <td>{v.hora_ingreso?.slice(0, 5)}</td>
                      <td className="font-mono">
                        {String(horas).padStart(2, "0")}:
                        {String(mins).padStart(2, "0")}:
                        {String(segundos).padStart(2, "0")}
                      </td>
                      <td className="font-semibold text-emerald-600">
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
    </div>
  );
}
