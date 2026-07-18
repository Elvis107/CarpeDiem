import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import { calcularTiempoYCosto } from "../components/timecost";

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
  const [, setTick] = useState(0); // fuerza re-render cada segundo para el contador en vivo

  useEffect(() => {
    if (!ingresoActivo || resultadoSalida) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
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

  const buscarIngresoActivo = async (patente) => {
    if (patente.length < 8) return;

    const { data: ingreso } = await supabase
      .from("ingreso")
      .select(
        `
      id_ingreso, patente, id_espacio, fecha_ingreso, hora_ingreso,
      vehiculo ( categoria_vehiculo ( nombre_categoria, valor_hora ) )
    `,
      )
      .eq("patente", patente)
      .order("fecha_ingreso", { ascending: false })
      .order("hora_ingreso", { ascending: false })
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

    setIngresoActivo(salidaExistente ? null : ingreso);
    setBuscado(true);
  };

  const pressKey = (key) => {
    const nueva = formatPlate(plate + key);
    setPlate(nueva);
    setBuscado(false);
    setResultadoSalida(null);
    buscarIngresoActivo(nueva);
  };

  const backspace = () => {
    const nueva = formatPlate(plate.slice(0, -1));
    setPlate(nueva);
    setBuscado(false);
    setResultadoSalida(null);
  };

  const registrarSalida = async () => {
    if (!ingresoActivo) {
      setError("No se encontró un ingreso activo para esa patente");
      return;
    }

    setLoading(true);
    setError("");

    const valorHora =
      ingresoActivo.vehiculo?.categoria_vehiculo?.valor_hora || 0;
    const { minutos, costo: costoTotal } = calcularTiempoYCosto(
      ingresoActivo.fecha_ingreso,
      ingresoActivo.hora_ingreso,
      valorHora,
    );

    const { data: salida, error: errSalida } = await supabase
      .from("salida")
      .insert({
        id_ingreso: ingresoActivo.id_ingreso,
        tiempo_total: minutos,
        costo_total: costoTotal,
      })
      .select()
      .single();

    if (errSalida) {
      setError("Error al registrar salida: " + errSalida.message);
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
      .eq("id_espacio", ingresoActivo.id_espacio);

    setResultadoSalida({ ...salida, minutos, costoTotal });
    setTimeout(() => {
      setPlate("");
      setBuscado(false);
      setIngresoActivo(null);
      setResultadoSalida(null);
    }, 3000);
    setLoading(false);
  };

  const keyClass =
    "flex h-14 items-center justify-center rounded-[22px] border border-slate-200 bg-white text-lg font-semibold text-slate-700 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_28px_-16px_rgba(15,23,42,0.2)] active:translate-y-0 active:scale-[0.98] sm:h-16 sm:text-xl";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef3ef] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(238,243,239,1))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40" />

      <div className="relative mx-auto max-w-[3000px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-900 hover:shadow-lg"
          >
            <Icon icon="mdi:arrow-left" className="text-lg" />
            Volver
          </button>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Vista en tiempo real
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
              <Icon icon="mdi:map-marker-outline" className="text-sm" />
              Operación activa
            </span>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-8.5rem)] gap-6 lg:grid-cols-2 xl:gap-8">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-none border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.16)]">
            <div className="border-b border-slate-200/80 px-6 py-6 sm:px-8 bg-white">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                    Registro de salida
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                    Salida
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Ingresa la patente para localizar el ingreso activo,
                    calcular la permanencia y cerrar la estadía.
                  </p>
                </div>
                <div className="hidden shrink-0 rounded-none border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Estado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Proceso activo
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 px-4 py-4 sm:px-6 bg-white">
              <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Patente
                    </span>
                    <span className="rounded-none border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
                      Formato: AA-BB-12
                    </span>
                  </div>
                  <input
                    value={plate}
                    readOnly
                    placeholder="AA-BB-12"
                    className="h-32 w-full rounded-none border border-slate-200 bg-white px-6 text-center font-mono text-5xl font-bold tracking-[0.45em] text-slate-900 outline-none ring-1 ring-slate-200 placeholder:text-slate-300 sm:h-36 sm:text-6xl"
                  />
                </div>

                <div className="rounded-none border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="grid gap-3">
                    <div className="grid grid-cols-10 gap-3">
                      {row1.map((key) => (
                        <button key={key} onClick={() => pressKey(key)} className={keyClass}>
                          {key}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-10 gap-3">
                      {row2.map((key) => (
                        <button key={key} onClick={() => pressKey(key)} className={keyClass}>
                          {key}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-10 gap-3">
                      {row3.map((key) => (
                        <button key={key} onClick={() => pressKey(key)} className={keyClass}>
                          {key}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-10 gap-3">
                      {row4.map((key) => (
                        <button key={key} onClick={() => pressKey(key)} className={keyClass}>
                          {key}
                        </button>
                      ))}
                      <button
                        onClick={backspace}
                        className="col-span-3 flex h-14 items-center justify-center gap-2 rounded-none border border-rose-200 bg-gradient-to-r from-rose-500 to-rose-600 text-sm font-semibold text-white shadow-[0_16px_30px_-16px_rgba(244,63,94,0.55)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_-18px_rgba(244,63,94,0.65)] active:translate-y-0 active:scale-[0.98] sm:h-16 sm:text-base"
                      >
                        <Icon icon="mdi:backspace-outline" className="text-lg" />
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {buscado && !ingresoActivo && !resultadoSalida && (
                    <div className="rounded-none border border-emerald-200 bg-emerald-50 p-5 shadow-sm lg:col-span-2">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Icon icon="mdi:car-off" className="text-2xl" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Vehículo no encontrado
                          </p>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                            No se encontró un ingreso activo con esa patente.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {buscado && ingresoActivo && !resultadoSalida && (
                    <div className="rounded-none border border-emerald-200 bg-emerald-50 p-5 shadow-sm lg:col-span-2">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Icon icon="mdi:check-circle-outline" className="text-2xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Vehículo encontrado
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            {ingresoActivo.vehiculo?.categoria_vehiculo?.nombre_categoria || "Vehículo"} · Espacio {ingresoActivo.id_espacio}
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Permanencia
                              </p>
                              {(() => {
                                const valorHora =
                                  ingresoActivo.vehiculo?.categoria_vehiculo?.valor_hora || 0;
                                const { minutos, segundos, costo } = calcularTiempoYCosto(
                                  ingresoActivo.fecha_ingreso,
                                  ingresoActivo.hora_ingreso,
                                  valorHora,
                                );
                                const horas = Math.floor(minutos / 60);
                                const mins = minutos % 60;
                                return (
                                  <>
                                    <p className="mt-2 font-mono text-3xl font-bold tracking-[0.18em] text-slate-900">
                                      {String(horas).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                      Tiempo total acumulado
                                    </p>
                                    <p className="mt-4 text-sm font-semibold text-emerald-700">
                                      Costo estimado al cierre
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-emerald-600">
                                      ${costo.toLocaleString("es-CL")}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>

                            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Estado de salida
                              </p>
                              <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                  <Icon icon="mdi:parking" className="text-xl" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    Listo para cerrar
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    El vehículo tiene un ingreso activo.
                                  </p>
                                </div>
                              </div>
                              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Registro
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  {ingresoActivo.fecha_ingreso} {ingresoActivo.hora_ingreso}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {resultadoSalida && (
                    <div className="rounded-none border border-emerald-200 bg-emerald-50 p-5 shadow-sm lg:col-span-2">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Icon icon="mdi:check-decagram-outline" className="text-2xl" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Salida registrada
                          </p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">
                            El vehículo salió correctamente del estacionamiento.
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Tiempo total
                              </p>
                              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                                {resultadoSalida.minutos} min
                              </p>
                              <p className="mt-2 text-sm text-slate-500">
                                Permanencia total registrada
                              </p>
                            </div>
                            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-cyan-500 px-4 py-4 text-white shadow-[0_20px_40px_-22px_rgba(16,185,129,0.85)]">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                                Costo total
                              </p>
                              <p className="mt-2 text-4xl font-black tracking-tight">
                                ${resultadoSalida.costoTotal.toLocaleString("es-CL")}
                              </p>
                              <p className="mt-2 text-sm text-white/80">
                                Cobro final por la estadía
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-none border border-emerald-200 bg-emerald-50 p-5 shadow-sm lg:col-span-2">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Icon icon="mdi:alert-circle-outline" className="text-2xl" />
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Error
                          </p>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={registrarSalida}
                  disabled={loading || !ingresoActivo}
                  className="flex h-16 w-full items-center justify-center gap-2 rounded-none bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-lg font-semibold text-white shadow-[0_18px_35px_-18px_rgba(16,185,129,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_42px_-18px_rgba(16,185,129,0.9)] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-white/90 disabled:opacity-100 disabled:shadow-none active:translate-y-0 active:scale-[0.99]"
                >
                  <Icon icon="mdi:exit-run" className="text-xl" />
                  {loading ? "Registrando..." : "Registrar salida"}
                </button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto rounded-none border border-slate-200/80 bg-white p-5 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.16)] sm:p-6">
            <div className="rounded-none border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Resumen de salida
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    Información clave
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon icon="mdi:receipt-text-outline" className="text-2xl" />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-white bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Icon icon="mdi:clock-outline" className="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tiempo total
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {resultadoSalida ? `${resultadoSalida.minutos} min` : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-none border border-white bg-gradient-to-br from-emerald-600 to-cyan-500 px-4 py-5 text-white shadow-[0_22px_45px_-24px_rgba(16,185,129,0.9)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                    Costo total
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-sm font-semibold text-white">$</span>
                    <span className="text-4xl font-black tracking-tight text-white">
                      {resultadoSalida
                        ? resultadoSalida.costoTotal.toLocaleString("es-CL")
                        : "0"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white">
                    El dato más importante de esta pantalla
                  </p>
                </div>

                <div className="rounded-2xl border border-white bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <Icon icon="mdi:state-machine" className="text-xl" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Estado de la salida
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
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

            <div className="rounded-none border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon icon="mdi:keyboard-outline" className="text-2xl" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Interacción
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    El teclado virtual conserva exactamente el mismo comportamiento.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-none border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Patente digitada
              </p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-[0.3em] text-slate-900">
                {plate || "AA-BB-12"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl">
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 shadow-[0_30px_100px_-35px_rgba(0,0,0,0.8)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500" />
            <div className="px-8 pb-10 pt-12 text-center sm:px-10">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Icon icon="mdi:lock-outline" className="text-3xl" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Confirmación
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                Ingresa tu contraseña para volver a la página del encargado.
              </p>

              <div className="mt-8 space-y-5 text-left">
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-5 pr-14 text-base text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    <Icon
                      icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"}
                      className="text-xl"
                    />
                  </button>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setPassword("");
                      setError("");
                    }}
                    className="rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={verifyPassword}
                    disabled={loading}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3.5 text-sm font-semibold text-white shadow-[0_18px_36px_-18px_rgba(6,182,212,0.75)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_42px_-20px_rgba(6,182,212,0.85)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Validando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
