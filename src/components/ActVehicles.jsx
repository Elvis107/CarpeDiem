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
      .order("hora_ingreso", { ascending: false });

    const { data: salidas } = await supabase
      .from("salida")
      .select("id_ingreso");

    const idsConSalida = new Set(
      (salidas || []).map((s) => s.id_ingreso)
    );

    setActivos(
      (ingresos || []).filter(
        (i) => !idsConSalida.has(i.id_ingreso)
      )
    );

    setLoading(false);
  };

  useEffect(() => {
    cargarActivos();

    const canal = supabase
      .channel("activos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ingreso",
        },
        cargarActivos
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "salida",
        },
        cargarActivos
      )
      .subscribe();

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(canal);
    };
  }, []);

  /*Aqui se calcula el costo de cada vehículo y el total que se esta generando en tiempo real.*/
  const vehiculosConCosto = activos.map((v) => {
    const valorHora =
      v.vehiculo?.categoria_vehiculo?.valor_hora || 0;

    const tiempo = calcularTiempoYCosto(
      v.fecha_ingreso,
      v.hora_ingreso,
      valorHora
    );

    return {
      ...v,
      ...tiempo,
    };
  });

  const totalRecaudacion = vehiculosConCosto.reduce(
    (total, vehiculo) => total + vehiculo.costo,
    0
  );

  return (
    <div className="w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-50">
      <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8 border-b border-slate-200 bg-white">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              Operación en tiempo real
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">
            Vehículos en servicio
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Supervisión de los vehículos actualmente dentro del estacionamiento.
          </p>
        </div>
      </div>

      <div className="overflow-auto px-6 py-6 sm:px-8">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vehículos dentro
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {activos.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Vehículos actualmente activos
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform duration-300">
                <Icon
                  icon="mdi:car-multiple"
                  className="text-2xl"
                />
              </div>
            </div>
          </div>

          {/* Mostrar el total de costo que esta generando el estacionamiento */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative flex items-center justify-between">
              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Recaudación estimada
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  ${totalRecaudacion.toLocaleString("es-CL")}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Acumulado en tiempo real
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                <Icon
                  icon="mdi:cash-multiple"
                  className="text-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Icon
              icon="mdi:loading"
              className="text-4xl animate-spin mb-3"
            />
            <p className="text-sm">
              Cargando vehículos activos...
            </p>
          </div>
        ) : activos.length === 0 ? (

          /* En caso de no poseer vehiculos activos mandara un mensaje de: */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 mb-5">
              <Icon
                icon="mdi:car-off"
                className="text-4xl"
              />
            </div>

            <h3 className="text-lg font-semibold text-slate-700">
              No hay vehículos activos
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Actualmente no hay vehículos dentro del estacionamiento.
            </p>
          </div>

        ) : (

          /* cardss de los vehiculos */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {vehiculosConCosto.map((v) => {
              const categoria =
                v.vehiculo?.categoria_vehiculo?.nombre_categoria || "Sin categoría";
              const valorHora =
                v.vehiculo?.categoria_vehiculo?.valor_hora || 0;
              return (
                <div
                  key={v.id_ingreso}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >

                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-12 h-12 shrink-0 rounded-2xl bg-slate-900 text-white group-hover:scale-110 transition-transform duration-300">
                          <Icon
                            icon="mdi:car"
                            className="text-2xl"
                          />
                        </div>
                        <div className="min-w-0">

                          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                            Patente
                          </p>

                          <h3 className="mt-1 text-2xl font-black tracking-wider text-slate-900 truncate">
                            {v.patente}
                          </h3>
                        </div>
                      </div>

                      <span className="flex items-center gap-1.5 shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Activo
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon
                            icon="mdi:shape-outline"
                            className="text-lg"
                          />
                          <span className="text-[10px] uppercase tracking-wider font-semibold">
                            Categoría
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700 truncate">
                          {categoria}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon
                            icon="mdi:parking"
                            className="text-lg"
                          />
                          <span className="text-[10px] uppercase tracking-wider font-semibold">
                            Espacio
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {v.id_espacio}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon
                            icon="mdi:clock-outline"
                            className="text-lg"
                          />
                          <span className="text-[10px] uppercase tracking-wider font-semibold">
                            Ingreso
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-700">
                          {v.hora_ingreso?.slice(0, 5)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Icon
                            icon="mdi:timer-outline"
                            className="text-lg"
                          />
                          <span className="text-[10px] uppercase tracking-wider font-semibold">
                            Tiempo
                          </span>
                        </div>
                        <p className="mt-2 font-mono text-sm font-bold text-slate-700">
                          {String(v.horas).padStart(2, "0")}:
                          {String(v.mins).padStart(2, "0")}:
                          {String(v.segundos).padStart(2, "0")}
                        </p>
                      </div>
                    </div>

                    {/* costo en tiempo real */}
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600">
                          <Icon
                            icon="mdi:cash"
                            className="text-xl"
                          />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
                            Costo actual
                          </p>
                          <p className="text-xs text-emerald-600/70">
                            ${valorHora.toLocaleString("es-CL")} / hora
                          </p>
                        </div>
                      </div>

                      <p className="text-2xl font-black text-emerald-600">
                        ${v.costo.toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}