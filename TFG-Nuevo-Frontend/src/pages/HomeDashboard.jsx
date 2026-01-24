// HomeDashboard.jsx
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import "../styles/HomeDashboard.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNotifications } from "../context/NotificationsContext";

// IMPORTA tu función ya hecha
// Ajusta la ruta al archivo donde la tengas
import { getDuties } from "../services/DutyService"; 

export default function HomeDashboard() {
  const stats = useMemo(
    () => [
      { title: "Sustituciones", value: "3", note: "Pendientes de validar", icon: "people", accent: "blue" },
      { title: "Total Guardias", value: "150", note: "+12% vs mes anterior", icon: "bar_chart", accent: "green" },
      { title: "Alertas", value: "5", note: "Errores de importación", icon: "warning", accent: "red" },
    ],
    []
  );

  const { addNotification } = useNotifications();

  // ============================
  // Helpers Excel (lo tuyo)
  // ============================
  function isExcelFile(file) {
    if (!file) return false;

    const validExtensions = [".xls", ".xlsx"];
    const hasValidExtension = validExtensions.some((ext) => file.name && file.name.toLowerCase().endsWith(ext));

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
    if (!file) {
      setImportMsg("No se ha seleccionado ningún archivo");
      return;
    }
    if (!year || !month || !idSpeciality) {
      setImportMsg("Por favor, seleccione año, mes y especialidad");
      return;
    }

    try {
      setImportMsg("Procesando archivo...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", year);
      formData.append("month", month);
      formData.append("idSpeciality", idSpeciality);

      const response = await fetch("/api/import-dutys", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportMsg("Archivo importado correctamente");
        setExcelFile(null);

        // ✅ refrescar calendario tras importar
        await loadDutiesForCurrentView();

        addNotification(`Se han importado guardias desde Excel (${new Date().toLocaleTimeString()}).`);
      } else {
        setImportMsg(result.message || "Error al importar el archivo");
      }
    } catch (error) {
      console.error("Error importing Excel:", error);
      setImportMsg("Error al importar el archivo: " + error.message);
    }
  }

  // ============================
  // FullCalendar control
  // ============================
  const calendarRef = useRef(null);
  const [monthLabel, setMonthLabel] = useState("");

  function syncTitle() {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    setMonthLabel(api.view.title);
  }

  function goPrev() {
    const api = calendarRef.current?.getApi();
    api?.prev();
    // datesSet refresca todo
  }

  function goNext() {
    const api = calendarRef.current?.getApi();
    api?.next();
    // datesSet refresca todo
  }

  // ============================
  // ✅ BD: cargar guardias reales
  // ============================
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");

  function mapDutyToEvent(d) {
    // Soporta varios formatos típicos del backend.
    // Si tu backend ya devuelve "start", se usa tal cual.
    const id = String(d.id ?? d.uuid ?? crypto?.randomUUID?.() ?? Date.now());

    const dutyType = d.duty_type ?? d.type ?? d.dutyType ?? "";
    const typeUpper = String(dutyType).toUpperCase();

    const date = d.date ?? d.day ?? "";
    const time = d.time ?? d.hour ?? ""; // si no existe, puede ser allDay
    const speciality = d.speciality ?? d.specialty ?? d.speciality_name ?? "";
    const workerName = d.worker_name ?? d.workerName ?? d.name ?? "";

    const allDayFromApi = Boolean(d.allDay ?? d.all_day);
    const isAllDay = allDayFromApi || (typeUpper === "PF" && !time);

    const start =
      d.start
        ? d.start
        : isAllDay
          ? date
          : `${date}T${String(time || "00:00").slice(0, 5)}:00`;

    const titleParts = [];
    if (speciality) titleParts.push(speciality);
    if (typeUpper) titleParts.push(typeUpper);
    if (!isAllDay && time) titleParts.push(String(time).slice(0, 5));
    if (workerName) titleParts.push(`- ${workerName}`);

    const jefe =
      Boolean(d.jefe ?? d.is_chief ?? d.isChief) ||
      Boolean(d.id_chief_worker ?? d.chief_worker_id ?? d.idChiefWorker);

    return {
      id,
      title: titleParts.join(" "),
      start,
      allDay: isAllDay,
      extendedProps: {
        type: typeUpper,
        jefe,
        raw: d, // por si lo quieres al click
      },
    };
  }

  // ✅ llamamos a tu getDuties sin romperte aunque lo tengas con firma distinta
  async function callGetDuties(start, end) {
    // 1) getDuties({start,end})
    try {
      return await getDuties({ start, end });
    } catch (_) {
      // 2) getDuties(start,end)
      return await getDuties(start, end);
    }
  }

  const loadDutiesForCurrentView = useCallback(async () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;

    const start = api.view.activeStart.toISOString().slice(0, 10);
    const end = api.view.activeEnd.toISOString().slice(0, 10);

    setEventsLoading(true);
    setEventsError("");

    try {
      const data = await callGetDuties(start, end);
      const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setEvents(arr.map(mapDutyToEvent));
    } catch (e) {
      console.error(e);
      setEventsError("No se pudieron cargar las guardias desde la base de datos.");
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncTitle();
    // espera a que FullCalendar monte
    setTimeout(() => {
      loadDutiesForCurrentView();
    }, 0);
  }, [loadDutiesForCurrentView]);

  // ============================
  // Filtros
  // ============================
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("ALL");

  const filteredEvents = useMemo(() => {
    if (filterType === "ALL") return events;
    return events.filter((e) => e.extendedProps?.type === filterType);
  }, [events, filterType]);

  // ============================
  // Modal Nueva Guardia (local)
  // ============================
  const [newOpen, setNewOpen] = useState(false);
  const [newType, setNewType] = useState("CA");
  const [newDate, setNewDate] = useState("2024-04-01");
  const [newTime, setNewTime] = useState("15:00");
  const [newName, setNewName] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("Anestesia");

  function openNewGuardiaModal(prefilledDate) {
    if (prefilledDate) setNewDate(prefilledDate);
    setNewName("");
    setNewOpen(true);
  }

  // IMPORTANTE:
  // Si todavía no tienes endpoint POST, esto añade en UI.
  // Cuando tengas POST, aquí haces fetch POST y luego loadDutiesForCurrentView()
  function addGuardia() {
    const start = `${newDate}T${newTime}:00`;

    const nameClean = newName.trim();
    const parts = [newSpecialty, newType, newTime];
    const title = nameClean ? `${parts.join(" ")} - ${nameClean}` : parts.join(" ");

    const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());

    setEvents((prev) => [
      ...prev,
      {
        id,
        title,
        start,
        allDay: false,
        extendedProps: { type: newType, name: nameClean },
      },
    ]);

    // NOTIFICACIÓN con hora actual
    addNotification(`Se ha agregado una nueva guardia a las ${new Date().toLocaleTimeString()}.`);

    setNewOpen(false);
  }

  // ============================
  // Import Excel modal (estado)
  // ============================
  const [importOpen, setImportOpen] = useState(false);

  // Especialidades (tu sistema)
  const [specialitiesLoading, setSpecialitiesLoading] = useState(false);
  const [specialitiesError, setSpecialitiesError] = useState("");

  const [idSpeciality, setIdSpeciality] = useState("");
  const [importMonth, setImportMonth] = useState("01");
  const [importYear, setImportYear] = useState("2026");

  const [excelFile, setExcelFile] = useState(null);
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [importUploading, setImportUploading] = useState(false);
  const [importMsg, setImportMsg] = useState("");

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

  function getMonthYearFromCalendar() {
    const api = calendarRef.current?.getApi();
    const d = api?.getDate() ?? new Date();
    const year = String(d.getFullYear());
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return { year, month };
  }

  async function openImportModal() {
    const { year, month } = getMonthYearFromCalendar();
    setImportYear(years.includes(year) ? year : years[years.length - 1]);
    setImportMonth(month);

    setImportMsg("");
    setExcelFile(null);
    setIdSpeciality("");
    setImportOpen(true);

    // Si tú ya cargas especialidades desde servicio, hazlo aquí:
    setSpecialitiesLoading(true);
    setSpecialitiesError("");
    getDuties()

    // ⚠️ aquí deberías llamar a tu servicio real de especialidades
    // (yo lo dejo como antes: sin romperte)
    setTimeout(() => {
      setSpecialitiesLoading(false);
    }, 0);
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
    if (!isExcelFile(excelFile)) return setImportMsg("Solo se permiten archivos .xls o .xlsx");
    if (!idSpeciality) return setImportMsg("Debes seleccionar una especialidad.");
    if (!importYear || !importMonth) return setImportMsg("Debes seleccionar año y mes.");

    const maxMB = 10;
    if (excelFile.size > maxMB * 1024 * 1024) return setImportMsg(`El archivo supera ${maxMB}MB`);

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

  return (
    <div className="hdContent">
      {/* Header móvil dentro del contenido */}
      <div className="hdMobileHeader">
        <div>
          <h2 className="hdTitle">Gestión de Guardias</h2>
          <p className="hdSubtitle">Planificación mensual</p>
        </div>
        <div className="hdStatus">
          <span className="hdStatusLabel">Estado</span>
          <span className="hdStatusPill">
            <span className="hdStatusDot" />
            Abierto
          </span>
        </div>
      </div>

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
            {/* FILTROS */}
            <button
              className="hdBtn light"
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

            {/* NUEVA GUARDIA */}
            <button className="hdBtn primary" type="button" onClick={() => openNewGuardiaModal()}>
              <span className="material-icons-outlined">add</span>
              <span className="hideOnMobile">Nueva Guardia</span>
              <span className="showOnMobile">Crear</span>
            </button>
          </div>
        </div>

        {/* ✅ Estado de carga/errores */}
        {(eventsLoading || eventsError) && (
          <div style={{ padding: "10px 16px" }}>
            {eventsLoading && <span style={{ fontWeight: 700 }}>Cargando guardias...</span>}
            {eventsError && <span style={{ color: "#b91c1c", fontWeight: 700 }}>{eventsError}</span>}
          </div>
        )}

        <div className="hdCalendar">
          <div className="hdFullCalendarWrap">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate="2024-04-01"
              firstDay={1}
              height="auto"
              locale="es"
              headerToolbar={false}
              // ✅ cada vez que cambia el rango (prev/next), recargamos desde BD
              datesSet={() => {
                syncTitle();
                loadDutiesForCurrentView();
              }}
              dayHeaderFormat={{ weekday: "short" }}
              events={filteredEvents}
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
                // Si quieres ver el duty original:
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

              <label className="hdField">
                <span>Nombre</span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="hdControl"
                  placeholder="Ej: María López"
                />
              </label>

              <label className="hdField">
                <span>Especialidad</span>
                <select value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} className="hdControl">
                  <option value="Anestesia">Anestesia</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Radiologia">Radiología</option>
                  <option value="Medicina Intensiva">Medicina Intensiva</option>
                  <option value="Medicina Interna">Medicina Interna</option>
                  <option value="Cirugia General">Cirugía General</option>
                  <option value="Pediatria">Pediatría</option>
                </select>
              </label>

              <label className="hdField">
                <span>Hora</span>
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="hdControl" />
              </label>
            </div>

            <div className="hdModalFooter">
              <button className="hdBtn light" type="button" onClick={() => setNewOpen(false)}>
                Cancelar
              </button>
              <button className="hdBtn primary" type="button" onClick={addGuardia}>
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

      {/* IMPORTAR EXCEL */}
      <section>
        <div className="cdActions">
          <button className="cdBtnSecondary" type="button" onClick={openImportModal}>
            <span className="material-icons excel">table_view</span>
            Importar Excel
          </button>
        </div>
      </section>

      {/* MODAL IMPORTAR EXCEL */}
      {importOpen && (
        <div className="hdModalOverlay" role="dialog" aria-modal="true">
          <div className="hdModalCard">
            <div className="hdModalHead">
              <div className="hdModalTitle">Importar guardias desde Excel</div>
              <button className="hdModalClose" type="button" onClick={closeImportModal} aria-label="Cerrar">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div className="hdModalBody">
              <label className="hdField">
                <span>Especialidad</span>

                {specialitiesLoading ? (
                  <div className="hdControl">Cargando especialidades...</div>
                ) : specialitiesError ? (
                  <div className="hdControl">{specialitiesError}</div>
                ) : (
                  // ✅ Aquí vuelve a poner tu select real de especialidades cuando lo tengas
                  <select className="hdControl" value={idSpeciality} onChange={(e) => setIdSpeciality(e.target.value)}>
                    <option value="">-- Selecciona una especialidad --</option>
                    <option value="1">Anestesia (id: 1)</option>
                    <option value="2">Cirugía (id: 2)</option>
                  </select>
                )}
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="hdField">
                  <span>Mes</span>
                  <select className="hdControl" value={importMonth} onChange={(e) => setImportMonth(e.target.value)}>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label} ({m.value})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="hdField">
                  <span>Año</span>
                  <select className="hdControl" value={importYear} onChange={(e) => setImportYear(e.target.value)}>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                style={{ display: "none" }}
                onChange={onPickExcelFile}
              />

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 12,
                  border: `2px dashed ${isDragging ? "#888" : "#ccc"}`,
                  borderRadius: 12,
                  padding: 16,
                  cursor: "pointer",
                  textAlign: "center",
                  userSelect: "none",
                }}
                title="Arrastra Excel o haz clic para seleccionarlo"
              >
                <div style={{ fontWeight: 600 }}>Arrastra aquí tu Excel (.xls / .xlsx)</div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>o haz clic para seleccionarlo</div>

                {excelFile && (
                  <div style={{ marginTop: 10 }}>
                    Archivo: <b>{excelFile.name}</b>
                  </div>
                )}
              </div>

              {importMsg && <p style={{ marginTop: 12 }}>{importMsg}</p>}
            </div>

            <div className="hdModalFooter">
              <button className="hdBtn light" type="button" onClick={closeImportModal}>
                Cancelar
              </button>

              <button className="hdBtn primary" type="button" disabled={importUploading} onClick={submitImport}>
                {importUploading ? "Subiendo..." : "Importar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}