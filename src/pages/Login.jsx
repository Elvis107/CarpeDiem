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
  const [remember, setRemember] = useState(false);

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
    <div className="cd-login">
      <div className="cd-login__card">
        {/* Panel izquierdo: visual */}
        <div className="cd-login__visual">
          <div className="cd-login__visual-overlay" />

          <div className="cd-login__sign">
            <span>P</span>
          </div>

          <div className="cd-login__level">
            <span className="cd-login__level-label">NIVEL</span>
            <span className="cd-login__level-number">2</span>
          </div>

          <div className="cd-login__exit">
            SALIDA <Icon icon="mdi:arrow-right" />
          </div>

          <div className="cd-login__stripe" aria-hidden="true" />

          <div className="cd-login__badge">
            <span className="cd-login__badge-icon">
              <Icon icon="mdi:car" />
            </span>
            <div>
              <strong>Sistema inteligente</strong>
              <div>de estacionamiento</div>
            </div>
          </div>
        </div>

        {/* Panel derecho: formulario */}
        <div className="cd-login__form">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="cd-login__back"
            aria-label="Volver"
          >
            <Icon icon="mdi:arrow-left" width="20" height="20" />
          </button>

          <div className="cd-login__logo">
            <svg viewBox="0 0 220 46" className="cd-login__logo-swoosh" aria-hidden="true">
              <path
                d="M10 34 C 55 34, 70 12, 110 10 C 150 8, 165 20, 210 20"
                fill="none"
                stroke="var(--cd-yellow)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <h1 className="cd-login__wordmark">
              CARPE<span>DIEM</span>
            </h1>
            <p className="cd-login__tagline">
              <span className="cd-login__tagline-line" />
              SISTEMA DE ESTACIONAMIENTO
              <span className="cd-login__tagline-line" />
            </p>
          </div>

          <h2 className="cd-login__welcome">Bienvenido</h2>
          <p className="cd-login__subtitle">Inicia sesión para continuar</p>

          {recoverSent && (
            <div className="cd-login__banner cd-login__banner--success">
              <Icon icon="mdi:check-circle-outline" width="16" height="16" />
              Si el correo existe recibirás un enlace de recuperación.
            </div>
          )}

          {error && <div className="cd-login__banner cd-login__banner--error">{error}</div>}

          {/* Campo: Usuario */}
          <div className="cd-login__field">
            <label htmlFor="email">Usuario</label>
            <div className={`cd-login__field-wrap ${emailError ? "cd-login__field-wrap--error" : ""}`}>
              <Icon icon="mdi:account-outline" width="18" height="18" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validateEmail(e.target.value)) setEmailError("");
                }}
                placeholder="Ingresa tu usuario"
                autoComplete="email"
              />
            </div>
            {emailError && <p className="cd-login__error-msg">{emailError}</p>}
          </div>

          {/* Campo: Contraseña */}
          <div className="cd-login__field">
            <label htmlFor="password">Contraseña</label>
            <div className={`cd-login__field-wrap ${passError ? "cd-login__field-wrap--error" : ""}`}>
              <Icon icon="mdi:lock-outline" width="18" height="18" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value.trim()) setPassError("");
                }}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="cd-login__field-toggle"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="20" height="20" />
              </button>
            </div>
            {passError && <p className="cd-login__error-msg">{passError}</p>}
          </div>

          {/* Opciones adicionales */}
          <div className="cd-login__row-options">
            <label className="cd-login__remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recuérdame
            </label>
            <button type="button" className="cd-login__forgot" onClick={handleRecover}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón de envío */}
          <button className="cd-login__submit" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <>
                <Icon icon="mdi:loading" className="cd-login__spin" width="20" height="20" />
                <span>Ingresando…</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:login-variant" width="18" height="18" />
                <span>INICIAR SESIÓN</span>
              </>
            )}
          </button>

          <div className="cd-login__footer">
            <span className="cd-login__footer-line" />
            <span className="cd-login__footer-badge">P</span>
            <span className="cd-login__footer-line" />
          </div>
          <p className="cd-login__footer-text">
            MÁS CONTROL <span>|</span> MÁS SEGURIDAD <span>|</span> MÁS EFICIENCIA
          </p>
        </div>
      </div>
    </div>
  );
}