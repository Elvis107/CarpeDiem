import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverSent, setRecoverSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passError, setPassError] = useState("");
  const navigate = useNavigate();

  function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }
  
  function validate() {
  let ok = true;
  if (!validateEmail(email)) {
    setEmailError("Ingresa un correo valido.");
    ok = false;
  } else {
    setEmailError("");
  }
  if (!password.trim()) {
    setPassError("La contrasena no puede estar vacía.");
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
      setError("Correo o contrasena incorrectos");
    } else {
      navigate("/dashboard");
    }

    setLoading(false);
  };

    const handleRecover = () => {
    setError("");
    setRecoverSent(false);
    if (!validateEmail(email)) {
      setEmailError("Ingresa tu correo para recuperar la contrasena");
      return;
    }
    setEmailError("");
    setRecoverSent(true);
  };
  
 return (
    <div className="login-container">
      <div className="login-box">

        <h1>Bienviendo al estacionamiento carpe Diem</h1>

        {recoverSent && (
          <div className="banner-success">
            <svg xmlns="http://www.w3.org/2000/svg" style={{width:16,height:16,flexShrink:0}} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Si el correo existe recibiras un enlace de recuperacion.
          </div>
        )}

        {error && <div className="banner-error">{error}</div>}

        {/* Correo */}
        <div className="field">
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
          {emailError && <p className="error-msg">{emailError}</p>}
        </div>

        {/* Contraseña */}
        <div className="field">
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (e.target.value.trim()) setPassError("");
            }}
            placeholder="Contraseña"
            autoComplete="current-password"
            className={passError ? "input-error" : ""}
          />
          {passError && <p className="error-msg">{passError}</p>}
        </div>

        {/* Recuérdame + Recuperar contraseña */}
        <div className="row-options">
          <label>
            <input type="checkbox" />
            Recuerdame
          </label>
          <button className="btn-forgot" onClick={handleRecover}>
            ¿Olvidaste tu contrasena?
          </button>
        </div>

        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </div>
    </div>
  );
}