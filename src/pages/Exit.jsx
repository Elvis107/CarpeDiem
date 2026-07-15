/**
 * Exit.jsx
 * --------
 * Página de registro de salida de vehículos del estacionamiento Carpe Diem.
 *
 * Layout:
 *   - Lado izquierdo: card con teclado virtual y campo de patente
 *   - Lado derecho:   panel de resumen (tiempo, categoría, costo) y botón confirmar
 *                     El panel cambia de estado según el flujo:
 *                     vacío → buscando → resumen → confirmado
 *
 * Flujo de registro:
 *   1. El operador ingresa la patente con el teclado virtual
 *   2. Al completar 8 caracteres, busca en "ingreso" el registro más reciente
 *      sin salida asociada para esa patente
 *   3. Calcula el tiempo transcurrido y el costo según la categoría del vehículo
 *   4. Muestra resumen: tiempo, categoría y costo total
 *   5. Al confirmar, inserta en la tabla "salida" y cierra el ingreso
 *
 * Lógica de tarifas (obtenida desde categoria_vehiculo):
 *   - Normal : mínimo $700 (primeros 30 min), luego $1400/hora proporcional
 *   - Grande : mínimo $1000 (primeros 35 min), luego $1600/hora proporcional
 *
 * Manejo de multi-visita:
 *   Siempre se busca el ingreso MÁS RECIENTE sin salida para esa patente.
 *   Si el auto estuvo ayer y vuelve hoy, el sistema cierra el ingreso correcto
 *   sin confusión, ya que linkea por id_ingreso.
 *
 * Modal de seguridad (botón "Volver"):
 *   Igual que Entrance: requiere contraseña del encargado para volver al dashboard.
 */

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

    // ¿Ese ingreso ya tiene una salida registrada? (ej. reingresó el mismo auto)
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

  const isXL = (n) => [1, 2, 3, 17, 18, 19, 20].includes(n);

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

    // Libera el espacio manualmente (el ESP32 también lo hará al no detectar el vehículo)
    await supabase
      .from("espacios")
      .update({
        estado: "disponible",
        patente: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id_espacio", ingresoActivo.id_espacio);

    setResultadoSalida({ ...salida, minutos, costoTotal });
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#edf3ef]">
      {/* boton volver */}
      <button
        onClick={() => setShowModal(true)}
        className="absolute top-8 left-8 z-20 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-lg"
      >
        <Icon icon="mdi:arrow-left" />
        Volver
      </button>
      <div className="flex min-h-screen">
        {/* Card de salida del estacionamiento */}
        <div className="w-full flex justify-center items-center px-12">
          <div className="w-[470px] bg-white rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] px-12 py-10">
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <Icon
                  icon="mdi:boom-gate-up"
                  className="text-[44px] text-red-600"
                />
              </div>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black text-slate-900 mb-2">
                Salida
              </h1>
              <p className="text-sm text-gray-500">
                Ingreso de patente para registro de salida
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Patente
              </label>
              <input
                value={plate}
                readOnly
                placeholder="Ej: AA-BB-12"
                className="w-full h-[55px] rounded-xl border-2 border-gray-200 bg-gray-50 px-4 text-lg outline-none"
              />
            </div>
            <div className="flex flex-col gap-2 mb-6">
              <div className="grid grid-cols-10 gap-1">
                {row1.map((key) => (
                  <button
                    key={key}
                    onClick={() => pressKey(key)}
                    className="h-9 text-sm rounded bg-gray-100 hover:bg-gray-200 font-semibold"
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-10 gap-1">
                {row2.map((key) => (
                  <button
                    key={key}
                    onClick={() => pressKey(key)}
                    className="h-9 text-sm rounded bg-gray-100 hover:bg-gray-200 font-semibold"
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-10 gap-1">
                {row3.map((key) => (
                  <button
                    key={key}
                    onClick={() => pressKey(key)}
                    className="h-9 text-sm rounded bg-gray-100 hover:bg-gray-200 font-semibold"
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-10 gap-1">
                {row4.map((key) => (
                  <button
                    key={key}
                    onClick={() => pressKey(key)}
                    className="h-9 text-sm rounded bg-gray-100 hover:bg-gray-200 font-semibold"
                  >
                    {key}
                  </button>
                ))}
                <button
                  onClick={backspace}
                  className="col-span-3 h-9 rounded bg-red-100 hover:bg-red-200 text-sm font-bold"
                >
                  Borrar
                </button>
              </div>
            </div>

            {buscado && !ingresoActivo && !resultadoSalida && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                No se encontró un ingreso activo con esa patente
              </div>
            )}

            {buscado && ingresoActivo && !resultadoSalida && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 text-sm text-blue-700">
                <p className="font-semibold mb-2">
                  {ingresoActivo.vehiculo?.categoria_vehiculo
                    ?.nombre_categoria || "Vehículo"}{" "}
                  — Espacio {ingresoActivo.id_espacio}
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
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-mono font-bold text-slate-800">
                        {String(horas).padStart(2, "0")}:
                        {String(mins).padStart(2, "0")}:
                        {String(segundos).padStart(2, "0")}
                      </span>
                      <span className="text-xl font-bold text-emerald-700">
                        ${costo.toLocaleString("es-CL")}
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            {resultadoSalida && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center">
                ✓ Salida registrada — {resultadoSalida.minutos} min · $
                {resultadoSalida.costoTotal.toLocaleString("es-CL")}
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={registrarSalida}
              disabled={loading || !ingresoActivo}
              className="w-full h-[55px] rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-lg font-bold transition-all"
            >
              {loading ? "Registrando..." : "Registrar Salida"}
            </button>
          </div>
        </div>
      </div>
      {/* ventana emergente ingreso de contraseña para retroceso a la pagina */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2633] w-full max-w-[450px] rounded-[28px] shadow-2xl border border-gray-700/40 p-10 pb-12 flex flex-col items-center justify-center text-center transform transition-all">
            <div className="w-16 h-16 rounded-2xl bg-[#00b4d8]/10 flex items-center justify-center border border-[#00b4d8]/20 mb-4">
              <Icon
                icon="mdi:lock-outline"
                className="text-[#00b4d8] text-3xl"
              />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-wide mb-2">
              Confirmación
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-[320px]">
              Ingresa tu contraseña para volver a la pagina encargado
            </p>
            <div className="w-full max-w-[350px] flex flex-col gap-5">
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#161b26] text-white placeholder-gray-500 py-3.5 pl-5 pr-12 rounded-xl border border-gray-700/60 focus:outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20 transition-all text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition p-1"
                >
                  <Icon
                    icon={
                      showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"
                    }
                    className="text-xl"
                  />
                </button>
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-sm text-center">
                  {error}
                </div>
              )}
              <div className="flex gap-4 w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPassword("");
                    setError("");
                  }}
                  className="flex-1 py-3.5 rounded-xl text-gray-300 bg-transparent border border-gray-600/70 hover:bg-white/5 hover:text-white transition-all font-medium text-base"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={verifyPassword}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl text-white font-semibold bg-[#00b4d8] hover:bg-[#0096b4] disabled:bg-gray-700 disabled:text-gray-400 shadow-lg shadow-[#00b4d8]/20 transition-all text-base"
                >
                  {loading ? "Validando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
