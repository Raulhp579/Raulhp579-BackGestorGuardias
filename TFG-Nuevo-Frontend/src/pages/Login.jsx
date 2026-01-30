import { useState, useEffect } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { login } from "../services/AuthService";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();

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

        navigate("/home");
    }

    useEffect(() => {
        const loginPage = document.querySelector(".loginPage");

        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const inertia = 0.05; // Reducimos la inercia para movimientos más suaves

        const animateLayers = () => {
            targetX += (mouseX - targetX) * inertia;
            targetY += (mouseY - targetY) * inertia;

            const xOffset1 = (targetX - 0.5) * 20; // Movimiento más sutil para la capa 1
            const yOffset1 = (targetY - 0.5) * 20;

            const xOffset2 = (targetX - 0.5) * -30; // Movimiento más amplio para la capa 2
            const yOffset2 = (targetY - 0.5) * -30;

            loginPage.style.setProperty("--layer1-x", `${xOffset1}px`);
            loginPage.style.setProperty("--layer1-y", `${yOffset1}px`);
            loginPage.style.setProperty("--layer2-x", `${xOffset2}px`);
            loginPage.style.setProperty("--layer2-y", `${yOffset2}px`);

            requestAnimationFrame(animateLayers);
        };

        const handleMouseMove = (e) => {
            const rect = loginPage.getBoundingClientRect();
            mouseX = (e.clientX - rect.left) / rect.width; // Posición X relativa
            mouseY = (e.clientY - rect.top) / rect.height; // Posición Y relativa
        };

        loginPage.addEventListener("mousemove", handleMouseMove);

        animateLayers();

        return () => {
            loginPage.removeEventListener("mousemove", handleMouseMove);
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
                            <path
                                d="M35 75 L65 75 L60 65 L40 65 Z"
                                fillOpacity="0.0"
                            />
                        </svg>
                    </div>
                    <h1 className="brandTitle">GuardiApp</h1>
                </header>

                <section
                    className="loginCard"
                    aria-label="Formulario de inicio de sesión"
                >
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
                            <span
                                className="material-icons fieldIcon"
                                aria-hidden="true"
                            >
                                person_outline
                            </span>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Usuario"
                                autoComplete="username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setError("");
                                }}
                                disabled={loading}
                            />
                        </div>

                        <div className="field">
                            <span
                                className="material-icons fieldIcon"
                                aria-hidden="true"
                            >
                                lock_outline
                            </span>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Contraseña"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="submitBtn">
                            Iniciar Sesión
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
