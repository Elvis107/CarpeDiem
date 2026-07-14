/**
 * Exit.jsx
 * --------
 * Página de registro de salida de vehículos del estacionamiento Carpe Diem.
 * Diseño Ampliado: Panel de Cobro a la izquierda, Interfaz de entrada Gigante a la derecha.
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
  const [formatoInvalido, setFormatoInvalido] = useState(false);
  const [, setTick] = useState(0); 

  useEffect(() => {
    if (!ingresoActivo || resultadoSalida) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [ingresoActivo, resultadoSalida]);

  const verifyPassword = async () => {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

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

  const buscarIngresoActivo = async (patente) => {
    // Reemplaza el antiguo .length < 8 por una validación estructural estricta
    if (!validatePlateFormat(patente)) return;

    const { data: ingreso } = await supabase
      .from("ingreso")
      .select(`
        id_ingreso, patente, id_espacio, fecha_ingreso, hora_ingreso,
        vehiculo ( categoria_vehiculo ( nombre_categoria, valor_hora ) )
      `)
      .eq("patente", patente)
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

    // CAMBIO: si la patente ya está completa (6 caracteres sin contar los guiones)
    // pero no calza con el formato chileno, se avisa con un mensaje aparte,
    // distinto al de "no se encuentra la información"
    const largoSinGuiones = nueva.replace(/-/g, "").length;
    if (largoSinGuiones === 6 && !validatePlateFormat(nueva)) {
      setFormatoInvalido(true);
      setIngresoActivo(null);
      setBuscado(false);
      return;
    }

    setFormatoInvalido(false);
    buscarIngresoActivo(nueva);
  };

  const backspace = () => {
    const nueva = formatPlate(plate.slice(0, -1));
    setPlate(nueva);
    setBuscado(false);
    setIngresoActivo(null);
    setResultadoSalida(null);
    setFormatoInvalido(false);
    setError("");
  };

  const limpiarFormulario = () => {
    setPlate("");
    setBuscado(false);
    setIngresoActivo(null);
    setResultadoSalida(null);
    setFormatoInvalido(false);
    setError("");
  };

  const registrarSalida = async () => {
    if (!plate || !validatePlateFormat(plate)) {
      setError("La patente ingresada posee un formato inválido.");
      return;
    }

    if (!ingresoActivo) {
      setError("No se encontró un ingreso activo para esa patente");
      return;
    }

    setLoading(true);
    setError("");

    const valorHora = ingresoActivo.vehiculo?.categoria_vehiculo?.valor_hora || 0;
    const { minutos, costo: costoTotal } = calcularTiempoYCosto(
      ingresoActivo.fecha_ingreso,
      ingresoActivo.hora_ingreso,
      valorHora
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

    if (ingresoActivo.id_espacio) {
      await supabase
        .from("espacios")
        .update({
          estado: "disponible",
          patente: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id_espacio", ingresoActivo.id_espacio);
    }

    setResultadoSalida({ ...salida, minutos, costoTotal });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased">
      
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

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col lg:flex-row p-6 lg:p-8 gap-8 items-stretch overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: PANEL DE COBRO */}
        <div className="flex-1 bg-white rounded-[32px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-8 flex flex-col justify-between overflow-visible">
          
          {!buscado && !resultadoSalida && !formatoInvalido && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4 animate-bounce">
                <Icon icon="mdi:text-box-search-outline" className="text-5xl" />
              </div>
              <h3 className="text-xl font-black text-slate-700 mb-1">Esperando Datos</h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                Complete el formato de la patente utilizando el teclado de la derecha para calcular las tarifas de manera automática.
              </p>
            </div>
          )}

          {formatoInvalido && !resultadoSalida && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
                <Icon icon="mdi:close-octagon-outline" className="text-4xl" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">Formato de patente inválido</h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-4">
                La patente <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{plate}</span> no cumple el formato chileno (Ej: AA-BB-11). Bórrela y vuelva a ingresarla.
              </p>
            </div>
          )}

          {buscado && !ingresoActivo && !resultadoSalida && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 mb-4">
                <Icon icon="mdi:alert-circle-outline" className="text-4xl" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">No se encuentra la información</h3>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-4">
                Verifique la patente <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{plate}</span> y vuelva a ingresarla.
              </p>
            </div>
          )}

          {buscado && ingresoActivo && !resultadoSalida && (
            <div className="flex-1 flex flex-col gap-6 pt-2">
              <div>
                <div className="border-b border-dashed border-slate-200 pb-4 mb-6 flex flex-wrap gap-2 justify-between items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Resumen de Cobro</span>
                  <span className="text-xs font-bold text-slate-400 font-mono truncate max-w-[140px]" title={`ID: #${ingresoActivo.id_ingreso}`}>
                    ID: #{String(ingresoActivo.id_ingreso).slice(0, 8)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Categoría</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase">
                      <Icon icon="mdi:car" />
                      {ingresoActivo.vehiculo?.categoria_vehiculo?.nombre_categoria || "Normal"}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">Espacio Ocupado</span>
                    <span className="text-sm font-black text-slate-700 bg-slate-200/80 px-2.5 py-0.5 rounded-md border border-slate-300/40">
                      {ingresoActivo.id_espacio || "Sin asignar"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg border border-slate-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tiempo transcurrido</span>
                    {(() => {
                      const valorHora = ingresoActivo.vehiculo?.categoria_vehiculo?.valor_hora || 0;
                      const { minutos, segundos } = calcularTiempoYCosto(ingresoActivo.fecha_ingreso, ingresoActivo.hora_ingreso, valorHora);
                      const horas = Math.floor(minutos / 60);
                      const mins = minutos % 60;
                      return (
                        <span className="text-3xl font-mono font-black tracking-wider text-slate-100">
                          {String(horas).padStart(2, "0")}:{String(mins).padStart(2, "0")}:{String(segundos).padStart(2, "0")}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-right w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total a Pagar</span>
                    {(() => {
                      const valorHora = ingresoActivo.vehiculo?.categoria_vehiculo?.valor_hora || 0;
                      const { costo } = calcularTiempoYCosto(ingresoActivo.fecha_ingreso, ingresoActivo.hora_ingreso, valorHora);
                      return (
                        <span className="text-4xl font-black text-emerald-400 tracking-tight">
                          ${costo.toLocaleString("es-CL")}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 flex gap-3 text-indigo-900 text-xs font-semibold leading-relaxed">
                  <Icon icon="mdi:information-outline" className="text-lg text-indigo-500 shrink-0 mt-0.5" />
                  <p>Al hacer clic en "Registrar Salida", la barrera se abrirá de forma automática y el espacio asignado quedará marcado como disponible inmediatamente.</p>
                </div>
              </div>

              {error && (
                <div className="my-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-bold flex items-center gap-2">
                  <Icon icon="mdi:alert-circle" /> {error}
                </div>
              )}

              <button
                onClick={registrarSalida}
                disabled={loading}
                className="w-full h-16 mt-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-black text-lg shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {loading ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin text-xl" /> Procesando pago...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check-circle-outline" className="text-xl" /> Registrar Salida
                  </>
                )}
              </button>
            </div>
          )}

          {resultadoSalida && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-md shadow-emerald-100">
                <Icon icon="mdi:checkbox-marked-circle-outline" className="text-6xl" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">¡Salida Autorizada!</h3>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                El vehículo con la patente <span className="font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{plate}</span> ha registrado su pago exitosamente.
              </p>

              <div className="w-full max-w-xs bg-slate-50 border border-slate-200/60 rounded-2xl p-4 mb-8 font-mono text-xs text-slate-600 flex flex-col gap-2 text-left">
                <div className="flex justify-between"><span>Tiempo Total:</span><span className="font-bold text-slate-800">{resultadoSalida.minutos} min</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-sans text-sm">
                  <span className="font-black text-slate-700">Monto Cobrado:</span>
                  <span className="font-black text-emerald-600">${resultadoSalida.costoTotal.toLocaleString("es-CL")}</span>
                </div>
              </div>

              <button
                onClick={limpiarFormulario}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                Listo, Nueva Consulta
              </button>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA INTERFAZ AGRANDADA */}
        <div className="w-full lg:w-[560px] bg-white rounded-[32px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-8 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                <Icon icon="mdi:boom-gate-up" className="text-3xl" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Salida</h1>
                <p className="text-sm font-medium text-slate-400">Ingrese patente para procesar cobro</p>
              </div>
            </div>

            <div className="mb-6 bg-slate-50/80 border-2 border-slate-100 rounded-2xl p-5 flex flex-col items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Patente Digitada</span>
              <div className="w-full h-20 bg-white border-2 border-slate-300 rounded-xl shadow-inner flex items-center justify-center">
                {plate ? (
                  <span className="font-mono font-black text-4xl tracking-widest text-slate-800 uppercase">{plate}</span>
                ) : (
                  <span className="font-sans font-bold text-slate-300 text-xl">Esperando entrada...</span>
                )}
              </div>
            </div>

            {/* TECLADO VIRTUAL */}
            <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
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
          </div>
        </div>

      </div>

      {/* VENTANA EMERGENTE: CONFIRMACIÓN DE CONTRASEÑA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-[modalBackdrop_0.35s_ease-out_forwards]">
          <style>{`
            @keyframes modalBackdrop { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modalScale { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>

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