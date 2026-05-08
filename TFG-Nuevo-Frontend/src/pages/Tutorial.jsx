import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Tutorial.css";

const BASE = import.meta.env.BASE_URL;

const img = (name) => `${BASE}imgsTutorial/${name}`;

/* ─── Data ──────────────────────────────────────────────────── */

const STEPS = [
    {
        title: "Descarga tu archivo de trabajo",
        label: "Paso 1",
        desc: "El primer paso es obtener la plantilla base. Ve a la seccion 'Plantilla Excel' en la pagina principal y pulsa el boton 'Descargar'. Guarda el archivo en tu ordenador para comenzar a trabajar con el.",
        img: img("LandingPage.png"),
        hint: null,
    },
    {
        title: "Completar los datos de los facultativos",
        label: "Paso 2",
        desc: "Al abrir la plantilla, encontraras una tabla donde deberas introducir la informacion de cada persona. Es muy importante que respetes el formato indicado para que el sistema lo lea correctamente.",
        img: img("ExelTrabajadores.png"),
        hint: (
            <>
                <strong>NOMBRE Y RANGO (columna izquierda):</strong>
                {" "}Nombre completo seguido de un punto (.) y el rango. Ejemplo: <em>Nombre Y Apellidos. Rango que ocupa</em>
                <br /><br />
                <strong>FECHA DE INICIO (columna derecha):</strong>
                {" "}Formato dia/mes/anyo. Ejemplo: <em>11/11/2011</em>
            </>
        ),
    },
    {
        title: "Planificacion del cuadrante mensual",
        label: "Paso 3",
        desc: "En la siguiente seccion de la plantilla organizaras el calendario de trabajo. Cada profesional tiene tres filas asignadas (CA, PF y LOC) segun el tipo de guardia. Marca con una 'x' el dia y tipo de guardia correspondiente.",
        img: img("ExcelMesEspecialidad.png"),
        hint: (
            <>
                <strong>FACULTATIVO:</strong>
                {" "}El nombre debe ir precedido de &quot;Dr.&quot; o &quot;Dra.&quot; &mdash; incluye el punto. Ejemplo: <em>Dra. Nombre trabajador</em>
                <br /><br />
                <strong>DIAS (1 al 31):</strong>
                {" "}Marca con &quot;x&quot; la celda que cruza el dia con el tipo de guardia (CA, PF o LOC).
            </>
        ),
    },
    {
        title: "Importar el Excel a la plataforma",
        label: "Paso 4",
        desc: "Una vez tengas el Excel rellenado, ve al menu lateral izquierdo, seccion 'Usuarios', boton 'Importar usuarios' (parte superior derecha). El sistema importara a todos los trabajadores y creara automaticamente un usuario de acceso para cada uno.",
        img: img("ImportarUsuarios.png"),
        hint: null,
    },
    {
        title: "Cargar el cuadrante de guardias",
        label: "Paso 5",
        desc: "Para subir el calendario, ve al menu lateral, seccion 'Guardias', boton 'Excel' (parte superior derecha). El sistema te pedira el archivo Excel y los datos clave: mes, anyo y especialidad del cuadrante.",
        img: img("ImpotarGuardias.png"),
        hint: null,
    },
];

const ADMIN_CARDS = [
    {
        icon: "people",
        iconClass: "iconGreen",
        title: "Gestion de Usuarios",
        desc: "Centro de control de todo el personal del sistema.",
        features: [
            "Alterna entre 'Ver trabajadores' y 'Ver usuarios' con los botones superiores.",
            "Edita (lapiz) o borra (papelera) cualquier registro desde la columna Acciones.",
            "Crea trabajadores manualmente con el boton verde; el usuario de acceso se genera automaticamente.",
            "Asigna la Jefatura de especialidad pulsando el icono de estrella.",
            "Importa listas masivas desde Excel con el boton 'Importar usuarios'.",
        ],
        img: img("GestionUsuarios.png"),
    },
    {
        icon: "schedule",
        iconClass: "iconBlue",
        title: "Gestion de Guardias",
        desc: "Pantalla central para organizar, modificar y visualizar todos los turnos.",
        features: [
            "Edita o borra guardias existentes desde la columna de acciones.",
            "Crea guardias individuales rapidamente con el boton verde 'Crear guardia'.",
            "Asignacion masiva de jefaturas por mes completo con el boton 'Asignar jefe' (elige al mas antiguo, maximo 3 veces por mes).",
            "Genera el PDF oficial de guardias de un dia y descargalo o envialo por correo.",
        ],
        img: img("GestionGuardias.png"),
    },
    {
        icon: "fingerprint",
        iconClass: "iconPurple",
        title: "Gestion de Fichajes",
        desc: "Control del registro horario de todo el personal.",
        features: [
            "Visualiza el listado completo de entradas y salidas.",
            "Crea fichajes manualmente con el boton 'Nuevo Fichaje'.",
            "Gestiona cada registro: ver ubicacion en el mapa, editar o borrar.",
        ],
        img: img("GestionFichajes.png"),
    },
    {
        icon: "local_hospital",
        iconClass: "iconOrange",
        title: "Gestion de Especialidades",
        desc: "Administra las areas medicas del centro.",
        features: [
            "Visualiza especialidades activas y el Jefe de Especialidad asignado.",
            "Anade nuevas areas con el boton verde 'Crear especialidad'.",
            "Edita o borra cualquier especialidad con los iconos de acciones.",
        ],
        img: img("GestionEspecialidades.png"),
    },
];

