import { useEffect, useMemo, useState } from "react";
import "../styles/GestionGuardias.css";
import { getDuties, updateDuty, deleteDuty } from "../services/DutyService";
import { assignChiefs, getWorkers, isUserAdmin } from "../services/userService";
import { getSpecialities } from "../services/SpecialitiesService";

export default function GestionGuardias() {
    // Verificar si el usuario es admin
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(isUserAdmin());
    }, []);

    // Modal "Asignar jefe automáticamente"
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estado tabla (empieza vacío)
    const [guardias, setGuardias] = useState([]);

    // estados extra para UX
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    // ✅ estado modal asignar
    const [assignMonth, setAssignMonth] = useState(() =>
        String(new Date().getMonth() + 1).padStart(2, "0"),
    ); // "01".."12"
    const [assignYear, setAssignYear] = useState(() =>
        String(new Date().getFullYear()),
    );
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignMsg, setAssignMsg] = useState("");

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
        const now = new Date().getFullYear();
        const start = now - 3;
        const end = now + 3;
        const arr = [];
        for (let y = start; y <= end; y++) arr.push(String(y));
        return arr;
    }, []);

    // Estados para especialidades y trabajadores
    const [specialities, setSpecialities] = useState([]);
    const [workers, setWorkers] = useState([]);

    // ✅ recargar guardias (reutilizable)
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
        } catch (e) {
            console.error(e);
            setGuardias([]);
            setLoadError("No se pudieron cargar las guardias.");
        } finally {
            setLoading(false);
        }
    }

    // cargar guardias al montar
    useEffect(() => {
        reloadDuties();

        // Cargar especialidades
        getSpecialities()
            .then((data) => {
                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                      ? data.data
                      : [];
                setSpecialities(arr);
            })
            .catch((e) => console.error("Error cargando especialidades:", e));

        // Cargar trabajadores
        getWorkers()
            .then((data) => {
                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.data)
                      ? data.data
                      : [];
                setWorkers(arr);
            })
            .catch((e) => console.error("Error cargando trabajadores:", e));
    }, []);

    // ✅ abrir modal: pre-rellena mes/año con el primer registro si existe
    function openAssignModal() {
        setAssignMsg("");

        if (guardias?.length) {
            const d = new Date(guardias[0].date); // espera "YYYY-MM-DD"
            if (!Number.isNaN(d.getTime())) {
                setAssignYear(String(d.getFullYear()));
                setAssignMonth(String(d.getMonth() + 1).padStart(2, "0"));
            }
        } else {
            const now = new Date();
            setAssignYear(String(now.getFullYear()));
            setAssignMonth(String(now.getMonth() + 1).padStart(2, "0"));
        }

        setIsModalOpen(true);
    }

    // ✅ confirmar asignación
    async function handleAssignChiefs() {
        setAssignLoading(true);
        setAssignMsg("");
        setLoadError("");

        try {
            const monthNum = Number(assignMonth); // backend quiere number
            const yearNum = Number(assignYear);

            if (!monthNum || monthNum < 1 || monthNum > 12) {
                setAssignMsg("Mes inválido.");
                return;
            }
            if (!yearNum || yearNum < 2000 || yearNum > 2100) {
                setAssignMsg("Año inválido.");
                return;
            }

            // ✅ llama a tu endpoint /assingChiefs?month=&year=
            await assignChiefs(monthNum, yearNum);

            // ✅ recargar tabla
            await reloadDuties();

            setAssignMsg("Jefes asignados correctamente.");
            setIsModalOpen(false);
        } catch (e) {
            console.error(e);
            setAssignMsg(e.message || "Error asignando jefes.");
        } finally {
            setAssignLoading(false);
        }
    }

    // Modal editar
    const [editOpen, setEditOpen] = useState(false);
    const [editRowId, setEditRowId] = useState(null);
    const [editForm, setEditForm] = useState({
        date: "",
        duty_type: "CA",
        id_speciality: "",
        id_worker: "",
        id_chief_worker: "",
    });
    const [editSpecialityName, setEditSpecialityName] = useState("");
    const [editError, setEditError] = useState("");

    // Filtrar trabajadores por especialidad seleccionada
    const filteredWorkers = useMemo(() => {
        if (!editForm.id_speciality || workers.length === 0) return workers;
        const specialityId = Number(editForm.id_speciality);
        return workers.filter((w) => {
            const workerSpeciality = Number(w.id_speciality);
            return workerSpeciality === specialityId;
        });
    }, [editForm.id_speciality, workers]);

    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Paginación
    const PAGE_SIZE = 8;
    const [page, setPage] = useState(1);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(guardias.length / PAGE_SIZE));
    }, [guardias.length]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const pagedGuardias = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return guardias.slice(start, start + PAGE_SIZE);
    }, [guardias, page]);

    function pillClass(type) {
        const t = (type || "").toLowerCase();
        if (t === "ca") return "ca";
        if (t === "pf") return "pf";
        if (t === "loc") return "loc";
        return "";
    }

    // Editar
    function handleEdit(row) {
        setEditRowId(row.id);
        setEditForm({
            date: row.date ?? "",
            duty_type: row.duty_type ?? "CA",
            id_speciality: String(row.id_speciality ?? ""),
            id_worker: String(row.id_worker ?? ""),
            id_chief_worker:
                row.id_chief_worker == null ? "" : String(row.id_chief_worker),
        });
        setEditSpecialityName(row.speciality ?? "");
        setEditError("");
        setEditOpen(true);
    }

    function handleSaveEdit(e) {
        e?.preventDefault?.();
        setEditError("");

        // Validar campos vacíos
        if (!editForm.date) {
            setEditError("La fecha es obligatoria.");
            return;
        }
        if (!editForm.duty_type) {
            setEditError("El tipo es obligatorio.");
            return;
        }
        if (!editForm.id_worker) {
            setEditError("Debes seleccionar un trabajador.");
            return;
        }

        const updated = {
            date: editForm.date,
            duty_type: editForm.duty_type,
            id_speciality: Number(editForm.id_speciality || 0),
            id_worker: Number(editForm.id_worker || 0),
            id_chief_worker:
                editForm.id_chief_worker === ""
                    ? null
                    : Number(editForm.id_chief_worker),
        };

        // Hacer la llamada a la API
        setLoading(true);
        updateDuty(editRowId, updated)
            .then(() => {
                // Recargar guardias desde el servidor después de actualizar
                return reloadDuties();
            })
            .then(() => {
                setEditOpen(false);
                setEditRowId(null);
                setEditError("");
            })
            .catch((error) => {
                console.error("Error al guardar guardia:", error);
                setEditError(error.message || "Error al guardar la guardia");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    // Borrar
    function handleDelete(row) {
        setDeleteRow(row);
        setDeleteError("");
        setDeleteOpen(true);
    }

    function confirmDelete() {
        if (!deleteRow) return;
        setDeleteError("");

        // Hacer la llamada a la API
        setLoading(true);
        deleteDuty(deleteRow.id)
            .then(() => {
                // Recargar guardias desde el servidor después de eliminar
                return reloadDuties();
            })
            .then(() => {
                setDeleteOpen(false);
                setDeleteRow(null);
                setDeleteError("");
            })
            .catch((error) => {
                console.error("Error al eliminar guardia:", error);
                setDeleteError(error.message || "Error al eliminar la guardia");
            })
            .finally(() => {
                setLoading(false);
            });
    }

    function cancelDelete() {
        setDeleteOpen(false);
        setDeleteRow(null);
        setDeleteError("");
    }

    // Helpers paginación
    function goPrev() {
        setPage((p) => Math.max(1, p - 1));
    }
    function goNext() {
        setPage((p) => Math.min(totalPages, p + 1));
    }

    const pageButtons = useMemo(() => {
        const maxButtons = 7;
        if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const windowSize = 5;
        const half = Math.floor(windowSize / 2);
        let start = Math.max(2, page - half);
        let end = Math.min(totalPages - 1, page + half);

        if (page <= 3) {
            start = 2;
            end = 2 + (windowSize - 1);
        } else if (page >= totalPages - 2) {
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
    }, [page, totalPages]);

    return (
        <div className="ggPage">
            <main className="ggMain">
                <section className="ggCard" aria-label="Listado de guardias">
                    <div className="ggCardTop">
                        <div className="ggCardTitle">Guardias</div>
                        <div className="ggCount">
                            {loading
                                ? "Cargando..."
                                : `${guardias.length} registros · Página ${page} / ${totalPages}`}
                        </div>
                    </div>

                    {/* error de carga */}
                    {loadError && (
                        <div
                            style={{
                                padding: "10px 14px",
                                color: "#b91c1c",
                                fontWeight: 700,
                            }}
                        >
                            {loadError}
                        </div>
                    )}

                    <div className="ggTableWrap">
                        <table className="ggTable">
                            <thead>
                                <tr>
                                    <th className="ggColDate">FECHA</th>
                                    <th className="ggColCenter">TIPO</th>
                                    <th className="ggColCenter">
                                        ESPECIALIDAD
                                    </th>
                                    <th className="ggColCenter">TRABAJADOR</th>
                                    <th className="ggColCenter">JEFE</th>
                                    {isAdmin && (
                                        <th className="ggColActions">
                                            ACCIONES
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            className="ggEmpty"
                                            colSpan={isAdmin ? 6 : 5}
                                        >
                                            Cargando guardias...
                                        </td>
                                    </tr>
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
                                        <tr key={g.id}>
                                            <td className="ggColDate ggMono">
                                                {g.date}
                                            </td>

                                            <td className="ggColCenter">
                                                <span
                                                    className={`ggPill ${pillClass(g.duty_type)}`}
                                                >
                                                    {g.duty_type}
                                                </span>
                                            </td>

                                            <td className="ggColCenter ggMono">
                                                {g.speciality}
                                            </td>
                                            <td className="ggColCenter ggMono">
                                                {g.worker}
                                            </td>
                                            <td className="ggColCenter ggMono">
                                                {g.chief_worker ?? "—"}
                                            </td>

                                            <td className="ggColActions">
                                                {isAdmin && (
                                                    <div className="ggActionsCenter">
                                                        <button
                                                            className="ggIconBtn"
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(g)
                                                            }
                                                            title="Editar"
                                                        >
                                                            <span className="material-icons-outlined">
                                                                edit
                                                            </span>
                                                        </button>

                                                        <button
                                                            className="ggIconBtn danger"
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(g)
                                                            }
                                                            title="Borrar"
                                                        >
                                                            <span className="material-icons-outlined">
                                                                delete
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ggPager">
                        <button
                            className="ggPagerBtn"
                            type="button"
                            onClick={goPrev}
                            disabled={page === 1 || loading}
                        >
                            <span className="material-icons-outlined">
                                chevron_left
                            </span>
                            Anterior
                        </button>

                        <div className="ggPagerNums" aria-label="Páginas">
                            {pageButtons.map((p, idx) =>
                                p === "..." ? (
                                    <span
                                        className="ggPagerEllipsis"
                                        key={`e-${idx}`}
                                    >
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
                                ),
                            )}
                        </div>

                        <button
                            className="ggPagerBtn"
                            type="button"
                            onClick={goNext}
                            disabled={page === totalPages || loading}
                        >
                            Siguiente
                            <span className="material-icons-outlined">
                                chevron_right
                            </span>
                        </button>
                    </div>
                </section>

                <div className="ctaWrap">
                    {/* ✅ abre modal con mes/año */}
                    {isAdmin && (
                        <button
                            className="ctaBtn"
                            type="button"
                            onClick={openAssignModal}
                            disabled={loading}
                        >
                            <span className="material-icons">
                                add_circle_outline
                            </span>
                            <span>Asignar jefe automaticamente</span>
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

            {/* MODAL EDITAR */}
            {editOpen && (
                <div
                    className="modalOverlay centered"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Editar Guardia"
                >
                    <div className="modalSheet">
                        <form onSubmit={handleSaveEdit}>
                            <div className="modalBody">
                                <div className="modalHeader">
                                    <div className="modalIcon">
                                        <span className="material-icons">
                                            edit
                                        </span>
                                    </div>
                                    <div>
                                        <div className="modalTitle">
                                            Editar Guardia
                                        </div>
                                        <div className="modalSubtitle">
                                            Actualiza los campos de la guardia
                                            seleccionada.
                                        </div>
                                    </div>
                                </div>

                                {editError && (
                                    <div
                                        role="alert"
                                        style={{
                                            background: "#fef2f2",
                                            border: "1px solid #fecaca",
                                            color: "#b91c1c",
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            marginBottom: "12px",
                                            fontSize: "14px",
                                            fontWeight: 500,
                                        }}
                                    >
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
                                            onChange={(e) =>
                                                setEditForm((p) => ({
                                                    ...p,
                                                    date: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </label>

                                    <label className="label">
                                        Tipo
                                        <select
                                            className="control"
                                            value={editForm.duty_type}
                                            onChange={(e) =>
                                                setEditForm((p) => ({
                                                    ...p,
                                                    duty_type: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="CA">
                                                CA (Continuidad)
                                            </option>
                                            <option value="PF">
                                                PF (Presencia Física)
                                            </option>
                                            <option value="LOC">
                                                LOC (Localizada)
                                            </option>
                                        </select>
                                    </label>

                                    <label className="label">
                                        Especialidad
                                        <input
                                            className="control"
                                            type="text"
                                            value={editSpecialityName}
                                            disabled
                                            title="La especialidad no se puede cambiar"
                                        />
                                    </label>

                                    <label className="label">
                                        Trabajador
                                        <select
                                            className="control"
                                            value={editForm.id_worker}
                                            onChange={(e) =>
                                                setEditForm((p) => ({
                                                    ...p,
                                                    id_worker: e.target.value,
                                                }))
                                            }
                                            required
                                        >
                                            <option value="">
                                                Selecciona un trabajador
                                            </option>
                                            {filteredWorkers.map((worker) => (
                                                <option
                                                    key={worker.id}
                                                    value={worker.id}
                                                >
                                                    {worker.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="label">
                                        Jefe (opcional)
                                        <select
                                            className="control"
                                            value={editForm.id_chief_worker}
                                            onChange={(e) =>
                                                setEditForm((p) => ({
                                                    ...p,
                                                    id_chief_worker:
                                                        e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Sin jefe</option>
                                            {workers.map((worker) => (
                                                <option
                                                    key={worker.id}
                                                    value={worker.id}
                                                >
                                                    {worker.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>

                            <div className="modalFooter">
                                <button className="btnPrimary" type="submit">
                                    Guardar cambios
                                </button>
                                <button
                                    className="btnSecondary"
                                    type="button"
                                    onClick={() => setEditOpen(false)}
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
                <div
                    className="modalOverlay centered"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirmar borrado"
                >
                    <div className="modalSheet">
                        <div className="modalBody">
                            <div className="modalHeader">
                                <div
                                    className="modalIcon"
                                    style={{
                                        background: "rgba(185, 28, 28, .12)",
                                        color: "#b91c1c",
                                    }}
                                >
                                    <span className="material-icons">
                                        delete_forever
                                    </span>
                                </div>
                                <div>
                                    <div className="modalTitle">
                                        Eliminar guardia
                                    </div>
                                    <div className="modalSubtitle">
                                        Esta acción no se puede deshacer.
                                        Confirma si quieres eliminarla.
                                    </div>
                                </div>
                            </div>

                            <div className="formGrid">
                                <div className="label">
                                    Resumen
                                    <div
                                        className="control"
                                        style={{ background: "#F9FAFB" }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 10,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <span>
                                                <b>ID:</b> {deleteRow.id}
                                            </span>
                                            <span>
                                                <b>Fecha:</b> {deleteRow.date}
                                            </span>
                                            <span>
                                                <b>Tipo:</b>{" "}
                                                {deleteRow.duty_type}
                                            </span>
                                            <span>
                                                <b>Trabajador:</b>{" "}
                                                {deleteRow.id_worker}
                                            </span>
                                        </div>
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
                                    margin: "0 16px 12px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                }}
                            >
                                {deleteError}
                            </div>
                        )}

                        <div className="modalFooter">
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="btnPrimary"
                                style={{ background: "#b91c1c" }}
                            >
                                Eliminar
                            </button>
                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="btnSecondary"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ MODAL ASIGNAR JEFE AUTOMÁTICO (funcional) */}
            {isModalOpen && (
                <div
                    className="modalOverlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Asignar Jefe de Guardia"
                >
                    <div className="modalSheet">
                        <div className="modalBody">
                            <div className="modalHeader">
                                <div className="modalIcon">
                                    <span className="material-icons">
                                        admin_panel_settings
                                    </span>
                                </div>
                                <div>
                                    <div className="modalTitle">
                                        Asignar Jefe de Guardia
                                    </div>
                                    <div className="modalSubtitle">
                                        Selecciona mes y año y asigna
                                        automáticamente.
                                    </div>
                                </div>
                            </div>

                            <div className="formGrid">
                                <label className="label">
                                    Mes
                                    <select
                                        className="control"
                                        value={assignMonth}
                                        onChange={(e) =>
                                            setAssignMonth(e.target.value)
                                        }
                                        disabled={assignLoading}
                                    >
                                        {months.map((m) => (
                                            <option
                                                key={m.value}
                                                value={m.value}
                                            >
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
                                        onChange={(e) =>
                                            setAssignYear(e.target.value)
                                        }
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
                                    <div
                                        className="label"
                                        style={{ gridColumn: "1 / -1" }}
                                    >
                                        <div
                                            className="control"
                                            style={{ background: "#F9FAFB" }}
                                        >
                                            {assignMsg}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modalFooter">
                            <button
                                className="btnPrimary"
                                onClick={handleAssignChiefs}
                                type="button"
                                disabled={assignLoading}
                            >
                                {assignLoading
                                    ? "Asignando..."
                                    : "Asignar automáticamente"}
                            </button>
                            <button
                                className="btnSecondary"
                                onClick={() => setIsModalOpen(false)}
                                type="button"
                                disabled={assignLoading}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
