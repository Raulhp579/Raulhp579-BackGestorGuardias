import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import "../styles/HomeDashboard.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNotifications } from "../context/NotificationsContext";
import { useAuth } from "../hooks/useAuth";

import { getDuties, createDuty, getDutiesLastUpdate } from "../services/DutyService";
import { getSpecialities } from "../services/SpecialitiesService";
import { importExcel } from "../services/importExcelService";
import { getWorkers } from "../services/workerService";
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
    const { isAdmin } = useAuth();

    const [specialities, setSpecialities] = useState([]);

    // ✅ NUEVO: workers para id_worker
    const [workers, setWorkers] = useState([]);
    const [workersLoading, setWorkersLoading] = useState(false);
    const [workersError, setWorkersError] = useState("");

    // estados que usas en el modal de importación
    const [importOpen, setImportOpen] = useState(false);
    const [specialitiesLoading, setSpecialitiesLoading] = useState(false);
    const [specialitiesError, setSpecialitiesError] = useState("");

    const [idSpeciality, setIdSpeciality] = useState("");
    const [importMonth, setImportMonth] = useState("01");
    const [importYear, setImportYear] = useState(
        String(new Date().getFullYear()),
    );

    const [excelFile, setExcelFile] = useState(null);
    const fileInputRef = useRef(null);

    const [isDragging, setIsDragging] = useState(false);
    const [importUploading, setImportUploading] = useState(false);
    const [importMsg, setImportMsg] = useState("");

    // Buscador por nombre (backend: /api/duties?name=...)
    const [searchName, setSearchName] = useState("");
    const [debouncedName, setDebouncedName] = useState("");

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedName(searchName.trim());
        }, 350);
        return () => clearTimeout(t);
    }, [searchName]);

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
        [],
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

    // NUEVO: rango visible actual (para stats del mes visible)
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
                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                      ? data.data
                      : [];
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

    // NUEVO: cargar workers al montar (para id_worker) - SOLO SI ES ADMIN
    useEffect(() => {
        let alive = true;

        // Solo cargar workers si es admin
        if (!isAdmin) {
            setWorkers([]);
            setWorkersError("");
            setWorkersLoading(false);
            return;
        }

        (async () => {
            setWorkersLoading(true);
            setWorkersError("");

            try {
                const data = await getWorkers();
                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                      ? data.data
                      : [];
                if (alive) setWorkers(arr);
            } catch (e) {
                console.error(e);
                if (alive) {
                    setWorkers([]);
                    setWorkersError("No se pudieron cargar los trabajadores.");
                }
            } finally {
                if (alive) setWorkersLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [isAdmin]);

    // Helpers Excel
    function isExcelFile(file) {
        if (!file) return false;

        const validExtensions = [".xls", ".xlsx"];
        const hasValidExtension = validExtensions.some(
            (ext) => file.name && file.name.toLowerCase().endsWith(ext),
        );

        const validMimeTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel.sheet.macroEnabled.12",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
        ];
        const hasValidMimeType = validMimeTypes.includes(file.type);

        return hasValidExtension || hasValidMimeType;
    }

    async function importDutysExcel({ file, year, month, idSpeciality }) {
        if (!file) return setImportMsg("No se ha seleccionado ningún archivo");
        if (!year || !month || !idSpeciality)
            return setImportMsg(
                "Por favor, seleccione año, mes y especialidad",
            );

        try {
            setImportMsg("Procesando archivo...");

            await importExcel({ file, year, month, idSpeciality });

            setImportMsg("Archivo importado correctamente");
            setExcelFile(null);

            await loadDutiesForCurrentView();

            addNotification(
                `Se han importado guardias desde Excel (${new Date().toLocaleTimeString()}).`,
            );
        } catch (error) {
            setImportMsg(error?.message || "Error al importar el archivo");
        }
    }

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

    // ÚLTIMA ACTUALIZACIÓN (desde backend) + tick para refrescar "hace X"
    const [lastUpdateISO, setLastUpdateISO] = useState(null);
    const [lastUpdateNowTick, setLastUpdateNowTick] = useState(Date.now()); // fuerza re-render cada X

    useEffect(() => {
        const t = setInterval(() => setLastUpdateNowTick(Date.now()), 30000); // cada 30s
        return () => clearInterval(t);
    }, []);

    function formatTimeAgo(iso) {
        if (!iso) return "Sin datos";

        const then = new Date(iso);
        const thenMs = then.getTime();
        if (Number.isNaN(thenMs)) return "Sin datos";

        const diffSec = Math.max(0, Math.floor((Date.now() - thenMs) / 1000));

        let value, unit;
        if (diffSec < 60) {
            value = -diffSec;
            unit = "second";
        } else if (diffSec < 3600) {
            value = -Math.floor(diffSec / 60);
            unit = "minute";
        } else if (diffSec < 86400) {
            value = -Math.floor(diffSec / 3600);
            unit = "hour";
        } else if (diffSec < 86400 * 7) {
            value = -Math.floor(diffSec / 86400);
            unit = "day";
        } else if (diffSec < 86400 * 30) {
            value = -Math.floor(diffSec / (86400 * 7));
            unit = "week";
        } else if (diffSec < 86400 * 365) {
            value = -Math.floor(diffSec / (86400 * 30));
            unit = "month";
        } else {
            value = -Math.floor(diffSec / (86400 * 365));
            unit = "year";
        }

        if (typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat === "function") {
            const rtf = new Intl.RelativeTimeFormat("es", { numeric: "always" });
            return rtf.format(value, unit);
        }

        const abs = Math.abs(value);
        const labels = {
            second: abs === 1 ? "segundo" : "segundos",
            minute: abs === 1 ? "minuto" : "minutos",
            hour: abs === 1 ? "hora" : "horas",
            day: abs === 1 ? "día" : "días",
            week: abs === 1 ? "semana" : "semanas",
            month: abs === 1 ? "mes" : "meses",
            year: abs === 1 ? "año" : "años",
        };
        return `hace ${abs} ${labels[unit]}`;
    }

    // ✅ responsive (móvil) con matchMedia compatible
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 600px)");

        const apply = () => setIsMobile(!!mq.matches);
        apply();

        // soporte navegadores viejos
        if (mq.addEventListener) mq.addEventListener("change", apply);
        else mq.addListener(apply);

        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", apply);
            else mq.removeListener(apply);
        };
    }, []);

    // ✅ NUEVO: modal de detalle de guardia
    const [dutyOpen, setDutyOpen] = useState(false);
    const [selectedDuty, setSelectedDuty] = useState(null);

    function closeDutyModal() {
        setDutyOpen(false);
        setSelectedDuty(null);
    }

    // cerrar con ESC
    useEffect(() => {
        if (!dutyOpen) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") closeDutyModal();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [dutyOpen]);

    // helper: eventos dentro del rango visible
    const eventsInView = useMemo(() => {
        if (!viewRange.start || !viewRange.end) return events;
        return events.filter(
            (e) =>
                e.start &&
                e.start >= viewRange.start &&
                e.start < viewRange.end,
        );
    }, [events, viewRange]);

    // ✅ STATS (incluye lastUpdateNowTick para que "hace X" se actualice)
    const stats = useMemo(() => {
        const totalVisible = eventsInView.length;
        const continuidadVisible = eventsInView.filter((e) => e.extendedProps?.type === "CA").length;

        return [
            {
                title: "Continuidad Asistida",
                value: String(continuidadVisible),
                note: "En el mes visible",
                icon: "people",
                accent: "blue",
            },
            {
                title: "Total Guardias",
                value: String(totalVisible),
                note: "En el mes visible",
                icon: "bar_chart",
                accent: "green",
            },
            {
                title: "Última actualización",
                value: lastUpdateISO ? formatTimeAgo(lastUpdateISO) : "Sin datos",
                note: "Sincronización con el servidor",
                icon: "sync",
                accent: "blue",
            },
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventsInView, lastUpdateISO, lastUpdateNowTick]);

    function mapDutyToEvent(d) {
        const id = String(
            d.id ??
                d.uuid ??
                (crypto?.randomUUID ? crypto.randomUUID() : Date.now()),
        );

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

    // ✅ compatible (service con objeto o con params)
    async function callGetDutiesLastUpdate(start, end, name) {
        try {
            return await getDutiesLastUpdate({ start, end, name });
        } catch (_) {
            return await getDutiesLastUpdate(start, end, name);
        }
    }

    const loadDutiesForCurrentView = useCallback(async () => {
        const api = calendarRef.current?.getApi();
        if (!api) return;

        const start = api.view.activeStart.toISOString().slice(0, 10);
        const end = api.view.activeEnd.toISOString().slice(0, 10);

        // guarda rango visible para stats
        setViewRange({ start, end });

        setEventsLoading(true);
        setEventsError("");

        try {
            const data = await callGetDuties(start, end, debouncedName);
            const arr = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                  ? data.data
                  : [];
            setEvents(arr.map(mapDutyToEvent));

            try {
                const meta = await getDutiesLastUpdate({ start, end, name: debouncedName });
                setLastUpdateISO(meta?.last_update ?? null);
            } catch (e) {
                console.error("last-update error:", e);
                setLastUpdateISO(null);
            }
        } catch (e) {
            console.error(e);
            setEventsError(
                "No se pudieron cargar las guardias desde la base de datos.",
            );
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

    // Modal Nueva Guardia (se mantiene, aunque tú me dijiste que aquí no se crea; lo dejo porque ya lo tienes)
    const [newOpen, setNewOpen] = useState(false);
    const [newType, setNewType] = useState("CA");
    const [newDate, setNewDate] = useState(() =>
        new Date().toISOString().slice(0, 10),
    );
    const [newTime, setNewTime] = useState("15:00");
    const [newName, setNewName] = useState("");
    const [newIdSpeciality, setNewIdSpeciality] = useState("");
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
            target: ".tour-import-excel",
            content:
                "Aquí puedes importar las guardias desde un archivo Excel. Asegúrate de seleccionar el mes, año y especialidad correctos.",
            disableBeacon: true,
        },
        {
            target: ".tour-new-guard",
            content:
                "Utiliza este botón para añadir manualmente una nueva guardia si no está en el Excel.",
        },
        {
            target: ".tour-filters",
            content:
                "Filtra las guardias visibles por tipo (Continuidad, Presencia Física, Localizada) para ver solo lo que te interesa.",
        },
    ];

    useEffect(() => {
        const phase = localStorage.getItem("tutorial_phase");
        if (phase === "PHASE_HOME") {
            setRunTour(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            localStorage.setItem("global_tutorial_done", "true");
            localStorage.removeItem("tutorial_phase");
            setRunTour(false);
        }
    };

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

            addNotification(
                `Guardia creada correctamente (${new Date().toLocaleTimeString()}).`,
            );
            setNewOpen(false);
        } catch (e) {
            console.error(e);
            addNotification(e?.message || "Error creando la guardia");
        }
    }

    async function openImportModal() {
        const { year, month } = getMonthYearFromCalendar();
        setImportYear(years.includes(year) ? year : years[years.length - 1]);
        setImportMonth(month);

        setImportMsg("");
        setExcelFile(null);
        setIdSpeciality("");
        setImportOpen(true);

        setSpecialitiesLoading(true);
        setSpecialitiesError("");

        try {
            const data = await getSpecialities();
            const arr = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                  ? data.data
                  : [];
            setSpecialities(arr);
        } catch (e) {
            console.error(e);
            setSpecialities([]);
            setSpecialitiesError("No se pudieron cargar las especialidades.");
        } finally {
            setSpecialitiesLoading(false);
        }
    }

    function closeImportModal() {
        setImportOpen(false);
        setIsDragging(false);
    }

    function onPickExcelFile(e) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!isExcelFile(file)) {
            setImportMsg("Solo se permiten archivos .xls o .xlsx");
            setExcelFile(null);
            return;
        }

        setExcelFile(file);
        setImportMsg("");
    }

    function onDragOver(e) {
        e.preventDefault();
        setIsDragging(true);
    }

    function onDragLeave(e) {
        e.preventDefault();
        setIsDragging(false);
    }

    function onDrop(e) {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (!isExcelFile(file)) {
            setImportMsg("Solo se permiten archivos .xls o .xlsx");
            setExcelFile(null);
            return;
        }

        setExcelFile(file);
        setImportMsg("");
    }

    async function submitImport() {
        if (!excelFile) return setImportMsg("Debes adjuntar un archivo Excel.");
        if (!isExcelFile(excelFile))
            return setImportMsg("Solo se permiten archivos .xls o .xlsx");
        if (!idSpeciality)
            return setImportMsg("Debes seleccionar una especialidad.");
        if (!importYear || !importMonth)
            return setImportMsg("Debes seleccionar año y mes.");

        const maxMB = 10;
        if (excelFile.size > maxMB * 1024 * 1024)
            return setImportMsg(`El archivo supera ${maxMB}MB`);

        setImportUploading(true);
        setImportMsg("");

        try {
            await importDutysExcel({
                file: excelFile,
                year: importYear,
                month: importMonth,
                idSpeciality: idSpeciality,
            });
        } catch (e) {
            setImportMsg(`Error al subir: ${e.message}`);
        } finally {
            setImportUploading(false);
        }
    }

    function dutyTypeLabel(t) {
        const x = String(t || "").toUpperCase();
        if (x === "CA") return "CA · Continuidad";
        if (x === "PF") return "PF · Presencia Física";
        if (x === "LOC") return "LOC · Localizada";
        return x || "-";
    }

    return (
        <div className="hdContent">
            {/* Cards stats */}
            <section className="hdStats">
                {stats.map((s) => (
                    <div className="hdStatCard" key={s.title}>
                        <div>
                            <div className="hdStatTitle">{s.title}</div>
                            <div className="hdStatValue">{s.value}</div>
                            <div className={`hdStatNote ${s.accent}`}>
                                {s.note}
                            </div>
                        </div>
                        <div className={`hdStatIcon ${s.accent}`}>
                            <span className="material-icons-outlined">
                                {s.icon}
                            </span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Calendar card */}
            <section className="hdCalendarCard">
                <div className="hdCalendarTop">
                    <div className="hdMonthPicker">
                        <button
                            className="hdMiniBtn"
                            aria-label="Mes anterior"
                            type="button"
                            onClick={goPrev}
                        >
                            <span className="material-icons-outlined">
                                chevron_left
                            </span>
                        </button>

                        <span className="hdMonthLabel">
                            {monthLabel || "..."}
                        </span>

                        <button
                            className="hdMiniBtn"
                            aria-label="Mes siguiente"
                            type="button"
                            onClick={goNext}
                        >
                            <span className="material-icons-outlined">
                                chevron_right
                            </span>
                        </button>
                    </div>

                    {/* INPUT CENTRADO */}
                    <div className="hdSearchWrap" role="search" aria-label="Buscar por nombre">
                        <div className="hdSearch">
                            <span
                                className="material-icons-outlined hdSearchIcon"
                                aria-hidden="true"
                            >
                                search
                            </span>

                            <input
                                className="hdSearchInput"
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />

                            {searchName && (
                                <button
                                    type="button"
                                    className="hdSearchClear"
                                    onClick={() => setSearchName("")}
                                    aria-label="Limpiar búsqueda"
                                    title="Limpiar"
                                >
                                    <span className="material-icons-outlined">
                                        close
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="hdActions" style={{ position: "relative" }}>
                        {/* FILTROS */}
                        <button
                            className="hdBtn light hdBtnSm tour-filters"
                            type="button"
                            onClick={() => setFilterOpen((v) => !v)}
                            aria-expanded={filterOpen}
                        >
                            <span className="material-icons-outlined">
                                filter_list
                            </span>
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
                        {eventsLoading && (
                            <span style={{ fontWeight: 700 }}>
                                Cargando guardias...
                            </span>
                        )}
                        {eventsError && (
                            <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                                {eventsError}
                            </span>
                        )}
                    </div>
                )}

                <div className="hdCalendar">
                    <div
                        className={`hdFullCalendarWrap ${eventsLoading ? "" : "hdEnter"}`}
                    >
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
                            dayCellClassNames={(arg) =>
                                arg.isToday ? ["hdTodayCell"] : []
                            }
                            eventContent={(arg) => {
                                const type = String(arg.event.extendedProps?.type || "").toUpperCase();
                                const jefe = Boolean(arg.event.extendedProps?.jefe);
                                const fullText = arg.event.title;

                                const dotClass =
                                    type === "CA" ? "ca" : type === "PF" ? "pf" : type === "LOC" ? "loc" : "loc";

                                // ✅ En móvil: letra corta (C/P/L) y si es jefe, mostramos SOLO el escudo
                                const label = isMobile
                                    ? type === "CA"
                                        ? "C"
                                        : type === "PF"
                                            ? "P"
                                            : type === "LOC"
                                                ? "L"
                                                : "-"
                                    : fullText;

                                return (
                                    <div className={`hdFcChip ${type || ""} ${jefe ? "hasChief" : ""}`}>
                                        {/* Desktop: dot + texto completo */}
                                        {!isMobile && dotClass && <span className={`dot ${dotClass}`} title={type} />}

                                        {/* Mobile: dot solo si NO es jefe */}
                                        {isMobile && !jefe && dotClass && <span className={`dot ${dotClass}`} title={type} />}

                                        <span className="hdFcChipText" title={fullText}>
                                            {label}
                                        </span>

                                        {jefe && (
                                            <span className="material-icons-outlined hdFcJefe" title="Jefe de Guardia" aria-label="Jefe de Guardia">
                                                local_police
                                            </span>
                                        )}
                                    </div>
                                );
                            }}
                            dateClick={(info) => {
                                // Solo permitir crear guardia si es admin
                                if (isAdmin) {
                                    openNewGuardiaModal(info.dateStr);
                                }
                            }}
                            eventClick={(info) => {
                                const raw = info.event.extendedProps?.raw || null;

                                setSelectedDuty({
                                    title: info.event.title,
                                    date: info.event.startStr?.slice(0, 10) || "",
                                    type: info.event.extendedProps?.type || "",
                                    jefe: Boolean(info.event.extendedProps?.jefe),
                                    raw,
                                });

                                setDutyOpen(true);
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* ✅ MODAL DETALLE GUARDIA */}
            {dutyOpen && (
                <div
                    className="hdModalOverlay"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeDutyModal();
                    }}
                >
                    <div
                        className={`hdModalCard hdDutyModalCard ${(
                            selectedDuty?.raw?.duty_type ||
                            selectedDuty?.type ||
                            ""
                        )
                            .toString()
                            .toUpperCase()}`}
                    >
                        <div className="hdModalHead">
                            <div className="hdModalTitle">Detalle de guardia</div>
                            <button className="hdModalClose" type="button" onClick={closeDutyModal} aria-label="Cerrar">
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div className="hdModalBody">
                            <div className="hdDutyDetailTitle">{selectedDuty?.raw?.worker || selectedDuty?.title || "-"}</div>

                            <div className="hdDutyDetailGrid">
                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">Fecha</span>
                                    <span className="hdDutyVal">{selectedDuty?.raw?.date || selectedDuty?.date || "-"}</span>
                                </div>

                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">Tipo</span>
                                    <span className="hdDutyVal">{dutyTypeLabel(selectedDuty?.raw?.duty_type || selectedDuty?.type)}</span>
                                </div>

                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">Especialidad</span>
                                    <span className="hdDutyVal">{selectedDuty?.raw?.speciality || "-"}</span>
                                </div>

                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">ID Especialidad</span>
                                    <span className="hdDutyVal">{selectedDuty?.raw?.id_speciality ?? "-"}</span>
                                </div>

                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">Trabajador</span>
                                    <span className="hdDutyVal">{selectedDuty?.raw?.worker || "-"}</span>
                                </div>

                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">ID Trabajador</span>
                                    <span className="hdDutyVal">{selectedDuty?.raw?.id_worker ?? "-"}</span>
                                </div>

                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">Jefe de guardia</span>
                                    <span className="hdDutyVal">
                                        {selectedDuty?.raw?.chief_worker
                                            ? `${selectedDuty.raw.chief_worker} (id: ${selectedDuty.raw.id_chief_worker ?? "-"})`
                                            : selectedDuty?.jefe
                                                ? "Sí"
                                                : "No"}
                                    </span>
                                </div>

                                <div className="hdDutyRow">
                                    <span className="hdDutyKey">ID Guardia</span>
                                    <span className="hdDutyVal">{selectedDuty?.raw?.id ?? "-"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hdModalFooter">
                            <button className="hdBtn light hdBtnSm" type="button" onClick={closeDutyModal}>
                                Cerrar
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
                        <span className="material-icons-outlined amber">
                            local_police
                        </span>
                        <span>Jefe de Guardia</span>
                    </div>
                </div>
            </section>

            <Joyride
                steps={tourSteps}
                run={runTour}
                continuous
                showProgress
                showSkipButton={true}
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
                    last: "Finalizar Tutorial",
                    next: "Siguiente",
                    skip: "Saltar tutorial",
                }}
            />
        </div>
    );
}
