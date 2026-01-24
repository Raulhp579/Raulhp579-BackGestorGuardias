// import "../styles/PanelAdministracion.css";
// import { useMemo, useRef, useState, useEffect } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import interactionPlugin from "@fullcalendar/interaction";
// // import Header from "../components/Header";

// export default function PanelAdministracion() {
//     const stats = useMemo(
//         () => [
//             { title: "Sustituciones", value: "3", note: "Pendientes de validar", icon: "people", accent: "blue" },
//             { title: "Total Guardias", value: "150", note: "+12% vs mes anterior", icon: "bar_chart", accent: "green" },
//             { title: "Alertas", value: "5", note: "Errores de importación", icon: "warning", accent: "red" },
//         ],
//         []
//     );

//     // ===== FullCalendar control (mes arriba + prev/next) =====
//     const calendarRef = useRef(null);
//     const [monthLabel, setMonthLabel] = useState("");

//     function syncTitle() {
//         const api = calendarRef.current?.getApi();
//         if (!api) return;
//         setMonthLabel(api.view.title);
//     }

//     useEffect(() => {
//         syncTitle();
//     }, []);

//     function goPrev() {
//         const api = calendarRef.current?.getApi();
//         api?.prev();
//         syncTitle();
//     }

//     function goNext() {
//         const api = calendarRef.current?.getApi();
//         api?.next();
//         syncTitle();
//     }

//     // ===== Eventos base (mock) =====
//     const baseEvents = useMemo(
//         () => [
//             // CA (Continuidad)
//             { id: "1", title: "CA 15:00", start: "2024-04-01T15:00:00", extendedProps: { type: "CA" } },
//             { id: "2", title: "CA 15:00", start: "2024-04-04T15:00:00", extendedProps: { type: "CA" } },
//             { id: "3", title: "CA 19:00", start: "2024-04-04T19:00:00", extendedProps: { type: "CA" } },
//             { id: "4", title: "CA 12:00", start: "2024-04-08T12:00:00", extendedProps: { type: "CA" } },

//             // PF (Presencia Física)
//             { id: "5", title: "PF 24h", start: "2024-04-02", allDay: true, extendedProps: { type: "PF" } },
//             { id: "6", title: "PF 10h", start: "2024-04-05", allDay: true, extendedProps: { type: "PF" } },
//             { id: "7", title: "PF 24h", start: "2024-04-10", allDay: true, extendedProps: { type: "PF" } },

//             // LOC (Localizada)
//             { id: "8", title: "LOC 8:00", start: "2024-04-03T08:00:00", extendedProps: { type: "LOC", jefe: true } },
//         ],
//         []
//     );

//     // ===== Estado editable de eventos (aquí añadimos nuevas guardias) =====
//     const [events, setEvents] = useState(baseEvents);

//     //  FILTROS 
//     const [filterOpen, setFilterOpen] = useState(false);
//     const [filterType, setFilterType] = useState("ALL"); // ALL | CA | PF | LOC

//     const filteredEvents = useMemo(() => {
//         if (filterType === "ALL") return events;
//         return events.filter((e) => e.extendedProps?.type === filterType);
//     }, [events, filterType]);

//     // ===== MODAL NUEVA GUARDIA =====
//     const [newOpen, setNewOpen] = useState(false);
//     const [newType, setNewType] = useState("CA");          // CA | PF | LOC
//     const [newDate, setNewDate] = useState("2024-04-01");  // YYYY-MM-DD
//     const [newTime, setNewTime] = useState("15:00");       // HH:mm
//     const [newAllDay, setNewAllDay] = useState(false);     // para PF 24h / etc

//     function openNewGuardiaModal(prefilledDate) {
//         // Si haces click en día, lo prellenamos
//         if (prefilledDate) setNewDate(prefilledDate);
//         setNewOpen(true);
//     }

//     function addGuardia() {
//         // Construir start: si allDay => "YYYY-MM-DD" / si no => "YYYY-MM-DDTHH:mm:00"
//         const start = newAllDay ? newDate : `${newDate}T${newTime}:00`;

//         // Título estilo chip
//         const title = newAllDay ? `${newType} 24h` : `${newType} ${newTime}`;

