import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { calcularTiempoYCosto } from "./timecost";
import "../styles/ActVehicles.css";

export default function VehiculosActivosModal({ onClose }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const cargarActivos = async () => {
    setLoading(true);

    const { data: ingresos } = await supabase
      .from("ingreso")
      .select(
        `
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
      `,
      )
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ingreso",
        },
        cargarActivos,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "salida",
        },
        cargarActivos,
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
    const valorHora = v.vehiculo?.categoria_vehiculo?.valor_hora || 0;

    const tiempo = calcularTiempoYCosto(
      v.fecha_ingreso,
      v.hora_ingreso,
      valorHora,
    );

    return {
      ...v,
      ...tiempo,
    };
  });

  const totalRecaudacion = vehiculosConCosto.reduce(
    (total, vehiculo) => total + vehiculo.costo,
    0,
  );

  return (
    <div className="cd-act w-100 min-w-0 flex-grow-1 min-h-0 overflow-hidden d-flex flex-column">
      <div className="cd-act__header d-flex align-items-center justify-content-between gap-4 px-4 px-sm-5 py-4">
        <div className="min-w-0">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="cd-act__live-dot" />
            <span className="cd-act__live-label">Operación en tiempo real</span>
          </div>

          <h2 className="cd-act__title text-truncate mb-0">
            Vehículos en servicio
          </h2>

          <p className="cd-act__subtitle mt-1 mb-0">
            Supervisión de los vehículos actualmente dentro del estacionamiento.
          </p>
        </div>
      </div>

      <div className="overflow-auto px-4 px-sm-5 py-4">
        <div className="cd-act__stats-grid mb-4">
          <div className="cd-act__stat-card cd-act__stat-card--info">
            <div className="cd-act__stat-blob cd-act__stat-blob--info" />
            <div className="position-relative d-flex align-items-center justify-content-between">
              <div>
                <p className="cd-act__stat-label mb-0">Vehículos dentro</p>
                <p className="cd-act__stat-value mb-0">{activos.length}</p>
                <p className="cd-act__stat-hint mb-0">
                  Vehículos actualmente activos
                </p>
              </div>
              <div className="cd-act__stat-icon cd-act__stat-icon--info">
                <Icon icon="mdi:car-multiple" />
              </div>
            </div>
          </div>

          {/* Mostrar el total de costo que esta generando el estacionamiento */}
          <div className="cd-act__stat-card cd-act__stat-card--money">
            <div className="cd-act__stat-blob cd-act__stat-blob--money" />
            <div className="position-relative d-flex align-items-center justify-content-between">
              <div>
                <p className="cd-act__stat-label cd-act__stat-label--money mb-0">
                  Recaudación estimada
                </p>
                <p className="cd-act__stat-value cd-act__stat-value--money mb-0">
                  ${totalRecaudacion.toLocaleString("es-CL")}
                </p>
                <p className="cd-act__stat-hint mb-0">
                  Acumulado en tiempo real
                </p>
              </div>
              <div className="cd-act__stat-icon cd-act__stat-icon--money">
                <Icon icon="mdi:cash-multiple" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5 cd-act__empty-text">
            <Icon icon="mdi:loading" className="cd-act__spin mb-3" />
            <p className="small mb-0">Cargando vehículos activos...</p>
          </div>
        ) : activos.length === 0 ? (
          /* En caso de no poseer vehiculos activos mandara un mensaje de: */
          <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
            <div className="cd-act__empty-icon mb-4">
              <Icon icon="mdi:car-off" />
            </div>

            <h3 className="cd-act__empty-title">No hay vehículos activos</h3>

            <p
              className="cd-act__empty-text mt-2 mx-auto"
              style={{ maxWidth: "24rem" }}
            >
              Actualmente no hay vehículos dentro del estacionamiento.
            </p>
          </div>
        ) : (
          /* cardss de los vehiculos */
          <div className="cd-act__cards-grid">
            {vehiculosConCosto.map((v) => {
              const categoria =
                v.vehiculo?.categoria_vehiculo?.nombre_categoria ||
                "Sin categoría";
              const valorHora = v.vehiculo?.categoria_vehiculo?.valor_hora || 0;
              return (
                <div key={v.id_ingreso} className="cd-act__card">
                  <div className="cd-act__card-bar" />
                  <div className="p-4">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-3 min-w-0">
                        <div className="cd-act__card-icon">
                          <Icon icon="mdi:car" />
                        </div>
                        <div className="min-w-0">
                          <p className="cd-act__card-label mb-0">Patente</p>
                          <h3 className="cd-act__card-plate text-truncate mb-0">
                            {v.patente}
                          </h3>
                        </div>
                      </div>

                      <span className="cd-act__badge-active">
                        <span className="cd-act__badge-dot" />
                        Activo
                      </span>
                    </div>

                    <div className="cd-act__card-grid mt-4">
                      <div className="cd-act__card-tile">
                        <div className="cd-act__card-tile-head">
                          <Icon icon="mdi:shape-outline" />
                          <span>Categoría</span>
                        </div>
                        <p className="cd-act__card-tile-value text-truncate mb-0">
                          {categoria}
                        </p>
                      </div>

                      <div className="cd-act__card-tile">
                        <div className="cd-act__card-tile-head">
                          <Icon icon="mdi:parking" />
                          <span>Espacio</span>
                        </div>
                        <p className="cd-act__card-tile-value mb-0">
                          {v.id_espacio}
                        </p>
                      </div>

                      <div className="cd-act__card-tile">
                        <div className="cd-act__card-tile-head">
                          <Icon icon="mdi:clock-outline" />
                          <span>Ingreso</span>
                        </div>
                        <p className="cd-act__card-tile-value mb-0">
                          {v.hora_ingreso?.slice(0, 5)}
                        </p>
                      </div>

                      <div className="cd-act__card-tile">
                        <div className="cd-act__card-tile-head">
                          <Icon icon="mdi:timer-outline" />
                          <span>Tiempo</span>
                        </div>
                        <p className="cd-act__card-tile-value cd-act__card-tile-value--mono mb-0">
                          {String(v.horas).padStart(2, "0")}:
                          {String(v.mins).padStart(2, "0")}:
                          {String(v.segundos).padStart(2, "0")}
                        </p>
                      </div>
                    </div>

                    {/* costo en tiempo real */}
                    <div className="cd-act__cost-row mt-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="cd-act__cost-icon">
                          <Icon icon="mdi:cash" />
                        </div>
                        <div>
                          <p className="cd-act__cost-label mb-0">
                            Costo actual
                          </p>
                          <p className="cd-act__cost-hint mb-0">
                            ${valorHora.toLocaleString("es-CL")} / hora
                          </p>
                        </div>
                      </div>

                      <p className="cd-act__cost-value mb-0">
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
