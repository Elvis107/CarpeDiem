/**
 * Entrance.jsx
 * ------------
 * Página de registro de entrada de vehículos al estacionamiento Carpe Diem.
 *
 * Layout:
 *   - Lado izquierdo (58%): mapa del estacionamiento en tiempo real (solo lectura)
 *   - Lado derecho (42%):   card de ingreso de patente
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
  const [categoria, setCategoria] = useState("normal"); // "normal" o "grande"
  const [registroActivo, setRegistroActivo] = useState(null); // ingreso en curso

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

  const isXL = (n) => [1, 2, 3, 17, 18, 19, 20].includes(n);

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

    try {
      if (!vehiculoExistente) {
        const { data: cat, error: errCat } = await supabase
          .from("categoria_vehiculo")
          .select("id_categoria")
          .eq("nombre_categoria", categoria === "grande" ? "Grande" : "Normal")
          .maybeSingle();

        const { data: nuevoVehiculo, error: errVehiculo } = await supabase
          .from("vehiculo")
          .insert({
            patente: plate,
            id_categoria: cat?.id_categoria || null,
          })
          .select();

        if (errVehiculo) {
          setError("Error al guardar vehículo: " + errVehiculo.message);
          setLoading(false);
          return;
        }
      }

      const { data: ingreso, error: errIngreso } = await supabase
        .from("ingreso")
        .insert({
          patente: plate,
          fecha_ingreso: new Date().toISOString().split("T")[0],
          hora_ingreso: new Date().toTimeString().split(" ")[0],
        })
        .select()
        .single();

      if (errIngreso) {
        setError("Error al registrar ingreso: " + errIngreso.message);
        setLoading(false);
        return;
      }

      setRegistroActivo(ingreso);
    } catch (e) {
      setError("Error inesperado: " + e.message);
      console.error(e);
    }

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
        {/* diseño del estacionamiento */}
        <div className="w-[58%] flex justify-center items-center">
          <ParkingMap />
        </div>
        {/* lado derecho card de ingreso de patente */}
        <div className="w-[42%] flex justify-center items-center px-12">
          <div className="w-[470px] bg-white rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] px-12 py-10">
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Icon
                  icon="mdi:car-arrow-right"
                  className="text-[44px] text-green-600"
                />
              </div>
            </div>
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black text-slate-900 mb-2">
                Entrada
              </h1>
              <p className="text-sm text-gray-500">
                Registrar ingreso del vehículo
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
            {/* Si el vehículo es nuevo, pedir categoría */}
            {vehiculoBuscado && !vehiculoExistente && (
              <div className="mb-4 flex flex-col gap-3">
                <p className="text-sm text-amber-600 font-semibold">
                  Vehículo nuevo — selecciona la categoría
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCategoria("normal")}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${categoria === "normal"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500"
                      }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setCategoria("grande")}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${categoria === "grande"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500"
                      }`}
                  >
                    Grande / XL
                  </button>
                </div>
              </div>
            )}

            {/* Si ya existe, mostrar info */}
            {vehiculoBuscado && vehiculoExistente && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                ✓ Vehículo ya registrado
              </div>
            )}

            {/* Ingreso activo */}
            {registroActivo && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 text-center">
                ✓ Entrada registrada — {registroActivo.fecha_ingreso}{" "}
                {registroActivo.hora_ingreso}
              </div>
            )}
            <button
              onClick={registrarEntrada}
              disabled={loading}
              className="w-full h-[55px] rounded-xl bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-lg font-bold transition-all"
            >
              {loading ? "Registrando..." : "Registrar Entrada"}
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
