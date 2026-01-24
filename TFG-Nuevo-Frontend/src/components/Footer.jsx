import { Link } from "react-router-dom";
import "./style/Footer.css";

export default function Footer({
    year = new Date().getFullYear(),
    org = "GuardiApp",
}) {
    return (
        <footer className="loginFooter">
            <p>© {year} {org}. Todos los derechos reservados.</p>

            <div className="footerLinks">
                <Link to="/aviso-legal">Aviso Legal</Link>
                <Link to="/privacidad">Privacidad</Link>
            </div>
        </footer>
    );
}