const USER_CARDS = [
    {
        icon: "calendar_month",
        iconClass: "iconBlue",
        title: "Dashboard / Calendario",
        desc: "Pantalla principal tras el acceso. Ofrece estadisticas del mes y el calendario semanal de todas las guardias del equipo.",
        features: [
            "Panel de estadisticas: guardias CA del periodo visible y total de guardias con la fecha de ultima sincronizacion.",
            "Calendario semanal interactivo: pasa el raton sobre cualquier evento para ver el detalle completo (trabajador, tipo, especialidad y jefe de guardia).",
            "Busca por nombre de trabajador y filtra por tipo de guardia (CA, PF, LOC) para limpiar la vista.",
            "Administradores: haz clic en cualquier dia del calendario para crear una guardia directamente desde aqui.",
        ],
        img: img("Calendario.png"),
    },
    {
        icon: "assignment_ind",
        iconClass: "iconGreen",
        title: "Control de Guardia",
        desc: "Seccion personal de cada trabajador con sus turnos asignados.",
        features: [
            "Visualiza el listado detallado de todas tus proximas guardias.",
            "Exporta tus turnos a Google Calendar con el boton azul central.",
            "Alterna a la pestanya 'Fichar' para registrar entrada y salida.",
        ],
        img: img("ControlGuardia.png"),
    },
    {
        icon: "touch_app",
        iconClass: "iconCyan",
        title: "Fichar",
        desc: "Registro de jornada diaria con control de ubicacion.",
        features: [
            "Registra tu entrada y salida con el boton central.",
            "Solo puedes fichar si estas dentro del area circular marcada en el mapa.",
            "Si no tienes guardia asignada ese dia, el sistema crea una automaticamente al fichar.",
        ],
        img: img("Fichar.png"),
    },
    {
        icon: "swap_horiz",
        iconClass: "iconPink",
        title: "Solicitudes",
        desc: "Bandeja de intercambios de turnos entre companeros.",
        features: [
            "Pide un cambio de guardia a otro companero de tu especialidad con 'Nueva Solicitud'.",
            "Revisa y responde las peticiones recibidas (acepta o rechaza).",
            "Doble validacion: si el companero acepta, la solicitud va al Jefe de Guardia para aprobacion final.",
        ],
        img: img("Solicitudes.png"),
    },
    {
        icon: "manage_accounts",
        iconClass: "iconOrange",
        title: "Perfil de Usuario",
        desc: "Gestion de los datos personales y seguridad de la cuenta.",
        features: [
            "Consulta tu nombre, email, rol asignado y fecha de creacion de la cuenta.",
            "Edita tu nombre y sube una foto de perfil (jpg/png, maximo 2 MB) pulsando 'Editar Perfil'.",
            "Cambia tu contrasena desde el boton 'Cambiar Contrasena' (minimo 8 caracteres).",
        ],
        img: null,
    },
];

/* ─── Lightbox ──────────────────────────────────────────────── */

