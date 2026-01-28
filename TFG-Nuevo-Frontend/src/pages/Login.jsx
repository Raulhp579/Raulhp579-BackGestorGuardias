import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import { login } from "../services/AuthService";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    async function onSubmit(e) {
        e.preventDefault();

        // Guardamos un objeto JSON (lo que AppLayout/Header esperan)
        const authPayload = {
            name: username.trim() || "Usuario",
            email: `${username.trim()}`,
            avatarUrl: "", // si algún día tienes URL real, la pones aquí
        };

        const user = {
            email: username,
            password: password,
        };

        const response = await login(user);
        localStorage.setItem("token", response.auth.access_token);

        // Guardar rol en sessionStorage
        sessionStorage.setItem("roles", JSON.stringify(response.auth.roles));

        localStorage.setItem("auth", JSON.stringify(authPayload));

        navigate("/home");
    }

    return (
        <main className="loginPage">
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
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="fieldAction"
                                aria-label="Acción secundaria (placeholder)"
                                title="Acción secundaria"
                                onClick={() => {}}
                            >
                                <span className="material-icons">
                                    expand_more
                                </span>
                            </button>
                        </div>

                        <div className="helpRow">
                            <a className="helpLink" href="#">
                                ¿Problemas de acceso?
                            </a>
                        </div>

                        <button className="submitBtn" type="submit">
                            Acceder
                        </button>
                    </form>
                </section>

                <footer className="loginFooter">
                    <p>
                        © 2026  En colaboración con la Junta de Andalucía. Todos los derechos
                        reservados.
                    </p>
                    <div className="footerLinks">
                        <a href="#">Aviso Legal</a>
                        <a href="#">Privacidad</a>
                    </div>
                </footer>
            </div>
        </main>
    );
}
