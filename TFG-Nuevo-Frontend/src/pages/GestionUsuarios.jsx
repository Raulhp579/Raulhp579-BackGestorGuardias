import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GestionUsuarios.css";
import "../styles/AppLayout.css";
import "../styles/GestionUsuarios.extra.css";
import { importWorkersExcel } from "../services/importExcelService";
import {
    getWorkers,
    getAdmins,
    updateAdmin,
    deleteAdmin as deleteAdminApi,
} from "../services/userService";
import { getSpecialities, updateSpeciality } from "../services/SpecialitiesService";

import RowActions from "../components/RowActions/RowActions";
import Select2 from "../components/Select2/Select2";
import Joyride, { STATUS } from "react-joyride-react-19";
import {
    deleteWorker as deleteWorkerApi,
    updateWorker,
    createWorker,
} from "../services/workerService";

export default function GestionUsuarios() {
    const navigate = useNavigate();
    const SKELETON_ROWS = 8;

    // ver trabajadores y admins
    const [view, setView] = useState("workers");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    // micro-animaciones filas (EDIT + DELETE)
    const [updatedRowId, setUpdatedRowId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    //para gettear los trabalhadores y users

    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [admins, setAdmins] = useState([]);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [adminsError, setAdminsError] = useState("");

    const [specialities, setSpecialities] = useState([]);

    // Joyride Steps
    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
        {
            target: ".tour-import-users",
            content:
                "Paso 1: Importa masivamente los trabajadores desde un archivo Excel para empezar a trabajar.",
            disableBeacon: true,
        },
        {
            target: ".tour-view-toggle",
            content:
                "Puedes alternar entre la vista de 'Trabajadores' y la de 'Usuarios' (cuentas con acceso al panel).",
        },
        {
            target: ".tour-search-users",
            content:
                "Utiliza el buscador para localizar rápidamente a cualquier persona por su nombre.",
        },
    ];

    useEffect(() => {
        // En este paso global, si no hay flag de terminado global, iniciamos
        const globalDone = localStorage.getItem("global_tutorial_done");
        if (!globalDone) {
            setRunTour(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED]; // Solo si finaliza (botón Siguiente)

        // Si el usuario "salta" (skip), se considera que abandona el tutorial global
        if (status === STATUS.SKIPPED) {
            setRunTour(false);
            localStorage.setItem("global_tutorial_done", "true");
            return;
        }

        if (finishedStatuses.includes(status)) {
            // Pasamos a la fase 2: Guardias
            localStorage.setItem("tutorial_phase", "PHASE_GUARDS");
            setRunTour(false);
            // Navegar a la siguiente pantalla (ruta correcta ver AppRouter.jsx)
            navigate("/guardias");
        }
    };

    // import excel
    const fileInputRef = useRef(null);
    const [importMsg, setImportMsg] = useState("");
    const [importing, setImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);

    async function onPickExcel(e) {
        // coge el archivo elegido
        const file = e.target.files[0];
        e.target.value = ""; // resetea el input para poder elegir el mismo archivo otra vez
        if (!file) {
            setImportMsg("Debes seleccionar un archivo");
            setImportSuccess(false);
            return;
        }

        // limpìa mensaje pa cuando importando
        setImportMsg("");
        setImporting(true);
        setImportSuccess(false);

        try {
            await importWorkersExcel(file);
            setImportMsg("Usuarios importados correctamente");
            setImportSuccess(true);
            setView("workers");
            await loadWorkers();
        } catch (err) {
            setImportMsg("Error al importar: " + err.message);
            setImportSuccess(false);
        } finally {
            setImporting(false);
        }
    }

    async function loadWorkers() {
        setLoading(true);
        setError("");
        try {
            const data = await getWorkers();
            setWorkers(data);
        } catch (e) {
            setError(e.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadWorkers();
        loadAdmins();
    }, []);

    useEffect(() => {
        setSearchTerm(""); // Resetear búsqueda al cambiar de vista
    }, [view]);

    async function loadAdmins() {
        setAdminsLoading(true);
        setAdminsError("");
        try {
            const data = await getAdmins();
            setAdmins(data);
        } catch (e) {
            setAdminsError(e.message || "Error desconocido");
        } finally {
            setAdminsLoading(false);
        }
    }

    // load specialities once
    useEffect(() => {
        let mounted = true;
        async function loadSpecs() {
            try {
                const data = await getSpecialities();
                if (!mounted) return;
                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];
                setSpecialities(arr);
            } catch (e) {
                console.error("No se pudieron cargar las especialidades", e);
                setSpecialities([]);
            }
        }
        loadSpecs();
        return () => {
            mounted = false;
        };
    }, []);

    // clases Segmented Control
    let workersBtnClass = "guSegBtn";
    let adminsBtnClass = "guSegBtn";

    if (view === "workers") {
        workersBtnClass += " active";
    } else {
        adminsBtnClass += " active";
    }

    // Funciones para manejar eliminación y edición
    const [editOpen, setEditOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [editType, setEditType] = useState(null); // 'worker' | 'admin'
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        rank: "",
        registration_date: "",
        discharge_date: "",
        id_speciality: "",
        password: "",
    });

    // Trabajadores disponibles para asociar al usuario
    const [isCreating, setIsCreating] = useState(false);

    function handleCreateWorker() {
        setEditType("worker");
        setIsCreating(true);
        setEditError("");
        setEditForm({
            name: "",
            rank: "",
            registration_date: "",
            discharge_date: "",
            id_speciality: "",
            email: "",
            password: "",
        });
        setEditOpen(true);
    }

    function openEdit(row, type) {
        setEditType(type);
        setEditRow(row);
        if (type === "worker") {
            setEditForm({
                name: row.name || "",
                rank: row.rank || "",
                registration_date: row.registration_date
                    ? row.registration_date.slice(0, 10)
                    : "",
                discharge_date: row.discharge_date
                    ? row.discharge_date.slice(0, 10)
                    : "",
                id_speciality: row.id_speciality
                    ? String(row.id_speciality)
                    : "",
                email: "",
                password: "",
            });
        } else {
            setEditForm({
                name: row.name || "",
                email: row.email || "",
                rank: "",
                registration_date: "",
                discharge_date: "",
                id_speciality: "",
                password: "",
            });
        }
        setEditOpen(true);
    }



    function closeEdit() {
        setEditOpen(false);
        setEditRow(null);
        setEditType(null);
        setEditSaving(false);
        setEditError("");
        setIsCreating(false);
    }

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'worker' | 'admin'
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    function deleteWorkerHandler(row) {
        setDeleteError("");
        setDeleteRow(row);
        setDeleteType("worker");
        setDeleteOpen(true);
    }

    async function editWorkerHandler(row) {
        try {
            const payload = {
                name: row.name,
                rank: row.rank,
                registration_date: row.registration_date,
                discharge_date: row.discharge_date,
                id_speciality: row.id_speciality,
            };
            await updateWorker(row.id, payload);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    function deleteAdminHandler(row) {
        setDeleteError("");
        setDeleteRow(row);
        setDeleteType("admin");
        setDeleteOpen(true);
    }

    async function editAdminHandler(row) {
        try {
            const payload = {
                name: row.name,
                email: row.email,
            };
            await updateAdmin(row.id, payload);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    // Handlers to open modal for editing
    function editWorker(row) {
        openEdit(row, "worker");
    }
    function deleteWorker(row) {
        deleteWorkerHandler(row);
    }
    function editAdmin(row) {
        openEdit(row, "admin");
    }
    function deleteAdmin(row) {
        deleteAdminHandler(row);
    }

    // Submit edited data from modal
    async function submitEdit(e) {
        e.preventDefault();
        if (!editRow && !isCreating) return;
        setEditError("");
        setEditSaving(true);
        try {
            if (editType === "worker") {
                const payload = {
                    name: editForm.name,
                    rank: editForm.rank,
                    registration_date: editForm.registration_date || null,
                    discharge_date: editForm.discharge_date || null,
                    id_speciality: editForm.id_speciality
                        ? Number(editForm.id_speciality)
                        : null,
                };

                // Añadir contraseña solo si se proporcionó
                if (editForm.password && editForm.password.trim()) {
                    payload.password = editForm.password;
                }

                if (isCreating) {
                    const response = await createWorker(payload);
                    const newWorker =
                        response.worker || response.data || response;

                    // Añadir speciality name si viene populado o buscarlo
                    const spec = specialities.find(
                        (s) => String(s.id) === String(payload.id_speciality),
                    );
                    newWorker.speciality = spec ? spec.name : null;

                    setWorkers((prev) => [newWorker, ...prev]);
                    showToast(
                        "Trabajador creado (y usuario generado)",
                        "success",
                    );
                } else {
                    await updateWorker(editRow.id, payload);
                    setWorkers((prev) =>
                        prev.map((w) => {
                            if (w.id !== editRow.id) return w;
                            const updated = { ...w, ...payload };
                            const spec = specialities.find(
                                (s) =>
                                    String(s.id) ===
                                    String(payload.id_speciality),
                            );
                            updated.speciality = spec
                                ? spec.name
                                : payload.id_speciality === null
                                    ? null
                                    : w.speciality;
                            return updated;
                        }),
                    );
                    showToast(
                        "Trabajador actualizado correctamente",
                        "success",
                    );
                }
            } else if (editType === "admin") {
                const payload = {
                    name: editForm.name,
                    email: editForm.email,
                };
                console.log("Payload que se envía al backend:", payload);
                await updateAdmin(editRow.id, payload);
                setAdmins((prev) =>
                    prev.map((a) =>
                        a.id === editRow.id ? { ...a, ...payload } : a,
                    ),
                );
                handleSuccessEdit(editRow.id);
                showToast("Administrador actualizado correctamente", "success");
            }

            if (!isCreating && editType === "worker") {
                handleSuccessEdit(editRow.id);
            }
            closeEdit();
        } catch (err) {
            const msg =
                err?.response?.data?.error ||
                err?.message ||
                "Error al guardar cambios";
            setEditError(msg);
        } finally {
            setEditSaving(false);
        }
    }

    async function handleSetChief(worker) {
        if (!worker.id_speciality) {
            showToast("El trabajador no tiene especialidad asignada", "error");
            return;
        }

        const spec = specialities.find(s => s.id == worker.id_speciality);
        if (!spec) {
            showToast("No se encontró la especialidad", "error");
            return;
        }

        setLoading(true);
        try {
            await updateSpeciality(worker.id_speciality, {
                name: spec.name,
                active: spec.active,
                id_chief: worker.id
            });

            // Update local specialities state
            setSpecialities(prev => prev.map(s =>
                s.id == worker.id_speciality ? { ...s, id_chief: worker.id } : s
            ));

            showToast(`${worker.name} ahora es Jefe de ${spec.name}`, "success");
        } catch (err) {
            showToast("Error al asignar jefe: " + err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    async function confirmDelete() {
        if (!deleteRow || !deleteType) return;

        const id = deleteRow.id;
        setDeleteLoading(true);
        setDeleteError("");
        // animación salida
        handleSuccessDelete(id);

        try {
            if (deleteType === "worker") {
                await deleteWorkerApi(id);
                setTimeout(() => {
                    setWorkers((prev) => prev.filter((w) => w.id !== id));
                }, 180);
                showToast("Trabajador eliminado correctamente", "success");
            } else {
                await deleteAdminApi(id);
                setTimeout(() => {
                    setAdmins((prev) => prev.filter((a) => a.id !== id));
                }, 180);
                showToast("Usuario eliminado correctamente", "success");
            }
            setDeleteOpen(false);
            setDeleteRow(null);
            setDeleteType(null);
        } catch (err) {
            console.error(err);
            handleSuccessDelete(null);
            setDeleteError(
                err?.response?.data?.error ||
                err?.message ||
                "No se pudo eliminar",
            );
        } finally {
            setDeleteLoading(false);
        }
    }

    function cancelDelete() {
        setDeleteOpen(false);
        setDeleteRow(null);
        setDeleteType(null);
        setDeleteError("");
    }

    // Toast notifications — DOM imperativo, sin React state
    function showToast(message, type = "success", ms = 3500) {
        const prev = document.getElementById("__guToast__");
        if (prev) prev.remove();

        const el = document.createElement("div");
        el.id = "__guToast__";
        el.setAttribute("role", "status");

        const icon = document.createElement("span");
        icon.className = "material-icons";
        icon.textContent = type === "success" ? "check_circle" : "error";
        icon.style.cssText = "font-size:20px;flex-shrink:0;line-height:1";

        const text = document.createElement("span");
        text.textContent = message;

        el.appendChild(icon);
        el.appendChild(text);

        Object.assign(el.style, {
            position:   "fixed",
            bottom:     "32px",
            right:      "28px",
            zIndex:     "99999",
            display:    "flex",
            alignItems: "center",
            gap:        "10px",
            padding:    "14px 20px",
            borderRadius: "14px",
            color:      "#fff",
            fontSize:   "14px",
            fontWeight: "600",
            fontFamily: "Inter,system-ui,sans-serif",
            boxShadow:  "0 8px 32px rgba(0,0,0,0.28)",
            background: type === "success"
                ? "linear-gradient(135deg,#10B981,#059669)"
                : "linear-gradient(135deg,#EF4444,#DC2626)",
            minWidth:   "220px",
            maxWidth:   "360px",
        });

        document.body.appendChild(el);
        setTimeout(() => el.remove(), ms);
    }

    function onEditFieldChange(e) {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: value }));
    }

    // tabla
    let title = "";
    let headers = [];
    let colSpan = 0;
    let rows = [];

    if (view === "workers") {
        title = "Trabajadores";
        headers = [
            "Nombre",
            "Rango",
            "Alta",
            "Baja",
            "Especialidad",
            "Acciones",
        ];
        colSpan = 6;
        rows = workers;
    } else {
        title = "Usuarios";
        headers = ["Nombre", "Email", "Creado", "Acciones"];
        colSpan = 4;
        rows = admins;
    }

    // Select2 options
    const specialityOptions = useMemo(() =>
        specialities.map(s => ({ value: String(s.id), label: s.name }))
    , [specialities]);



    // Filtrado por búsqueda
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const term = searchTerm.toLowerCase();
        return rows.filter((row) => row.name.toLowerCase().includes(term));
    }, [rows, searchTerm]);

    // Resetear página cuando cambia la búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Paginación
    const PAGE_SIZE = 10;
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    }, [filteredRows.length]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredRows.slice(start, start + PAGE_SIZE);
    }, [filteredRows, currentPage]);

    // Micro-animación para edición exitosa
    const handleSuccessEdit = (id) => {
        setUpdatedRowId(id);
        setTimeout(() => setUpdatedRowId(null), 1200);
    };

    // Micro-animación para eliminación
    const handleSuccessDelete = (id) => {
        setDeletingId(id);
        setTimeout(() => setDeletingId(null), 180);
    };

    const pageButtons = useMemo(() => {
        const maxButtons = 7;
        if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const windowSize = 5;
        const half = Math.floor(windowSize / 2);
        let start = Math.max(2, currentPage - half);
        let end = Math.min(totalPages - 1, currentPage + half);

        if (currentPage <= 3) {
            start = 2;
            end = 2 + (windowSize - 1);
        } else if (currentPage >= totalPages - 2) {
            end = totalPages - 1;
            start = end - (windowSize - 1);
        }

        const nums = [];
        nums.push(1);
        if (start > 2) nums.push("...");
        for (let n = start; n <= end; n++) nums.push(n);
        if (end < totalPages - 1) nums.push("...");
        nums.push(totalPages);
        return nums;
    }, [currentPage, totalPages]);

    function goPrevPage() {
        setCurrentPage((p) => Math.max(1, p - 1));
    }

    function goNextPage() {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
    }

    // filas
    let tableRows = null;

    if (view === "workers") {
        tableRows = pagedRows.map((w) => {
            const spec = specialities.find(s => s.id == w.id_speciality);
            const isChief = spec && spec.id_chief == w.id;

            return (
                <tr key={w.id}>
                    <td className="wNameCell">
                        {w.name}
                        {isChief && <span className="chiefBadge" title="Jefe de Especialidad">⭐</span>}
                    </td>
                    <td>{w.rank}</td>
                    <td>{w.registration_date}</td>
                    <td>{w.discharge_date ?? "-"}</td>
                    <td>{w.speciality}</td>
                    <td>
                        <RowActions
                            row={w}
                            onEdit={editWorker}
                            onDelete={deleteWorker}
                            onSetChief={handleSetChief}
                            isChief={isChief}
                            disabled={loading}
                        />
                    </td>
                </tr>
            );
        });
    } else {
        tableRows = pagedRows.map((a) => (
            <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{new Date(a.created_at).toLocaleDateString("es-ES")}</td>
                <td>
                    <RowActions
                        row={a}
                        onEdit={editAdmin}
                        onDelete={deleteAdmin}
                        disabled={adminsLoading}
                    />
                </td>
            </tr>
        ));
    }

    return (
        <>
        <div className="guPage">
            <main className="guMain">
                {/* Segmented Control */}
                <div className="guSegmentedControl tour-view-toggle">
                    <button
                        className={workersBtnClass}
                        type="button"
                        onClick={() => setView("workers")}
                    >
                        Ver trabajadores
                    </button>

                    <button
                        className={adminsBtnClass}
                        type="button"
                        onClick={() => setView("admins")}
                    >
                        Ver usuarios
                    </button>
                </div>

                {/* Tabla Card */}
                <div className="guCard">
                    {/* HEADER DE LA TARJETA (Buscador y Botones) */}
                    <div className="guHeaderRow">
                        <div className="guHeaderLeft">
                            <div className="guSearch">
                                <span className="material-icons">search</span>
                                <input
                                    type="text"
                                    className="tour-search-users"
                                    placeholder="Buscar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        className="guSearchClear"
                                        onClick={() => setSearchTerm("")}
                                        title="Limpiar búsqueda"
                                    >
                                        <span className="material-icons">close</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="guHeaderRight">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xls,.xlsx"
                                style={{ display: "none" }}
                                onChange={onPickExcel}
                            />
                            <button
                                className="guBtn outline tour-import-users"
                                type="button"
                                disabled={importing}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <span className="material-icons-outlined">table_view</span>
                                {importing ? "Importando..." : "Importar usuarios"}
                            </button>

                            {/* Botón CREAR TRABAJADOR (solo en vista workers) */}
                            {view === "workers" && (
                                <button
                                    className="guBtn primary"
                                    type="button"
                                    onClick={handleCreateWorker}
                                >
                                    <span className="material-icons">add_circle</span>
                                    Crear trabajador
                                </button>
                            )}
                        </div>
                    </div>

                    {/* TOAST de notificaciones (Joyride, Errores) */}
                    <div style={{ position: "absolute" }}>
                        <Joyride
                            steps={tourSteps}
                            run={runTour}
                            continuous
                            showProgress
                            showSkipButton={true}
                            scrollOffset={150}
                            callback={handleJoyrideCallback}
                            styles={{ options: { zIndex: 10000, primaryColor: "#007bff" } }}
                            locale={{ back: "Atrás", close: "Cerrar", last: "Siguiente: Explicar Guardias", next: "Siguiente", skip: "Saltar tutorial" }}
                        />
                    </div>

                    {importMsg && (
                        <div style={{ padding: "10px 24px", background: "#F0FDF4", color: "#166534", borderBottom: "1px solid #DCFCE7", fontSize: "14px" }}>
                            {importMsg}
                        </div>
                    )}

                    {view === "workers" && error && (
                        <div className="guError">{error}</div>
                    )}

                    {view === "admins" && adminsError && (
                        <div className="guError">{adminsError}</div>
                    )}

                    <div className="guTableWrap">
                        <table className="guTable">
                            <thead>
                                <tr>
                                    {headers.map((header) => (
                                        <th key={header}>{header}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {loading || adminsLoading ? (
                                    Array.from({ length: SKELETON_ROWS }).map(
                                        (_, i) => (
                                            <tr
                                                key={`sk-${i}`}
                                                className="cdSkRow"
                                            >
                                                {view === "workers" ? (
                                                    <>
                                                        <td>
                                                            <div className="cdSk skMd" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skMd" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skSm" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skSm" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skLg" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skBtn" />
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td>
                                                            <div className="cdSk skMd" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skLg" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skSm" />
                                                        </td>
                                                        <td>
                                                            <div className="cdSk skBtn" />
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ),
                                    )
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={colSpan}
                                            className="cdTableEmpty"
                                        >
                                            No hay{" "}
                                            {view === "workers"
                                                ? "trabajadores"
                                                : "usuarios"}
                                        </td>
                                    </tr>
                                ) : (
                                    pagedRows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={[
                                                "cdRowEnter",
                                                row.id === updatedRowId
                                                    ? "cdRowUpdated"
                                                    : "",
                                                row.id === deletingId
                                                    ? "cdRowExit"
                                                    : "",
                                            ].join(" ")}
                                        >
                                            {view === "workers" ? (
                                                <>
                                                    <td>
                                                        {(() => {
                                                            const relatedUser = admins.find(a => a.worker_id === row.id);
                                                            const isAdminWorker = relatedUser && relatedUser.roles && relatedUser.roles.some(r => r.name === 'admin');
                                                            return (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <span>{row.name}</span>
                                                                    {isAdminWorker && (
                                                                        <span className="material-icons-outlined" style={{ fontSize: "16px", color: "#006236" }} title="Administrador">shield</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td>{row.rank}</td>
                                                    <td>
                                                        {row.registration_date
                                                            ? new Date(
                                                                row.registration_date,
                                                            ).toLocaleDateString(
                                                                "es-ES",
                                                            )
                                                            : "-"}
                                                    </td>
                                                    <td>
                                                        {row.discharge_date
                                                            ? new Date(
                                                                row.discharge_date,
                                                            ).toLocaleDateString(
                                                                "es-ES",
                                                            )
                                                            : "-"}
                                                    </td>
                                                    <td>{row.speciality}</td>
                                                    <td>
                                                        {(() => {
                                                            const relatedUser = admins.find(a => a.worker_id === row.id);
                                                            const isAdminWorker = relatedUser && relatedUser.roles && relatedUser.roles.some(r => r.name === 'admin');
                                                            const s = specialities.find(sp => sp.id == row.id_speciality);
                                                            const isChief = s && s.id_chief == row.id;

                                                            return (
                                                                <div className="cdActionsCenter">
                                                                    <RowActions
                                                                        row={row}
                                                                        onEdit={editWorker}
                                                                        onDelete={deleteWorker}
                                                                        onSetChief={handleSetChief}
                                                                        isChief={isChief}
                                                                        disabled={loading}
                                                                        disableEdit={isAdminWorker}
                                                                        disableDelete={isAdminWorker}
                                                                    />
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>
                                                        {(() => {
                                                            const isAdminUser = row.roles && row.roles.some(r => r.name === 'admin');
                                                            const isUserAdminName = row.name.includes("Santo Tomás") || row.name.includes("Javier Ruiz") || row.name.includes("Admin");
                                                            const readOnly = isAdminUser || isUserAdminName;
                                                            return (
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <span>{row.name}</span>
                                                                    {readOnly && (
                                                                        <span className="material-icons-outlined" style={{ fontSize: "16px", color: "#006236" }} title="Administrador">shield</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td>{row.email}</td>
                                                    <td>
                                                        {new Date(
                                                            row.created_at,
                                                        ).toLocaleDateString(
                                                            "es-ES",
                                                        )}
                                                    </td>
                                                    <td>
                                                        {(() => {
                                                            const isAdminUser = row.roles && row.roles.some(r => r.name === 'admin');
                                                            const isUserAdminName = row.name.includes("Santo Tomás") || row.name.includes("Javier Ruiz") || row.name.includes("Admin");
                                                            const readOnly = isAdminUser || isUserAdminName;
                                                            return (
                                                                <div className="cdActionsCenter">
                                                                    <RowActions
                                                                        row={row}
                                                                        onEdit={editAdmin}
                                                                        onDelete={deleteAdmin}
                                                                        disabled={adminsLoading}
                                                                        disableEdit={readOnly}
                                                                        disableDelete={readOnly}
                                                                    />
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN ESTANDARIZADA */}
                    <div className="ggPager" style={{ borderTop: "1px solid #E2E8F0" }}>
                        <div className="ggPagerInfo">
                            Mostrando{" "}
                            <strong>{Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredRows.length)}</strong>
                            {" "}a{" "}
                            <strong>{Math.min(currentPage * PAGE_SIZE, filteredRows.length)}</strong>
                            {" "}de{" "}
                            <strong>{filteredRows.length}</strong> registros
                        </div>

                        <div className="ggPagerControls">
                            <button
                                className="ggPagerArrow"
                                type="button"
                                onClick={goPrevPage}
                                disabled={currentPage === 1 || loading || adminsLoading}
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
                                        className={`ggPagerNum ${p === currentPage ? "active" : ""}`}
                                        onClick={() => setCurrentPage(p)}
                                        disabled={loading || adminsLoading}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                className="ggPagerArrow"
                                type="button"
                                onClick={goNextPage}
                                disabled={currentPage === totalPages || loading || adminsLoading}
                                aria-label="Siguiente"
                            >
                                <span className="material-icons-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit modal */}
                {editOpen && (
                    <div
                        className="modalOverlay centered"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Editar registro"
                    >
                        <div className="modalSheet">
                            <form onSubmit={submitEdit}>
                                <div className="modalBody">
                                    <div className="modalHeader">
                                        <div className="modalIcon">
                                            <span className="material-icons">
                                                edit
                                            </span>
                                        </div>
                                        <div>
                                            <div className="modalTitle">
                                                {isCreating ? "Crear" : "Editar"}{" "}
                                                {editType === "worker"
                                                    ? "Trabajador"
                                                    : "Administrador"}
                                            </div>
                                            <div className="modalSubtitle">
                                                {isCreating
                                                    ? "Rellena los campos para añadir un nuevo registro."
                                                    : "Modifica los campos y guarda los cambios."}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="formGrid">
                                        <label className="label">
                                            Nombre
                                            <input
                                                name="name"
                                                className="control"
                                                value={editForm.name}
                                                onChange={onEditFieldChange}
                                                required
                                            />
                                        </label>

                                        {editType === "admin" ? (
                                            <label className="label">
                                                Email
                                                <input
                                                    name="email"
                                                    type="email"
                                                    className="control"
                                                    value={editForm.email}
                                                    onChange={
                                                        onEditFieldChange
                                                    }
                                                    required
                                                />
                                            </label>
                                        ) : (
                                            <>
                                                <label className="label">
                                                    Rango
                                                    <input
                                                        name="rank"
                                                        className="control"
                                                        value={editForm.rank}
                                                        onChange={
                                                            onEditFieldChange
                                                        }
                                                    />
                                                </label>

                                                <label className="label">
                                                    Alta
                                                    <input
                                                        name="registration_date"
                                                        type="date"
                                                        className="control"
                                                        value={
                                                            editForm.registration_date
                                                        }
                                                        onChange={
                                                            onEditFieldChange
                                                        }
                                                    />
                                                </label>

                                                {!isCreating && (
                                                    <label className="label">
                                                        Baja
                                                        <input
                                                            name="discharge_date"
                                                            type="date"
                                                            className="control"
                                                            value={
                                                                editForm.discharge_date
                                                            }
                                                            onChange={
                                                                onEditFieldChange
                                                            }
                                                        />
                                                    </label>
                                                )}

                                                <label className="label">
                                                    Especialidad
                                                    <Select2
                                                        placeholder="-- Ninguna --"
                                                        options={specialityOptions}
                                                        value={editForm.id_speciality}
                                                        onChange={(val) => onEditFieldChange({ target: { name: "id_speciality", value: val } })}
                                                    />
                                                </label>

                                                {!isCreating && (
                                                    <label className="label">
                                                        Contraseña (opcional)
                                                        <input
                                                            name="password"
                                                            type="password"
                                                            className="control"
                                                            value={
                                                                editForm.password
                                                            }
                                                            onChange={
                                                                onEditFieldChange
                                                            }
                                                            placeholder="Nueva contraseña o dejar vacío"
                                                        />
                                                    </label>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="modalFooter">
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button
                                            className="btnPrimary"
                                            type="submit"
                                            disabled={editSaving}
                                        >
                                            {editSaving
                                                ? (isCreating ? "Creando..." : "Guardando...")
                                                : (isCreating ? "Crear" : "Guardar")}
                                        </button>
                                        <button
                                            className="btnSecondary btnSecondary--destructive"
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                closeEdit();
                                            }}
                                            disabled={editSaving}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete modal */}
                {deleteOpen && (
                    <div
                        className="modalOverlay centered"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Confirmar eliminación"
                    >
                        <div className="modalSheet">
                            <div className="modalBody">
                                <div className="modalHeader">
                                    <div className="modalIcon">
                                        <span className="material-icons">
                                            delete
                                        </span>
                                    </div>
                                    <div>
                                        <div className="modalTitle">
                                            Eliminar{" "}
                                            {deleteType === "worker"
                                                ? "Trabajador"
                                                : "Administrador"}
                                        </div>
                                        <div className="modalSubtitle">
                                            ¿Seguro que quieres eliminar a{" "}
                                            <strong>{deleteRow?.name}</strong>?
                                            Esta acción no se puede deshacer.
                                        </div>
                                        {deleteError && (
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    color: "#b91c1c",
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {deleteError}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modalFooter">
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button
                                        className="btnPrimary btnPrimary--destructive"
                                        onClick={confirmDelete}
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading
                                            ? "Eliminando..."
                                            : "Eliminar"}
                                    </button>
                                    <button
                                        className="btnSecondary"
                                        onClick={cancelDelete}
                                        disabled={deleteLoading}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
        </>
    );
}
