import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { calcularTiempoYCosto } from "../components/timecost";
import "../styles/Exit.css";

export default function Exit() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [ingresoActivo, setIngresoActivo] = useState(null);
  const [buscado, setBuscado] = useState(false);
  const [resultadoSalida, setResultadoSalida] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!ingresoActivo || resultadoSalida) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [ingresoActivo, resultadoSalida]);


  const verifyPassword = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("Sesión no encontrada");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      setError("Contraseña incorrecta");
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  };


  const formatPlate = (value) => {
    const clean = value
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase();

    let result = "";

    for (let i = 0; i < clean.length && i < 6; i++) {
      if (i === 2 || i === 4) {
        result += "-";
      }

      result += clean[i];
    }

    return result;
  };

  const row1 = ["1","2","3","4","5","6","7","8","9","0",];
  const row2 = ["Q","W","E","R","T","Y","U","I","O","P",];
  const row3 = ["A","S","D","F","G","H","J","K","L","Ñ",];
  const row4 = ["Z","X","C","V","B","N","M",];

  // reglas que se deber respetar debido a la patente chilena

  const isKeyDisabled = (key) => {
    const cleanPlate = plate
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase();

    const position = cleanPlate.length;

    if (position >= 6) {
      return true;
    }

    const vocales = ["A", "E", "I", "O", "U"];

    if (vocales.includes(key)) {
      return true;
    }

    if (key === "Ñ") {
      return true;
    }

    if (position < 4) {
      return !/^[A-Z]$/.test(key) || /^[AEIOU]$/.test(key);
    }

    if (position >= 4) {
      return !/^[0-9]$/.test(key);
    }

    return false;
  };


  const buscarIngresoActivo = async (patente) => {
    if (patente.length < 8) return;

    const { data: ingreso } = await supabase
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
            valor_hora,
            valor_media_hora
          )
        )
      `,
      )
      .eq("patente", patente)
      .order("fecha_ingreso", {
        ascending: false,
      })
      .order("hora_ingreso", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (!ingreso) {
      setIngresoActivo(null);
      setBuscado(true);
      return;
    }

    const { data: salidaExistente } = await supabase
      .from("salida")
      .select("id_salida")
      .eq("id_ingreso", ingreso.id_ingreso)
      .maybeSingle();

    setIngresoActivo(
      salidaExistente ? null : ingreso,
    );

    setBuscado(true);
  };


  const pressKey = (key) => {
    if (isKeyDisabled(key)) {
      return;
    }

    const nueva = formatPlate(plate + key);

    setPlate(nueva);
    setBuscado(false);
    setResultadoSalida(null);
    setError("");

    buscarIngresoActivo(nueva);
  };


  const backspace = () => {
    const nueva = formatPlate(
      plate.slice(0, -1),
    );

    setPlate(nueva);
    setBuscado(false);
    setResultadoSalida(null);
    setError("");
  };

  // se encarga de registrar la salida
  const registrarSalida = async () => {
    if (!ingresoActivo) {
      setError(
        "No se encontró un ingreso activo para esa patente",
      );
      return;
    }

    setLoading(true);
    setError("");

    // obtiene las tarifas que se realizaron
    const categoria =
      ingresoActivo.vehiculo?.categoria_vehiculo;

    const valorHora =
      Number(categoria?.valor_hora) || 0;

    const valorMediaHora =
      Number(categoria?.valor_media_hora) || 0;


    // se encarga de calcular el tiempo y cosot
    const {
      minutos,
      costo: costoTotal,
    } = calcularTiempoYCosto(
      ingresoActivo.fecha_ingreso,
      ingresoActivo.hora_ingreso,
      valorHora,
      valorMediaHora,
    );

    // se encarga de registrar la salida
    const {
      data: salida,
      error: errSalida,
    } = await supabase
      .from("salida")
      .insert({
        id_ingreso: ingresoActivo.id_ingreso,
        tiempo_total: minutos,
        costo_total: costoTotal,
      })
      .select()
      .single();

    if (errSalida) {
      setError(
        "Error al registrar salida: " +
          errSalida.message,
      );

      setLoading(false);
      return;
    }


    await supabase
      .from("espacios")
      .update({
        estado: "disponible",
        patente: null,
        updated_at: new Date().toISOString(),
      })
      .eq(
        "id_espacio",
        ingresoActivo.id_espacio,
      );

    setResultadoSalida({
      ...salida,
      minutos,
      costoTotal,
    });

    setTimeout(() => {
      setPlate("");
      setBuscado(false);
      setIngresoActivo(null);
      setResultadoSalida(null);
    }, 3000);

    setLoading(false);
  };

  return (
    <div className="cd-exit position-relative min-vh-100 overflow-hidden">
      <div className="cd-exit__bg-glow" />
      <div className="cd-exit__bg-grid" />

      <div className="position-relative px-3 py-4 px-sm-4 px-lg-5">
        <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="cd-exit__back-btn btn d-inline-flex align-items-center gap-2"
          >
            <Icon
              icon="mdi:arrow-left"
              className="fs-5"
            />
            Volver
          </button>

          <div className="d-flex flex-wrap gap-2">
            <span className="cd-exit__pill cd-exit__pill--live d-inline-flex align-items-center gap-2">
              <span className="cd-exit__pill-dot" />
              Vista en tiempo real
            </span>

            <span className="cd-exit__pill cd-exit__pill--neutral d-inline-flex align-items-center gap-2">
              <Icon icon="mdi:map-marker-outline" />
              Operación activa
            </span>
          </div>
        </div>

        <div className="cd-exit__grid">

          <div className="cd-exit__panel d-flex flex-column overflow-hidden">
            <div className="cd-exit__panel-header px-4 px-sm-5 py-4">
              <div className="d-flex align-items-start justify-content-between gap-4">
                <div className="min-w-0">
                  <div className="cd-exit__badge d-inline-flex align-items-center gap-2">
                    <span className="cd-exit__badge-dot" />
                    Registro de salida
                  </div>

                  <h1 className="cd-exit__title mt-3 mb-0">
                    Salida
                  </h1>
                </div>

              </div>
            </div>

            <div className="flex-grow-1 min-h-0 px-3 px-sm-4 py-4">
              <div className="d-flex flex-column gap-3 h-100 min-h-0">

                <div className="cd-exit__card p-3 p-sm-4">
                  <div className="mb-3 d-flex align-items-center justify-content-between gap-3">
                    <span className="cd-exit__field-label">
                      Patente
                    </span>

                    <span className="cd-exit__field-hint">
                      Formato: BC-DF-12
                    </span>
                  </div>

                  <input
                    value={plate}
                    readOnly
                    placeholder="AA-BB-12"
                    className="cd-exit__plate-display w-100"
                  />
                </div>

                <div className="cd-exit__card p-3 p-sm-4">
                  <div className="d-flex flex-column gap-3">

                    <div className="cd-exit__key-row">
                      {row1.map((key) => (
                        <button
                          key={key}
                          onClick={() =>
                            pressKey(key)
                          }
                          disabled={isKeyDisabled(key)}
                          className="cd-exit__key"
                        >
                          {key}
                        </button>
                      ))}
                    </div>

                    <div className="cd-exit__key-row">
                      {row2.map((key) => (
                        <button
                          key={key}
                          onClick={() =>
                            pressKey(key)
                          }
                          disabled={isKeyDisabled(key)}
                          className="cd-exit__key"
                        >
                          {key}
                        </button>
                      ))}
                    </div>

                    <div className="cd-exit__key-row">
                      {row3.map((key) => (
                        <button
                          key={key}
                          onClick={() =>
                            pressKey(key)
                          }
                          disabled={isKeyDisabled(key)}
                          className="cd-exit__key"
                        >
                          {key}
                        </button>
                      ))}
                    </div>

                    <div className="cd-exit__key-row">
                      {row4.map((key) => (
                        <button
                          key={key}
                          onClick={() =>
                            pressKey(key)
                          }
                          disabled={isKeyDisabled(key)}
                          className="cd-exit__key"
                        >
                          {key}
                        </button>
                      ))}

                      <button
                        onClick={backspace}
                        className="cd-exit__key-backspace d-flex align-items-center justify-content-center gap-2"
                      >
                        <Icon icon="mdi:backspace-outline" />
                        Borrar
                      </button>
                    </div>

                  </div>
                </div>

                <div className="cd-exit__notice-grid">

                  {buscado &&
                    !ingresoActivo &&
                    !resultadoSalida && (
                      <div className="cd-exit__notice cd-exit__notice--warn p-4 cd-exit__notice--span2">
                        <div className="d-flex align-items-start gap-3">

                          <div className="cd-exit__notice-icon cd-exit__notice-icon--warn">
                            <Icon icon="mdi:car-off" />
                          </div>

                          <div>
                            <p className="cd-exit__notice-eyebrow cd-exit__notice-eyebrow--warn mb-0">
                              Vehículo no encontrado
                            </p>

                            <p className="cd-exit__notice-text-strong mt-2 mb-0">
                              No se encontró un ingreso
                              activo con esa patente.
                            </p>
                          </div>

                        </div>
                      </div>
                    )}

                  {buscado &&
                    ingresoActivo &&
                    !resultadoSalida && (
                      <div className="cd-exit__notice cd-exit__notice--found p-4 cd-exit__notice--span2">

                        <div className="d-flex align-items-start gap-3">

                          <div className="cd-exit__notice-icon cd-exit__notice-icon--found">
                            <Icon icon="mdi:check-circle-outline" />
                          </div>

                          <div className="min-w-0 flex-grow-1">

                            <p className="cd-exit__notice-eyebrow cd-exit__notice-eyebrow--found mb-0">
                              Vehículo encontrado
                            </p>

                            <p className="cd-exit__notice-title mt-2 mb-0">
                              {
                                ingresoActivo
                                  .vehiculo
                                  ?.categoria_vehiculo
                                  ?.nombre_categoria ||
                                "Vehículo"
                              }{" "}
                              · Espacio{" "}
                              {ingresoActivo.id_espacio}
                            </p>

                            <div className="cd-exit__subgrid mt-3">

                              <div className="cd-exit__subcard p-3">

                                <p className="cd-exit__subcard-label mb-0">
                                  Permanencia
                                </p>

                                {(() => {
                                  const categoria =
                                    ingresoActivo
                                      .vehiculo
                                      ?.categoria_vehiculo;

                                  const valorHora =
                                    Number(
                                      categoria?.valor_hora,
                                    ) || 0;

                                  const valorMediaHora =
                                    Number(
                                      categoria?.valor_media_hora,
                                    ) || 0;

                                  const {
                                    minutos,
                                    segundos,
                                    costo,
                                  } =
                                    calcularTiempoYCosto(
                                      ingresoActivo.fecha_ingreso,
                                      ingresoActivo.hora_ingreso,
                                      valorHora,
                                      valorMediaHora,
                                    );

                                  const horas =
                                    Math.floor(
                                      minutos / 60,
                                    );

                                  const mins =
                                    minutos % 60;

                                  return (
                                    <>
                                      <p className="cd-exit__timer mt-2 mb-0">
                                        {String(
                                          horas,
                                        ).padStart(2, "0")}
                                        :
                                        {String(
                                          mins,
                                        ).padStart(2, "0")}
                                        :
                                        {String(
                                          segundos,
                                        ).padStart(2, "0")}
                                      </p>

                                      <p className="cd-exit__subcard-hint mt-2 mb-0">
                                        Tiempo total acumulado
                                      </p>

                                      <p className="cd-exit__cost-label mt-3 mb-0">
                                        Costo estimado al cierre
                                      </p>

                                      <p className="cd-exit__cost-value mt-1 mb-0">
                                        $
                                        {costo.toLocaleString(
                                          "es-CL",
                                        )}
                                      </p>
                                    </>
                                  );
                                })()}

                              </div>

                              <div className="cd-exit__subcard p-3">

                                <p className="cd-exit__subcard-label mb-0">
                                  Estado de salida
                                </p>

                                <div className="mt-2 d-flex align-items-center gap-3">

                                  <div className="cd-exit__subcard-icon">
                                    <Icon icon="mdi:parking" />
                                  </div>

                                  <div>
                                    <p className="cd-exit__subcard-title mb-0">
                                      Listo para cerrar
                                    </p>

                                    <p className="cd-exit__subcard-hint mb-0">
                                      El vehículo tiene un
                                      ingreso activo.
                                    </p>
                                  </div>

                                </div>

                                <div className="cd-exit__mini-box mt-3 p-2">

                                  <p className="cd-exit__mini-label mb-0">
                                    Registro
                                  </p>

                                  <p className="cd-exit__mini-value mt-1 mb-0">
                                    {
                                      ingresoActivo.fecha_ingreso
                                    }{" "}
                                    {
                                      ingresoActivo.hora_ingreso
                                    }
                                  </p>

                                </div>

                              </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {resultadoSalida && (
                    <div className="cd-exit__notice cd-exit__notice--found p-4 cd-exit__notice--span2">

                      <div className="d-flex align-items-start gap-3">

                        <div className="cd-exit__notice-icon cd-exit__notice-icon--found">
                          <Icon icon="mdi:check-decagram-outline" />
                        </div>

                        <div className="min-w-0 flex-grow-1">

                          <p className="cd-exit__notice-eyebrow cd-exit__notice-eyebrow--found mb-0">
                            Salida registrada
                          </p>

                          <p className="cd-exit__notice-title mt-2 mb-0">
                            El vehículo salió correctamente
                            del estacionamiento.
                          </p>

                          <div className="cd-exit__subgrid mt-3">

                            <div className="cd-exit__subcard p-3">

                              <p className="cd-exit__subcard-label mb-0">
                                Tiempo total
                              </p>

                              <p className="cd-exit__timer-lg mt-2 mb-0">
                                {resultadoSalida.minutos}{" "}
                                min
                              </p>

                              <p className="cd-exit__subcard-hint mt-2 mb-0">
                                Permanencia total registrada
                              </p>

                            </div>

                            <div className="cd-exit__highlight-card p-3">

                              <p className="cd-exit__highlight-label mb-0">
                                Costo total
                              </p>

                              <p className="cd-exit__highlight-value mt-2 mb-0">
                                $
                                {resultadoSalida.costoTotal.toLocaleString(
                                  "es-CL",
                                )}
                              </p>

                              <p className="cd-exit__highlight-hint mt-2 mb-0">
                                Cobro final por la estadía
                              </p>

                            </div>

                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="cd-exit__notice cd-exit__notice--error p-4 cd-exit__notice--span2">

                      <div className="d-flex align-items-start gap-3">

                        <div className="cd-exit__notice-icon cd-exit__notice-icon--error">
                          <Icon icon="mdi:alert-circle-outline" />
                        </div>

                        <div>

                          <p className="cd-exit__notice-eyebrow cd-exit__notice-eyebrow--error mb-0">
                            Error
                          </p>

                          <p className="cd-exit__notice-text-strong mt-2 mb-0">
                            {error}
                          </p>

                        </div>

                      </div>
                    </div>
                  )}

                </div>

                <button
                  onClick={registrarSalida}
                  disabled={
                    loading || !ingresoActivo
                  }
                  className="cd-exit__submit-btn w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <Icon icon="mdi:exit-run" />

                  {loading
                    ? "Registrando..."
                    : "Registrar salida"}
                </button>

              </div>
            </div>
          </div>

          <div className="cd-exit__panel cd-exit__sidepanel d-flex flex-column gap-3 overflow-auto p-3 p-sm-4">

            <div className="cd-exit__summary-card p-4">

              <div className="d-flex align-items-center justify-content-between gap-3">

                <div>
                  <p className="cd-exit__summary-eyebrow mb-0">
                    Resumen de salida
                  </p>

                  <h3 className="cd-exit__summary-title mt-2 mb-0">
                    Información clave
                  </h3>
                </div>

                <div className="cd-exit__summary-icon">
                  <Icon icon="mdi:receipt-text-outline" />
                </div>

              </div>

              <div className="mt-3 d-flex flex-column gap-3">


                <div className="cd-exit__info-row p-3">

                  <div className="d-flex align-items-center gap-3">

                    <div className="cd-exit__info-icon cd-exit__info-icon--green">
                      <Icon icon="mdi:clock-outline" />
                    </div>

                    <div className="min-w-0">

                      <p className="cd-exit__info-label mb-0">
                        Tiempo total
                      </p>

                      <p className="cd-exit__info-value mt-1 mb-0">
                        {resultadoSalida
                          ? `${resultadoSalida.minutos} min`
                          : "—"}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="cd-exit__highlight-card p-3 p-sm-4">

                  <p className="cd-exit__highlight-label mb-0">
                    Costo total
                  </p>

                  <div className="mt-2 d-flex align-items-end gap-2">

                    <span className="cd-exit__highlight-currency">
                      $
                    </span>

                    <span className="cd-exit__highlight-value-lg">
                      {resultadoSalida
                        ? resultadoSalida.costoTotal.toLocaleString(
                            "es-CL",
                          )
                        : "0"}
                    </span>

                  </div>

                  <p className="cd-exit__highlight-hint mt-2 mb-0">
                    El dato más importante de esta pantalla
                  </p>

                </div>

                <div className="cd-exit__info-row p-3">

                  <div className="d-flex align-items-center gap-3">

                    <div className="cd-exit__info-icon cd-exit__info-icon--red">
                      <Icon icon="mdi:state-machine" />
                    </div>

                    <div className="min-w-0">

                      <p className="cd-exit__info-label mb-0">
                        Estado de la salida
                      </p>

                      <p className="cd-exit__info-value mt-1 mb-0">
                        {resultadoSalida
                          ? "Salida completada"
                          : ingresoActivo
                            ? "Listo para registrar"
                            : buscado
                              ? "Sin ingreso activo"
                              : "Esperando búsqueda"}
                      </p>

                    </div>

                  </div>

                </div>

              </div>
            </div>

            <div className="cd-exit__aux-card p-4">

              <div className="d-flex align-items-center gap-3">

                <div className="cd-exit__aux-icon">
                  <Icon icon="mdi:keyboard-outline" />
                </div>

                <div>

                  <p className="cd-exit__aux-eyebrow mb-0">
                    Interacción
                  </p>

                  <p className="cd-exit__aux-text mt-1 mb-0">
                    El teclado virtual conserva
                    exactamente el mismo comportamiento.
                  </p>

                </div>

              </div>

            </div>

            <div className="cd-exit__aux-card p-4">

              <p className="cd-exit__aux-eyebrow mb-0">
                Patente digitada
              </p>

              <p className="cd-exit__aux-plate mt-2 mb-0">
                {plate || "AA-BB-12"}
              </p>

            </div>

          </div>
        </div>
      </div>

      {showModal && (
        <div className="cd-exit__modal-overlay position-fixed d-flex align-items-center justify-content-center p-3">

          <div className="cd-exit__modal">

            <div className="cd-exit__modal-bar" />

            <div className="px-4 px-sm-5 pb-5 pt-5 text-center">

              <div className="cd-exit__modal-icon mx-auto mb-3">
                <Icon icon="mdi:lock-outline" />
              </div>

              <h2 className="cd-exit__modal-title mb-0">
                Confirmación
              </h2>

              <p className="cd-exit__modal-subtitle mt-2 mx-auto mb-0">
                Ingresa tu contraseña para volver a la
                página del encargado.
              </p>

              <div className="mt-4 d-flex flex-column gap-3 text-start">

                <div className="position-relative w-100">

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="cd-exit__modal-input w-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword,
                      )
                    }
                    className="cd-exit__modal-eye"
                  >
                    <Icon
                      icon={
                        showPassword
                          ? "mdi:eye-off-outline"
                          : "mdi:eye-outline"
                      }
                    />
                  </button>

                </div>

                {error && (
                  <div className="cd-exit__modal-error">
                    {error}
                  </div>
                )}

                <div className="row g-3">

                  <div className="col-6">

                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setPassword("");
                        setError("");
                      }}
                      className="cd-exit__modal-cancel w-100"
                    >
                      Cancelar
                    </button>

                  </div>

                  <div className="col-6">

                    <button
                      type="button"
                      onClick={verifyPassword}
                      disabled={loading}
                      className="cd-exit__modal-confirm w-100"
                    >
                      {loading
                        ? "Validando..."
                        : "Confirmar"}
                    </button>

                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}