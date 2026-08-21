import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import ParkingMap from "../components/ParkingMap";
import "../styles/Entrance.css";

export default function Entrance() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [plate, setPlate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [vehiculoExistente, setVehiculoExistente] = useState(null);
  const [vehiculoBuscado, setVehiculoBuscado] = useState(false);
  const [categoria, setCategoria] = useState("normal");
  const [registroActivo, setRegistroActivo] = useState(null);

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
    const clean = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    let result = "";
    for (let i = 0; i < clean.length && i < 6; i++) {
      if (i === 2 || i === 4) result += "-";
      result += clean[i];
    }
    return result;
  };

  const row1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const row2 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const row3 = ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"];
  const row4 = ["Z", "X", "C", "V", "B", "N", "M"];

  const pressKey = (key) => {
    const nueva = formatPlate(plate + key);
    setPlate(nueva);
    setVehiculoBuscado(false);
    buscarVehiculo(nueva);
  };

  const backspace = () => {
    const nueva = formatPlate(plate.slice(0, -1));
    setPlate(nueva);
    setVehiculoBuscado(false);
  };

  const buscarVehiculo = async (patente) => {
    if (patente.length < 8) return;
    const { data } = await supabase
      .from("vehiculo")
      .select("*")
      .eq("patente", patente)
      .maybeSingle();

    setVehiculoExistente(data || null);
    setVehiculoBuscado(true);
  };

  const registrarEntrada = async () => {
    if (!plate || plate.length < 8) {
      setError("Ingresa una patente válida");
      return;
    }

    setLoading(true);
    setError("");

    const regexPatente = /^[A-Z]{2}-[A-Z]{2}-[0-9]{2}$/;
    if (!regexPatente.test(plate)) {
      setError("Formato de patente incorrecto (ej: AA-BB-12)");
      setLoading(false);

      setVehiculoBuscado(false);
      setVehiculoExistente(null);

      return;
    }

    try {
      const { data: ingresosPatente } = await supabase
        .from("ingreso")
        .select("id_ingreso")
        .eq("patente", plate)
        .order("hora_ingreso", { ascending: false });

      if (ingresosPatente?.length) {
        const { data: salidasPatente } = await supabase
          .from("salida")
          .select("id_ingreso")
          .in(
            "id_ingreso",
            ingresosPatente.map((i) => i.id_ingreso),
          );

        const idsConSalida = new Set(
          (salidasPatente || []).map((s) => s.id_ingreso),
        );
        const tieneIngresoActivo = ingresosPatente.some(
          (i) => !idsConSalida.has(i.id_ingreso),
        );

        if (tieneIngresoActivo) {
          setError(
            "Este vehículo ya tiene un ingreso activo sin salida registrada",
          );
          setLoading(false);
          return;
        }
      }

      if (!vehiculoExistente) {
        const { data: cat } = await supabase
          .from("categoria_vehiculo")
          .select("id_categoria")
          .eq("nombre_categoria", categoria === "grande" ? "Grande" : "Normal")
          .maybeSingle();

        await supabase.from("vehiculo").insert({
          patente: plate,
          id_categoria: cat?.id_categoria || null,
        });
      }

      const { data: ingreso, error: errIngreso } = await supabase
        .from("ingreso")
        .insert({
          patente: plate,
          fecha_ingreso: new Date().toLocaleDateString("sv-SE"),
          hora_ingreso: new Date().toTimeString().split(" ")[0],
        })
        .select()
        .single();

      if (errIngreso) {
        setError("Error: " + errIngreso.message);
        setLoading(false);
        return;
      }

      setRegistroActivo(ingreso);
      setTimeout(() => {
        setPlate("");
        setVehiculoBuscado(false);
        setVehiculoExistente(null);
        setRegistroActivo(null);
      }, 3000);

      setRegistroActivo(ingreso);
    } catch (e) {
      setError("Error inesperado: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="cd-ent position-relative min-vh-100 overflow-hidden">
      <div className="cd-ent__bg-glow" />
      <div className="cd-ent__bg-grid" />

      <div className="position-relative px-3 py-4 px-sm-4 px-lg-5">
        <div className="mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="cd-ent__back-btn btn d-inline-flex align-items-center gap-2"
          >
            <Icon icon="mdi:arrow-left" className="fs-5" />
            Volver
          </button>

          <div className="d-flex flex-wrap gap-2">
            <span className="cd-ent__pill cd-ent__pill--live d-inline-flex align-items-center gap-2">
              <span className="cd-ent__pill-dot" />
              Vista en tiempo real
            </span>
            <span className="cd-ent__pill cd-ent__pill--neutral d-inline-flex align-items-center gap-2">
              <Icon icon="mdi:map-marker-outline" />
              Operación activa
            </span>
          </div>
        </div>

        <div className="cd-ent__grid">
          {/* Mapa */}
          <div className="cd-ent__panel d-flex flex-column overflow-hidden">
            <div className="cd-ent__panel-header d-flex align-items-start justify-content-between gap-4 px-4 px-sm-5 py-4">
              <div className="min-w-0">
                <div className="cd-ent__badge cd-ent__badge--green d-inline-flex align-items-center gap-2">
                  <span className="cd-ent__badge-dot" />
                  Mapa en vivo
                </div>
                <h2 className="cd-ent__panel-title mt-3 mb-0">
                  Mapa del estacionamiento
                </h2>
                <p className="cd-ent__panel-subtitle mt-2 mb-0">
                  Supervisión visual de los espacios disponibles con una
                  presentación limpia, profesional y fácil de leer.
                </p>
              </div>
              <div className="cd-ent__status-box d-none d-sm-block flex-shrink-0">
                <p className="cd-ent__status-label mb-0">Estado</p>
                <p className="cd-ent__status-value mt-1 mb-0">
                  Operación activa
                </p>
              </div>
            </div>

            <div className="flex-grow-1 p-2">
              <div className="cd-ent__map-frame h-100 d-flex align-items-center justify-content-center p-2">
                <div className="cd-ent__map-inner w-100 h-100">
                  <ParkingMap />
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de entrada */}
          <div className="cd-ent__panel d-flex flex-column overflow-hidden">
            <div className="cd-ent__panel-header px-4 px-sm-5 py-4">
              <div className="d-flex align-items-start justify-content-between gap-4">
                <div className="min-w-0">
                  <div className="cd-ent__badge cd-ent__badge--yellow d-inline-flex align-items-center gap-2">
                    <Icon icon="mdi:car-arrow-right" />
                    Registro de entrada
                  </div>
                  <h1 className="cd-ent__title mt-3 mb-0">Entrada</h1>
                  <p className="cd-ent__panel-subtitle mt-2 mb-0">
                    Captura la patente, confirma el vehículo y registra el
                    ingreso sin perder fluidez.
                  </p>
                </div>
                <div className="cd-ent__status-box d-none d-sm-block text-end">
                  <p className="cd-ent__status-label mb-0">Teclado</p>
                  <p className="cd-ent__status-value mt-1 mb-0">Modo táctil</p>
                </div>
              </div>
            </div>

            <div className="flex-grow-1 min-h-0 overflow-auto px-3 px-sm-4 py-4">
              <div className="d-flex flex-column gap-3 h-100 min-h-0">
                <div className="cd-ent__card p-3">
                  <div className="mb-3 d-flex align-items-center justify-content-between gap-3">
                    <span className="cd-ent__field-label">Patente</span>
                    <span className="cd-ent__field-hint">
                      Formato: AA-BB-12
                    </span>
                  </div>
                  <input
                    value={plate}
                    readOnly
                    placeholder="AA-BB-12"
                    className="cd-ent__plate-display w-100"
                  />
                </div>

                <div className="cd-ent__card p-3">
                  <div className="d-flex flex-column gap-3">
                    <div className="cd-ent__key-row">
                      {row1.map((key) => (
                        <button
                          key={key}
                          onClick={() => pressKey(key)}
                          className="cd-ent__key"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                    <div className="cd-ent__key-row">
                      {row2.map((key) => (
                        <button
                          key={key}
                          onClick={() => pressKey(key)}
                          className="cd-ent__key"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                    <div className="cd-ent__key-row">
                      {row3.map((key) => (
                        <button
                          key={key}
                          onClick={() => pressKey(key)}
                          className="cd-ent__key"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                    <div className="cd-ent__key-row">
                      {row4.map((key) => (
                        <button
                          key={key}
                          onClick={() => pressKey(key)}
                          className="cd-ent__key"
                        >
                          {key}
                        </button>
                      ))}
                      <button
                        onClick={backspace}
                        className="cd-ent__key-backspace d-flex align-items-center justify-content-center gap-2"
                      >
                        <Icon icon="mdi:backspace-outline" />
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>

                {vehiculoBuscado && (
                  <>
                    {!vehiculoExistente ? (
                      <div className="cd-ent__notice cd-ent__notice--new p-4">
                        <div className="d-flex align-items-start gap-3">
                          <div className="cd-ent__notice-icon cd-ent__notice-icon--new">
                            <Icon icon="mdi:car-plus" />
                          </div>
                          <div className="min-w-0 flex-grow-1">
                            <p className="cd-ent__notice-eyebrow cd-ent__notice-eyebrow--new mb-0">
                              Vehículo nuevo
                            </p>
                            <p className="cd-ent__notice-title mt-2 mb-0">
                              Selecciona la categoría antes de registrar la
                              entrada.
                            </p>
                            <div className="mt-3 d-flex gap-2">
                              <button
                                onClick={() => setCategoria("normal")}
                                className={`cd-ent__cat-btn flex-grow-1 ${categoria === "normal" ? "cd-ent__cat-btn--active" : ""}`}
                              >
                                Normal
                              </button>
                              <button
                                onClick={() => setCategoria("grande")}
                                className={`cd-ent__cat-btn flex-grow-1 ${categoria === "grande" ? "cd-ent__cat-btn--active" : ""}`}
                              >
                                XL / Grande
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="cd-ent__notice cd-ent__notice--found p-4">
                        <div className="d-flex align-items-start gap-3">
                          <div className="cd-ent__notice-icon cd-ent__notice-icon--found">
                            <Icon icon="mdi:check-circle-outline" />
                          </div>
                          <div>
                            <p className="cd-ent__notice-eyebrow cd-ent__notice-eyebrow--found mb-0">
                              Vehículo encontrado
                            </p>
                            <p className="cd-ent__notice-title mt-2 mb-0">
                              Este vehículo ya existe en el sistema.
                            </p>
                            <p className="cd-ent__notice-text mt-1 mb-0">
                              Está listo para registrar la entrada sin crear un
                              nuevo registro.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {registroActivo && (
                  <div className="cd-ent__notice cd-ent__notice--success p-4">
                    <div className="d-flex align-items-start gap-3">
                      <div className="cd-ent__notice-icon cd-ent__notice-icon--success">
                        <Icon icon="mdi:check-decagram-outline" />
                      </div>
                      <div>
                        <p className="cd-ent__notice-eyebrow cd-ent__notice-eyebrow--success mb-0">
                          Registro exitoso
                        </p>
                        <p className="cd-ent__notice-title mt-2 mb-0">
                          Entrada registrada correctamente.
                        </p>
                        <p className="cd-ent__notice-text mt-1 mb-0">
                          {registroActivo.fecha_ingreso}{" "}
                          {registroActivo.hora_ingreso}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="cd-ent__notice cd-ent__notice--error p-4">
                    <div className="d-flex align-items-start gap-3">
                      <div className="cd-ent__notice-icon cd-ent__notice-icon--error">
                        <Icon icon="mdi:alert-circle-outline" />
                      </div>
                      <div>
                        <p className="cd-ent__notice-eyebrow cd-ent__notice-eyebrow--error mb-0">
                          Error
                        </p>
                        <p className="cd-ent__notice-text-strong mt-2 mb-0">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={registrarEntrada}
                  disabled={loading || plate.length < 8}
                  className="cd-ent__submit-btn w-100 d-flex align-items-center justify-content-center"
                >
                  {loading ? "Registrando..." : "Registrar entrada"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="cd-ent__modal-overlay position-fixed d-flex align-items-center justify-content-center p-3">
          <div className="cd-ent__modal">
            <div className="cd-ent__modal-bar" />
            <div className="px-4 px-sm-5 pb-5 pt-5 text-center">
              <div className="cd-ent__modal-icon mx-auto mb-3">
                <Icon icon="mdi:lock-outline" />
              </div>
              <h2 className="cd-ent__modal-title mb-0">Confirmación</h2>
              <p className="cd-ent__modal-subtitle mt-2 mx-auto mb-0">
                Ingresa tu contraseña para volver a la página del encargado.
              </p>

              <div className="mt-4 d-flex flex-column gap-3 text-start">
                <div className="position-relative w-100">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="cd-ent__modal-input w-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cd-ent__modal-eye"
                  >
                    <Icon
                      icon={
                        showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"
                      }
                    />
                  </button>
                </div>

                {error && <div className="cd-ent__modal-error">{error}</div>}

                <div className="row g-3">
                  <div className="col-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setPassword("");
                        setError("");
                      }}
                      className="cd-ent__modal-cancel w-100"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      onClick={verifyPassword}
                      disabled={loading}
                      className="cd-ent__modal-confirm w-100"
                    >
                      {loading ? "Validando..." : "Confirmar"}
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
