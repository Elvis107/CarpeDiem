import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { calcularTiempoYCosto } from "./timecost";

export default function UltimoMovimiento({ tipo, data }) {
  const esIngreso = tipo === "ingreso";
  const [, setTick] = useState(0);

  // Reloj en vivo: solo corre si el vehículo sigue dentro del estacionamiento.
  useEffect(() => {
    if (!esIngreso || !data?.activo) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [esIngreso, data]);

  return (
    <div
      className={`rounded-2xl p-5 shadow-md border ${
        esIngreso ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          icon={esIngreso ? "mdi:car-arrow-right" : "mdi:car-arrow-left"}
          className={`text-2xl ${esIngreso ? "text-green-600" : "text-red-600"}`}
        />
        <h3 className="font-bold text-gray-700">
          {esIngreso ? "Último ingreso" : "Último egreso"}
        </h3>
      </div>

      {!data ? (
        <p className="text-sm text-gray-400">Sin movimientos registrados</p>
      ) : esIngreso ? (
        <div className="text-sm text-gray-600 space-y-1">
          <p className="text-lg font-bold text-gray-800">{data.patente}</p>
          <p>{data.categoria || "—"}</p>
          <p>Espacio {data.id_espacio}</p>

          {data.activo ? (
            (() => {
              const { horas, mins, segundos, costo } = calcularTiempoYCosto(
                data.fecha_ingreso,
                data.hora_ingreso,
                data.valorHora,
              );
              return (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-mono font-bold text-slate-800">
                    {String(horas).padStart(2, "0")}:
                    {String(mins).padStart(2, "0")}:
                    {String(segundos).padStart(2, "0")}
                  </span>
                  <span className="font-bold text-emerald-700">
                    ${costo.toLocaleString("es-CL")}
                  </span>
                </div>
              );
            })()
          ) : (
            <p className="text-xs text-amber-600 pt-1">
              Ya salió del estacionamiento
            </p>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600 space-y-1">
          <p className="text-lg font-bold text-gray-800">{data.patente}</p>
          <p>Tiempo: {data.tiempo_total} min</p>
          <p>
            Costo:{" "}
            <span className="font-semibold text-emerald-700">
              ${Number(data.costo_total || 0).toLocaleString("es-CL")}
            </span>
          </p>
          <p className="text-xs text-gray-400">
            {data.fecha_salida} · {data.hora_salida?.slice(0, 5)}
          </p>
        </div>
      )}
    </div>
  );
}
