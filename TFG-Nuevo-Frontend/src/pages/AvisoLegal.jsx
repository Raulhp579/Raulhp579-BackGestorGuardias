import "../styles/Legal.css";

export default function Legal() {
    return (
        <div className="legalPage">

            <main className="legalMain">
                <header className="legalHead">
                    <h1 className="legalTitle">Aviso legal</h1>
                    <p className="legalSubtitle">
                        Información general y condiciones de uso del sitio.
                    </p>
                </header>

                <section className="legalCard">
                    <h2>1. Titularidad del sitio</h2>
                    <p>
                        En cumplimiento del deber de información, se indica que este sitio web
                        (en adelante, el “Sitio”) es titularidad de <b>GuardiApp</b>.
                    </p>
                    <ul>
                        <li><b>Titular:</b> GuardiApp</li>
                        <li><b>Domicilio:</b> C. Escritora Maria Goyri, 14005</li>
                        <li><b>Correo:</b> (Completar)</li>
                        <li><b>NIF:</b> A12345678</li>
                    </ul>
                </section>

                <section className="legalCard">
                    <h2>2. Condiciones de uso</h2>
                    <p>
                        El acceso y uso del Sitio atribuye la condición de usuario e implica la
                        aceptación de las presentes condiciones. El usuario se compromete a
                        hacer un uso adecuado de los contenidos y servicios.
                    </p>
                </section>

                <section className="legalCard">
                    <h2>3. Propiedad intelectual e industrial</h2>
                    <p>
                        Los contenidos del Sitio (textos, diseños, logos, código, etc.) están
                        protegidos por la normativa de propiedad intelectual e industrial.
                        Queda prohibida su reproducción, distribución o comunicación pública,
                        total o parcial, sin autorización.
                    </p>
                </section>

                <section className="legalCard">
                    <h2>4. Responsabilidad</h2>
                    <p>
                        GuardiApp no se hace responsable de los daños o perjuicios derivados
                        del uso del Sitio, ni garantiza la ausencia de virus u otros elementos
                        que puedan causar alteraciones en los sistemas del usuario.
                    </p>
                </section>

                <section className="legalCard">
                    <h2>5. Enlaces a terceros</h2>
                    <p>
                        El Sitio puede incluir enlaces a páginas de terceros. GuardiApp no
                        asume responsabilidad sobre sus contenidos, políticas o prácticas.
                    </p>
                </section>

                <section className="legalCard">
                    <h2>6. Modificaciones</h2>
                    <p>
                        GuardiApp se reserva el derecho a modificar en cualquier momento el
                        contenido del Sitio y estas condiciones para adaptarlas a cambios
                        normativos o necesidades del servicio.
                    </p>
                </section>

                <section className="legalCard">
                    <h2>7. Legislación aplicable y jurisdicción</h2>
                    <p>
                        Estas condiciones se rigen por la legislación vigente aplicable. Para
                        cualquier conflicto, las partes se someten a los juzgados y tribunales
                        que correspondan conforme a derecho.
                    </p>
                </section>

                <section className="legalCard legalNote">
                    <p>
                        Nota: Este texto es una simulación para nuestro proyecto, no pretende ser fiel a la realidad ni aparentar que ha sido completamente escrito a mano. Agradecemos su atención y comprensión.
                    </p>
                </section>
            </main>

        </div>
    );
}
