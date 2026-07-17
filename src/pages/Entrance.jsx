/**
 * Entrance.jsx
 * ------------
 * Página de registro de entrada de vehículos al estacionamiento Carpe Diem.
 *
 * Flujo de registro:
 *   1. El operador escribe la patente con el teclado virtual
 *   2. Al completar 8 caracteres (ej: AA-BB-12), se busca el vehículo en Supabase
 *   3a. Si el vehículo existe → muestra confirmación y permite registrar entrada
 *   3b. Si el vehículo es nuevo → muestra selector de categoría (Normal / XL)
 *       y crea el vehículo antes de registrar la entrada
 *   4. Se inserta un registro en la tabla "ingreso" con fecha y hora actuales
 *
 * Modal de seguridad (botón "Volver"):
 *   Para evitar salidas accidentales, al presionar "Volver" se solicita
 *   la contraseña del encargado. Solo si es correcta se navega al dashboard.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { supabase } from "../supabaseClient";
import ParkingMap from "../components/ParkingMap";

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
          setError("Este vehículo ya tiene un ingreso activo sin salida registrada");
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

        await supabase
          .from("vehiculo")
          .insert({
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

  const keyClass =
    "flex h-14 items-center justify-center rounded-[22px] border border-slate-200 bg-white text-lg font-semibold text-slate-700 shadow-[0_10px_24px_-14px_rgba(15,23,42,0.14)] transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_28px_-16px_rgba(15,23,42,0.2)] active:translate-y-0 active:scale-[0.98] sm:h-16 sm:text-xl";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef3ef] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(238,243,239,1))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:34px_34px] opacity-40" />

        <div className="relative w-full px-4 py-5 sm:px-6 lg:px-8">
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
          <div className="flex min-h-0 flex-col overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-6 border-b border-slate-200/80 px-6 py-6 sm:px-8">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                  Mapa en vivo
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Mapa del estacionamiento
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Supervisión visual de los espacios disponibles con una
                  presentación limpia, profesional y fácil de leer.
                </p>
              </div>
              <div className="hidden shrink-0 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Estado
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Operación activa
                </p>
              </div>
            </div>

              <div className="flex flex-1 p-2">
                <div className="flex flex-1 items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 p-2">
                <div className="w-full overflow-hidden rounded-[24px] bg-white shadow-[0_18px_45px_-25px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/70">
                  <ParkingMap />
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-none border border-slate-200/80 bg-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.18)]">
            <div className="border-b border-slate-200/80 px-6 py-6 sm:px-8 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-none border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700">
                    <Icon icon="mdi:car-arrow-right" className="text-sm" />
                    Registro de entrada
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
                    Entrada
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Captura la patente, confirma el vehículo y registra el
                    ingreso sin perder fluidez.
                  </p>
                </div>
                <div className="hidden rounded-none border border-slate-200 bg-slate-50 px-4 py-3 text-right sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Teclado
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Modo táctil
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto px-4 py-4 sm:px-6 bg-white">
              <div className="flex h-full min-h-0 flex-col gap-4">
                <div className="rounded-none border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Patente
                    </span>
                    <span className="rounded-none border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
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

                <div className="rounded-none border border-slate-200 bg-white p-4 shadow-sm">
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
                        className="col-span-3 flex h-14 items-center justify-center gap-2 rounded-none border border-rose-400/25 bg-gradient-to-r from-rose-500 to-rose-600 text-sm font-semibold text-white shadow-[0_16px_30px_-16px_rgba(225,29,72,0.72)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_22px_34px_-18px_rgba(225,29,72,0.82)] active:translate-y-0 active:scale-[0.98] sm:h-16 sm:text-base"
                      >
                        <Icon icon="mdi:backspace-outline" className="text-lg" />
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>

                {vehiculoBuscado && (
                  <div className="space-y-4">
                    {!vehiculoExistente ? (
                      <div className="rounded-none border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                            <Icon icon="mdi:car-plus" className="text-2xl" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
                              Vehículo nuevo
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              Selecciona la categoría antes de registrar la
                              entrada.
                            </p>
                            <div className="mt-4 flex gap-3">
                              <button
                                onClick={() => setCategoria("normal")}
                                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                                  categoria === "normal"
                                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                Normal
                              </button>
                              <button
                                onClick={() => setCategoria("grande")}
                                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all duration-150 ${
                                  categoria === "grande"
                                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                XL / Grande
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-none border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                            <Icon
                              icon="mdi:check-circle-outline"
                              className="text-2xl"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                              Vehículo encontrado
                            </p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">
                              Este vehículo ya existe en el sistema.
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Está listo para registrar la entrada sin crear un
                              nuevo registro.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {registroActivo && (
                  <div className="rounded-none border border-sky-200 bg-sky-50 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                        <Icon
                          icon="mdi:check-decagram-outline"
                          className="text-2xl"
                        />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                          Registro exitoso
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          Entrada registrada correctamente.
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {registroActivo.fecha_ingreso} {registroActivo.hora_ingreso}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-none border border-rose-200 bg-rose-50 p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                        <Icon icon="mdi:alert-circle-outline" className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">
                          Error
                        </p>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={registrarEntrada}
                  disabled={loading || plate.length < 8}
                  className="flex h-16 w-full items-center justify-center rounded-none bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 text-lg font-semibold text-white shadow-[0_18px_35px_-18px_rgba(16,185,129,0.82)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-18px_rgba(16,185,129,0.92)] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-white/90 disabled:opacity-100 disabled:shadow-none active:translate-y-0 active:scale-[0.99]"
                >
                  {loading ? "Registrando..." : "Registrar entrada"}
                </button>
              </div>
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
