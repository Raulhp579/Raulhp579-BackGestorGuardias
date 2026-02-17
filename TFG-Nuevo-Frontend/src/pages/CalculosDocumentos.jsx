import { useEffect, useRef, useState, useMemo } from "react";
import "../styles/CalculosDocumentos.css";
import "../styles/AppLayout.css";
import "../styles/CalculosDocumentos.extra.css";
import { importWorkersExcel } from "../services/importExcelService";
import { getWorkers, getAdmins, updateAdmin, deleteAdmin as deleteAdminApi } from "../services/userService";
import { getSpecialities } from "../services/SpecialitiesService";
import RowActions from "../components/RowActions/RowActions";
import { deleteWorker as deleteWorkerApi, updateWorker, createWorker } from "../services/workerService";
import Button from "../components/Button/Button";

export default function CalculosDocumentos() {
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
        if (view === "workers") {
            loadWorkers();
        } else {
            loadAdmins();
        }
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
                const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
                setSpecialities(arr);
            } catch (e) {
                console.error("No se pudieron cargar las especialidades", e);
                setSpecialities([]);
            }
        }
        loadSpecs();
        return () => { mounted = false; };
    }, []);


    // clases botones
    let workersBtnClass = "cdToggleBtn";
    let adminsBtnClass = "cdToggleBtn";

    if (view === "workers") {
        workersBtnClass += " isActive";
    } else {
        adminsBtnClass += " isActive";
    }

    // Funciones para manejar eliminación y edición
    const [editOpen, setEditOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [editType, setEditType] = useState(null); // 'worker' | 'admin'
    const [isCreation, setIsCreation] = useState(false);
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
    const [passwordError, setPasswordError] = useState(""); // Nuevo estado para error de contraseña

    function openCreate() {
        setEditType("worker");
        setEditRow(null);
        setIsCreation(true);
        setEditForm({
            name: "",
            rank: "",
            registration_date: "",
            discharge_date: "",
            id_speciality: "",
            email: "",
            password: "",
        });
        setPasswordError(""); // Resetear error
        setEditOpen(true);
    }

    function openEdit(row, type) {
        setIsCreation(false);
        setEditType(type);
        setEditRow(row);
        if (type === "worker") {
            setEditForm({
                name: row.name || "",
                rank: row.rank || "",
                registration_date: row.registration_date ? row.registration_date.slice(0, 10) : "",
                discharge_date: row.discharge_date ? (row.discharge_date.slice(0, 10)) : "",
                id_speciality: row.id_speciality ? String(row.id_speciality) : "",
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
        setPasswordError(""); // Resetear error
        setEditOpen(true);
    }

    function closeEdit() {
        setEditOpen(false);
        setEditRow(null);
        setEditType(null);
        setEditSaving(false);
        setEditError("");
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


    function deleteAdminHandler(row) {
        setDeleteError("");
        setDeleteRow(row);
        setDeleteType("admin");
        setDeleteOpen(true);
    }

    // Handlers to open modal for editing
    function editWorker(row) { openEdit(row, "worker"); }
    function deleteWorker(row) { deleteWorkerHandler(row); }
    function editAdmin(row) { openEdit(row, "admin"); }
    function deleteAdmin(row) { deleteAdminHandler(row); }

    // Submit edited data from modal
    async function submitEdit(e) {
        e.preventDefault();
        // if (!editRow) return; // Removed to allow creation
        setEditError("");
        setEditSaving(true);
        setPasswordError("");

        try {
            if (isCreation && editType === "worker") {
                // Validación: Contraseña obligatoria al crear
                if (!editForm.password || !editForm.password.trim()) {
                    setPasswordError("La contraseña es obligatoria para nuevos trabajadores.");
                    setEditSaving(false);
                    return;
                }

                const payload = {
                    name: editForm.name,
                    rank: editForm.rank,
                    registration_date: editForm.registration_date || null,
                    discharge_date: editForm.discharge_date || null,
                    id_speciality: editForm.id_speciality ? Number(editForm.id_speciality) : null,
                    password: editForm.password,
                };

                const newWorker = await createWorker(payload);
                // Refresh workers list or append
                // Append is tricky if we don't know the ID or if sorting matters, let's just append for now or reload.
                // Assuming create returns the object with ID.

                // Manual append logic
                const spec = specialities.find((s) => String(s.id) === String(payload.id_speciality));
                const finalWorker = { ...newWorker, speciality: spec ? spec.name : null };

                setWorkers((prev) => [...prev, finalWorker]);
                showToast("Trabajador creado correctamente", "success");
                handleSuccessEdit(newWorker.id); // Highlight new row if possible
            } else if (editType === "worker") {
                if (!editRow) return;
                const payload = {
                    name: editForm.name,
                    rank: editForm.rank,
                    registration_date: editForm.registration_date || null,
                    discharge_date: editForm.discharge_date || null,
                    id_speciality: editForm.id_speciality ? Number(editForm.id_speciality) : null,
                };

                // Añadir contraseña solo si se proporcionó
                if (editForm.password && editForm.password.trim()) {
                    payload.password = editForm.password;
                }

                await updateWorker(editRow.id, payload);
                setWorkers((prev) => prev.map((w) => {
                    if (w.id !== editRow.id) return w;
                    const updated = { ...w, ...payload };
                    const spec = specialities.find((s) => String(s.id) === String(payload.id_speciality));
                    updated.speciality = spec ? spec.name : (payload.id_speciality === null ? null : w.speciality);
                    return updated;
                }));
                handleSuccessEdit(editRow.id);
                showToast("Trabajador actualizado correctamente", "success");
            } else if (editType === "admin") {
                if (!editRow) return;
                const payload = {
                    name: editForm.name,
                    email: editForm.email,
                };
                await updateAdmin(editRow.id, payload);
                setAdmins((prev) => prev.map((a) => (a.id === editRow.id ? { ...a, ...payload } : a)));
                handleSuccessEdit(editRow.id);
                showToast("Administrador actualizado correctamente", "success");
            }

            closeEdit();
        } catch (err) {
            const msg = err?.response?.data?.error || err?.message || "Error al guardar cambios";
            setEditError(msg);
        } finally {
            setEditSaving(false);
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
                showToast('Trabajador eliminado correctamente', 'success');
            } else {
                await deleteAdminApi(id);
                setTimeout(() => {
                    setAdmins((prev) => prev.filter((a) => a.id !== id));
                }, 180);
                showToast('Administrador eliminado correctamente', 'success');
            }
            setDeleteOpen(false);
            setDeleteRow(null);
            setDeleteType(null);
        } catch (err) {
            console.error(err);
            handleSuccessDelete(null);
            setDeleteError(err?.response?.data?.error || err?.message || "No se pudo eliminar");
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

    // Toast notifications
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
    function showToast(message, type = "success", ms = 3000) {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), ms);
    }

    function onEditFieldChange(e) {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: value }));
        if (name === "password" && passwordError) setPasswordError(""); // Limpiar error al escribir
    }

    // tabla
    let title = "";
    let headers = [];
    let colSpan = 0;
    let rows = [];

    if (view === "workers") {
        title = "Trabajadores";
        headers = ["Nombre", "Rango", "Alta", "Baja", "Especialidad", "Acciones"];
        colSpan = 6;
        rows = workers;
    } else {
        title = "Administradores";
        headers = ["Nombre", "Email", "Creado", "Acciones"];
        colSpan = 4;
        rows = admins;
    }

    // Filtrado por búsqueda
    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const term = searchTerm.toLowerCase();
        return rows.filter(row =>
            row.name.toLowerCase().includes(term)
        );
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
        tableRows = pagedRows.map((w) => (
            <tr key={w.id}>
                <td>{w.name}</td>
                <td>{w.rank}</td>
                <td>{w.registration_date}</td>
                <td>{w.discharge_date ?? "-"}</td>
                <td>{w.speciality}</td>
                <td>
                    <RowActions row={w} onEdit={editWorker} onDelete={deleteWorker} disabled={loading} />
                </td>
            </tr>
        ));
    } else {
        tableRows = pagedRows.map((a) => (
            <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{new Date(a.created_at).toLocaleDateString('es-ES')}</td>
                <td>
                    <RowActions row={a} onEdit={editAdmin} onDelete={deleteAdmin} disabled={adminsLoading} />
                </td>
            </tr>
        ));
    }

    return (
        <div className="cdPage">
            <main className="cdMain">

                <div className="cdToggle">
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
                <div className="cdTableCard">
                    <div className="cdTableCardTop">
                        <div>
                            {view === "workers" && (
                                <Button
                                    variant="secondary"
                                    onClick={openCreate}
                                    style={{ marginRight: 10 }}
                                    icon="add"
                                >
                                    Crear trabajador
                                </Button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xls,.xlsx"
                                style={{ display: "none" }}
                                onChange={onPickExcel}
                            />
                            <Button
                                variant="secondary"
                                disabled={importing}
                                onClick={() => fileInputRef.current?.click()}
                                icon="table_view"
                            >
                                {importing ? "Importando..." : "Importar trabajadores"}
                            </Button>
                            {importMsg && <p className="cdInfo" style={{ margin: 0 }}>{importMsg}</p>}
                        </div>
                        {/* Search Input */}
                        <div className="cdSearchContainer">
                            <span className="material-icons">search</span>
                            <input
                                type="text"
                                className="cdSearchInput"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    className="cdSearchClear"
                                    onClick={() => setSearchTerm("")}
                                    title="Limpiar búsqueda"
                                >
                                    <span className="material-icons">close</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {view === "workers" && error && (
                        <div className="cdTableError">
                            {error}
                        </div>
                    )}

                    {view === "admins" && adminsError && (
                        <div className="cdTableError">
                            {adminsError}
                        </div>
                    )}

                    <div className="cdTableWrap">
                        <table className="cdTable">
                            <thead>
                                <tr>
                                    {headers.map((header) => (
                                        <th key={header}>{header}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {loading || adminsLoading ? (
                                    Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                        <tr key={`sk-${i}`} className="cdSkRow">
                                            {view === "workers" ? (
                                                <>
                                                    <td><div className="cdSk skMd" /></td>
                                                    <td><div className="cdSk skMd" /></td>
                                                    <td><div className="cdSk skSm" /></td>
                                                    <td><div className="cdSk skSm" /></td>
                                                    <td><div className="cdSk skLg" /></td>
                                                    <td><div className="cdSk skBtn" /></td>
                                                </>
                                            ) : (
                                                <>
                                                    <td><div className="cdSk skMd" /></td>
                                                    <td><div className="cdSk skLg" /></td>
                                                    <td><div className="cdSk skSm" /></td>
                                                    <td><div className="cdSk skBtn" /></td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={colSpan} className="cdTableEmpty">
                                            No hay {view === "workers" ? "trabajadores" : "administradores"}
                                        </td>
                                    </tr>
                                ) : (
                                    pagedRows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={[
                                                "cdRowEnter",
                                                row.id === updatedRowId ? "cdRowUpdated" : "",
                                                row.id === deletingId ? "cdRowExit" : "",
                                            ].join(" ")}
                                        >
                                            {view === "workers" ? (
                                                <>
                                                    <td>{row.name}</td>
                                                    <td>{row.rank}</td>
                                                    <td>{row.registration_date ? new Date(row.registration_date).toLocaleDateString('es-ES') : "-"}</td>
                                                    <td>{row.discharge_date ? new Date(row.discharge_date).toLocaleDateString('es-ES') : "-"}</td>
                                                    <td>{row.speciality}</td>
                                                    <td>
                                                        <div className="cdActionsCenter">
                                                            <RowActions row={row} onEdit={editWorker} onDelete={deleteWorker} disabled={loading} />
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{row.name}</td>
                                                    <td>{row.email}</td>
                                                    <td>{new Date(row.created_at).toLocaleDateString('es-ES')}</td>
                                                    <td>
                                                        <div className="cdActionsCenter">
                                                            <RowActions row={row} onEdit={editAdmin} onDelete={deleteAdmin} disabled={adminsLoading} />
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && !adminsLoading && totalPages > 1 && (
                        <div className="cdPager">
                            <button className="cdPagerBtn" type="button" onClick={goPrevPage} disabled={currentPage === 1 || loading}>
                                <span className="material-icons-outlined">chevron_left</span>
                                Anterior
                            </button>

                            <div className="cdPagerNums" aria-label="Páginas">
                                {pageButtons.map((p, idx) =>
                                    p === "..." ? (
                                        <span className="cdPagerEllipsis" key={`e-${idx}`}>
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={p}
                                            type="button"
                                            className={`cdPagerNum ${p === currentPage ? "active" : ""}`}
                                            onClick={() => setCurrentPage(p)}
                                            disabled={loading || adminsLoading}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                            </div>

                            <button className="cdPagerBtn" type="button" onClick={goNextPage} disabled={currentPage === totalPages || loading || adminsLoading}>
                                Siguiente
                                <span className="material-icons-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}

                    {/* Contador de registros al fondo */}
                    <div className="cdTableCardBottom">
                        <span className="cdTableCount">{filteredRows.length} {filteredRows.length === 1 ? "registro" : "registros"}</span>
                    </div>
                </div>

                {/* Edit modal */}
                {
                    editOpen && (
                        <div
                            className="modalOverlay centered"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Editar registro"
                            onClick={(e) => {
                                if (e.target === e.currentTarget && !editSaving) closeEdit();
                            }}
                        >
                            <div className="modalSheet">
                                <form onSubmit={submitEdit}>
                                    <div className="modalBody">
                                        <div className="modalHeader">
                                            <div className="modalIcon">
                                                <span className="material-icons">edit</span>
                                            </div>
                                            <div>
                                                <div>
                                                    <div className="modalTitle">
                                                        {isCreation ? "Crear Nuevo Trabajador" :
                                                            `Editar ${editType === "worker" ? "Trabajador" : "Administrador"}`
                                                        }
                                                    </div>
                                                    <div className="modalSubtitle">
                                                        {isCreation ? "Rellena los datos para crear un nuevo trabajador." : "Modifica los campos y guarda los cambios."}
                                                    </div>
                                                </div>

                                            </div>
                                        </div>

                                        <div className="formGrid">
                                            <label className="label">
                                                Nombre
                                                <input name="name" className="control" value={editForm.name} onChange={onEditFieldChange} required />
                                            </label>

                                            {editType === "admin" ? (
                                                <label className="label">
                                                    Email
                                                    <input name="email" type="email" className="control" value={editForm.email} onChange={onEditFieldChange} required />
                                                </label>
                                            ) : (
                                                <>
                                                    <label className="label">
                                                        Rango
                                                        <input name="rank" className="control" value={editForm.rank} onChange={onEditFieldChange} />
                                                    </label>

                                                    <label className="label">
                                                        Alta
                                                        <input name="registration_date" type="date" className="control" value={editForm.registration_date} onChange={onEditFieldChange} />
                                                    </label>

                                                    <label className="label">
                                                        Baja
                                                        <input name="discharge_date" type="date" className="control" value={editForm.discharge_date} onChange={onEditFieldChange} />
                                                    </label>

                                                    <label className="label">
                                                        Especialidad
                                                        <select name="id_speciality" className="control" value={editForm.id_speciality} onChange={onEditFieldChange}>
                                                            <option value="">-- Ninguna --</option>
                                                            {specialities.map((s) => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </label>

                                                    <label className="label">
                                                        Contraseña (dejar vacío si no deseas cambiarla)
                                                        <input name="password" type="password" className="control" value={editForm.password} onChange={onEditFieldChange} placeholder="Nueva contraseña" />
                                                        {passwordError && <span style={{ color: "red", fontSize: "0.85rem", marginTop: "4px", display: "block" }}>{passwordError}</span>}
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="modalFooter">
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={editSaving}
                                                isLoading={editSaving}
                                            >
                                                {editSaving ? 'Guardando...' : 'Guardar'}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => closeEdit()}
                                                disabled={editSaving}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Delete modal */}
                {
                    deleteOpen && (
                        <div
                            className="modalOverlay centered"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Confirmar eliminación"
                            onClick={(e) => {
                                if (e.target === e.currentTarget && !deleteLoading) cancelDelete();
                            }}
                        >
                            <div className="modalSheet">
                                <div className="modalBody">
                                    <div className="modalHeader">
                                        <div className="modalIcon">
                                            <span className="material-icons">delete</span>
                                        </div>
                                        <div>
                                            <div className="modalTitle">Eliminar {deleteType === 'worker' ? 'Trabajador' : 'Administrador'}</div>
                                            <div className="modalSubtitle">¿Seguro que quieres eliminar a <strong>{deleteRow?.name}</strong>? Esta acción no se puede deshacer.</div>
                                            {deleteError && <div style={{ marginTop: 8, color: '#b91c1c', fontWeight: 700 }}>{deleteError}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="modalFooter">
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <Button
                                            variant="danger"
                                            onClick={confirmDelete}
                                            disabled={deleteLoading}
                                            isLoading={deleteLoading}
                                        >
                                            {deleteLoading ? "Eliminando..." : "Eliminar"}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={cancelDelete}
                                            disabled={deleteLoading}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    toast.visible && (
                        <div className={`toast ${toast.type === 'success' ? 'toast--success' : 'toast--error'}`} role="status" aria-live="polite">
                            {toast.message}
                        </div>
                    )
                }

            </main >
        </div >
    );
}
