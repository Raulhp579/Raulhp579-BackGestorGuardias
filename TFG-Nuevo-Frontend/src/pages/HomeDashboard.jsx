import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import "../styles/HomeDashboard.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNotifications } from "../context/NotificationsContext";

import { getDuties, createDuty } from "../services/DutyService";
import { getSpecialities } from "../services/SpecialitiesService";
import Joyride, { STATUS } from "react-joyride-react-19";

function normalizeTime(t) {
    if (!t) return "";
    const s = String(t).trim();
    if (/^\d{2}:\d{2}$/.test(s)) return s;
    if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 5);
    return s.slice(0, 5);
}

function getInitials(name) {
    const n = String(name || "").trim();
    if (!n) return "";
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
}

export default function HomeDashboard() {
    const { addNotification } = useNotifications();

    const [specialities, setSpecialities] = useState([]);

    const months = useMemo(
        () => [
            { value: "01", label: "Enero" },
            { value: "02", label: "Febrero" },
            { value: "03", label: "Marzo" },
            { value: "04", label: "Abril" },
            { value: "05", label: "Mayo" },
            { value: "06", label: "Junio" },
            { value: "07", label: "Julio" },
            { value: "08", label: "Agosto" },
            { value: "09", label: "Septiembre" },
            { value: "10", label: "Octubre" },
            { value: "11", label: "Noviembre" },
            { value: "12", label: "Diciembre" },
        ],
        []
    );

    const years = useMemo(() => {
        const start = 2020;
        const end = 2030;
        const arr = [];
        for (let y = start; y <= end; y++) arr.push(String(y));
        return arr;
    }, []);

    // FullCalendar control
    const calendarRef = useRef(null);
    const [monthLabel, setMonthLabel] = useState("");

    // ✅ NUEVO: rango visible actual (para stats del mes visible)
    const [viewRange, setViewRange] = useState({ start: "", end: "" });

    function getMonthYearFromCalendar() {
        const api = calendarRef.current?.getApi();
        const d = api?.getDate() ?? new Date();
        const year = String(d.getFullYear());
        const month = String(d.getMonth() + 1).padStart(2, "0");
        return { year, month };
    }

    // cargar especialidades al montar (para el modal de nueva guardia)
    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const data = await getSpecialities();
                const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                if (alive) setSpecialities(arr);
            } catch (e) {
                console.error(e);
                if (alive) setSpecialities([]);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    function syncTitle() {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        setMonthLabel(api.view.title);
    }

    function goPrev() {
        const api = calendarRef.current?.getApi();
        api?.prev();
    }

    function goNext() {
        const api = calendarRef.current?.getApi();
        api?.next();
    }

    // BD: cargar guardias reales
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsError, setEventsError] = useState("");

    // ✅ helper: eventos dentro del rango visible
    const eventsInView = useMemo(() => {
        if (!viewRange.start || !viewRange.end) return events;
        return events.filter((e) => e.start && e.start >= viewRange.start && e.start < viewRange.end);
    }, [events, viewRange]);

    // ✅ STATS usando solo el mes visible (rango visible)
    const stats = useMemo(() => {
        const totalVisible = eventsInView.length;
        const continuidadVisible = eventsInView.filter((e) => e.extendedProps?.type === "CA").length;
        const alertas = events.filter((e) => !e.start).length;

        return [
            { title: "Continuidad Asistida", value: String(continuidadVisible), note: "En el mes visible", icon: "people", accent: "blue" },
            { title: "Total Guardias", value: String(totalVisible), note: "En el mes visible", icon: "bar_chart", accent: "green" },
            { title: "Alertas", value: String(alertas), note: "Eventos sin fecha", icon: "warning", accent: "red" },
        ];
    }, [events, eventsInView]);

    function mapDutyToEvent(d) {
        const id = String(d.id ?? d.uuid ?? (crypto?.randomUUID ? crypto.randomUUID() : Date.now()));

        const date = String(d.date ?? "");
        const typeUpper = String(d.duty_type ?? "").toUpperCase();

        const workerName = String(d.worker ?? "").trim();
        const specialityName = String(d.speciality ?? "").trim();

        const jefe = Boolean(d.is_chief);

        const title = `${workerName} · ${typeUpper}${specialityName ? ` · ${specialityName}` : ""}`;

        return {
            id,
            title,
            start: date, // YYYY-MM-DD
            allDay: true,
            extendedProps: {
                type: typeUpper,
                jefe,
                raw: d,
            },
        };
    }

    async function callGetDuties(start, end, name) {
        try {
            return await getDuties({ start, end, name });
        } catch (_) {
            return await getDuties(start, end, name);
        }
    }

    const loadDutiesForCurrentView = useCallback(async () => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        const start = api.view.activeStart.toISOString().slice(0, 10);
        const end = api.view.activeEnd.toISOString().slice(0, 10);

        // ✅ guarda rango visible para stats
        setViewRange({ start, end });

        setEventsLoading(true);
        setEventsError("");

        try {
            const data = await callGetDuties(start, end, debouncedName);
            const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            setEvents(arr.map(mapDutyToEvent));
        } catch (e) {
            console.error(e);
            setEventsError("No se pudieron cargar las guardias desde la base de datos.");
            setEvents([]);
        } finally {
            setEventsLoading(false);
        }
    }, [debouncedName]);

    useEffect(() => {
        syncTitle();
        setTimeout(() => {
            loadDutiesForCurrentView();
        }, 0);
    }, [loadDutiesForCurrentView]);

    useEffect(() => {
        loadDutiesForCurrentView();
    }, [debouncedName, loadDutiesForCurrentView]);

    // Filtros
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState("ALL");

    const filteredEvents = useMemo(() => {
        if (filterType === "ALL") return events;
        return events.filter((e) => e.extendedProps?.type === filterType);
    }, [events, filterType]);

    // Modal Nueva Guardia
    const [newOpen, setNewOpen] = useState(false);
    const [newType, setNewType] = useState("CA");
    const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [newTime, setNewTime] = useState("15:00");

    // se mantiene porque lo tienes en UI
    const [newName, setNewName] = useState("");

    const [newIdSpeciality, setNewIdSpeciality] = useState("");

    // ✅ id del worker requerido por backend
    const [newWorkerId, setNewWorkerId] = useState("");

    function openNewGuardiaModal(prefilledDate) {
        if (prefilledDate) setNewDate(prefilledDate);
        setNewName("");
        setNewIdSpeciality("");
        setNewWorkerId("");
        setNewOpen(true);
    }

    // Joyride Steps
    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
        {
            target: ".tour-new-guard",
            content:
                "Utiliza este botón para añadir manualmente una nueva guardia si no está en el Excel.",
            disableBeacon: true,
        },
        {
            target: ".tour-filters",
            content: "Filtra las guardias visibles por tipo (Continuidad, Presencia Física, Localizada) para ver solo lo que te interesa.",
        },
    ];

    useEffect(() => {
        const tutorialDone = localStorage.getItem("homeDashboardTutorialDone");
        if (!tutorialDone) {
            setRunTour(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            localStorage.setItem("homeDashboardTutorialDone", "true");
            setRunTour(false);
        }
    };

    // ✅ crear duty como espera el backend (id_worker requerido)
    async function addGuardia() {
        if (!newDate) return;

        if (!newIdSpeciality) {
            addNotification("La especialidad es obligatoria.");
            return;
        }

        if (!newWorkerId) {
            addNotification("Debes seleccionar un trabajador.");
            return;
        }

        try {
            normalizeTime(newTime);

            const payload = {
                date: newDate,
                duty_type: newType,
                id_speciality: Number(newIdSpeciality),
                id_worker: Number(newWorkerId),
                id_chief_worker: null,
            };

            const created = await createDuty(payload);
            console.log("CREATED DUTY =>", created);

            await loadDutiesForCurrentView();

            addNotification(`Guardia creada correctamente (${new Date().toLocaleTimeString()}).`);
            setNewOpen(false);
        } catch (e) {
            console.error(e);
            addNotification(e?.message || "Error creando la guardia");
        }
    }

    // ✅ IMPORTANTE: ahora sí devolvemos JSX
    return (
        <div className="hdContent">
            {/* Cards stats */}
            <section className="hdStats">
                {stats.map((s) => (
                    <div className="hdStatCard" key={s.title}>
                        <div>
                            <div className="hdStatTitle">{s.title}</div>
                            <div className="hdStatValue">{s.value}</div>
                            <div className={`hdStatNote ${s.accent}`}>{s.note}</div>
                        </div>
                        <div className={`hdStatIcon ${s.accent}`}>
                            <span className="material-icons-outlined">{s.icon}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Calendar card */}
            <section className="hdCalendarCard">
                <div className="hdCalendarTop">
                    <div className="hdMonthPicker">
                        <button className="hdMiniBtn" aria-label="Mes anterior" type="button" onClick={goPrev}>
                            <span className="material-icons-outlined">chevron_left</span>
                        </button>

                        <span className="hdMonthLabel">{monthLabel || "..."}</span>

                        <button className="hdMiniBtn" aria-label="Mes siguiente" type="button" onClick={goNext}>
                            <span className="material-icons-outlined">chevron_right</span>
                        </button>
                    </div>

                    <div className="hdActions" style={{ position: "relative" }}>
                        {/* BUTTON HELP TOUR */}

                        {/* NUEVA GUARDIA */}
                        <button className="hdBtn primary hdBtnSm tour-new-guard" type="button" onClick={() => openNewGuardiaModal()}>
                            <span className="material-icons-outlined">add</span>
                            <span className="hideOnMobile">Nueva Guardia</span>
                            <span className="showOnMobile">Crear</span>
                        </button>

                        {/* FILTROS */}
                        <button
                            className="hdBtn light hdBtnSm tour-filters"
                            type="button"
                            onClick={() => setFilterOpen((v) => !v)}
                            aria-expanded={filterOpen}
                        >
                            <span className="material-icons-outlined">filter_list</span>
                            Filtros
                        </button>

                        {filterOpen && (
                            <div className="hdFilterMenu" role="menu">
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "ALL" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("ALL");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Todos
                                </button>
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "CA" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("CA");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Continuidad (CA)
                                </button>
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "PF" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("PF");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Presencia Física (PF)
                                </button>
                                <button
                                    type="button"
                                    className={`hdFilterItem ${filterType === "LOC" ? "active" : ""}`}
                                    onClick={() => {
                                        setFilterType("LOC");
                                        setFilterOpen(false);
                                    }}
                                >
                                    Localizada (LOC)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {(eventsLoading || eventsError) && (
                    <div style={{ padding: "10px 16px" }}>
                        {eventsLoading && <span style={{ fontWeight: 700 }}>Cargando guardias...</span>}
                        {eventsError && <span style={{ color: "#b91c1c", fontWeight: 700 }}>{eventsError}</span>}
                    </div>
                )}

                <div className="hdCalendar">
                    <div className={`hdFullCalendarWrap ${eventsLoading ? "" : "hdEnter"}`}>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            initialDate={new Date()}
                            firstDay={1}
                            height="auto"
                            locale="es"
                            headerToolbar={false}
                            datesSet={() => {
                                syncTitle();
                                loadDutiesForCurrentView();
                            }}
                            dayHeaderFormat={{ weekday: "short" }}
                            events={filteredEvents}
                            dayCellClassNames={(arg) => (arg.isToday ? ["hdTodayCell"] : [])}
                            eventContent={(arg) => {
                                const type = arg.event.extendedProps?.type;
                                const jefe = arg.event.extendedProps?.jefe;
                                const text = arg.event.title;

                                return (
                                    <div className={`hdFcChip ${type || ""}`}>
                                        <span className="hdFcChipText">{text}</span>
                                        {jefe && (
                                            <span className="material-icons-outlined hdFcJefe" title="Jefe de Guardia">
                                                local_police
                                            </span>
                                        )}
                                    </div>
                                );
                            }}
                            dateClick={(info) => openNewGuardiaModal(info.dateStr)}
                            eventClick={(info) => {
                                console.log("eventClick raw:", info.event.extendedProps?.raw);
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* MODAL NUEVA GUARDIA */}
            {newOpen && (
                <div className="hdModalOverlay" role="dialog" aria-modal="true">
                    <div className="hdModalCard">
                        <div className="hdModalHead">
                            <div className="hdModalTitle">Nueva Guardia</div>
                            <button className="hdModalClose" onClick={() => setNewOpen(false)} type="button" aria-label="Cerrar">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="hdModalBody">
                            <label className="hdField">
                                <span>Tipo</span>
                                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="hdControl">
                                    <option value="CA">CA (Continuidad)</option>
                                    <option value="PF">PF (Presencia Física)</option>
                                    <option value="LOC">LOC (Localizada)</option>
                                </select>
                            </label>

                            <label className="hdField">
                                <span>Fecha</span>
                                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="hdControl" />
                            </label>

                            {/* NUEVO: selector de trabajador requerido por backend */}
                            <label className="hdField">
                                <span>Trabajador</span>

                                {workersLoading ? (
                                    <div className="hdControl">Cargando trabajadores...</div>
                                ) : workersError ? (
                                    <div className="hdControl">{workersError}</div>
                                ) : (
                                    <select
                                        className="hdControl"
                                        value={newWorkerId}
                                        onChange={(e) => setNewWorkerId(e.target.value)}
                                    >
                                        <option value="">Selecciona un trabajador</option>
                                        {workers.map((w) => (
                                            <option key={w.id} value={String(w.id)}>
                                                {w.name} (id: {w.id})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </label>

                            <label className="hdField">
                                <span>Especialidad</span>
                                <select className="hdControl" value={newIdSpeciality} onChange={(e) => setNewIdSpeciality(e.target.value)}>
                                    <option value="">Selecciona una especialidad</option>
                                    {specialities.map((s) => (
                                        <option key={s.id} value={String(s.id)}>
                                            {s.name} (id: {s.id})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="hdField">
                                <span>Hora</span>
                                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="hdControl" />
                            </label>
                        </div>

                        <div className="hdModalFooter">
                            <button className="hdBtn light hdBtnSm" type="button" onClick={() => setNewOpen(false)}>
                                Cancelar
                            </button>
                            <button className="hdBtn primary hdBtnSm" type="button" onClick={addGuardia}>
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legend */}
            <section className="hdLegendCard">
                <h4 className="hdLegendTitle">Leyenda</h4>
                <div className="hdLegendGrid">
                    <div className="hdLegendItem">
                        <span className="dot ca" />
                        <span>Continuidad (CA)</span>
                    </div>
                    <div className="hdLegendItem">
                        <span className="dot pf" />
                        <span>Presencia Física (PF)</span>
                    </div>
                    <div className="hdLegendItem">
                        <span className="dot loc" />
                        <span>Localizada (LOC)</span>
                    </div>
                    <div className="hdLegendItem">
                        <span className="material-icons-outlined amber">local_police</span>
                        <span>Jefe de Guardia</span>
                    </div>
                </div>
            </section>

            <Joyride
                steps={tourSteps}
                run={runTour}
                continuous
                showProgress
                showSkipButton
                scrollOffset={150}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        zIndex: 10000,
                        primaryColor: "#007bff",
                    },
                }}
                locale={{
                    back: "Atrás",
                    close: "Cerrar",
                    last: "Finalizar",
                    next: "Siguiente",
                    skip: "Saltar",
                }}
            />
        </div>
    );
}