import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Home.css";

export default function Home() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);
    }, []);

    return (
        <div className="homeContainer">
            {/* Navbar */}
            <nav className="homeNav">
                <div className="homeNavContent">
                    <div className="homeNavLogo">
                        <svg viewBox="0 0 100 100" className="homeNavLogoSvg" role="img">
                            <path d="M50 15 L15 85 L30 85 L50 45 L70 85 L85 85 Z" />
                            <path d="M35 75 L65 75 L60 65 L40 65 Z" fillOpacity="0.0" />
                        </svg>
                        <span className="homeNavTitle">GuardiApp</span>
                    </div>
                    <div className="homeNavLinks">
                        {isLoggedIn ? (
                            <button 
                                className="homeNavButton homeNavButtonPrimary"
                                onClick={() => navigate("/home")}
                            >
                                Ir al Dashboard
                            </button>
                        ) : (
                            <button 
                                className="homeNavButton homeNavButtonPrimary"
                                onClick={() => navigate("/login")}
                            >
                                Iniciar Sesión
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="homeHero">
                <div className="homeHeroContent">
                    <div className="homeHeroText">
                        <h1 className="homeHeroTitle">Gestión de Guardias Simplificada</h1>
                        <p className="homeHeroSubtitle">
                            Planifica, organiza y controla los turnos de guardias de tu equipo 
                            con una plataforma moderna y fácil de usar.
                        </p>
                        <div className="homeHeroButtons">
                            {isLoggedIn ? (
                                <button 
                                    className="homeHeroButton homeHeroButtonPrimary"
                                    onClick={() => navigate("/home")}
                                >
                                    <span className="material-icons">dashboard</span>
                                    Acceder al Sistema
                                </button>
                            ) : (
                                <>
                                    <button 
                                        className="homeHeroButton homeHeroButtonPrimary"
                                        onClick={() => navigate("/login")}
                                    >
                                        <span className="material-icons">login</span>
                                        Acceder al Sistema
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="homeHeroImage">
                        <div className="heroIllustration">
                            <div className="heroCalendar">
                                <div className="heroCalendarDay">L</div>
                                <div className="heroCalendarDay">M</div>
                                <div className="heroCalendarDay">X</div>
                                <div className="heroCalendarDay">J</div>
                                <div className="heroCalendarDay">V</div>
                                <div className="heroCalendarDay highlighted">S</div>
                                <div className="heroCalendarDay">D</div>
                            </div>
                            <div className="heroShifts">
                                <div className="heroShift shift1"></div>
                                <div className="heroShift shift2"></div>
                                <div className="heroShift shift3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Free Resources Section */}
            <section className="homeResources">
                <div className="homeResourcesContent">
                    <div className="homeResourcesHeader">
                        <h2 className="homeResourcesTitle">Recursos Incluidos Gratis</h2>
                        <p className="homeResourcesSubtitle">Acceso completo a tutoriales y plantillas para maximizar tu experiencia</p>
                    </div>

                    <div className="homeResourcesGrid">
                        {/* Tutorial Resource */}
                        <div className="homeResourceCard">
                            <div className="homeResourceIcon resourceTutorial">
                                <span className="material-icons">assistant</span>
                            </div>
                            <h3 className="homeResourceTitle">Tutorial Interactivo</h3>
                            <p className="homeResourceText">
                                Aprende a usar GuardiApp con nuestro tutorial interactivo integrado en la aplicación. 
                                Guía paso a paso directamente donde necesitas, con explicaciones contextuales 
                                y demostraciones en tiempo real. Acceso completo desde tu cuenta.
                            </p>
                            <button className="homeResourceButton">Acceder a Tutorial</button>
                        </div>

                        {/* Excel Template Resource */}
                        <div className="homeResourceCard">
                            <div className="homeResourceIcon resourceExcel">
                                <span className="material-icons">cloud_download</span>
                            </div>
                            <h3 className="homeResourceTitle">Plantilla Excel</h3>
                            <p className="homeResourceText">
                                Descarga plantillas Excel profesionales para gestionar guardias manualmente. 
                                Perfecta para transiciones o respaldos. Fácilmente importable a GuardiApp 
                                cuando estés listo para migrar.
                            </p>
                            <button className="homeResourceButton">Descargar</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="homeFeatures">
                <div className="homeSectionHeader">
                    <h2 className="homeSectionTitle">Características Principales</h2>
                    <p className="homeSectionSubtitle">Herramientas poderosas para gestionar guardias</p>
                </div>

                <div className="homeFeaturesGrid">
                    {/* Feature 1 */}
                    <div className="homeFeatureCard">
                        <div className="homeFeatureIcon feature1">
                            <span className="material-icons">event_note</span>
                        </div>
                        <h3 className="homeFeatureTitle">Planificación Inteligente</h3>
                        <p className="homeFeatureText">
                            Visualiza tus turnos en un calendario interactivo. Crea nuevas guardias, 
                            asigna trabajadores y modifica fechas con solo unos clics. Sistema intuitivo 
                            que ahorra horas de planificación manual.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="homeFeatureCard">
                        <div className="homeFeatureIcon feature2">
                            <span className="material-icons">people</span>
                        </div>
                        <h3 className="homeFeatureTitle">Gestión de Equipo</h3>
                        <p className="homeFeatureText">
                            Administra trabajadores, sus especialidades y disponibilidades. Asigna 
                            permisos por rol y controla quién puede ver, editar o eliminar guardias. 
                            Control total y centralizado de tu equipo.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="homeFeatureCard">
                        <div className="homeFeatureIcon feature3">
                            <span className="material-icons">description</span>
                        </div>
                        <h3 className="homeFeatureTitle">Reportes en PDF</h3>
                        <p className="homeFeatureText">
                            Genera reportes profesionales de guardias por día, mes o período. 
                            Descarga en PDF listos para imprimir, compartir con tu equipo o archivar. 
                            Información siempre a mano.
                        </p>
                    </div>

                    {/* Feature 4 */}
                    <div className="homeFeatureCard">
                        <div className="homeFeatureIcon feature4">
                            <span className="material-icons">filter_list</span>
                        </div>
                        <h3 className="homeFeatureTitle">Filtros y Búsqueda</h3>
                        <p className="homeFeatureText">
                            Encuentra guardias al instante usando múltiples filtros. Busca por nombre 
                            de trabajador, fecha, tipo de guardia. Ordena por fecha o tipo en cualquier 
                            dirección que necesites.
                        </p>
                    </div>

                    {/* Feature 5 */}
                    <div className="homeFeatureCard">
                        <div className="homeFeatureIcon feature5">
                            <span className="material-icons">security</span>
                        </div>
                        <h3 className="homeFeatureTitle">Seguridad</h3>
                        <p className="homeFeatureText">
                            Autenticación segura con tokens de acceso. Control granular de permisos 
                            por usuario. Solo acceden a lo que necesitan. Datos encriptados y respaldos 
                            automáticos.
                        </p>
                    </div>

                    {/* Feature 6 */}
                    <div className="homeFeatureCard">
                        <div className="homeFeatureIcon feature6">
                            <span className="material-icons">mobile_friendly</span>
                        </div>
                        <h3 className="homeFeatureTitle">Responsivo</h3>
                        <p className="homeFeatureText">
                            Funciona perfectamente en desktop, tablet y móvil. Accede desde la oficina, 
                            en casa o en ruta. Interfaz adaptable que se ajusta a cualquier pantalla 
                            sin perder funcionalidad.
                        </p>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="homeBenefits">
                <div className="homeBenefitsContent">
                    <div className="homeBenefitsText">
                        <h2 className="homeBenefitsTitle">Beneficios para tu Equipo</h2>
                        <div className="homeBenefitsList">
                            <div className="homeBenefitItem">
                                <span className="material-icons homeBenefitIcon">check_circle</span>
                                <div>
                                    <h4>Ahorra Tiempo</h4>
                                    <p>Reduce la planificación manual de 8 horas a 30 minutos. Automatiza tareas repetitivas y dedica tu tiempo a decisiones estratégicas.</p>
                                </div>
                            </div>
                            <div className="homeBenefitItem">
                                <span className="material-icons homeBenefitIcon">check_circle</span>
                                <div>
                                    <h4>Aumenta Productividad</h4>
                                    <p>Mejora la organización y reduce conflictos de turnos. Tu equipo sabe exactamente cuándo trabaja. Mayor eficiencia y menos estrés.</p>
                                </div>
                            </div>
                            <div className="homeBenefitItem">
                                <span className="material-icons homeBenefitIcon">check_circle</span>
                                <div>
                                    <h4>Mejora Comunicación</h4>
                                    <p>Todos ven los mismos datos actualizados en tiempo real. Notificaciones automáticas evitan confusiones y cambios de último minuto.</p>
                                </div>
                            </div>
                            <div className="homeBenefitItem">
                                <span className="material-icons homeBenefitIcon">check_circle</span>
                                <div>
                                    <h4>Fácil de Usar</h4>
                                    <p>No requiere capacitación compleja. Tu equipo puede empezar a usar GuardiApp en minutos. Diseño intuitivo que todos entienden.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="homeBenefitsImage">
                        <div className="benefitsIllustration">
                            <div className="benefitCard">
                                <span className="material-icons">trending_up</span>
                                <p>Mayor Eficiencia</p>
                            </div>
                            <div className="benefitCard">
                                <span className="material-icons">schedule</span>
                                <p>Planificación Rápida</p>
                            </div>
                            <div className="benefitCard">
                                <span className="material-icons">thumb_up</span>
                                <p>Mayor Satisfacción</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="homeCTA">
                <div className="homeCTAContent">
                    <h2 className="homeCTATitle">¿Listo para Empezar?</h2>
                    <p className="homeCTASubtitle">
                        Simplifica la gestión de guardias de tu equipo hoy mismo
                    </p>
                    {isLoggedIn && (
                        <button 
                            className="homeCTAButton"
                            onClick={() => navigate("/home")}
                        >
                            <span className="material-icons">dashboard</span>
                            Ir al Dashboard
                        </button>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="homeFooter">
                <div className="homeFooterContent">
                    <div className="homeFooterSection">
                        <h4>GuardiApp</h4>
                        <p>Gestión inteligente de turnos y guardias</p>
                    </div>
                    <div className="homeFooterSection">
                        <h4>Enlaces</h4>
                        <ul>
                            <li><a href="/aviso-legal">Aviso Legal</a></li>
                            <li><a href="/privacidad">Privacidad</a></li>
                        </ul>
                    </div>
                    <div className="homeFooterSection">
                        <h4>Contacto</h4>
                        <ul>
                            <li>Email: info@guardiapp.com</li>
                            <li>Teléfono: +34 900 XXX XXX</li>
                        </ul>
                    </div>
                </div>
                <div className="homeFooterBottom">
                    <p>&copy; 2026 GuardiApp. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
