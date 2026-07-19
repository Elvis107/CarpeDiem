import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";

export default function HistorialReportes({ onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  const [resumen, setResumen] = useState({
    ingresos: 0,
    egresos: 0,
    enServicio: 0,
    recaudacion: 0,
  });

  const [filtro, setFiltro] = useState("todos");
  const cargarHistorial = async () => {
    setLoading(true);

    /*obtener vehiculos con ingresos*/
    const {
      data: ingresos,
      error: errorIngresos,
    } = await supabase
      .from("ingreso")
      .select(`
        id_ingreso,
        patente,
        fecha_ingreso,
        hora_ingreso,
        vehiculo (
          categoria_vehiculo (
            nombre_categoria,
            valor_hora
          )
        )
      `)
      .order("fecha_ingreso", {
        ascending: false,
      });

    /*OBTENER TODAS LAS SALIDAS*/
    const {
      data: salidas,
      error: errorSalidas,
    } = await supabase
      .from("salida")
      .select(`
        id_salida,
        id_ingreso,
        fecha_salida,
        hora_salida,
        tiempo_total,
        costo_total
      `)
      .order("fecha_salida", {
        ascending: false,
      });

    if (errorIngresos || errorSalidas) {
      console.error("Error cargando historial:", {
        errorIngresos,
        errorSalidas,
      });

      setLoading(false);
      return;
    }

    const historialCompleto = (salidas || [])
      .map((salida) => {
        const ingreso = (ingresos || []).find(
          (i) => i.id_ingreso === salida.id_ingreso
        );

        if (!ingreso) {
          return null;
        }

        return {
          ...salida,
          patente: ingreso.patente,
          fecha_ingreso: ingreso.fecha_ingreso,
          hora_ingreso: ingreso.hora_ingreso,
          categoria:
            ingreso.vehiculo?.categoria_vehiculo
              ?.nombre_categoria || "Sin categoría",
          valorHora:
            ingreso.vehiculo?.categoria_vehiculo
              ?.valor_hora || 0,
        };
      })
      .filter(Boolean);

    setHistorial(historialCompleto);

    const idsIngresos = new Set(
      (ingresos || []).map(
        (ingreso) => ingreso.id_ingreso
      )
    );

    const idsSalidas = new Set(
      (salidas || []).map(
        (salida) => salida.id_ingreso
      )
    );

    const vehiculosEnServicio = [
      ...idsIngresos,
    ].filter(
      (idIngreso) =>
        !idsSalidas.has(idIngreso)
    ).length;

    const totalIngresos =
      ingresos?.length || 0;

    const totalEgresos =
      salidas?.length || 0;

    const totalRecaudacion =
      (salidas || []).reduce(
        (total, salida) =>
          total +
          Number(
            salida.costo_total || 0
          ),
        0
      );

    setResumen({
      ingresos: totalIngresos,
      egresos: totalEgresos,
      enServicio: vehiculosEnServicio,
      recaudacion: totalRecaudacion,
    });

    setLoading(false);
  };

  useEffect(() => {
    cargarHistorial();

    const canal = supabase
      .channel("historial-reportes")

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ingreso",
        },
        () => {
          cargarHistorial();
        }
      )

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "salida",
        },
        () => {
          cargarHistorial();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  /*filtrar informacion por categoria*/
  const historialFiltrado =
    filtro === "todos"
      ? historial
      : historial.filter(
          (vehiculo) =>
            vehiculo.categoria.toLowerCase() ===
            filtro.toLowerCase()
        );

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";

    const [year, month, day] =
      fecha.split("-");

    return `${day}-${month}-${year}`;
  };

  const formatearTiempo = (tiempo) => {
    if (!tiempo) {
      return "00:00:00";
    }

    return tiempo
      .toString()
      .split(".")[0];
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-none border border-slate-200/80 bg-gradient-to-b from-white via-white to-slate-50 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-6 py-5 backdrop-blur sm:px-8 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-600">
              <Icon
                icon="mdi:history"
                className="text-sm"
              />
              Control visual
            </div>
            <h2 className="mt-3 truncate text-2xl font-black tracking-tight text-slate-900 sm:text-[2rem]">
              Historial
            </h2>
            <p className="mt-2 text-base text-slate-500">
              Consulta los movimientos completados y la recaudación generada por el estacionamiento.
            </p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 shadow-sm">
              <Icon
                icon="mdi:calendar-range"
                className="text-sm"
              />
              Todos los movimientos
            </div>
            <div className="relative">
              <select
                value={filtro}
                onChange={(e) =>
                  setFiltro(e.target.value)
                }
                className="appearance-none rounded-md border border-slate-200 bg-slate-50 px-4 py-2 pr-9 text-xs font-semibold text-slate-600 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="todos">
                  Todas las categorías
                </option>

                <option value="normal">
                  Normal
                </option>

                <option value="grande">
                  Grande
                </option>

              </select>
              <Icon
                icon="mdi:chevron-down"
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="group rounded-md border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.35em] text-emerald-600">
                    Ingresos totales
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                    {resumen.ingresos}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Vehículos registrados
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Icon
                    icon="mdi:login"
                    className="text-xl"
                  />
                </div>
              </div>
            </div>
            <div className="group rounded-md border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.35em] text-rose-500">
                    Egresos totales
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                    {resumen.egresos}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Vehículos que finalizaron su estadía
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-500">
                  <Icon
                    icon="mdi:logout"
                    className="text-xl"
                  />
                </div>
              </div>
            </div>
            <div className="group rounded-md border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.35em] text-blue-600">
                    En servicio
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                    {resumen.enServicio}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Vehículos actualmente dentro
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon
                    icon="mdi:car-clock"
                    className="text-xl"
                  />
                </div>
              </div>
            </div>
  
            <div className="group rounded-md border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.35em] text-amber-600">
                    Recaudación total
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                    $
                    {resumen.recaudacion.toLocaleString(
                      "es-CL"
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Recaudación acumulada
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Icon
                    icon="mdi:cash-multiple"
                    className="text-xl"
                  />
                </div>
              </div>
            </div>
          </div>
         
          <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
                <Icon
                  icon="mdi:format-list-bulleted"
                  className="text-xl text-emerald-600"
                />
                Movimientos registrados
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Mostrando vehículos que ya finalizaron su estadía.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Icon
                  icon="mdi:loading"
                  className="mb-3 animate-spin text-4xl"
                />
                <p className="text-sm">
                  Cargando historial...
                </p>
              </div>

            ) : historialFiltrado.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icon
                  icon="mdi:history"
                  className="mb-3 text-5xl text-slate-300"
                />
                <h3 className="text-lg font-bold text-slate-700">
                  No hay movimientos registrados
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Los vehículos que completen su entrada y salida aparecerán aquí.
                </p>
              </div>
            ) : (

              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                    <tr className="border-b border-slate-200 text-left text-slate-400">
                      <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                        Fecha
                      </th>
                      <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                        Patente
                      </th>
                      <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                        Categoría
                      </th>
                      <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                        Tiempo total
                      </th>
                      <th className="px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em]">
                        Costo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">

                    {historialFiltrado.map(
                      (vehiculo) => (
                        <tr
                          key={
                            vehiculo.id_salida
                          }
                          className="group transition-colors hover:bg-slate-50/80"
                        >
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-[12px] font-semibold tracking-wide text-slate-700">
                              <Icon
                                icon="mdi:calendar-outline"
                                className="text-slate-400"
                              />
                              {formatearFecha(
                                vehiculo.fecha_salida
                              )}
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                <Icon
                                  icon="mdi:car"
                                  className="text-sm"
                                />
                              </div>
                              {vehiculo.patente}
                            </div>
                          </td>
  
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
                              <Icon
                                icon="mdi:shape-outline"
                                className="text-sm"
                              />
                              {vehiculo.categoria}
                            </span>
                          </td>
                      
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="inline-flex items-center gap-2 font-mono text-base text-slate-700">
                              <Icon
                                icon="mdi:timer-outline"
                                className="text-slate-400"
                              />
                              {formatearTiempo(
                                vehiculo.tiempo_total
                              )}
                            </span>
                          </td>
  
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
                              <Icon
                                icon="mdi:cash"
                                className="text-sm"
                              />
                              $
                              {Number(
                                vehiculo.costo_total ||
                                  0
                              ).toLocaleString(
                                "es-CL"
                              )}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="pb-2 text-center text-xs text-slate-400">
            Información actualizada automáticamente desde el sistema de estacionamiento.
          </p>
        </div>
      </div>
    </div>
  );
}