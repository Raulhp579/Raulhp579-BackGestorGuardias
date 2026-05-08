import { useEffect, useState, useMemo } from "react";
import "../styles/GestionUsuarios.css";
import "../styles/AppLayout.css";
import "../styles/GestionUsuarios.extra.css";
import {
    getSpecialities,
    createSpeciality,
    updateSpeciality,
    deleteSpeciality,
} from "../services/SpecialitiesService";
import { getWorkers } from "../services/workerService";
import RowActions from "../components/RowActions/RowActions";
import Select2 from "../components/Select2/Select2";

const SKELETON_ROWS = 6;
const PAGE_SIZE = 10;

export default function GestionEspecialidades() {
    const [specialities, setSpecialities] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // micro-animaciones
    const [updatedRowId, setUpdatedRowId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // modal editar/crear
    const [editOpen, setEditOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [editForm, setEditForm] = useState({ name: "", active: true, id_chief: "" });

    // modal eliminar
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    async function loadSpecialities() {
        setLoading(true);
        setError("");
        try {
            const data = await getSpecialities();
            const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
            setSpecialities(arr);
        } catch (e) {
            setError(e.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadSpecialities();
        getWorkers()
            .then((data) => setWorkers(Array.isArray(data) ? data : []))
            .catch(() => setWorkers([]));
    }, []);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const workerOptions = useMemo(() =>
        workers.map((w) => ({ value: String(w.id), label: w.name })),
    [workers]);

    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return specialities;
        const term = searchTerm.toLowerCase();
        return specialities.filter((s) => s.name.toLowerCase().includes(term));
    }, [specialities, searchTerm]);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE)), [filteredRows.length]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const pagedRows = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredRows.slice(start, start + PAGE_SIZE);
    }, [filteredRows, currentPage]);

    const pageButtons = useMemo(() => {
        const maxButtons = 7;
        if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const windowSize = 5;
        const half = Math.floor(windowSize / 2);
        let start = Math.max(2, currentPage - half);
        let end = Math.min(totalPages - 1, currentPage + half);
        if (currentPage <= 3) { start = 2; end = 2 + (windowSize - 1); }
        else if (currentPage >= totalPages - 2) { end = totalPages - 1; start = end - (windowSize - 1); }
        const nums = [1];
        if (start > 2) nums.push("...");
        for (let n = start; n <= end; n++) nums.push(n);
        if (end < totalPages - 1) nums.push("...");
        nums.push(totalPages);
        return nums;
    }, [currentPage, totalPages]);

    function showToast(message, type = "success", ms = 3500) {
        const prev = document.getElementById("__geToast__");
        if (prev) prev.remove();
        const el = document.createElement("div");
        el.id = "__geToast__";
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
            position: "fixed", bottom: "32px", right: "28px", zIndex: "99999",
            display: "flex", alignItems: "center", gap: "10px", padding: "14px 20px",
            borderRadius: "14px", color: "#fff", fontSize: "14px", fontWeight: "600",
            fontFamily: "Inter,system-ui,sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            background: type === "success"
                ? "linear-gradient(135deg,#10B981,#059669)"
                : "linear-gradient(135deg,#EF4444,#DC2626)",
            minWidth: "220px", maxWidth: "360px",
        });
        document.body.appendChild(el);
        setTimeout(() => el.remove(), ms);
    }

    function handleCreate() {
        setIsCreating(true);
        setEditRow(null);
        setEditError("");
        setEditForm({ name: "", active: true, id_chief: "" });
        setEditOpen(true);
    }

    function handleEdit(row) {
        setIsCreating(false);
        setEditRow(row);
        setEditError("");
        setEditForm({
            name: row.name || "",
            active: row.active ?? true,
            id_chief: row.id_chief ? String(row.id_chief) : "",
        });
        setEditOpen(true);
    }

    function closeEdit() {
        setEditOpen(false);
        setEditRow(null);
        setIsCreating(false);
        setEditSaving(false);
        setEditError("");
    }

    async function submitEdit(e) {
        e.preventDefault();
        setEditError("");
        setEditSaving(true);
        try {
            const payload = {
                name: editForm.name,
                active: editForm.active,
                id_chief: editForm.id_chief ? Number(editForm.id_chief) : null,
            };
            if (isCreating) {
                await createSpeciality(payload);
                await loadSpecialities();
                showToast("Especialidad creada correctamente", "success");
            } else {
                await updateSpeciality(editRow.id, payload);
                setSpecialities((prev) =>
                    prev.map((s) => (s.id === editRow.id ? { ...s, ...payload } : s))
                );
                setUpdatedRowId(editRow.id);
                setTimeout(() => setUpdatedRowId(null), 1200);
                showToast("Especialidad actualizada correctamente", "success");
            }
            closeEdit();
        } catch (err) {
            setEditError(err?.response?.data?.error || err?.message || "Error al guardar");
        } finally {
            setEditSaving(false);
        }
    }

    function handleDelete(row) {
        setDeleteRow(row);
        setDeleteError("");
        setDeleteOpen(true);
    }

    async function confirmDelete() {
        if (!deleteRow) return;
        const id = deleteRow.id;
        setDeleteLoading(true);
        setDeleteError("");
        setDeletingId(id);
        try {
            await deleteSpeciality(id);
            setTimeout(() => {
                setSpecialities((prev) => prev.filter((s) => s.id !== id));
                setDeletingId(null);
            }, 180);
            showToast("Especialidad eliminada correctamente", "success");
            setDeleteOpen(false);
            setDeleteRow(null);
        } catch (err) {
            setDeletingId(null);
            setDeleteError(err?.response?.data?.error || err?.message || "No se pudo eliminar");
        } finally {
            setDeleteLoading(false);
        }
    }

    function cancelDelete() {
        setDeleteOpen(false);
        setDeleteRow(null);
        setDeleteError("");
    }

    function onEditFieldChange(e) {
        const { name, value, type, checked } = e.target;
        setEditForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    }

    return (
        <>
            <div className="guPage">
                <main className="guMain">
                    <div className="guCard">
                        {/* HEADER */}
                        <div className="guHeaderRow">
                            <div className="guHeaderLeft">
                                <div className="guSearch">
                                    <span className="material-icons">search</span>
                                    <input
                                        type="text"
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
                                <button className="guBtn primary" type="button" onClick={handleCreate}>
                                    <span className="material-icons">add_circle</span>
                                    Crear especialidad
                                </button>
                            </div>
                        </div>

                        {error && <div className="guError">{error}</div>}

                        {/* TABLA */}
                        <div className="guTableWrap">
                            <table className="guTable">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Estado</th>
                                        <th>Jefe de Especialidad</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                            <tr key={`sk-${i}`} className="cdSkRow">
                                                <td><div className="cdSk skMd" /></td>
                                                <td><div className="cdSk skSm" /></td>
                                                <td><div className="cdSk skLg" /></td>
                                                <td><div className="cdSk skBtn" /></td>
                                            </tr>
                                        ))
                                    ) : specialities.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="cdTableEmpty">
                                                No hay especialidades
                                            </td>
                                        </tr>
                                    ) : (
                                        pagedRows.map((row) => {
                                            const chief = workers.find((w) => w.id == row.id_chief);
                                            return (
                                                <tr
                                                    key={row.id}
                                                    className={[
                                                        "cdRowEnter",
                                                        row.id === updatedRowId ? "cdRowUpdated" : "",
                                                        row.id === deletingId ? "cdRowExit" : "",
                                                    ].join(" ")}
                                                >
                                                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                                                    <td>
                                                        <span style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "6px",
                                                            padding: "3px 10px",
                                                            borderRadius: "999px",
                                                            fontSize: "12px",
                                                            fontWeight: 600,
                                                            background: row.active ? "#DCFCE7" : "#F1F5F9",
                                                            color: row.active ? "#15803D" : "#64748B",
                                                        }}>
                                                            <span className="material-icons" style={{ fontSize: "14px" }}>
                                                                {row.active ? "check_circle" : "cancel"}
                                                            </span>
                                                            {row.active ? "Activa" : "Inactiva"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {chief ? (
                                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                                <span className="material-icons" style={{ fontSize: "16px", color: "#fbbf24" }}>star</span>
                                                                <span>{chief.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: "#94A3B8", fontStyle: "italic" }}>Sin asignar</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="cdActionsCenter">
                                                            <RowActions
                                                                row={row}
                                                                onEdit={handleEdit}
                                                                onDelete={handleDelete}
                                                                disabled={loading}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINACIÓN */}
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
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || loading}
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
                                            disabled={loading}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}
                                <button
                                    className="ggPagerArrow"
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || loading}
                                    aria-label="Siguiente"
                                >
                                    <span className="material-icons-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* MODAL CREAR/EDITAR */}
                    {editOpen && (
                        <div className="modalOverlay centered" role="dialog" aria-modal="true" aria-label="Especialidad">
                            <div className="modalSheet">
                                <form onSubmit={submitEdit}>
                                    <div className="modalBody">
                                        <div className="modalHeader">
                                            <div className="modalIcon">
                                                <span className="material-icons">edit</span>
                                            </div>
                                            <div>
                                                <div className="modalTitle">
                                                    {isCreating ? "Crear" : "Editar"} Especialidad
                                                </div>
                                                <div className="modalSubtitle">
                                                    {isCreating
                                                        ? "Rellena los campos para añadir una nueva especialidad."
                                                        : "Modifica los campos y guarda los cambios."}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="formGrid">
                                            <label className="label" style={{ gridColumn: "1 / -1" }}>
                                                Nombre
                                                <input
                                                    name="name"
                                                    className="control"
                                                    value={editForm.name}
                                                    onChange={onEditFieldChange}
                                                    required
                                                    minLength={3}
                                                    maxLength={20}
                                                    placeholder="Nombre de la especialidad"
                                                />
                                            </label>

                                            <label className="label">
                                                Jefe de Especialidad
                                                <Select2
                                                    placeholder="-- Sin asignar --"
                                                    options={workerOptions}
                                                    value={editForm.id_chief}
                                                    onChange={(val) =>
                                                        onEditFieldChange({ target: { name: "id_chief", value: val } })
                                                    }
                                                />
                                            </label>

                                            <label className="label" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", paddingTop: "20px" }}>
                                                <input
                                                    name="active"
                                                    type="checkbox"
                                                    checked={editForm.active}
                                                    onChange={onEditFieldChange}
                                                    style={{ width: "16px", height: "16px", accentColor: "#006236", cursor: "pointer" }}
                                                />
                                                <span>Activa</span>
                                            </label>
                                        </div>

                                        {editError && (
                                            <div style={{ marginTop: 10, color: "#b91c1c", fontWeight: 700, fontSize: 13 }}>
                                                {editError}
                                            </div>
                                        )}
                                    </div>

                                    <div className="modalFooter">
                                        <div style={{ display: "flex", gap: 10 }}>
                                            <button className="btnPrimary" type="submit" disabled={editSaving}>
                                                {editSaving
                                                    ? (isCreating ? "Creando..." : "Guardando...")
                                                    : (isCreating ? "Crear" : "Guardar")}
                                            </button>
                                            <button
                                                className="btnSecondary btnSecondary--destructive"
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); closeEdit(); }}
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

                    {/* MODAL ELIMINAR */}
                    {deleteOpen && (
                        <div className="modalOverlay centered" role="dialog" aria-modal="true" aria-label="Confirmar eliminación">
                            <div className="modalSheet">
                                <div className="modalBody">
                                    <div className="modalHeader">
                                        <div className="modalIcon">
                                            <span className="material-icons">delete</span>
                                        </div>
                                        <div>
                                            <div className="modalTitle">Eliminar Especialidad</div>
                                            <div className="modalSubtitle">
                                                ¿Seguro que quieres eliminar{" "}
                                                <strong>{deleteRow?.name}</strong>?
                                                Esta acción no se puede deshacer.
                                            </div>
                                            {deleteError && (
                                                <div style={{ marginTop: 8, color: "#b91c1c", fontWeight: 700 }}>
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
                                            {deleteLoading ? "Eliminando..." : "Eliminar"}
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
