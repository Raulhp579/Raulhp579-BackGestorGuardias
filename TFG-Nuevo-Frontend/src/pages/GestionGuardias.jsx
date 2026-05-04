import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GestionGuardias.css";
import {
    getDuties,
    updateDuty,
    deleteDuty,
    createDuty,
} from "../services/DutyService";
import { assignChiefs, getWorkers, isUserAdmin } from "../services/userService";
import { getSpecialities } from "../services/SpecialitiesService";
import { importExcel } from "../services/importExcelService";

import RowActions from "../components/RowActions/RowActions";
import Select2 from "../components/Select2/Select2";
import Joyride, { STATUS } from "react-joyride-react-19";

function showToast(message, type = "success", ms = 3500) {
    const prev = document.getElementById("__guToast__");
    if (prev) prev.remove();
    const el = document.createElement("div");
    el.id = "__guToast__";
    const icon = document.createElement("span");
    icon.className = "material-icons";
    icon.textContent = type === "success" ? "check_circle" : "error";
    icon.style.cssText = "font-size:20px;flex-shrink:0;line-height:1";
    const text = document.createElement("span");
    text.textContent = message;
    el.appendChild(icon);
    el.appendChild(text);
    Object.assign(el.style, {
        position: "fixed", bottom: "32px", right: "28px", zIndex: "99999",
        display: "flex", alignItems: "center", gap: "10px",
        padding: "14px 20px", borderRadius: "14px", color: "#fff",
        fontSize: "14px", fontWeight: "600", fontFamily: "Inter,system-ui,sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
        background: type === "success"
            ? "linear-gradient(135deg,#10B981,#059669)"
            : "linear-gradient(135deg,#EF4444,#DC2626)",
        minWidth: "220px", maxWidth: "360px",
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
}

export default function GestionGuardias() {
    const navigate = useNavigate();
    const SKELETON_ROWS = 8;

    // micro-animaciones filas (EDIT + DELETE)
    const [updatedRowId, setUpdatedRowId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // tabla
    const [guardias, setGuardias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [searchChief, setSearchChief] = useState(""); // Filtro por nombre de usuario
    const [searchDate, setSearchDate] = useState(""); // Filtro por fecha
    const [sortBy, setSortBy] = useState("date"); // Ordenar por: date o type
    const [sortOrder, setSortOrder] = useState("desc"); // asc o desc
    const [sortDropOpen, setSortDropOpen] = useState(false);

    // admin + datos auxiliares
    const [isAdmin, setIsAdmin] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [specialities, setSpecialities] = useState([]);

    // paginación
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // ✅ estados que usas en el modal de importación
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

    // modal asignar jefes
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assignMonth, setAssignMonth] = useState(() =>
        String(new Date().getMonth() + 1).padStart(2, "0"),
    );
    const [assignYear, setAssignYear] = useState(() =>
        String(new Date().getFullYear()),
    );
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignMsg, setAssignMsg] = useState("");

    // modal editar
    const [editOpen, setEditOpen] = useState(false);
    const [editRowId, setEditRowId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editForm, setEditForm] = useState({
        date: "",
        duty_type: "CA",
        id_speciality: "",
        id_worker: "",
        id_chief_worker: "",
    });

    // modal generar pdf
    const [pdfOpen, setPdfOpen] = useState(false);
    const [pdfDay, setPdfDay] = useState(() =>
        String(new Date().getDate()).padStart(2, "0"),
    );
    const [pdfMonth, setPdfMonth] = useState(() =>
        String(new Date().getMonth() + 1).padStart(2, "0"),
    );
    const [pdfYear, setPdfYear] = useState(() =>
        String(new Date().getFullYear()),
    );
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    // modal borrar
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

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

    // Joyride Steps
    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
        {
            target: ".tour-import-excel",
            content:
                "Paso 2: Importa guardias desde Excel. Recuerda seleccionar mes y especialidad.",
            disableBeacon: true,
        },
        {
            target: ".tour-assign-chief",
            content:
                "Paso 3: Asigna automáticamente los jefes de guardia para el mes.",
        },
        {
            target: ".tour-create-guard",
            content: "Crea una nueva guardia manualmente si fuera necesario.",
        },
        {
            target: ".tour-generate-pdf",
            content: "Genera y descarga un PDF con la plantilla del día.",
        },
        {
            target: ".tour-search-name",
            content: "Busca guardias por el nombre del trabajador.",
        },
        {
            target: ".tour-search-date",
            content: "Filtra las guardias por una fecha específica.",
        },
    ];

    useEffect(() => {
        const phase = localStorage.getItem("tutorial_phase");
        if (phase === "PHASE_GUARDS") {
            setRunTour(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            // Pasamos a la fase 3: Fichajes
            localStorage.setItem("tutorial_phase", "PHASE_FICHAJES");
            setRunTour(false);
            navigate("/fichajes");
        }
    };

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

            await reloadDuties();

            showToast(`Se han importado guardias desde Excel (${new Date().toLocaleTimeString()}).`);
        } catch (error) {
            setImportMsg(error?.message || "Error al importar el archivo");
        }
    }

    async function openImportModal() {
        setImportMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
        setImportYear(String(new Date().getFullYear()));

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

    const years = useMemo(() => {
        const now = new Date().getFullYear();
        const arr = [];
        for (let y = now - 3; y <= now + 3; y++) arr.push(String(y));
        return arr;
    }, []);

    const monthOptions = useMemo(() =>
        months.map(m => ({ value: m.value, label: `${m.label} (${m.value})` }))
    , [months]);

    const yearOptions = useMemo(() =>
        years.map(y => ({ value: y, label: y }))
    , [years]);

    const specialityOptions = useMemo(() =>
        specialities.map(s => ({ value: String(s.id), label: s.name }))
    , [specialities]);

    const workerOptions = useMemo(() =>
        workers.map(w => ({ value: String(w.id), label: w.name ?? w.email ?? `ID ${w.id}` }))
    , [workers]);

    const dutyTypeOptions = [
        { value: "CA", label: "CA" },
        { value: "PF", label: "PF" },
        { value: "LOC", label: "LOC" },
    ];

    const pdfDayOptions = useMemo(() =>
        Array.from({ length: getDaysInMonth(pdfMonth, pdfYear) }, (_, i) => {
            const d = String(i + 1).padStart(2, "0");
            return { value: d, label: d };
        })
    , [pdfMonth, pdfYear]);

    const pdfMonthOptions = useMemo(() =>
        [1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
            const v = String(m).padStart(2, "0");
            return { value: v, label: v };
        })
    , []);

    const pdfYearOptions = useMemo(() =>
        Array.from({ length: 10 }, (_, i) => {
            const y = String(new Date().getFullYear() - 5 + i);
            return { value: y, label: y };
        })
    , []);

    function pillClass(type) {
        const t = String(type || "").toUpperCase();
        if (t === "CA") return "ca";
        if (t === "PF") return "pf";
        if (t === "LOC") return "loc";
        return "other";
    }

    async function reloadDuties() {
        setLoading(true);
        setLoadError("");

        try {
            const data = await getDuties();
            const arr = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                  ? data.data
                  : [];
            setGuardias(arr);
            setPage(1);
        } catch (e) {
            console.error(e);
            setGuardias([]);
            setLoadError("No se pudieron cargar las guardias.");
        } finally {
            setLoading(false);
        }
    }

    // carga inicial
    useEffect(() => {
        reloadDuties();
    }, []);

    // cargar admin + combos (workers/specialities)
    useEffect(() => {
        (async () => {
            try {
                const admin = await isUserAdmin();
                setIsAdmin(Boolean(admin));
            } catch {
                setIsAdmin(false);
            }
            try {
                const w = await getWorkers();
                const arr = Array.isArray(w)
                    ? w
                    : Array.isArray(w?.data)
                      ? w.data
                      : [];
                setWorkers(arr);
            } catch {
                setWorkers([]);
            }
            try {
                const s = await getSpecialities();
                const arr = Array.isArray(s)
                    ? s
                    : Array.isArray(s?.data)
                      ? s.data
                      : [];
                setSpecialities(arr);
            } catch {
                setSpecialities([]);
            }
        })();
    }, []);

    // paginación calculada
    const filteredGuardias = useMemo(() => {
        let result = guardias;

        if (searchChief.trim()) {
            result = result.filter((g) =>
                (g.worker ?? "")
                    .toLowerCase()
                    .includes(searchChief.toLowerCase()),
            );
        }

        if (searchDate.trim()) {
            result = result.filter((g) => (g.date ?? "").includes(searchDate));
        }

        // Ordenamiento
        const sorted = [...result];
        if (sortBy === "date") {
            sorted.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
            });
        } else if (sortBy === "type") {
            sorted.sort((a, b) => {
                const typeA = (a.duty_type ?? "").toUpperCase();
                const typeB = (b.duty_type ?? "").toUpperCase();
                const cmp = typeA.localeCompare(typeB);
                return sortOrder === "asc" ? cmp : -cmp;
            });
        }

        return sorted;
    }, [guardias, searchChief, searchDate, sortBy, sortOrder]);

    const totalPages = useMemo(() => {
        const t = Math.ceil((filteredGuardias?.length || 0) / pageSize);
        return Math.max(1, t);
    }, [filteredGuardias.length]);

    const pagedGuardias = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredGuardias.slice(start, start + pageSize);
    }, [filteredGuardias, page]);

    function goPrev() {
        setPage((p) => Math.max(1, p - 1));
    }
    function goNext() {
        setPage((p) => Math.min(totalPages, p + 1));
    }

    const pageButtons = useMemo(() => {
        const maxButtons = 7;
        if (totalPages <= maxButtons)
            return Array.from({ length: totalPages }, (_, i) => i + 1);

        const nums = [];
        const start = Math.max(2, page - 2);
        const end = Math.min(totalPages - 1, page + 2);

        nums.push(1);
        if (start > 2) nums.push("...");
        for (let n = start; n <= end; n++) nums.push(n);
        if (end < totalPages - 1) nums.push("...");
        nums.push(totalPages);
        return nums;
    }, [page, totalPages]);

    // -------- Modal ASIGNAR JEFE ----------
    function openAssignModal() {
        setAssignMsg("");

        if (guardias?.length) {
            const d = new Date(guardias[0].date);
            if (!Number.isNaN(d.getTime())) {
                setAssignYear(String(d.getFullYear()));
                setAssignMonth(String(d.getMonth() + 1).padStart(2, "0"));
            }
        } else {
            const now = new Date();
            setAssignYear(String(now.getFullYear()));
            setAssignMonth(String(now.getMonth() + 1).padStart(2, "0"));
        }

        setIsAssignOpen(true);
    }

    async function handleAssignChiefs() {
        setAssignLoading(true);
        setAssignMsg("");
        setLoadError("");

        try {
            const monthNum = Number(assignMonth);
            const yearNum = Number(assignYear);

            if (!monthNum || monthNum < 1 || monthNum > 12) {
                setAssignMsg("Mes inválido.");
                return;
            }
            if (!yearNum || yearNum < 2000 || yearNum > 2100) {
                setAssignMsg("Año inválido.");
                return;
            }

            await assignChiefs(monthNum, yearNum);
            await reloadDuties();

            setAssignMsg("Jefes asignados correctamente.");
            setIsAssignOpen(false);
        } catch (e) {
            console.error(e);
            setAssignMsg(e?.message || "Error asignando jefes.");
        } finally {
            setAssignLoading(false);
        }
    }

    // -------- Modal EDITAR ----------
    function handleEdit(row) {
        setEditError("");
        setIsCreating(false);
        setEditRowId(row.id);
        setEditForm({
            date: row.date || "",
            duty_type: row.duty_type || "CA",
            id_speciality: row.id_speciality ? String(row.id_speciality) : "",
            id_worker: row.id_worker ? String(row.id_worker) : "",
            id_chief_worker:
                row.id_chief_worker === null ||
                row.id_chief_worker === undefined
                    ? ""
                    : String(row.id_chief_worker),
        });
        setEditOpen(true);
    }

    function handleCreateGuardia() {
        setEditError("");
        setIsCreating(true);
        setEditRowId(null);
        setEditForm({
            date: "",
            duty_type: "CA",
            id_speciality: "",
            id_worker: "",
            id_chief_worker: "",
        });
        setEditOpen(true);
    }

    async function handleGeneratePdf() {
        setPdfOpen(true);
        setPdfError("");
    }

    // Calcular días del mes
    function getDaysInMonth(month, year) {
        const m = parseInt(month);
        const y = parseInt(year);

        if (m === 2) {
            // Febrero: 28 o 29 (año bisiesto)
            return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28;
        }
        // Meses con 31 días: 1, 3, 5, 7, 8, 10, 12
        if ([1, 3, 5, 7, 8, 10, 12].includes(m)) {
            return 31;
        }
        // Meses con 30 días: 4, 6, 9, 11
        return 30;
    }

    async function confirmGeneratePdf() {
        setPdfLoading(true);
        setPdfError("");
        try {
            const token = localStorage.getItem("token");
            const url = new URL(
                "/api/plantilla-dia-pdf",
                window.location.origin,
            );
            url.searchParams.append("day", pdfDay);
            url.searchParams.append("month", pdfMonth);
            url.searchParams.append("year", pdfYear);

            const response = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                let errorMsg = `Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {}
                throw new Error(errorMsg);
            }

            const blob = await response.blob();
            if (blob.type === "application/json") {
                const text = await blob.text();
                throw new Error(
                    JSON.parse(text).error || "Error al generar PDF",
                );
            }

            const urlBlob = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = urlBlob;
            a.download = `guardias-${pdfYear}-${pdfMonth}-${pdfDay}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(urlBlob);
            document.body.removeChild(a);

            setPdfOpen(false);
        } catch (err) {
            console.error("Error al generar PDF:", err);
            setPdfError(err.message || "Error al generar el PDF");
        } finally {
            setPdfLoading(false);
        }
    }

    function cancelPdf() {
        setPdfOpen(false);
        setPdfLoading(false);
        setPdfError("");
    }

    async function handleSaveEdit(e) {
        e?.preventDefault?.();
        setEditError("");

        if (!editForm.date) return setEditError("La fecha es obligatoria.");
        if (!editForm.duty_type) return setEditError("El tipo es obligatorio.");

        const payload = {
            date: editForm.date,
            duty_type: editForm.duty_type,
            id_speciality: editForm.id_speciality
                ? Number(editForm.id_speciality)
                : null,
            id_worker: editForm.id_worker ? Number(editForm.id_worker) : null,
            id_chief_worker:
                editForm.id_chief_worker === ""
                    ? null
                    : Number(editForm.id_chief_worker),
        };

        setEditSaving(true);
        try {
            if (isCreating) {
                const response = await createDuty(payload);
                setGuardias((prev) => [response.data || response, ...prev]);
                showToast("Guardia creada correctamente.");
            } else {
                if (!editRowId) return;
                const response = await updateDuty(editRowId, payload);
                const updatedDuty = response.data || response;
                setGuardias((prev) =>
                    prev.map((g) => (g.id === editRowId ? updatedDuty : g)),
                );
                setUpdatedRowId(editRowId);
                setTimeout(() => setUpdatedRowId(null), 1200);
                showToast("Guardia actualizada correctamente.");
            }

            setEditOpen(false);
            setEditRowId(null);
            setIsCreating(false);
        } catch (err) {
            console.error(err);
            setEditError(err?.message || "No se pudo guardar la guardia.");
        } finally {
            setEditSaving(false);
        }
    }

    // -------- Modal BORRAR ----------
    function handleDelete(row) {
        setDeleteError("");
        setDeleteRow(row);
        setDeleteOpen(true);
    }

    async function confirmDelete() {
        if (!deleteRow) return;

        const id = deleteRow.id;
        setDeleteLoading(true);
        setDeleteError("");

        // animación salida
        setDeletingId(id);

        try {
            await deleteDuty(id);

            setTimeout(() => {
                setGuardias((prev) => prev.filter((g) => g.id !== id));
                setDeletingId(null);
            }, 180);

            setDeleteOpen(false);
            setDeleteRow(null);
            showToast("Guardia eliminada correctamente.");
        } catch (err) {
            console.error(err);
            setDeletingId(null);
            setDeleteError(err?.message || "No se pudo eliminar la guardia.");
            showToast("Error al eliminar la guardia.", "error");
        } finally {
            setDeleteLoading(false);
        }
    }

    function cancelDelete() {
        setDeleteOpen(false);
        setDeleteRow(null);
        setDeleteError("");
    }

    return (
        <div className="ggPage">
            <main className="ggMain">
                <div className="ggTableCard">
                    <div className="ggTableCardTop">
                        <div className="ggTableTitleGroup">
                            <h2 className="ggTableCardTitle">
                                Gestión de Guardias
                            </h2>
                            <div className="ggTableCount">
                                {loading
                                    ? "Cargando..."
                                    : `${filteredGuardias.length}`}{" "}
                                registros
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="ggButtonsContainer">
                                <button
                                    className="ggCtaBtn outline tour-assign-chief"
                                    type="button"
                                    onClick={openAssignModal}
                                    disabled={loading}
                                >
                                    <span className="material-icons">
                                        supervised_user_circle
                                    </span>
                                    <span>Asignar jefe</span>
                                </button>
                                <button
                                    className="ggCtaBtn outline pdfBtn tour-generate-pdf"
                                    type="button"
                                    onClick={handleGeneratePdf}
                                    disabled={loading}
                                >
                                    <span className="material-icons">
                                        file_download
                                    </span>
                                    <span>PDF</span>
                                </button>
                                <button
                                    className="ggCtaBtn outline tour-import-excel"
                                    type="button"
                                    onClick={openImportModal}
                                    disabled={loading}
                                >
                                    <span className="material-icons">
                                        table_view
                                    </span>
                                    <span>Excel</span>
                                </button>
                                <button
                                    className="ggCtaBtn primary tour-create-guard"
                                    type="button"
                                    onClick={handleCreateGuardia}
                                    disabled={loading}
                                >
                                    <span className="material-icons">
                                        add_circle_outline
                                    </span>
                                    <span>Crear guardia</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {loadError && (
                        <div className="ggTableError">{loadError}</div>
                    )}

                    <div className="ggFilterContainer">
                        <div className="ggFilterToolbar">
                            <div className="ggFilterGroup ggFilterSearch">
                                <span className="material-icons ggFilterIcon">search</span>
                                <input
                                    type="text"
                                    className="ggSearchInput tour-search-name"
                                    placeholder="Buscar por nombre de trabajador..."
                                    value={searchChief}
                                    onChange={(e) => {
                                        setSearchChief(e.target.value);
                                        setPage(1);
                                    }}
                                />
                                {searchChief && (
                                    <button
                                        className="ggSearchClear"
                                        onClick={() => {
                                            setSearchChief("");
                                            setPage(1);
                                        }}
                                        title="Limpiar búsqueda"
                                    >
                                        <span className="material-icons">close</span>
                                    </button>
                                )}
                            </div>

                            <div className="ggFilterSep" />

                            <div className="ggFilterGroup ggFilterDate">
                                <span className="material-icons ggFilterIcon">event</span>
                                <input
                                    type="date"
                                    className="ggSearchInput tour-search-date"
                                    value={searchDate}
                                    onChange={(e) => {
                                        setSearchDate(e.target.value);
                                        setPage(1);
                                    }}
                                />
                                {searchDate && (
                                    <button
                                        className="ggSearchClear"
                                        onClick={() => {
                                            setSearchDate("");
                                            setPage(1);
                                        }}
                                        title="Limpiar fecha"
                                    >
                                        <span className="material-icons">close</span>
                                    </button>
                                )}
                            </div>

                            <div className="ggFilterSep" />

                            <div className="ggFilterGroup ggFilterSort">
                                <span className="material-icons ggFilterIcon">sort</span>
                                <div className="ggDropdownWrap">
                                    <button
                                        className="ggDropdownTrigger"
                                        type="button"
                                        onClick={() => setSortDropOpen(v => !v)}
                                    >
                                        <span>{sortBy === "date" ? "Fecha" : "Tipo"}</span>
                                        <span className="material-icons ggDropdownChevron">
                                            {sortDropOpen ? "expand_less" : "expand_more"}
                                        </span>
                                    </button>
                                    {sortDropOpen && (
                                        <>
                                            <div
                                                className="ggDropdownOverlay"
                                                onClick={() => setSortDropOpen(false)}
                                            />
                                            <div className="ggDropdownMenu">
                                                <button
                                                    className={`ggDropdownItem ${sortBy === "date" ? "active" : ""}`}
                                                    type="button"
                                                    onClick={() => { setSortBy("date"); setSortDropOpen(false); }}
                                                >
                                                    Fecha
                                                </button>
                                                <button
                                                    className={`ggDropdownItem ${sortBy === "type" ? "active" : ""}`}
                                                    type="button"
                                                    onClick={() => { setSortBy("type"); setSortDropOpen(false); }}
                                                >
                                                    Tipo
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    className="ggSortDirBtn"
                                    onClick={() =>
                                        setSortOrder(
                                            sortOrder === "asc" ? "desc" : "asc",
                                        )
                                    }
                                    title={`Ordenado ${sortOrder === "asc" ? "ascendente" : "descendente"}`}
                                >
                                    <span className="material-icons" style={{ fontSize: 18 }}>
                                        {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="ggTableWrap">
                        <table className="ggTable">
                            <thead>
                                <tr>
                                    <th className="ggColDate">FECHA</th>
                                    <th className="ggColType">TIPO</th>
                                    <th className="ggColSpec">ESPECIALIDAD</th>
                                    <th className="ggColWorker">TRABAJADOR</th>
                                    <th className="ggColChief">JEFE</th>
                                    {isAdmin && (
                                        <th className="ggColActions">
                                            ACCIONES
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    Array.from({ length: SKELETON_ROWS }).map(
                                        (_, i) => (
                                            <tr
                                                key={`sk-${i}`}
                                                className="ggSkRow"
                                            >
                                                <td className="ggColDate">
                                                    <div className="ggSk skMd" />
                                                </td>
                                                <td className="ggColType">
                                                    <div className="ggSk skXs" />
                                                </td>
                                                <td className="ggColSpec">
                                                    <div className="ggSk skLg" />
                                                </td>
                                                <td className="ggColWorker">
                                                    <div className="ggSk skLg" />
                                                </td>
                                                <td className="ggColChief">
                                                    <div className="ggSk skSm" />
                                                </td>
                                                {isAdmin && (
                                                    <td className="ggColActions">
                                                        <div className="ggSk skBtn" />
                                                    </td>
                                                )}
                                            </tr>
                                        ),
                                    )
                                ) : pagedGuardias.length === 0 ? (
                                    <tr>
                                        <td
                                            className="ggEmpty"
                                            colSpan={isAdmin ? 6 : 5}
                                        >
                                            No hay guardias registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    pagedGuardias.map((g) => (
                                        <tr
                                            key={g.id}
                                            className={[
                                                "ggRowEnter",
                                                g.id === updatedRowId
                                                    ? "ggRowUpdated"
                                                    : "",
                                                g.id === deletingId
                                                    ? "ggRowExit"
                                                    : "",
                                            ].join(" ")}
                                        >
                                            <td className="ggColDate">
                                                {g.date
                                                    ? new Date(
                                                          g.date,
                                                      ).toLocaleDateString(
                                                          "es-ES",
                                                      )
                                                    : "-"}
                                            </td>

                                            <td className="ggColType">
                                                <span
                                                    className={`ggPill ${pillClass(g.duty_type)}`}
                                                >
                                                    {g.duty_type}
                                                </span>
                                            </td>

                                            <td className="ggColSpec">
                                                {g.speciality}
                                            </td>
                                            <td className="ggColWorker">
                                                {g.worker}
                                            </td>
                                            <td className="ggColChief">
                                                {g.chief_worker ?? "—"}
                                            </td>

                                            {isAdmin && (
                                                <td className="ggColActions">
                                                    <RowActions
                                                        row={g}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                        disabled={
                                                            deletingId === g.id
                                                        }
                                                    />
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ggPager">
                        <div className="ggPagerInfo">
                            Mostrando{" "}
                            <strong>{Math.min((page - 1) * pageSize + 1, filteredGuardias.length)}</strong>
                            {" "}a{" "}
                            <strong>{Math.min(page * pageSize, filteredGuardias.length)}</strong>
                            {" "}de{" "}
                            <strong>{filteredGuardias.length}</strong> registros
                        </div>

                        <div className="ggPagerControls">
                            <button
                                className="ggPagerArrow"
                                type="button"
                                onClick={goPrev}
                                disabled={page === 1 || loading}
                                aria-label="Anterior"
                            >
                                <span className="material-icons-outlined">chevron_left</span>
                            </button>

                            {pageButtons.map((p, idx) =>
                                p === "..." ? (
                                    <span className="ggPagerEllipsis" key={`e-${idx}`}>…</span>
                                ) : (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`ggPagerNum ${p === page ? "active" : ""}`}
                                        onClick={() => setPage(p)}
                                        disabled={loading}
                                    >
                                        {p}
                                    </button>
                                ),
                            )}

                            <button
                                className="ggPagerArrow"
                                type="button"
                                onClick={goNext}
                                disabled={page === totalPages || loading}
                                aria-label="Siguiente"
                            >
                                <span className="material-icons-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL ASIGNAR JEFE */}
            {isAssignOpen && (
                <div className="modalOverlay centered" role="dialog" aria-modal="true" aria-label="Asignar Jefe de Guardia">
                    <div className="modalSheet">
                        <div className="modalBody">
                            <div className="modalHeader">
                                <div className="modalIcon">
                                    <span className="material-icons">admin_panel_settings</span>
                                </div>
                                <div>
                                    <div className="modalTitle">Asignar jefe automáticamente</div>
                                    <div className="modalSubtitle">Selecciona mes y año para el reparto.</div>
                                </div>
                            </div>
                            <div className="formGrid">
                                <label className="label">
                                    Mes
                                    <Select2 options={monthOptions} value={assignMonth} onChange={setAssignMonth} disabled={assignLoading} />
                                </label>
                                <label className="label">
                                    Año
                                    <Select2 options={yearOptions} value={assignYear} onChange={setAssignYear} disabled={assignLoading} />
                                </label>
                                {assignMsg && (
                                    <div className="label" style={{ gridColumn: "1 / -1" }}>
                                        <div className="control" style={{ background: "#F9FAFB" }}>{assignMsg}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modalFooter">
                            <button className="btnSecondary" onClick={() => setIsAssignOpen(false)} type="button" disabled={assignLoading}>Cancelar</button>
                            <button className="btnPrimary" onClick={handleAssignChiefs} type="button" disabled={assignLoading}>
                                {assignLoading ? "Asignando..." : "Asignar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL IMPORTAR EXCEL */}
            {importOpen && (
                <div className="modalOverlay centered" role="dialog" aria-modal="true">
                    <div className="modalSheet">
                        <div className="modalBody">
                            <div className="modalHeader">
                                <div className="modalIcon">
                                    <span className="material-icons">table_view</span>
                                </div>
                                <div>
                                    <div className="modalTitle">Importar guardias desde Excel</div>
                                    <div className="modalSubtitle">Selecciona el mes, año y especialidad correctos.</div>
                                </div>
                            </div>
                            <div className="formGrid">
                                <label className="label" style={{ gridColumn: "1 / -1" }}>
                                    <span>Especialidad</span>
                                    {specialitiesLoading ? (
                                        <div className="control">Cargando especialidades...</div>
                                    ) : specialitiesError ? (
                                        <div className="control">{specialitiesError}</div>
                                    ) : (
                                        <Select2 placeholder="-- Selecciona una especialidad --" options={specialityOptions} value={idSpeciality} onChange={setIdSpeciality} />
                                    )}
                                </label>
                                <label className="label">
                                    <span>Mes</span>
                                    <Select2 options={monthOptions} value={importMonth} onChange={setImportMonth} />
                                </label>
                                <label className="label">
                                    <span>Año</span>
                                    <Select2 options={yearOptions} value={importYear} onChange={setImportYear} />
                                </label>
                                <input ref={fileInputRef} type="file" accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} onChange={onPickExcelFile} />
                                <div
                                    className={`dropZone ${isDragging ? "dragging" : ""}`}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Arrastra Excel o haz clic para seleccionarlo"
                                >
                                    <div className="dropZoneTitle">Arrastra aquí tu Excel (.xls / .xlsx)</div>
                                    <div className="dropZoneSub">o haz clic para seleccionarlo</div>
                                    {excelFile && <div className="dropZoneFile">Archivo: {excelFile.name}</div>}
                                </div>
                                {importMsg && <div className="importMsg">{importMsg}</div>}
                            </div>
                        </div>
                        <div className="modalFooter">
                            <button className="btnSecondary" type="button" onClick={closeImportModal}>Cancelar</button>
                            <button className="btnPrimary" type="button" disabled={importUploading} onClick={submitImport}>
                                {importUploading ? "Subiendo..." : "Importar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR/CREAR */}
            {editOpen && (
                <div
                    className="modalOverlay centered"
                    role="dialog"
                    aria-modal="true"
                    aria-label={isCreating ? "Crear Guardia" : "Editar Guardia"}
                >
                    <div className="modalSheet">
                        <form onSubmit={handleSaveEdit}>
                            <div className="modalBody">
                                <div className="modalHeader">
                                    <div className="modalIcon">
                                        <span className="material-icons">
                                            {isCreating
                                                ? "add_circle_outline"
                                                : "edit"}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="modalTitle">
                                            {isCreating
                                                ? "Crear Guardia"
                                                : "Editar Guardia"}
                                        </div>
                                        <div className="modalSubtitle">
                                            {isCreating
                                                ? "Crea una nueva guardia completando los campos."
                                                : "Actualiza los campos de la guardia seleccionada."}
                                        </div>
                                    </div>
                                </div>

                                {editError && (
                                    <div className="modalAlert">{editError}</div>
                                )}

                                <div className="formGrid">
                                    <label className="label">
                                        Fecha
                                        <input
                                            className="control"
                                            type="date"
                                            value={editForm.date}
                                            onChange={(e) =>
                                                setEditForm((p) => ({
                                                    ...p,
                                                    date: e.target.value,
                                                }))
                                            }
                                            disabled={editSaving}
                                        />
                                    </label>

                                    <label className="label">
                                        Tipo
                                        <Select2
                                            options={dutyTypeOptions}
                                            value={editForm.duty_type}
                                            onChange={(val) => setEditForm((p) => ({ ...p, duty_type: val }))}
                                            disabled={editSaving}
                                        />
                                    </label>

                                    <label className="label">
                                        Especialidad
                                        <Select2
                                            placeholder="—"
                                            options={specialityOptions}
                                            value={editForm.id_speciality}
                                            onChange={(val) => setEditForm((p) => ({ ...p, id_speciality: val }))}
                                            disabled={editSaving}
                                        />
                                    </label>

                                    <label className="label">
                                        Trabajador
                                        <Select2
                                            placeholder="—"
                                            options={workerOptions}
                                            value={editForm.id_worker}
                                            onChange={(val) => setEditForm((p) => ({ ...p, id_worker: val }))}
                                            disabled={editSaving}
                                        />
                                    </label>

                                    <label
                                        className="label"
                                        style={{ gridColumn: "1 / -1" }}
                                    >
                                        Jefe (opcional)
                                        <Select2
                                            placeholder="—"
                                            options={workerOptions}
                                            value={editForm.id_chief_worker}
                                            onChange={(val) => setEditForm((p) => ({ ...p, id_chief_worker: val }))}
                                            disabled={editSaving}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="modalFooter">
                                <button className="btnSecondary" type="button" onClick={() => { setEditOpen(false); setEditRowId(null); setIsCreating(false); setEditError(""); }} disabled={editSaving}>Cancelar</button>
                                <button className="btnPrimary" type="submit" disabled={editSaving}>
                                    {editSaving ? (isCreating ? "Creando..." : "Guardando...") : (isCreating ? "Crear" : "Guardar")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BORRAR */}
            {deleteOpen && deleteRow && (
                <div className="modalOverlay centered" role="dialog" aria-modal="true" aria-label="Confirmar borrado">
                    <div className="modalSheet">
                        <div className="modalBody">
                            <div className="modalHeader">
                                <div className="modalIcon danger">
                                    <span className="material-icons">delete_forever</span>
                                </div>
                                <div>
                                    <div className="modalTitle">Eliminar guardia</div>
                                    <div className="modalSubtitle">Esta acción no se puede deshacer.</div>
                                </div>
                            </div>
                            <div className="formGrid">
                                <div className="label" style={{ gridColumn: "1 / -1" }}>
                                    Resumen
                                    <div className="control" style={{ background: "#F9FAFB" }}>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <span><b>ID:</b> {deleteRow.id}</span>
                                            <span><b>Fecha:</b> {deleteRow.date}</span>
                                            <span><b>Tipo:</b> {deleteRow.duty_type}</span>
                                            <span><b>Trabajador:</b> {deleteRow.id_worker}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {deleteError && <div className="modalAlert" role="alert">{deleteError}</div>}
                        </div>
                        <div className="modalFooter">
                            <button className="btnSecondary" type="button" onClick={cancelDelete} disabled={deleteLoading}>Cancelar</button>
                            <button className="btnDanger" type="button" onClick={confirmDelete} disabled={deleteLoading}>
                                {deleteLoading ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GENERAR PDF */}
            {pdfOpen && (
                <div className="modalOverlay centered" role="dialog" aria-modal="true" aria-label="Generar PDF">
                    <div className="modalSheet">
                        <div className="modalBody">
                            <div className="modalHeader">
                                <div className="modalIcon pdf">
                                    <span className="material-icons">picture_as_pdf</span>
                                </div>
                                <div>
                                    <div className="modalTitle">Generar PDF</div>
                                    <div className="modalSubtitle">Selecciona la fecha para generar el PDF.</div>
                                </div>
                            </div>
                            <div className="formGrid">
                                <label className="label">
                                    Día
                                    <Select2 options={pdfDayOptions} value={pdfDay} onChange={setPdfDay} disabled={pdfLoading} />
                                </label>
                                <label className="label">
                                    Mes
                                    <Select2 options={pdfMonthOptions} value={pdfMonth} onChange={setPdfMonth} disabled={pdfLoading} />
                                </label>
                                <label className="label" style={{ gridColumn: "1 / -1" }}>
                                    Año
                                    <Select2 options={pdfYearOptions} value={pdfYear} onChange={setPdfYear} disabled={pdfLoading} />
                                </label>
                            </div>
                            {pdfError && <div className="modalAlert" role="alert">{pdfError}</div>}
                        </div>
                        <div className="modalFooter">
                            <button className="btnSecondary" type="button" onClick={cancelPdf} disabled={pdfLoading}>Cancelar</button>
                            <button className="btnDanger" type="button" onClick={confirmGeneratePdf} disabled={pdfLoading}>
                                {pdfLoading ? "Generando..." : "Generar PDF"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
                    last: "Siguiente: Dashboard",
                    next: "Siguiente",
                    skip: "Saltar tutorial",
                }}
            />
        </div>
    );
}
