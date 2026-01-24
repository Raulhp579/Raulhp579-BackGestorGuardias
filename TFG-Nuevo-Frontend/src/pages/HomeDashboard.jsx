import { useMemo, useRef, useState, useEffect } from "react";
import "../styles/HomeDashboard.css";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useNotifications } from "../context/NotificationsContext";


export default function HomeDashboard() {
  const stats = useMemo(
    () => [
      { title: "Sustituciones", value: "3", note: "Pendientes de validar", icon: "people", accent: "blue" },
      { title: "Total Guardias", value: "150", note: "+12% vs mes anterior", icon: "bar_chart", accent: "green" },
      { title: "Alertas", value: "5", note: "Errores de importación", icon: "warning", accent: "red" },
    ],
    []
  );
  //mio
  function isExcelFile(file) {
  if (!file) return false;
  
  // Verificar extensión del archivo
  const validExtensions = ['.xls', '.xlsx'];
  const hasValidExtension = validExtensions.some(ext => 
    file.name && file.name.toLowerCase().endsWith(ext)
  );
  
  // Verificar tipo MIME
  const validMimeTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel.sheet.macroEnabled.12',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.template'
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
    
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', year);
    formData.append('month', month);
    formData.append('idSpeciality', idSpeciality);
    
    // Hacer la llamada a la API
    const response = await fetch('/api/import-dutys', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (response.ok) {
      setImportMsg("Archivo importado correctamente");
      // Limpiar el archivo seleccionado
      setExcelFile(null);
      // Opcional: recargar la lista de duties
      // loadDutys();
    } else {
      setImportMsg(result.message || "Error al importar el archivo");
    }
  } catch (error) {
    console.error('Error importing Excel:', error);
    setImportMsg("Error al importar el archivo: " + error.message);
  }
}



  // ===== FullCalendar control (mes arriba + prev/next) =====
  const calendarRef = useRef(null);
  const [monthLabel, setMonthLabel] = useState("");

  function syncTitle() {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    setMonthLabel(api.view.title);
  }

  useEffect(() => {
    syncTitle();
  }, []);

  function goPrev() {
    const api = calendarRef.current?.getApi();
    api?.prev();
    syncTitle();
  }

  function goNext() {
    const api = calendarRef.current?.getApi();
    api?.next();
    syncTitle();
  }

  // ===== Eventos base (mock) =====
  const baseEvents = useMemo(
    () => [
      // CA (Continuidad)
      { id: "1", title: "Anestesia CA 15:00 - Antonio Ramon", start: "2024-04-01T15:00:00", extendedProps: { type: "CA" } },
      { id: "2", title: "Cirugía CA 15:00 - Raul Henares", start: "2024-04-04T15:00:00", extendedProps: { type: "CA" }, },
      { id: "3", title: "Cirugía CA 19:00 - Kike Paez", start: "2024-04-04T19:00:00", extendedProps: { type: "CA" } },
      { id: "4", title: "Cirugía CA 12:00 - Samuel Peña", start: "2024-04-08T12:00:00", extendedProps: { type: "CA" } },

      // PF (Presencia Física)
      { id: "5", title: "Anestesia PF 24h - Javier Juarez", start: "2024-04-02", allDay: true, extendedProps: { type: "PF" } },
      { id: "6", title: "Anestesia PF 10h - Jose Ramon", start: "2024-04-05", allDay: true, extendedProps: { type: "PF" } },
      { id: "7", title: "Anestesia PF 24h - Javier Ruiz", start: "2024-04-10", allDay: true, extendedProps: { type: "PF" } },

      // LOC (Localizada)
      { id: "8", title: "Anestesia LOC 8:00 - Antonio Moyano", start: "2024-04-03T08:00:00", extendedProps: { type: "LOC", jefe: true } },
    ],
    []
  );

  // ===== Estado editable de eventos (aquí añadimos nuevas guardias) =====
  const [events, setEvents] = useState(baseEvents);

  // ===== FILTROS =====
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState("ALL"); // ALL | CA | PF | LOC

  const filteredEvents = useMemo(() => {
    if (filterType === "ALL") return events;
    return events.filter((e) => e.extendedProps?.type === filterType);
  }, [events, filterType]);

  // ===== MODAL NUEVA GUARDIA =====
  const [newOpen, setNewOpen] = useState(false);
  const [newType, setNewType] = useState("CA");          // CA | PF | LOC
  const [newDate, setNewDate] = useState("2024-04-01");  // YYYY-MM-DD
  const [newTime, setNewTime] = useState("15:00");       // HH:mm
  const [newName, setNewName] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("Anestesia");

  function openNewGuardiaModal(prefilledDate) {
    // Si haces click en día, lo prellenamos
    if (prefilledDate) setNewDate(prefilledDate);
    setNewName(""); // reset
    setNewOpen(true);
  }

  const { addNotification } = useNotifications();

  function addGuardia() {
    const start = `${newDate}T${newTime}:00`;
  
    const baseTitle = `${newType} ${newTime}`;
    const nameClean = newName.trim();
    const title = nameClean ? `${baseTitle} - ${nameClean}` : baseTitle;
  
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
  
    // NOTIFICACIÓN
    addNotification(`Se ha agregado una nueva guardia (${title}).`);
  
    setNewOpen(false);
  }

  // Estado modal
  const [importOpen, setImportOpen] = useState(false);

  // Especialidades (para el select)

  const [specialitiesLoading, setSpecialitiesLoading] = useState(false);
  const [specialitiesError, setSpecialitiesError] = useState("");

  // Campos requeridos por el backend
  const [idSpeciality, setIdSpeciality] = useState("");
  const [importMonth, setImportMonth] = useState("01");
  const [importYear, setImportYear] = useState("2026");

  // Archivo Excel
  const [excelFile, setExcelFile] = useState(null);
  const fileInputRef = useRef(null);

  // UX
  const [isDragging, setIsDragging] = useState(false);
  const [importUploading, setImportUploading] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const months = useMemo(() => ([
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
  ]), []);

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
    // Prefill mes/año del calendario
    const { year, month } = getMonthYearFromCalendar();
    setImportYear(years.includes(year) ? year : years[years.length - 1]);
    setImportMonth(month);

    // Reset UI modal
    setImportMsg("");
    setExcelFile(null);
    setIdSpeciality("");
    setImportOpen(true);

    // Cargar especialidades desde SERVICE
    setSpecialitiesLoading(true);
    setSpecialitiesError("");
    
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

      setImportMsg("Excel importado correctamente");
      // Si quieres cerrar automático:
      // setImportOpen(false);
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
                  onClick={() => { setFilterType("ALL"); setFilterOpen(false); }}
                >
                  Todos
                </button>
                <button
                  type="button"
                  className={`hdFilterItem ${filterType === "CA" ? "active" : ""}`}
                  onClick={() => { setFilterType("CA"); setFilterOpen(false); }}
                >
                  Continuidad (CA)
                </button>
                <button
                  type="button"
                  className={`hdFilterItem ${filterType === "PF" ? "active" : ""}`}
                  onClick={() => { setFilterType("PF"); setFilterOpen(false); }}
                >
                  Presencia Física (PF)
                </button>
                <button
                  type="button"
                  className={`hdFilterItem ${filterType === "LOC" ? "active" : ""}`}
                  onClick={() => { setFilterType("LOC"); setFilterOpen(false); }}
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
              datesSet={syncTitle}
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
              dateClick={(info) => {
                openNewGuardiaModal(info.dateStr);
              }}
              eventClick={(info) => {
                console.log("eventClick:", info.event.title, info.event.start);
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
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="hdControl"
                />
              </label>

              {/* NUEVO: Nombre */}
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
              {/* NUEVO: Tipo */}

              <label className="hdField">
                <span>Tipo</span>
                <select value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} className="hdControl">
                  <option value="Anestesia">Anestesia</option>
                  <option value="Cirugía">Cirugía</option>
                  <option value="Algo mas">Radiologia</option>
                  <option value="Medicina Intensiva">Medicina Intensiva</option>
                  <option value="Medicina Interna">Medicina Interna</option>
                  <option value="Cirugia General">Cirugia General</option>
                  <option value="Pediatria">Pediatria</option>
                </select>
              </label>

              {/* Siempre mostramos Hora (ya no existe Todo el día) */}
              <label className="hdField">
                <span>Hora</span>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="hdControl"
                />
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
      {/* SECCIÓN IMPORTAR EXCEL */}
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
                  {/* <select //tocar 
                    className="hdControl"
                    value={idSpeciality}
                    onChange={(e) => setIdSpeciality(e.target.value)}
                  >
                    <option value="">-- Selecciona una especialidad --</option>
                    {specialities.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (id: {s.id})
                      </option>
                    ))}
                  </select> */}
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