import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import "../styles/HistorialReportes.css";

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
    const { data: ingresos, error: errorIngresos } = await supabase
      .from("ingreso")
      .select(
        `
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
      `,
      )
      .order("fecha_ingreso", {
        ascending: false,
      });

    /*OBTENER TODAS LAS SALIDAS*/
    const { data: salidas, error: errorSalidas } = await supabase
      .from("salida")
      .select(
        `
        id_salida,
        id_ingreso,
        fecha_salida,
        hora_salida,
        tiempo_total,
        costo_total
      `,
      )
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
          (i) => i.id_ingreso === salida.id_ingreso,
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
            ingreso.vehiculo?.categoria_vehiculo?.nombre_categoria ||
            "Sin categoría",
          valorHora: ingreso.vehiculo?.categoria_vehiculo?.valor_hora || 0,
        };
      })
      .filter(Boolean);

    setHistorial(historialCompleto);

    const idsIngresos = new Set(
      (ingresos || []).map((ingreso) => ingreso.id_ingreso),
    );

    const idsSalidas = new Set(
      (salidas || []).map((salida) => salida.id_ingreso),
    );

    const vehiculosEnServicio = [...idsIngresos].filter(
      (idIngreso) => !idsSalidas.has(idIngreso),
    ).length;

    const totalIngresos = ingresos?.length || 0;

    const totalEgresos = salidas?.length || 0;

    const totalRecaudacion = (salidas || []).reduce(
      (total, salida) => total + Number(salida.costo_total || 0),
      0,
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
        },
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
        },
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
            vehiculo.categoria.toLowerCase() === filtro.toLowerCase(),
        );

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";

    const [year, month, day] = fecha.split("-");

    return `${day}-${month}-${year}`;
  };

  const formatearTiempo = (tiempo) => {
    if (!tiempo) {
      return "00:00:00";
    }

    return tiempo.toString().split(".")[0];
  };

  return (
    <div className="cd-hist d-flex min-h-0 w-100 min-w-0 flex-grow-1 flex-column overflow-hidden">
      <div className="cd-hist__header px-4 py-4 px-sm-5 py-sm-4">
        <div className="d-flex align-items-start justify-content-between gap-4">
          <div className="min-w-0">
            <div className="cd-hist__eyebrow d-inline-flex align-items-center gap-2">
              <Icon icon="mdi:history" />
              Control visual
            </div>
            <h2 className="cd-hist__title text-truncate mt-3 mb-0">
              Historial
            </h2>
            <p className="cd-hist__subtitle mt-2 mb-0">
              Consulta los movimientos completados y la recaudación generada por
              el estacionamiento.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-grow-1 overflow-auto px-3 px-sm-5 py-4 py-sm-4">
        <div className="d-flex flex-column gap-4">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div className="cd-hist__filter-pill d-flex align-items-center gap-2">
              <Icon icon="mdi:calendar-range" />
              Todos los movimientos
            </div>

            <div className="position-relative">
              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="cd-hist__select"
              >
                <option value="todos">Todas las categorías</option>
                <option value="normal">Normal</option>
                <option value="grande">Grande</option>
              </select>
              <Icon icon="mdi:chevron-down" className="cd-hist__select-caret" />
            </div>
          </div>

          <div className="cd-hist__stats-grid">
            <div className="cd-hist__stat-card cd-hist__stat-card--in">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <p className="cd-hist__stat-label cd-hist__stat-label--in mb-0">
                    Ingresos totales
                  </p>
                  <p className="cd-hist__stat-value mb-0">{resumen.ingresos}</p>
                  <p className="cd-hist__stat-hint mb-0">
                    Vehículos registrados
                  </p>
                </div>
                <div className="cd-hist__stat-icon cd-hist__stat-icon--in">
                  <Icon icon="mdi:login" />
                </div>
              </div>
            </div>

            <div className="cd-hist__stat-card cd-hist__stat-card--out">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <p className="cd-hist__stat-label cd-hist__stat-label--out mb-0">
                    Egresos totales
                  </p>
                  <p className="cd-hist__stat-value mb-0">{resumen.egresos}</p>
                  <p className="cd-hist__stat-hint mb-0">
                    Vehículos que finalizaron su estadía
                  </p>
                </div>
                <div className="cd-hist__stat-icon cd-hist__stat-icon--out">
                  <Icon icon="mdi:logout" />
                </div>
              </div>
            </div>

            <div className="cd-hist__stat-card cd-hist__stat-card--service">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <p className="cd-hist__stat-label cd-hist__stat-label--service mb-0">
                    En servicio
                  </p>
                  <p className="cd-hist__stat-value mb-0">
                    {resumen.enServicio}
                  </p>
                  <p className="cd-hist__stat-hint mb-0">
                    Vehículos actualmente dentro
                  </p>
                </div>
                <div className="cd-hist__stat-icon cd-hist__stat-icon--service">
                  <Icon icon="mdi:car-clock" />
                </div>
              </div>
            </div>

            <div className="cd-hist__stat-card cd-hist__stat-card--money">
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <p className="cd-hist__stat-label cd-hist__stat-label--money mb-0">
                    Recaudación total
                  </p>
                  <p className="cd-hist__stat-value mb-0">
                    ${resumen.recaudacion.toLocaleString("es-CL")}
                  </p>
                  <p className="cd-hist__stat-hint mb-0">
                    Recaudación acumulada
                  </p>
                </div>
                <div className="cd-hist__stat-icon cd-hist__stat-icon--money">
                  <Icon icon="mdi:cash-multiple" />
                </div>
              </div>
            </div>
          </div>

          <div className="cd-hist__table-card">
            <div className="cd-hist__table-head">
              <h3 className="cd-hist__table-title d-flex align-items-center gap-2 mb-0">
                <Icon icon="mdi:format-list-bulleted" />
                Movimientos registrados
              </h3>
              <p className="cd-hist__table-subtitle mt-1 mb-0">
                Mostrando vehículos que ya finalizaron su estadía.
              </p>
            </div>

            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 cd-hist__empty-text">
                <Icon icon="mdi:loading" className="cd-hist__spin mb-3" />
                <p className="small mb-0">Cargando historial...</p>
              </div>
            ) : historialFiltrado.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                <Icon icon="mdi:history" className="cd-hist__empty-icon mb-3" />
                <h3 className="cd-hist__empty-title mb-0">
                  No hay movimientos registrados
                </h3>
                <p className="cd-hist__empty-text mt-2 mb-0">
                  Los vehículos que completen su entrada y salida aparecerán
                  aquí.
                </p>
              </div>
            ) : (
              <div className="cd-hist__table-scroll">
                <table className="cd-hist__table w-100">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Patente</th>
                      <th>Categoría</th>
                      <th>Tiempo total</th>
                      <th>Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialFiltrado.map((vehiculo) => (
                      <tr key={vehiculo.id_salida}>
                        <td>
                          <div className="cd-hist__date-pill d-inline-flex align-items-center gap-2">
                            <Icon icon="mdi:calendar-outline" />
                            {formatearFecha(vehiculo.fecha_salida)}
                          </div>
                        </td>

                        <td className="cd-hist__plate-cell">
                          <div className="d-flex align-items-center gap-2">
                            <div className="cd-hist__plate-icon">
                              <Icon icon="mdi:car" />
                            </div>
                            {vehiculo.patente}
                          </div>
                        </td>

                        <td>
                          <span className="cd-hist__category-pill d-inline-flex align-items-center gap-2">
                            <Icon icon="mdi:shape-outline" />
                            {vehiculo.categoria}
                          </span>
                        </td>

                        <td>
                          <span className="cd-hist__time-value d-inline-flex align-items-center gap-2">
                            <Icon icon="mdi:timer-outline" />
                            {formatearTiempo(vehiculo.tiempo_total)}
                          </span>
                        </td>

                        <td>
                          <span className="cd-hist__cost-pill d-inline-flex align-items-center gap-2">
                            <Icon icon="mdi:cash" />$
                            {Number(vehiculo.costo_total || 0).toLocaleString(
                              "es-CL",
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="cd-hist__footnote pb-2 text-center mb-0">
            Información actualizada automáticamente desde el sistema de
            estacionamiento.
          </p>
        </div>
      </div>
    </div>
  );
}
