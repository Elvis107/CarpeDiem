/**
 * Entrance.jsx
 * ------------
 * Página de registro de entrada de vehículos al estacionamiento Carpe Diem.
 * Diseño Fluido: Previene recortes de texto y pérdida de contenido al achicar la pantalla.
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

  // SCRIPT DE VALIDACIÓN DE FORMATO CHILENO
  const validatePlateFormat = (value) => {
    const regex = /^[A-Z]{2}-[A-Z0-9]{2}-[0-9]{2}$/;
    return regex.test(value);
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
    setError(""); 
  };

  const limpiarFormulario = () => {
    setPlate("");
    setVehiculoBuscado(false);
    setVehiculoExistente(null);
    setCategoria("normal");
    setError("");
  };

  const buscarVehiculo = async (patente) => {
    if (!validatePlateFormat(patente)) return;
    
    const { data } = await supabase
      .from("vehiculo")
      .select("*")
      .eq("patente", patente)
      .maybeSingle();

    setVehiculoExistente(data || null);
    setVehiculoBuscado(true);
  };

  const registrarEntrada = async () => {
    if (!plate || !validatePlateFormat(plate)) {
      setError("Patente inválida o incompleta (Ej: AA-BB-11)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!vehiculoExistente) {
        const { data: cat } = await supabase
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
          fecha_ingreso: (() => {
            const ahora = new Date();
            const y = ahora.getFullYear();
            const m = String(ahora.getMonth() + 1).padStart(2, "0");
            const d = String(ahora.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
          })(),
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
      limpiarFormulario();

      setTimeout(() => setRegistroActivo(null), 4000);
    } catch (e) {
      setError("Error inesperado: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col font-sans antialiased">
      
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="w-full bg-white border-b border-slate-200/80 px-8 py-4 flex justify-between items-center shrink-0 shadow-sm">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl border border-slate-200 transition-all active:scale-95"
        >
          <Icon icon="mdi:arrow-left" className="text-lg" />
          Volver al Dashboard
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL AUTORESPONSIVO */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 lg:p-8 gap-8 items-stretch">
        
        {/* COLUMNA IZQUIERDA: PANEL DEL MAPA */}
        <div className="flex-1 w-full bg-white rounded-[32px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6 lg:p-8 flex flex-col">
          {/* Cabecera del mapa sin riesgos de colapso */}
          <div className="border-b border-dashed border-slate-200 pb-4 mb-6 flex justify-between items-center w-full">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Estado del Estacionamiento</span>
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Icon icon="mdi:map-marker-outline" /> Vista en Tiempo Real
            </span>
          </div>
          
          {/* Contenedor con scroll interno independiente para el mapa si la pantalla es muy chica */}
          <div className="w-full overflow-auto flex items-center justify-center py-4">
            <ParkingMap orientation="horizontal" />
          </div>
        </div>

        {/* COLUMNA DERECHA: CONSOLA DE ENTRADA VERTICAL */}
        <div className="w-full lg:w-[560px] bg-white rounded-[32px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6 lg:p-8 flex flex-col justify-between gap-6">
          
          <div className="flex flex-col flex-1">
            {/* Encabezado del Panel */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Icon icon="mdi:boom-gate-down" className="text-3xl" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Entrada</h1>
                <p className="text-sm font-medium text-slate-400">Ingrese patente para registrar vehículo</p>
              </div>
            </div>

            {/* Caja de Visualización de Patente */}
            <div className="mb-4 bg-slate-50/80 border-2 border-slate-100 rounded-2xl p-5 flex flex-col items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Patente Digitada</span>
              <div className="w-full h-20 bg-white border-2 border-slate-300 rounded-xl shadow-inner flex items-center justify-center">
                {plate ? (
                  <span className="font-mono font-black text-4xl tracking-widest text-slate-800 uppercase">{plate}</span>
                ) : (
                  <span className="font-sans font-bold text-slate-300 text-xl">Esperando entrada...</span>
                )}
              </div>
            </div>

            {/* Alertas y selectores de Categorías */}
            <div className="min-h-[65px] mb-4 flex flex-col justify-center text-xs">
              {vehiculoBuscado && !vehiculoExistente && (
                <div className="flex flex-col gap-1.5 bg-amber-50 border border-amber-100 p-3 rounded-xl">
                  <span className="text-amber-700 font-black uppercase text-[10px] tracking-wider">Categoría de Vehículo Nuevo:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCategoria("normal")}
                      className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                        categoria === "normal" ? "border-amber-500 bg-white text-amber-700 shadow-sm" : "border-slate-200 text-slate-400 bg-white/40"
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setCategoria("grande")}
                      className={`flex-1 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                        categoria === "grande" ? "border-amber-500 bg-white text-amber-700 shadow-sm" : "border-slate-200 text-slate-400 bg-white/40"
                      }`}
                    >
                      XL (Grande)
                    </button>
                  </div>
                </div>
              )}

              {vehiculoBuscado && vehiculoExistente && (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <Icon icon="mdi:check-circle" className="text-lg" />
                  <span>Vehículo registrado como: {vehiculoExistente.id_categoria === 2 ? "XL" : "Normal"}</span>
                </div>
              )}

              {registroActivo && (
                <div className="flex flex-col gap-0.5 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-xl">
                  <span className="text-emerald-700 font-bold text-sm flex items-center gap-1">✓ Ingreso Guardado</span>
                  <span className="text-emerald-600 font-semibold text-xs">¡Puede hacer pasar al vehículo!</span>
                </div>
              )}
            </div>

            {/* Teclado Virtual */}
            <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner mb-6">
              <div className="grid grid-cols-20 gap-1.5">
                {row1.map((key) => (
                  <button key={key} onClick={() => pressKey(key)} className="col-span-2 h-14 text-lg rounded-xl bg-white shadow-sm border border-slate-200 font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all">{key}</button>
                ))}
              </div>
              <div className="grid grid-cols-20 gap-1.5">
                {row2.map((key) => (
                  <button key={key} onClick={() => pressKey(key)} className="col-span-2 h-14 text-lg rounded-xl bg-white shadow-sm border border-slate-200 font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all">{key}</button>
                ))}
              </div>
              <div className="grid grid-cols-20 gap-1.5">
                {row3.map((key) => (
                  <button key={key} onClick={() => pressKey(key)} className="col-span-2 h-14 text-lg rounded-xl bg-white shadow-sm border border-slate-200 font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all">{key}</button>
                ))}
              </div>
              <div className="grid grid-cols-20 gap-1.5">
                {row4.map((key) => (
                  <button key={key} onClick={() => pressKey(key)} className="col-span-2 h-14 text-lg rounded-xl bg-white shadow-sm border border-slate-200 font-black text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all">{key}</button>
                ))}
                <button onClick={backspace} className="col-span-3 h-14 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all"><Icon icon="mdi:backspace-outline" className="text-lg" /> Borrar</button>
                <button onClick={limpiarFormulario} className="col-span-3 h-14 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all"><Icon icon="mdi:refresh" className="text-lg" /> Limpiar</button>
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
              className="w-full h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white text-lg font-black shadow-lg transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Icon icon={loading ? "mdi:loading" : "mdi:check-circle"} className={`text-2xl ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Procesando..." : "Confirmar Entrada"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* VENTANA EMERGENTE: CONFIRMACIÓN DE CONTRASEÑA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-[modalBackdrop_0.35s_ease-out_forwards]">
          <style>{`
            @keyframes modalBackdrop { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modalScale { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}
          </style>
          
          <div className="bg-[#131924] w-full max-w-[520px] rounded-[36px] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.6)] border border-slate-800/80 p-10 flex flex-col items-center animate-[modalScale_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-5 text-indigo-400 shadow-inner">
              <Icon icon="mdi:shield-key-outline" className="text-3xl" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">Área Protegida</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-[340px] text-center">
              Por seguridad, introduce tu clave de supervisor para regresar al menú principal.
            </p>

            <div className="w-full flex flex-col gap-4">
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña del encargado"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-slate-950/50 text-slate-200 placeholder-slate-600 py-3 pl-5 pr-14 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-base shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5 transition"
                >
                  <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} className="text-xl" />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl py-3 px-4 text-xs text-center font-semibold tracking-wide">
                  {error}
                </div>
              )}

              <div className="flex gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setPassword("");
                    setError("");
                  }}
                  className="flex-1 h-12 rounded-xl text-slate-400 bg-slate-900 border border-slate-800/80 hover:bg-slate-800 hover:text-slate-200 transition-all font-bold text-sm"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={verifyPassword}
                  disabled={loading}
                  className="flex-1 h-12 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all text-sm shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Icon icon="mdi:loading" className="animate-spin text-xl" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <span>Confirmar</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}