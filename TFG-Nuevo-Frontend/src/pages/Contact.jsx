import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Contact.css";
import Button from "../components/Button/Button";

export default function Contact() {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [empresa, setEmpresa] = useState("");
    const [mensaje, setMensaje] = useState("");

    function enviarFormulario(e) {
        e.preventDefault();

        if (nombre === "" || email === "" || telefono === "" || empresa === "" || mensaje === "") {
            alert("Por favor rellena todos los campos");
            return;
        }

        console.log("Datos:", { nombre, email, telefono, empresa, mensaje });
        alert("¡Gracias! Nos pondremos en contacto pronto.");

        setNombre("");
        setEmail("");
        setTelefono("");
        setEmpresa("");
        setMensaje("");

        navigate("/");
    }

    return (
        <div className="contactPage">
            <div className="contactContainer">
                <h1>Contacta con Nosotros</h1>

                <form onSubmit={enviarFormulario}>
                    <div className="formGroup">
                        <label htmlFor="nombre">Nombre</label>
                        <input
                            type="text"
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Tu nombre"
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="telefono">Teléfono</label>
                        <input
                            type="tel"
                            id="telefono"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            placeholder="+34 XXX XXX XXX"
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="empresa">Empresa</label>
                        <input
                            type="text"
                            id="empresa"
                            value={empresa}
                            onChange={(e) => setEmpresa(e.target.value)}
                            placeholder="Nombre de tu empresa"
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="mensaje">Mensaje</label>
                        <textarea
                            id="mensaje"
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Cuéntanos más..."
                            rows="5"
                        ></textarea>
                    </div>

                    <Button variant="primary" type="submit" className="submitButton">
                        Enviar
                    </Button>
                </form>
            </div>
        </div>
    );
}