function Lightbox({ src, onClose }) {
    if (!src) return null;
    return (
        <div className="tutorialLightbox" onClick={onClose}>
            <button className="tutorialLightboxClose" onClick={onClose}>
                <span className="material-icons">close</span>
            </button>
            <img
                className="tutorialLightboxImg"
                src={src}
                alt="Vista ampliada"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

/* ─── Sub-components ────────────────────────────────────────── */

function StepItem({ step, index, onImgClick }) {
    const isReverse = index % 2 !== 0;
    return (
        <div className={`tutorialStep ${isReverse ? "reverse" : ""}`}>
            <div className="tutorialStepText">
                <div className="tutorialStepBadge">
                    <div className="tutorialStepNumber">{index + 1}</div>
                    <span className="tutorialStepLabel">{step.label}</span>
                </div>
                <h3 className="tutorialStepTitle">{step.title}</h3>
                <p className="tutorialStepDesc">{step.desc}</p>
                {step.hint && (
                    <div className="tutorialStepHint">{step.hint}</div>
                )}
            </div>
            <img
                className="tutorialStepImg"
                src={step.img}
                alt={step.title}
                onClick={() => onImgClick(step.img)}
            />
        </div>
    );
}

function FeatureCard({ card, index, onImgClick }) {
    const isReverse = index % 2 !== 0;
    return (
        <div className={`tutorialCard ${isReverse ? "reverse" : ""}`}>
            <div className="tutorialCardInner">
                <div className="tutorialCardText">
                    <div className={`tutorialCardIcon ${card.iconClass}`}>
                        <span className="material-icons">{card.icon}</span>
                    </div>
                    <p className="tutorialCardRole">Funcionalidad</p>
                    <h3 className="tutorialCardTitle">{card.title}</h3>
                    <p className="tutorialCardDesc">{card.desc}</p>
                    <ul className="tutorialCardFeatures">
                        {card.features.map((f, i) => (
                            <li key={i}>
                                <span className="material-icons">check_circle</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="tutorialCardImgWrapper">
                    {card.img ? (
                        <img
                            className="tutorialCardImg"
                            src={card.img}
                            alt={card.title}
                            onClick={() => onImgClick(card.img)}
                        />
                    ) : (
                        <div className="tutorialCardImgPlaceholder">
                            <span className="material-icons">{card.icon}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function Tutorial() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("inicio");
    const [lightboxSrc, setLightboxSrc] = useState(null);

    const TABS = [
        { id: "inicio",  label: "Como Empezar",        icon: "rocket_launch",       count: STEPS.length },
        { id: "admin",   label: "Vista Administrador",  icon: "admin_panel_settings", count: ADMIN_CARDS.length },
        { id: "usuario", label: "Vista Usuario",         icon: "person",              count: USER_CARDS.length },
    ];

    return (
        <div className="tutorialPage">
            <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

            {/* Navbar */}
            <nav className="tutorialNav">
                <div className="tutorialNavContent">
                    <div className="tutorialNavLogo" onClick={() => navigate("/")}>
                        <svg viewBox="0 0 100 100" className="tutorialNavLogoSvg" role="img">
                            <path d="M50 15 L15 85 L30 85 L50 45 L70 85 L85 85 Z" />
                        </svg>
                        <span className="tutorialNavTitle">GuardiApp</span>
                    </div>
                    <button className="tutorialNavBack" onClick={() => navigate("/")}>
                        <span className="material-icons" style={{ fontSize: 18 }}>arrow_back</span>
                        Volver al inicio
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="tutorialHero">
                <div className="tutorialHeroContent">
                    <div className="tutorialHeroBadge">
                        <span className="material-icons" style={{ fontSize: 15 }}>school</span>
                        Tutorial Interactivo
                    </div>
                    <h1 className="tutorialHeroTitle">Aprende a usar GuardiApp</h1>
                    <p className="tutorialHeroSubtitle">
                        Guia completa paso a paso para configurar tu sistema, gestionar el personal
                        y aprovechar todas las funcionalidades de la plataforma.
                    </p>
                </div>
            </section>

            {/* Tabs */}
            <div className="tutorialTabs">
                <div className="tutorialTabsContent">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tutorialTab ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="material-icons">{tab.icon}</span>
                            {tab.label}
                            <span className="tutorialTabBadge">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="tutorialBody">

                {/* TAB: Como Empezar */}
                {activeTab === "inicio" && (
                    <>
                        <div className="tutorialSectionHeader">
                            <h2 className="tutorialSectionTitle">Como empezar</h2>
                            <p className="tutorialSectionDesc">
                                Sigue estos 5 pasos para configurar GuardiApp desde cero,
                                importar tu plantilla y tener el sistema listo para operar.
                            </p>
                        </div>
                        <div className="tutorialSteps">
                            {STEPS.map((step, i) => (
                                <StepItem
                                    key={i}
                                    step={step}
                                    index={i}
                                    onImgClick={setLightboxSrc}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* TAB: Vista Admin */}
                {activeTab === "admin" && (
                    <>
                        <div className="tutorialSectionHeader">
                            <h2 className="tutorialSectionTitle">Vistas del Administrador</h2>
                            <p className="tutorialSectionDesc">
                                Como administrador tienes acceso completo a la gestion del personal,
                                guardias, fichajes y especialidades del centro.
                            </p>
                        </div>
                        <div className="tutorialSubHeader">
                            <div className="tutorialSubHeaderIcon iconGreen">
                                <span className="material-icons">admin_panel_settings</span>
                            </div>
                            <div className="tutorialSubHeaderText">
                                <h3>Panel de Administracion</h3>
                                <p>Herramientas disponibles solo para el rol de administrador</p>
                            </div>
                        </div>
                        <div className="tutorialCards">
                            {ADMIN_CARDS.map((card, i) => (
                                <FeatureCard
                                    key={i}
                                    card={card}
                                    index={i}
                                    onImgClick={setLightboxSrc}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* TAB: Vista Usuario */}
                {activeTab === "usuario" && (
                    <>
                        <div className="tutorialSectionHeader">
                            <h2 className="tutorialSectionTitle">Vistas del Usuario</h2>
                            <p className="tutorialSectionDesc">
                                Cada trabajador dispone de su area personal para consultar guardias,
                                fichar y gestionar solicitudes de cambio de turno.
                            </p>
                        </div>
                        <div className="tutorialSubHeader">
                            <div className="tutorialSubHeaderIcon iconBlue">
                                <span className="material-icons">person</span>
                            </div>
                            <div className="tutorialSubHeaderText">
                                <h3>Area Personal del Trabajador</h3>
                                <p>Secciones accesibles para cualquier usuario registrado</p>
                            </div>
                        </div>
                        <div className="tutorialCards">
                            {USER_CARDS.map((card, i) => (
                                <FeatureCard
                                    key={i}
                                    card={card}
                                    index={i}
                                    onImgClick={setLightboxSrc}
                                />
                            ))}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
