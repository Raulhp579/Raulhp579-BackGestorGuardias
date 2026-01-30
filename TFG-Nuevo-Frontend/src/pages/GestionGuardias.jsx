import { useEffect, useMemo, useState } from "react";
import "../styles/GestionGuardias.css";
import { getDuties, updateDuty, deleteDuty } from "../services/DutyService";
import { assignChiefs, getWorkers, isUserAdmin } from "../services/userService";
import { getSpecialities } from "../services/SpecialitiesService";

export default function GestionGuardias() {
    const SKELETON_ROWS = 8;

    // ✅ micro-animaciones filas (EDIT + DELETE)
    const [updatedRowId, setUpdatedRowId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // tabla
    const [guardias, setGuardias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    // admin + datos auxiliares
    const [isAdmin, setIsAdmin] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [specialities, setSpecialities] = useState([]);

    // paginación
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // modal asignar jefes
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assignMonth, setAssignMonth] = useState(() =>
        String(new Date().getMonth() + 1).padStart(2, "0")
    );
    const [assignYear, setAssignYear] = useState(() => String(new Date().getFullYear()));
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignMsg, setAssignMsg] = useState("");

    // modal editar
    const [editOpen, setEditOpen] = useState(false);
    const [editRowId, setEditRowId] = useState(null);
    const [editForm, setEditForm] = useState({
        date: "",
        duty_type: "CA",
        id_speciality: "",
        id_worker: "",
        id_chief_worker: "",
    });
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
        []
    );

    const years = useMemo(() => {
        const now = new Date().getFullYear();
        const arr = [];
        for (let y = now - 3; y <= now + 3; y++) arr.push(String(y));
        return arr;
    }, []);

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
            const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
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
                const arr = Array.isArray(w) ? w : Array.isArray(w?.data) ? w.data : [];
                setWorkers(arr);
            } catch {
                setWorkers([]);
            }
            try {
                const s = await getSpecialities();
                const arr = Array.isArray(s) ? s : Array.isArray(s?.data) ? s.data : [];
                setSpecialities(arr);
            } catch {
                setSpecialities([]);
            }
        })();
    }, []);

    // paginación calculada
    const totalPages = useMemo(() => {
        const t = Math.ceil((guardias?.length || 0) / pageSize);
        return Math.max(1, t);
    }, [guardias.length]);

    const pagedGuardias = useMemo(() => {
        const start = (page - 1) * pageSize;
        return guardias.slice(start, start + pageSize);
    }, [guardias, page]);

    function goPrev() {
        setPage((p) => Math.max(1, p - 1));
    }
    function goNext() {
        setPage((p) => Math.min(totalPages, p + 1));
    }

    const pageButtons = useMemo(() => {
        const maxButtons = 7;
        if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);

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
        setEditRowId(row.id);
        setEditForm({
            date: row.date || "",
            duty_type: row.duty_type || "CA",
            id_speciality: row.id_speciality ? String(row.id_speciality) : "",
            id_worker: row.id_worker ? String(row.id_worker) : "",
            id_chief_worker:
                row.id_chief_worker === null || row.id_chief_worker === undefined ? "" : String(row.id_chief_worker),
        });
        setEditOpen(true);
    }

    async function handleSaveEdit(e) {
        e?.preventDefault?.();
        setEditError("");

        if (!editRowId) return;
        if (!editForm.date) return setEditError("La fecha es obligatoria.");
        if (!editForm.duty_type) return setEditError("El tipo es obligatorio.");

        const payload = {
            date: editForm.date,
            duty_type: editForm.duty_type,
            id_speciality: editForm.id_speciality ? Number(editForm.id_speciality) : null,
            id_worker: editForm.id_worker ? Number(editForm.id_worker) : null,
            id_chief_worker: editForm.id_chief_worker === "" ? null : Number(editForm.id_chief_worker),
        };

        // UI optimista + backend
        setEditSaving(true);
        try {
            // si tu backend lo necesita distinto, ajustas aquí
            await updateDuty(editRowId, payload);

            setGuardias((prev) => prev.map((g) => (g.id === editRowId ? { ...g, ...payload } : g)));

            setUpdatedRowId(editRowId);
            setTimeout(() => setUpdatedRowId(null), 1200);

            setEditOpen(false);
            setEditRowId(null);
        } catch (err) {
            console.error(err);
            setEditError(err?.message || "No se pudo guardar la edición.");
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
        } catch (err) {
            console.error(err);
            setDeletingId(null);
            setDeleteError(err?.message || "No se pudo eliminar la guardia.");
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
                <section className="ggCard" aria-label="Listado de guardias">
                    <div className="ggCardTop">
                        <div className="ggCardTitle">Guardias</div>
                        <div className="ggCount">
                            {loading ? "Cargando..." : `${guardias.length} registros · Página ${page} / ${totalPages}`}
                        </div>
                    </div>

                    {loadError && (
                        <div style={{ padding: "10px 14px", color: "#b91c1c", fontWeight: 700 }}>{loadError}</div>
                    )}

                    <div className="ggTableWrap">
                        <table className="ggTable">
                            <thead>
                                <tr>
                                    <th className="ggColDate">FECHA</th>
                                    <th className="ggColCenter">TIPO</th>
                                    <th className="ggColCenter">ESPECIALIDAD</th>
                                    <th className="ggColCenter">TRABAJADOR</th>
                                    <th className="ggColCenter">JEFE</th>
                                    {isAdmin && <th className="ggColActions">ACCIONES</th>}
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                        <tr key={`sk-${i}`} className="ggSkRow">
                                            <td className="ggColDate">
                                                <div className="ggSk skMd" />
                                            </td>
                                            <td className="ggColCenter">
                                                <div className="ggSk skXs" />
                                            </td>
                                            <td className="ggColCenter">
                                                <div className="ggSk skLg" />
                                            </td>
                                            <td className="ggColCenter">
                                                <div className="ggSk skLg" />
                                            </td>
                                            <td className="ggColCenter">
                                                <div className="ggSk skSm" />
                                            </td>
                                            {isAdmin && (
                                                <td className="ggColActions">
                                                    <div className="ggActionsCenter">
                                                        <div className="ggSk skBtn" />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : pagedGuardias.length === 0 ? (
                                    <tr>
                                        <td className="ggEmpty" colSpan={isAdmin ? 6 : 5}>
                                            No hay guardias registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    pagedGuardias.map((g) => (
                                        <tr
                                            key={g.id}
                                            className={[
                                                "ggRowEnter",
                                                g.id === updatedRowId ? "ggRowUpdated" : "",
                                                g.id === deletingId ? "ggRowExit" : "",
                                            ].join(" ")}
                                        >
                                            <td className="ggColDate ggMono">{g.date}</td>

                                            <td className="ggColCenter">
                                                <span className={`ggPill ${pillClass(g.duty_type)}`}>{g.duty_type}</span>
                                            </td>

                                            <td className="ggColCenter ggMono">{g.speciality}</td>
                                            <td className="ggColCenter ggMono">{g.worker}</td>
                                            <td className="ggColCenter ggMono">{g.chief_worker ?? "—"}</td>

                                            {isAdmin && (
                                                <td className="ggColActions">
                                                    <div className="ggActionsCenter">
                                                        <button className="ggIconBtn" type="button" onClick={() => handleEdit(g)} title="Editar">
                                                            <span className="material-icons-outlined">edit</span>
                                                        </button>

                                                        <button
                                                            className="ggIconBtn danger"
                                                            type="button"
                                                            onClick={() => handleDelete(g)}
                                                            title="Borrar"
                                                            disabled={deletingId === g.id}
                                                        >
                                                            <span className="material-icons-outlined">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ggPager">
                        <button className="ggPagerBtn" type="button" onClick={goPrev} disabled={page === 1 || loading}>
                            <span className="material-icons-outlined">chevron_left</span>
                            Anterior
                        </button>

                        <div className="ggPagerNums" aria-label="Páginas">
                            {pageButtons.map((p, idx) =>
                                p === "..." ? (
                                    <span className="ggPagerEllipsis" key={`e-${idx}`}>
                                        …
                                    </span>
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
                                )
                            )}
                        </div>

                        <button className="ggPagerBtn" type="button" onClick={goNext} disabled={page === totalPages || loading}>
                            Siguiente
                            <span className="material-icons-outlined">chevron_right</span>
                        </button>
                    </div>
                </section>

                <div className="ctaWrap">
                    {isAdmin && (
                        <button className="ctaBtn" type="button" onClick={openAssignModal} disabled={loading}>
                            <span className="material-icons">add_circle_outline</span>
                            <span>Asignar jefe automáticamente</span>
                        </button>
                    )}
                </div>
            </main>

            {/* Bottom nav */}
            <nav className="bottomNav" aria-label="Navegación inferior">
                <a className="navItem active" href="#">
                    <span className="material-icons">calendar_month</span>
                    <span>Guardias</span>
                </a>
                <a className="navItem" href="#">
                    <span className="material-icons">calculate</span>
                    <span>Cálculos</span>
                </a>
                <a className="navItem" href="#">
                    <span className="material-icons">description</span>
                    <span>Informes</span>
                </a>
                <a className="navItem" href="#">
                    <span className="material-icons">settings</span>
                    <span>Ajustes</span>
                </a>
            </nav>

            {/* MODAL ASIGNAR JEFE */}
            {isAssignOpen && (
                <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Asignar Jefe de Guardia">
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
                                    <select
                                        className="control"
                                        value={assignMonth}
                                        onChange={(e) => setAssignMonth(e.target.value)}
                                        disabled={assignLoading}
                                    >
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label} ({m.value})
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="label">
                                    Año
                                    <select
                                        className="control"
                                        value={assignYear}
                                        onChange={(e) => setAssignYear(e.target.value)}
                                        disabled={assignLoading}
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {assignMsg && (
                                    <div className="label" style={{ gridColumn: "1 / -1" }}>
                                        <div className="control" style={{ background: "#F9FAFB" }}>
                                            {assignMsg}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modalFooter">
                            <button className="btnPrimary" onClick={handleAssignChiefs} type="button" disabled={assignLoading}>
                                {assignLoading ? "Asignando..." : "Asignar automáticamente"}
                            </button>
                            <button className="btnSecondary" onClick={() => setIsAssignOpen(false)} type="button" disabled={assignLoading}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR */}
            {editOpen && (
                <div className="modalOverlay centered" role="dialog" aria-modal="true" aria-label="Editar Guardia">
                    <div className="modalSheet">
                        <form onSubmit={handleSaveEdit}>
                            <div className="modalBody">
                                <div className="modalHeader">
                                    <div className="modalIcon">
                                        <span className="material-icons">edit</span>
                                    </div>
                                    <div>
                                        <div className="modalTitle">Editar Guardia</div>
                                        <div className="modalSubtitle">Actualiza los campos de la guardia seleccionada.</div>
                                    </div>
                                </div>

                                {editError && (
                                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: 12, borderRadius: 10 }}>
                                        {editError}
                                    </div>
                                )}

                                <div className="formGrid">
                                    <label className="label">
                                        Fecha
                                        <input
                                            className="control"
                                            type="date"
                                            value={editForm.date}
                                            onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                                            disabled={editSaving}
                                        />
                                    </label>

                                    <label className="label">
                                        Tipo
                                        <select
                                            className="control"
                                            value={editForm.duty_type}
                                            onChange={(e) => setEditForm((p) => ({ ...p, duty_type: e.target.value }))}
                                            disabled={editSaving}
                                        >
                                            <option value="CA">CA</option>
                                            <option value="PF">PF</option>
                                            <option value="LOC">LOC</option>
                                        </select>
                                    </label>

                                    <label className="label">
                                        Especialidad
                                        <select
                                            className="control"
                                            value={editForm.id_speciality}
                                            onChange={(e) => setEditForm((p) => ({ ...p, id_speciality: e.target.value }))}
                                            disabled={editSaving}
                                        >
                                            <option value="">—</option>
                                            {specialities.map((s) => (
                                                <option key={s.id} value={String(s.id)}>
                                                    {s.name} (id: {s.id})
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="label">
                                        Trabajador
                                        <select
                                            className="control"
                                            value={editForm.id_worker}
                                            onChange={(e) => setEditForm((p) => ({ ...p, id_worker: e.target.value }))}
                                            disabled={editSaving}
                                        >
                                            <option value="">—</option>
                                            {workers.map((w) => (
                                                <option key={w.id} value={String(w.id)}>
                                                    {w.name ?? w.email ?? `ID ${w.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="label" style={{ gridColumn: "1 / -1" }}>
                                        Jefe (opcional)
                                        <select
                                            className="control"
                                            value={editForm.id_chief_worker}
                                            onChange={(e) => setEditForm((p) => ({ ...p, id_chief_worker: e.target.value }))}
                                            disabled={editSaving}
                                        >
                                            <option value="">—</option>
                                            {workers.map((w) => (
                                                <option key={w.id} value={String(w.id)}>
                                                    {w.name ?? w.email ?? `ID ${w.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>

                            <div className="modalFooter">
                                <button className="btnPrimary" type="submit" disabled={editSaving}>
                                    {editSaving ? "Guardando..." : "Guardar"}
                                </button>
                                <button
                                    className="btnSecondary"
                                    type="button"
                                    onClick={() => {
                                        setEditOpen(false);
                                        setEditRowId(null);
                                        setEditError("");
                                    }}
                                    disabled={editSaving}
                                >
                                    Cancelar
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
                                <div className="modalIcon" style={{ background: "rgba(185, 28, 28, .12)", color: "#b91c1c" }}>
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
                                            <span>
                                                <b>ID:</b> {deleteRow.id}
                                            </span>
                                            <span>
                                                <b>Fecha:</b> {deleteRow.date}
                                            </span>
                                            <span>
                                                <b>Tipo:</b> {deleteRow.duty_type}
                                            </span>
                                            <span>
                                                <b>Trabajador:</b> {deleteRow.id_worker}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {deleteError && (
                                <div
                                    role="alert"
                                    style={{
                                        background: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        color: "#b91c1c",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        marginTop: 12,
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                >
                                    {deleteError}
                                </div>
                            )}
                        </div>

                        <div className="modalFooter">
                            <button type="button" onClick={confirmDelete} className="btnPrimary" style={{ background: "#b91c1c" }} disabled={deleteLoading}>
                                {deleteLoading ? "Eliminando..." : "Eliminar"}
                            </button>
                            <button type="button" onClick={cancelDelete} className="btnSecondary" disabled={deleteLoading}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
