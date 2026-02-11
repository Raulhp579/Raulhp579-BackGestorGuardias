import { useState, useEffect } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { login } from "../services/AuthService";
import Button from "../components/Button/Button";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // ✅ FALTABAN (esto era la causa del blanco)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authPayload = {
        name: username.trim() || "Usuario",
        email: `${username.trim()}`,
        avatarUrl: "",
      };

      const user = {
        email: username,
        password: password,
      };

      const response = await login(user);

      localStorage.setItem("token", response.auth.access_token);
      sessionStorage.setItem("roles", JSON.stringify(response.auth.roles));
      localStorage.setItem("auth", JSON.stringify(authPayload));

      // Disparar evento personalizado para notificar cambios de autenticación
      window.dispatchEvent(new CustomEvent("authChange", { detail: { roles: response.auth.roles } }));

      navigate("/home");
    } catch (err) {
      console.error(err);
      setError(err?.message || "No se pudo iniciar sesión. Revisa tus credenciales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loginPage = document.querySelector(".loginPage");
    if (!loginPage) return;

    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;

    const inertia = 0.05;
    let rafId = 0;

    const animateLayers = () => {
      targetX += (mouseX - targetX) * inertia;
      targetY += (mouseY - targetY) * inertia;

      const xOffset1 = (targetX - 0.5) * 20;
      const yOffset1 = (targetY - 0.5) * 20;

      const xOffset2 = (targetX - 0.5) * -30;
      const yOffset2 = (targetY - 0.5) * -30;

      loginPage.style.setProperty("--layer1-x", `${xOffset1}px`);
      loginPage.style.setProperty("--layer1-y", `${yOffset1}px`);
      loginPage.style.setProperty("--layer2-x", `${xOffset2}px`);
      loginPage.style.setProperty("--layer2-y", `${yOffset2}px`);

      rafId = requestAnimationFrame(animateLayers);
    };

    const handleMouseMove = (e) => {
      const rect = loginPage.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      mouseY = (e.clientY - rect.top) / rect.height;
    };

    loginPage.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(animateLayers);

    return () => {
      loginPage.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="loginPage">
      {/* Partículas para el efecto parallax */}
      {Array.from({ length: 30 }).map((_, index) => (
        <div key={index} className="particle"></div>
      ))}

      <div className="loginWrap">
        <header className="brandHeader">
          <div className="brandLogo" aria-hidden="true">
            <svg viewBox="0 0 100 100" role="img">
              <path d="M50 15 L15 85 L30 85 L50 45 L70 85 L85 85 Z" />
              <path d="M35 75 L65 75 L60 65 L40 65 Z" fillOpacity="0.0" />
            </svg>
          </div>
          <h1 className="brandTitle">GuardiApp</h1>
        </header>

        <section className="loginCard" aria-label="Formulario de inicio de sesión">
          <h2 className="loginTitle">Iniciar Sesión</h2>

          {error && (
            <div
              className="loginError"
              role="alert"
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <form className="loginForm" onSubmit={onSubmit}>
            <div className="field">
              <span className="material-icons fieldIcon" aria-hidden="true">
                person_outline
              </span>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Usuario"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                disabled={loading}
              />
            </div>

            <div className="field">
              <span className="material-icons fieldIcon" aria-hidden="true">
                lock_outline
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              isLoading={loading}
              style={{ width: "100%", marginTop: "8px" }}
            >
              Iniciar Sesión
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}