//         const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());

//         setEvents((prev) => [
//             ...prev,
//             {
//                 id,
//                 title,
//                 start,
//                 allDay: newAllDay,
//                 extendedProps: { type: newType },
//             },
//         ]);

//         setNewOpen(false);
//     }

//     // Si eliges PF y marcas allDay, tiene sentido por defecto
//     useEffect(() => {
//         if (newType === "PF") {
//             // no forzamos, pero podrías activar esto si quieres:
//             // setNewAllDay(true);
//         }
//     }, [newType]);

//     return (

//         <div className="hdContent">
//             {/* Header escritorio */}
//             {/* <Header /> */}

//             {/* Header móvil dentro del contenido */}
//             <div className="hdMobileHeader">
//                 <div>
//                     <h2 className="hdTitle">Gestión de Guardias</h2>
//                     <p className="hdSubtitle">Planificación mensual</p>
//                 </div>
//                 <div className="hdStatus">
//                     <span className="hdStatusLabel">Estado</span>
//                     <span className="hdStatusPill">
//                         <span className="hdStatusDot" />
//                         Abierto
//                     </span>
//                 </div>
//             </div>

//             {/* Cards stats */}
//             <section className="hdStats">
//                 {stats.map((s) => (
//                     <div className="hdStatCard" key={s.title}>
//                         <div>
//                             <div className="hdStatTitle">{s.title}</div>
//                             <div className="hdStatValue">{s.value}</div>
//                             <div className={`hdStatNote ${s.accent}`}>{s.note}</div>
//                         </div>
//                         <div className={`hdStatIcon ${s.accent}`}>
//                             <span className="material-icons-outlined">{s.icon}</span>
//                         </div>
//                     </div>
//                 ))}
//             </section>

//             {/* Calendar card */}
//             <section className="hdCalendarCard">
//                 <div className="hdCalendarTop">
//                     <div className="hdMonthPicker">
//                         <button className="hdMiniBtn" aria-label="Mes anterior" type="button" onClick={goPrev}>
//                             <span className="material-icons-outlined">chevron_left</span>
//                         </button>

//                         <span className="hdMonthLabel">{monthLabel || "..."}</span>

//                         <button className="hdMiniBtn" aria-label="Mes siguiente" type="button" onClick={goNext}>
//                             <span className="material-icons-outlined">chevron_right</span>
//                         </button>
//                     </div>

//                     <div className="hdActions" style={{ position: "relative" }}>
//                         {/* FILTROS */}
//                         <button
//                             className="hdBtn light"
//                             type="button"
//                             onClick={() => setFilterOpen((v) => !v)}
//                             aria-expanded={filterOpen}
//                         >
//                             <span className="material-icons-outlined">filter_list</span>
//                             Filtros
//                         </button>

//                         {filterOpen && (
//                             <div className="hdFilterMenu" role="menu">
//                                 <button type="button" className={`hdFilterItem ${filterType === "ALL" ? "active" : ""}`}
//                                     onClick={() => { setFilterType("ALL"); setFilterOpen(false); }}
//                                 >
//                                     Todos
//                                 </button>
//                                 <button type="button" className={`hdFilterItem ${filterType === "CA" ? "active" : ""}`}
//                                     onClick={() => { setFilterType("CA"); setFilterOpen(false); }}
//                                 >
//                                     Continuidad (CA)
//                                 </button>
//                                 <button type="button" className={`hdFilterItem ${filterType === "PF" ? "active" : ""}`}
//                                     onClick={() => { setFilterType("PF"); setFilterOpen(false); }}
//                                 >
//                                     Presencia Física (PF)
//                                 </button>
//                                 <button type="button" className={`hdFilterItem ${filterType === "LOC" ? "active" : ""}`}
//                                     onClick={() => { setFilterType("LOC"); setFilterOpen(false); }}
//                                 >
//                                     Localizada (LOC)
//                                 </button>
//                             </div>
//                         )}

//                         {/* NUEVA GUARDIA */}
//                         {<button className="hdBtn primary" type="button" onClick={() => openNewGuardiaModal()}>
//                             <span className="material-icons-outlined">add</span>
//                             <span className="hideOnMobile">Nueva Guardia</span>
//                             <span className="showOnMobile">Crear</span>
//                         </button>}
//                     </div>
//                 </div>

