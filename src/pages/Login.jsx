import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import "../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverSent, setRecoverSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  
  // NUEVO ESTADO: Controla la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
  
  function validate() {
    let ok = true;
    if (!validateEmail(email)) {
      setEmailError("Ingresa un correo válido.");
      ok = false;
    } else {
      setEmailError("");
    }
    if (!password.trim()) {
      setPassError("La contraseña no puede estar vacía.");
      ok = false;
    } else {
      setPassError("");
    }
    return ok;
  }

  const handleLogin = async () => {
    setError("");
    if (!validate()) return;  
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos");
    } else {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const handleRecover = () => {
    setError("");
    setRecoverSent(false);
    if (!validateEmail(email)) {
      setEmailError("Ingresa tu correo para recuperar la contraseña");
      return;
    }
    setEmailError("");
    setRecoverSent(true);
  };
  
  return (
    <div className="login-container min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Caja de login estilizada y moderna coordinada con el resto del sistema */}
      <div className="login-box bg-[#131924] w-full max-w-[440px] rounded-[32px] border border-slate-800/80 p-10 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.6)] flex flex-col gap-6 text-slate-200">
        
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
            Bienvenido al Estacionamiento<br />
            <span className="text-indigo-400 font-extrabold text-2xl">Carpe Diem</span>
          </h1>
        </div>

        {recoverSent && (
          <div className="banner-success bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl py-3 px-4 text-xs flex items-center gap-2 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Si el correo existe recibirás un enlace de recuperación.
          </div>
        )}

        {error && (
          <div className="banner-error bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl py-3 px-4 text-xs text-center font-semibold">
            {error}
          </div>
        )}

        {/* Campo: Correo */}
        <div className="field flex flex-col gap-1.5 w-full">
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (validateEmail(e.target.value)) setEmailError("");
            }}
            placeholder="Correo electrónico"
            autoComplete="email"
            className={`w-full h-12 bg-slate-950/50 text-slate-200 placeholder-slate-600 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm shadow-inner ${emailError ? "input-error border-red-500/50" : ""}`}
          />
          {emailError && <p className="error-msg text-xs text-red-400 font-medium pl-1">{emailError}</p>}
        </div>

        {/* Campo: Contraseña con Ojo Interactivo */}
        <div className="field flex flex-col gap-1.5 w-full relative">
          <div className="relative w-full">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (e.target.value.trim()) setPassError("");
              }}
              placeholder="Contraseña"
              autoComplete="current-password"
              className={`w-full h-12 bg-slate-950/50 text-slate-200 placeholder-slate-600 pl-4 pr-12 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm shadow-inner ${passError ? "input-error border-red-500/50" : ""}`}
            />
            {/* Botón del Ojo */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 transition-colors"
            >
              <Icon 
                icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} 
                width="22" 
                height="22" 
              />
            </button>
          </div>
          {passError && <p className="error-msg text-xs text-red-400 font-medium pl-1">{passError}</p>}
        </div>

        {/* Opciones adicionales */}
        <div className="row-options flex items-center justify-between text-xs text-slate-400 font-medium px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-200 transition-colors">
            <input type="checkbox" className="accent-indigo-600 rounded" />
            Recuérdame
          </label>
          <button type="button" className="btn-forgot text-indigo-400 hover:text-indigo-300 transition-colors bg-none border-none cursor-pointer font-semibold" onClick={handleRecover}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Botón de envío con animación de carga unificada */}
        <button 
          className="btn-primary w-full h-12 rounded-xl text-white font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all text-sm shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 mt-2" 
          onClick={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Icon icon="mdi:loading" className="animate-spin" width="20" height="20" />
              <span>Ingresando…</span>
            </>
          ) : (
            <span>Ingresar</span>
          )}
        </button>
      </div>
    </div>
  );
}