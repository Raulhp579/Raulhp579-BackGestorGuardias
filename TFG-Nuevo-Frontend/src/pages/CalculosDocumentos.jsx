import { useEffect, useRef, useState, useMemo } from "react";
import "../styles/CalculosDocumentos.css";
import "../styles/AppLayout.css";
import { importWorkersExcel } from "../services/importExcelService"
import { getWorkers, getAdmins, updateAdmin, deleteAdmin as deleteAdminApi } from "../services/userService";
import { getSpecialities } from "../services/SpecialitiesService";
import RowActions from "../components/RowActions/RowActions";
import { deleteWorker as deleteWorkerApi, updateWorker } from "../services/workerService";

export default function CalculosDocumentos() {
    // ver trabajadores y admins
    const [view, setView] = useState("workers");
    const [currentPage, setCurrentPage] = useState(1);

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

    async function onPickExcel(e) {
        // coge el archivo elegido
        const file = e.target.files[0];
        e.target.value = "";// resetea el input para poder elegir el mismo archivo otra vez
        if (!file) return;

        // limpìa mensaje pa cuando importando
        setImportMsg("");
        setImporting(true);

        try {
            await importWorkersExcel(file);
            setImportMsg("Usuarios importados correctamente");
            setView("workers");
            await loadWorkers();

        } catch (err) {
            setImportMsg("Error al importar: " + err.message);
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
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        rank: "",
        registration_date: "",
        discharge_date: "",
        id_speciality: "",
    });

    function openEdit(row, type) {
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
            });
        } else {
            setEditForm({
                name: row.name || "",
                email: row.email || "",
                rank: "",
                registration_date: "",
                discharge_date: "",
                id_speciality: "",
            });
        }
        setEditOpen(true);
    }

    function closeEdit() {
        setEditOpen(false);
        setEditRow(null);
        setEditType(null);
    }

    async function deleteWorkerHandler(row) {
        const ok = window.confirm(
            `¿Seguro que quieres eliminar a ${row.name}?`
        );
        if (!ok) return;

        try {
            await deleteWorkerApi(row.id);
            setWorkers((prev) => prev.filter((w) => w.id !== row.id));
        } catch (e) {
            alert(e.message || "No se pudo eliminar el trabajador");
        }
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
            alert("Trabajador actualizado correctamente");
        } catch (e) {
            alert(e.message || "Error al actualizar trabajador");
        }
    }

    async function deleteAdminHandler(row) {
        const ok = window.confirm(
            `¿Seguro que quieres eliminar a ${row.name}?`
        );
        if (!ok) return;

        try {
            await deleteAdminApi(row.id);
            setAdmins((prev) => prev.filter((a) => a.id !== row.id));
        } catch (e) {
            alert(e.message || "No se pudo eliminar el administrador");
        }
    }

    async function editAdminHandler(row) {
        try {
            const payload = {
                name: row.name,
                email: row.email,
            };
            await updateAdmin(row.id, payload);
            alert("Administrador actualizado correctamente");
        } catch (e) {
            alert(e.message || "Error al actualizar administrador");
        }
    }

    // Handlers to open modal for editing
    function editWorker(row) { openEdit(row, "worker"); }
    function deleteWorker(row) { deleteWorkerHandler(row); }
    function editAdmin(row) { openEdit(row, "admin"); }
    function deleteAdmin(row) { deleteAdminHandler(row); }

    // Submit edited data from modal
    async function submitEdit(e) {
        e.preventDefault();
        if (!editRow) return;

        try {
            if (editType === "worker") {
                const payload = {
                    name: editForm.name,
                    rank: editForm.rank,
                    registration_date: editForm.registration_date || null,
                    discharge_date: editForm.discharge_date || null,
                    id_speciality: editForm.id_speciality ? Number(editForm.id_speciality) : null,
                };

                await updateWorker(editRow.id, payload);
                setWorkers((prev) => prev.map((w) => {
                    if (w.id !== editRow.id) return w;
                    const updated = { ...w, ...payload };
                    const spec = specialities.find((s) => String(s.id) === String(payload.id_speciality));
                    updated.speciality = spec ? spec.name : (payload.id_speciality === null ? null : w.speciality);
                    return updated;
                }));
            } else if (editType === "admin") {
                const payload = {
                    name: editForm.name,
                    email: editForm.email,
                };
                await updateAdmin(editRow.id, payload);
                setAdmins((prev) => prev.map((a) => (a.id === editRow.id ? { ...a, ...payload } : a)));
            }

            closeEdit();
        } catch (err) {
            alert(err.response?.data?.error || err.message || "Error al guardar cambios");
        }
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
        headers = ["Nombre", "Rango", "Alta", "Baja", "Especialidad", "Acciones"];
        colSpan = 6;
        rows = workers;
    } else {
        title = "Administradores";
        headers = ["Nombre", "Email", "Creado", "Acciones"];
        colSpan = 4;
        rows = admins;
    }

    // Paginación
    const PAGE_SIZE = 10;
    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    }, [rows.length]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return rows.slice(start, start + PAGE_SIZE);
    }, [rows, currentPage]);

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

                <div className="cdActions">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xls,.xlsx"
                        style={{ display: "none" }}
                        onChange={onPickExcel}
                    />
                    <button
                        className="cdBtnSecondary"
                        type="button"
                        disabled={importing}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-icons excel">table_view</span>
                        {importing ? "Importando..." : "Importar usuarios"}
                    </button>
                    {importMsg && <p className="cdInfo">{importMsg}</p>}

                </div>

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
                        Ver administradores
                    </button>
                </div>

                <h3 className="cdSectionTitle">{title}</h3>

                {view === "workers" && loading && <p>Cargando trabajadores...</p>}
                {view === "workers" && error && <p className="cdError">{error}</p>}

                {view === "admins" && adminsLoading && <p>Cargando administradores...</p>}
                {view === "admins" && adminsError && <p className="cdError">{adminsError}</p>}

                <table className="cdTable">
                    <thead>
                        <tr>
                            {headers.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={colSpan}>No hay datos</td>
                            </tr>
                        )}

                        {tableRows}
                    </tbody>
                </table>

                {totalPages > 1 && (
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
                                        disabled={loading}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        </div>

                        <button className="cdPagerBtn" type="button" onClick={goNextPage} disabled={currentPage === totalPages || loading}>
                            Siguiente
                            <span className="material-icons-outlined">chevron_right</span>
                        </button>
                    </div>
                )}

                {/* Edit modal */}
                {editOpen && (
                    <div className="modalOverlay centered" role="dialog" aria-modal="true" aria-label="Editar registro">
                        <div className="modalSheet">
                            <form onSubmit={submitEdit}>
                                <div className="modalBody">
                                    <div className="modalHeader">
                                        <div className="modalIcon">
                                            <span className="material-icons">edit</span>
                                        </div>
                                        <div>
                                            <div className="modalTitle">Editar {editType === "worker" ? "Trabajador" : "Administrador"}</div>
                                            <div className="modalSubtitle">Modifica los campos y guarda los cambios.</div>
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
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="modalFooter">
                                    <button className="btnPrimary" type="submit">Guardar</button>
                                    <button className="btnSecondary btnSecondary--destructive" type="button" onClick={(e) => { e.preventDefault(); closeEdit(); }}>Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
