import "../styles/privacidad.css";

export default function Privacidad() {
    return (
        <div className="legalPage">

            <main className="legalMain">
                <section className="legalCard">
                    <header className="legalHead">
                        <h1 className="legalTitle">Política de Privacidad</h1>
                        <p className="legalSubtitle">
                            Información sobre el tratamiento de datos personales en GuardiApp (uso interno).
                        </p>
                    </header>

                    <div className="legalBody">
                        <h2>1. Ámbito de aplicación</h2>
                        <p>
                            Esta aplicación está destinada al uso interno del hospital para la planificación y gestión de guardias.
                            Su uso está restringido a personal autorizado.
                        </p>

                        <h2>2. Responsable del tratamiento</h2>
                        <p>
                            El responsable del tratamiento es el propio centro/hospital que utiliza
                            GuardiApp para la organización de guardias.
                        </p>

                        <h2>3. Qué datos se tratan</h2>
                        <ul>
                            <li>Datos identificativos y laborales: nombre, apellidos, usuario corporativo, especialidad, rol/perfil.</li>
                            <li>Datos operativos: asignaciones de guardia, turnos, incidencias y validaciones relacionadas.</li>
                            <li>Registros de actividad: accesos y acciones realizadas en la aplicación (auditoría y seguridad).</li>
                        </ul>

                        <h2>4. Finalidad del tratamiento</h2>
                        <ul>
                            <li>Gestionar la planificación de guardias y su asignación por especialidad/unidad.</li>
                            <li>Facilitar la coordinación operativa del servicio y la continuidad asistencial.</li>
                            <li>Generar informes internos y trazabilidad de cambios (auditoría).</li>
                            <li>Garantizar la seguridad del sistema y prevenir usos no autorizados.</li>
                        </ul>

                        <h2>5. Base jurídica</h2>
                        <p>
                            El tratamiento de datos se realiza por necesidad organizativa y operativa del servicio público sanitario,
                            conforme a la normativa aplicable de protección de datos y al marco interno de la entidad.
                        </p>

                        <h2>6. Conservación de los datos</h2>
                        <p>
                            Los datos se conservarán durante el tiempo necesario para la gestión de guardias y el cumplimiento de
                            obligaciones internas, de control y de auditoría. Una vez finalizado el periodo, se aplicarán criterios
                            de archivo y/o eliminación según la política del centro.
                        </p>

                        <h2>7. Destinatarios y cesiones</h2>
                        <p>
                            Los datos no se comunicarán a terceros salvo obligación legal o cuando sea necesario para el soporte
                            técnico bajo contrato y con garantías adecuadas. El acceso está limitado al personal autorizado.
                        </p>

                        <h2>8. Seguridad</h2>
                        <ul>
                            <li>Control de acceso por perfiles (usuarios autorizados).</li>
                            <li>Registro de actividad (logs) y trazabilidad de cambios.</li>
                            <li>Medidas técnicas y organizativas para proteger la confidencialidad e integridad.</li>
                        </ul>

                        <h2>9. Derechos de las personas usuarias</h2>
                        <p>
                            Las personas usuarias pueden ejercer los derechos que correspondan (acceso, rectificación, limitación,
                            oposición, etc.) a través de los canales internos del hospital o del delegado/a de protección de datos,
                            según proceda.
                        </p>

                        <h2>10. Contacto</h2>
                        <p>
                            Para cuestiones de privacidad y protección de datos, contacte con el área responsable del centro o con el
                            canal interno designado (por ejemplo, DPD/Seguridad de la Información).
                        </p>

                        <div className="legalNote">
                            <span className="material-icons-outlined">info</span>
                            <p>
                                Para mas información contacte con sus superiores y ellos se encargaran de proveer dicha información o hacer que esta llegue a aquellos interesados escalando la petición.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

        </div>
    );
}
