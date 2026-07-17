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
      className={`rounded-none border p-5 shadow-sm ${
        esIngreso ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon
          icon={esIngreso ? "mdi:car-arrow-right" : "mdi:car-arrow-left"}
          className={`text-2xl ${esIngreso ? "text-emerald-600" : "text-rose-600"}`}
        />
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
          {esIngreso ? "Último ingreso" : "Último egreso"}
        </h3>
      </div>

      {!data ? (
        <p className="text-sm text-slate-400">Sin movimientos registrados</p>
      ) : esIngreso ? (
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-2xl font-black tracking-tight text-slate-900">
            {data.patente}
          </p>
          <p className="text-[20px] font-medium text-slate-700">
            {data.categoria || "—"}
          </p>

          <p className="text-[15px] text-slate-500">Espacio {data.id_espacio}</p>
          <p className="text-sm text-slate-400">
          {data.fecha_ingreso} · {data.hora_ingreso?.slice(0, 5)}
          </p>

          {data.activo ? (
            (() => {
              const { horas, mins, segundos, costo } = calcularTiempoYCosto(
                data.fecha_ingreso,
                data.hora_ingreso,
                data.valorHora,
              );
              return (
                <div className="flex items-center justify-between gap-3 pt-3">
                  <span className="text-xl font-mono font-bold tracking-[0.18em] text-slate-900">
                    {String(horas).padStart(2, "0")}:
                    {String(mins).padStart(2, "0")}:
                    {String(segundos).padStart(2, "0")}
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    ${costo.toLocaleString("es-CL")}
                  </span>
                </div>
              );
            })()
          ) : (
            <p className="pt-1 text-sm font-medium text-amber-600">
              Ya salió del estacionamiento
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2 text-sm text-slate-600">
          <p className="text-2xl font-black tracking-tight text-slate-900">
            {data.patente}
          </p>
          <p className="text-[15px] text-slate-500">
            Tiempo: {data.tiempo_total} min
          </p>
          <p className="text-[15px] text-slate-600">
            Costo:{" "}
            <span className="font-black text-emerald-700">
              ${Number(data.costo_total || 0).toLocaleString("es-CL")}
            </span>
          </p>
          <p className="text-sm text-slate-400">
            {data.fecha_salida} · {data.hora_salida?.slice(0, 5)}
          </p>
        </div>
      )}
    </div>
  );
}
