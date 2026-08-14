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

  // Controla la visibilidad de la contraseña
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

    <div className="login-container">
      <div className="login-glow-cyan" />
      <div className="login-glow-indigo" />
      <button
        type="button"
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          width: "42px",
          height: "42px",
          border: "none",
          borderRadius: "10px",
          background: "#ffffff",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        aria-label="Volver"
      >
        <Icon icon="mdi:arrow-left" width="24" height="24" />
      </button>

      <div className="login-box">
        <p className="login-eyebrow">Gestión de estacionamiento · Tiempo real</p>
        <h1>Carpe Diem</h1>
        <p className="login-subtitle">Ingresa para monitorear tus plazas</p>

        {/* Firma visual: franja de sensores de plaza (ESP32 / HC-SR04) */}
        <div className="sensor-strip" aria-hidden="true">
          <span className="sensor-strip__slot" />
          <span className="sensor-strip__slot" />
          <span className="sensor-strip__slot sensor-strip__slot--active" />
          <span className="sensor-strip__slot" />
          <span className="sensor-strip__slot" />
        </div>

        {recoverSent && (
          <div className="banner-success">
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Si el correo existe recibirás un enlace de recuperación.
          </div>
        )}

        {error && <div className="banner-error">{error}</div>}

        {/* Campo: Correo */}
        <div className="field">
          <div className="field-wrap">
            <span className="field-icon-leading">
              <Icon icon="mdi:email-outline" width="18" height="18" />
            </span>
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
              className={emailError ? "input-error" : ""}
            />
          </div>
          {emailError && <p className="error-msg">{emailError}</p>}
        </div>

        {/* Campo: Contraseña con ojo interactivo */}
        <div className="field">
          <div className="field-wrap">
            <span className="field-icon-leading">
              <Icon icon="mdi:lock-outline" width="18" height="18" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              data-has-toggle="true"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (e.target.value.trim()) setPassError("");
              }}
              placeholder="Contraseña"
              autoComplete="current-password"
              className={passError ? "input-error" : ""}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="field-icon-trailing"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" height="20" />
            </button>
          </div>
          {passError && <p className="error-msg">{passError}</p>}
        </div>

        {/* Opciones adicionales */}
        <div className="row-options">
          <label>
            <input type="checkbox" />
            Recuérdame
          </label>
          <button type="button" className="btn-forgot" onClick={handleRecover}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* Botón de envío */}
        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
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