//                 <div className="hdCalendar">
//                     <div className="hdFullCalendarWrap">
//                         <FullCalendar
//                             ref={calendarRef}
//                             plugins={[dayGridPlugin, interactionPlugin]}
//                             initialView="dayGridMonth"
//                             initialDate="2024-04-01"
//                             firstDay={1}
//                             height="auto"
//                             locale="es"
//                             headerToolbar={false}
//                             datesSet={syncTitle}
//                             dayHeaderFormat={{ weekday: "short" }}
//                             events={filteredEvents}
//                             eventContent={(arg) => {
//                                 const type = arg.event.extendedProps?.type;
//                                 const jefe = arg.event.extendedProps?.jefe;
//                                 const text = arg.event.title;

//                                 return (
//                                     <div className={`hdFcChip ${type || ""}`}>
//                                         <span className="hdFcChipText">{text}</span>
//                                         {jefe && (
//                                             <span className="material-icons-outlined hdFcJefe" title="Jefe de Guardia">
//                                                 local_police
//                                             </span>
//                                         )}
//                                     </div>
//                                 );
//                             }}
//                             dateClick={(info) => {
//                                 // click en día -> abre modal y prellena fecha
//                                 openNewGuardiaModal(info.dateStr);
//                             }}
//                             eventClick={(info) => {
//                                 console.log("eventClick:", info.event.title, info.event.start);
//                             }}
//                         />
//                     </div>
//                 </div>
//             </section>

//             {/* MODAL NUEVA GUARDIA */}
//             {newOpen && (
//                 <div className="hdModalOverlay" role="dialog" aria-modal="true">
//                     <div className="hdModalCard">
//                         <div className="hdModalHead">
//                             <div className="hdModalTitle">Nueva Guardia</div>
//                             <button className="hdModalClose" onClick={() => setNewOpen(false)} type="button" aria-label="Cerrar">
//                                 <span className="material-icons-outlined">close</span>
//                             </button>
//                         </div>

//                         <div className="hdModalBody">
//                             <label className="hdField">
//                                 <span>Tipo</span>
//                                 <select value={newType} onChange={(e) => setNewType(e.target.value)} className="hdControl">
//                                     <option value="CA">CA (Continuidad)</option>
//                                     <option value="PF">PF (Presencia Física)</option>
//                                     <option value="LOC">LOC (Localizada)</option>
//                                 </select>
//                             </label>

//                             <label className="hdField">
//                                 <span>Fecha</span>
//                                 <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="hdControl" />
//                             </label>

//                             <label className="hdField">
//                                 <span>Todo el día</span>
//                                 <input
//                                     type="checkbox"
//                                     checked={newAllDay}
//                                     onChange={(e) => setNewAllDay(e.target.checked)}
//                                 />
//                             </label>

//                             {!newAllDay && (
//                                 <label className="hdField">
//                                     <span>Hora</span>
//                                     <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="hdControl" />
//                                 </label>
//                             )}
//                         </div>

//                         <div className="hdModalFooter">
//                             <button className="hdBtn light" type="button" onClick={() => setNewOpen(false)}>
//                                 Cancelar
//                             </button>
//                             <button className="hdBtn primary" type="button" onClick={addGuardia}>
//                                 Guardar
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Legend */}
//             <section className="hdLegendCard">
//                 <h4 className="hdLegendTitle">Leyenda</h4>
//                 <div className="hdLegendGrid">
//                     <div className="hdLegendItem">
//                         <span className="dot ca" />
//                         <span>Continuidad (CA)</span>
//                     </div>
//                     <div className="hdLegendItem">
//                         <span className="dot pf" />
//                         <span>Presencia Física (PF)</span>
//                     </div>
//                     <div className="hdLegendItem">
//                         <span className="dot loc" />
//                         <span>Localizada (LOC)</span>
//                     </div>
//                     <div className="hdLegendItem">
//                         <span className="material-icons-outlined amber">local_police</span>
//                         <span>Jefe de Guardia</span>
//                     </div>
//                 </div>
//             </section>
//         </div>







//     );




// }