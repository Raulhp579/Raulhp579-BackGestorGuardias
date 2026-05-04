import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GestionGuardias.css"; 
import {
    getFichajes,
    createFichaje,
    updateFichaje,
    deleteFichaje,
} from "../services/FichajeService";
import { getWorkers, isUserAdmin } from "../services/userService";
import { getDuties } from "../services/DutyService";
import RowActions from "../components/RowActions/RowActions";
import Select2 from "../components/Select2/Select2";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Joyride, { STATUS } from "react-joyride-react-19";

// Fix leaflet icon default behavior
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

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

export default function GestionFichajes() {
    const navigate = useNavigate();
    const pageSize = 10;

    // Table state
    const [fichajes, setFichajes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);

    // Aux data
    const [isAdmin, setIsAdmin] = useState(false);
    const [workers, setWorkers] = useState([]);
    const [duties, setDuties] = useState([]);

    // Modals
    const [editOpen, setEditOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editRowId, setEditRowId] = useState(null);
    const [editForm, setEditForm] = useState({
        date_time: "",
        type: "0",
        worker_id: "",
        id_duty: "",
    });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Animations
    const [updatedRowId, setUpdatedRowId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Joyride Steps
    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
        {
            target: ".tour-fichajes-header",
            content: "Paso 3: Aquí puedes monitorear todos los registros de jornada (entradas y salidas) en tiempo real.",
            disableBeacon: true,
        },
        {
            target: ".tour-fichajes-search",
            content: "Busca trabajadores específicos o filtra por email para revisar sus registros.",
        },
        {
            target: ".tour-fichajes-map-btn",
            content: "¡Muy importante! Haz clic en el icono del mapa para verificar la ubicación GPS exacta donde se realizó el fichaje.",
        },
    ];

    useEffect(() => {
        const phase = localStorage.getItem("tutorial_phase");
        if (phase === "PHASE_FICHAJES") {
            setRunTour(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            // Pasamos a la fase 4: Mis Guardias
            localStorage.setItem("tutorial_phase", "PHASE_MIS_GUARDIAS");
            setRunTour(false);
            navigate("/mis-guardias");
        }
    };

    // Map Modal Admin
    const [mapOpen, setMapOpen] = useState(false);
    const [mapRow, setMapRow] = useState(null);
    const adminMapRef = useRef(null);
    const adminMapContainerRef = useRef(null);

    useEffect(() => {
        if (mapOpen && mapRow && mapRow.latitude && mapRow.longitude) {
            setTimeout(() => {
                if (adminMapContainerRef.current && !adminMapRef.current) {
                    const map = L.map(adminMapContainerRef.current).setView([37.8802566, -4.8040947], 16);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap'
                    }).addTo(map);

                    // Medac Arena
                    L.circle([37.8802566, -4.8040947], {
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        radius: 300
                    }).addTo(map).bindPopup("MEDAC Arena");

                    // Employee Location
                    L.marker([mapRow.latitude, mapRow.longitude]).addTo(map)
                        .bindPopup(`<b>${mapRow.worker?.user?.name || 'Empleado'}</b><br>Fichaje: ${formatDateTime(mapRow.date_time)}`).openPopup();
                    
                    adminMapRef.current = map;
                }
            }, 100);
        }

        return () => {
            if (!mapOpen && adminMapRef.current) {
                adminMapRef.current.remove();
                adminMapRef.current = null;
            }
        };
    }, [mapOpen, mapRow]);

    const reloadData = async () => {
        setLoading(true);
        setLoadError("");
        try {
            const data = await getFichajes();
            setFichajes(Array.isArray(data) ? data : []);
        } catch (e) {
            setLoadError("No se pudieron cargar los fichajes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reloadData();
        (async () => {
            try {
                const admin = await isUserAdmin();
                setIsAdmin(Boolean(admin));
                
                const w = await getWorkers();
                setWorkers(Array.isArray(w) ? w : w?.data || []);
                
                const d = await getDuties();
                setDuties(Array.isArray(d) ? d : d?.data || []);
            } catch (e) {
                console.error("Error loading auxiliary data", e);
            }
        })();
    }, []);

    // Memoize options for Select2
    const workerOptions = useMemo(() =>
        workers.map(w => ({
            value: String(w.id),
            label: [w.name || w.user?.name, w.rank].filter(Boolean).join(" · ") || `ID: ${w.id}`
        }))
    , [workers]);

    const dutyOptions = useMemo(() =>
        duties.map(d => ({
            value: String(d.id),
            label: [d.speciality, d.date, d.duty_type ? `(${d.duty_type})` : null].filter(Boolean).join(" - ") || `ID: ${d.id}`
        }))
    , [duties]);

    // Filters & Pagination
    const filteredData = useMemo(() => {
        let res = [...fichajes];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            res = res.filter(f => 
                (f.worker?.user?.name || "").toLowerCase().includes(term) ||
                (f.worker?.user?.email || "").toLowerCase().includes(term)
            );
        }
        // Order by date_time descending
        res.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
        return res;
    }, [fichajes, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
    const pagedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page]);

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

    // Handlers
    const handleCreate = () => {
        setEditError("");
        setIsCreating(true);
        setEditRowId(null);
        setEditForm({
            date_time: new Date().toISOString().slice(0, 16),
            type: "0",
            worker_id: "",
            id_duty: "",
        });
        setEditOpen(true);
    };

    const handleEdit = (row) => {
        setEditError("");
        setIsCreating(false);
        setEditRowId(row.id);
        setEditForm({
            date_time: row.date_time ? row.date_time.replace(" ", "T").slice(0, 16) : "",
            type: String(row.type),
            worker_id: String(row.worker_id),
            id_duty: row.id_duty ? String(row.id_duty) : "",
        });
        setEditOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setEditError("");
        if (!editForm.date_time) return setEditError("La fecha y hora son obligatorias.");
        if (!editForm.worker_id) return setEditError("El trabajador es obligatorio.");

        setEditSaving(true);
        try {
            const payload = {
                ...editForm,
                worker_id: Number(editForm.worker_id),
                id_duty: editForm.id_duty ? Number(editForm.id_duty) : null,
                type: Number(editForm.type)
            };

            if (isCreating) {
                await createFichaje(payload);
                showToast("Fichaje creado correctamente.");
            } else {
                await updateFichaje(editRowId, payload);
                setUpdatedRowId(editRowId);
                setTimeout(() => setUpdatedRowId(null), 1200);
                showToast("Fichaje actualizado correctamente.");
            }
            setEditOpen(false);
            reloadData();
        } catch (err) {
            setEditError(err.message || "Error al guardar el fichaje.");
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = (row) => {
        setDeleteRow(row);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        setDeleteLoading(true);
        setDeletingId(deleteRow.id);
        try {
            await deleteFichaje(deleteRow.id);
            showToast("Fichaje eliminado.");
            setDeleteOpen(false);
            setTimeout(() => {
                setFichajes(prev => prev.filter(f => f.id !== deleteRow.id));
                setDeletingId(null);
            }, 200);
        } catch (e) {
            showToast("Error al eliminar el fichaje.", "error");
            setDeletingId(null);
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDateTime = (str) => {
        if (!str) return "-";
        return new Date(str).toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="ggPage">
            <main className="ggMain">
                <div className="ggTableCard">
                    <div className="ggTableCardTop">
                        <div className="ggTableTitleGroup">
                            <h2 className="ggTableCardTitle tour-fichajes-header">Gestión de Fichajes</h2>
                            <div className="ggTableCount">
                                {loading ? "Cargando..." : `${filteredData.length} registros`}
                            </div>
                        </div>

                        <div className="ggButtonsContainer">
                            {isAdmin && (
                                <button className="ggCtaBtn primary" onClick={handleCreate} disabled={loading}>
                                    <span className="material-icons">add_circle_outline</span>
                                    <span>Nuevo Fichaje</span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="ggFilterContainer tour-fichajes-search">
                        <div className="ggFilterToolbar">
                            <div className="ggFilterGroup ggFilterSearch">
                                <span className="material-icons ggFilterIcon">search</span>
                                <input
                                    className="ggSearchInput"
                                    type="text"
                                    placeholder="Buscar trabajador o email..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
                                {searchTerm && (
                                    <button onClick={() => { setSearchTerm(""); setPage(1); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9CA3AF' }}>
                                        <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="ggTableWrap">
                        <table className="ggTable">
                            <thead>
                                <tr>
                                    <th className="ggColDate">Fecha y Hora</th>
                                    <th className="ggColWorker">Trabajador</th>
                                    <th className="ggColType" style={{ textAlign: 'center' }}>Tipo</th>
                                    {isAdmin && <th className="ggColActions" style={{ textAlign: 'center' }}>Acciones</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="ggSkRow">
                                            <td colSpan={isAdmin ? 4 : 3}>
                                                <div className="ggSk skLg"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : pagedData.length > 0 ? (
                                    pagedData.map((f) => (
                                        <tr 
                                            key={f.id}
                                            className={`${updatedRowId === f.id ? "ggRowUpdated" : ""} ${deletingId === f.id ? "ggRowExit" : ""}`}
                                        >
                                            <td>{formatDateTime(f.date_time)}</td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontWeight: 700 }}>{f.worker?.user?.name || "N/A"}</span>
                                                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{f.worker?.user?.email}</span>
                                                </div>
                                            </td>
                                            <td className="ggColType" style={{ textAlign: 'center' }}>
                                                <span className={`ggPill ${f.type === 0 ? "ca" : "loc"}`}>
                                                    {f.type === 0 ? "ENTRADA" : "SALIDA"}
                                                </span>
                                            </td>
                                            {isAdmin && (
                                                <td className="ggColActions">
                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                                                        <button 
                                                            className="ggActionBtn tour-fichajes-map-btn" 
                                                            title="Ver en mapa" 
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
                                                            onClick={() => {
                                                                if(f.latitude && f.longitude) {
                                                                    setMapRow(f); setMapOpen(true);
                                                                } else {
                                                                    showToast("Este fichaje no tiene ubicación GPS guardada.", "error");
                                                                }
                                                            }}>
                                                            <span className="material-icons-outlined" style={{color: f.latitude ? '#3b82f6' : '#cbd5e1', fontSize: '20px'}}>map</span>
                                                        </button>
                                                        <RowActions 
                                                            onEdit={() => handleEdit(f)}
                                                            onDelete={() => handleDelete(f)}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 4 : 3} className="ggEmpty" style={{ padding: 0 }}>
                                            <div style={{ padding: '64px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                                <span className="material-icons-outlined" style={{ color: '#cbd5e1', fontSize: '48px', marginBottom: '16px' }}>schedule</span>
                                                <span style={{ color: '#64748b', fontWeight: 500, fontSize: '15px' }}>No hay fichajes registrados</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mostrar paginador siempre visible para asentar el layout */}
                    <div className="ggPager">
                        <div className="ggPagerInfo">
                            Mostrando{" "}
                            <strong>{filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong>
                            {" "}a{" "}
                            <strong>{Math.min(page * pageSize, filteredData.length)}</strong>
                            {" "}de{" "}
                            <strong>{filteredData.length}</strong> registros
                        </div>

                        <div className="ggPagerControls">
                            <button
                                className="ggPagerArrow"
                                type="button"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
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
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || loading}
                            >
                                <span className="material-icons-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>

                    {/* Joyride Tour */}
                    <Joyride
                        steps={tourSteps}
                        run={runTour}
                        continuous
                        showProgress
                        showSkipButton={true}
                        callback={handleJoyrideCallback}
                        styles={{
                            options: {
                                zIndex: 10000,
                                primaryColor: "#3b82f6",
                            },
                        }}
                        locale={{
                            back: "Atrás",
                            close: "Cerrar",
                            last: "Siguiente: Mi Portal",
                            next: "Siguiente",
                            skip: "Saltar tutorial",
                        }}
                    />
                </div>
            </main>

            {/* Modal Editar/Crear */}
            {editOpen && (
                <div className="modalOverlay centered" onClick={() => setEditOpen(false)}>
                    <div className="modalSheet" onClick={(e) => e.stopPropagation()}>
                        <form onSubmit={handleSave}>
                            <div className="modalBody">
                                <div className="modalHeader">
                                    <div className="modalIcon">
                                        <span className="material-icons">history_toggle_off</span>
                                    </div>
                                    <div>
                                        <div className="modalTitle">{isCreating ? "Nuevo Fichaje" : "Editar Fichaje"}</div>
                                        <div className="modalSubtitle">Administra los registros de entrada y salida.</div>
                                    </div>
                                </div>
                                
                                {editError && (
                                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "10px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>
                                        {editError}
                                    </div>
                                )}

                                <div className="formGrid">
                                    <label className="label">
                                        Fecha y Hora
                                        <input 
                                            className="control"
                                            type="datetime-local" 
                                            value={editForm.date_time}
                                            onChange={e => setEditForm({...editForm, date_time: e.target.value})}
                                            disabled={editSaving}
                                        />
                                    </label>

                                    <label className="label">
                                        Tipo
                                        <select 
                                            className="control"
                                            value={editForm.type}
                                            onChange={e => setEditForm({...editForm, type: e.target.value})}
                                            disabled={editSaving}
                                        >
                                            <option value="0">Entrada</option>
                                            <option value="1">Salida</option>
                                        </select>
                                    </label>

                                    <label className="label fullWidth">
                                        Trabajador
                                        <Select2 
                                            placeholder="Buscar trabajador..."
                                            options={workerOptions}
                                            value={editForm.worker_id}
                                            onChange={(val) => setEditForm({ ...editForm, worker_id: val })}
                                            disabled={editSaving}
                                        />
                                    </label>

                                    <label className="label fullWidth">
                                        Guardia Asociada (Opcional)
                                        <Select2 
                                            placeholder="Ninguna"
                                            options={dutyOptions}
                                            value={editForm.id_duty}
                                            onChange={(val) => setEditForm({ ...editForm, id_duty: val })}
                                            disabled={editSaving}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="modalFooter">
                                <button type="submit" className="btnPrimary" disabled={editSaving}>
                                    {editSaving ? "Guardando..." : "Guardar"}
                                </button>
                                <button type="button" className="btnSecondary" onClick={() => setEditOpen(false)} disabled={editSaving}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Eliminar */}
            {deleteOpen && deleteRow && (
                <div className="modalOverlay centered" onClick={() => setDeleteOpen(false)}>
                    <div className="modalSheet">
                        <div className="modalBody">
                            <div className="modalHeader">
                                <div className="modalIcon" style={{ background: "rgba(185, 28, 28, .12)", color: "#b91c1c" }}>
                                    <span className="material-icons">delete_forever</span>
                                </div>
                                <div>
                                    <div className="modalTitle">Eliminar fichaje</div>
                                    <div className="modalSubtitle">Esta acción no se puede deshacer.</div>
                                </div>
                            </div>
                            <div className="formGrid">
                                <div className="label fullWidth">
                                    Resumen
                                    <div className="control" style={{ background: "#F9FAFB" }}>
                                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                            <span><b>Fecha:</b> {formatDateTime(deleteRow.date_time)}</span>
                                            <span><b>Trabajador:</b> {deleteRow.worker?.user?.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modalFooter">
                            <button className="btnPrimary" style={{ background: "#b91c1c" }} onClick={confirmDelete} disabled={deleteLoading}>
                                {deleteLoading ? "Eliminando..." : "Eliminar"}
                            </button>
                            <button className="btnSecondary" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Mapa Fichaje */}
            {mapOpen && mapRow && (
                <div className="modalOverlay centered" onClick={() => setMapOpen(false)} style={{zIndex: 2000}}>
                    <div className="modalSheet" onClick={(e) => e.stopPropagation()} style={{ width: '800px', maxWidth: '95vw', height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div className="modalBody" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="modalHeader" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
                                <div className="modalIcon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                                    <span className="material-icons">map</span>
                                </div>
                                <div>
                                    <div className="modalTitle">Ubicación GPS del Fichaje</div>
                                    <div className="modalSubtitle">{mapRow.worker?.user?.name} · {formatDateTime(mapRow.date_time)}</div>
                                </div>
                                <button type="button" onClick={() => setMapOpen(false)} style={{marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b'}}>
                                    <span className="material-icons">close</span>
                                </button>
                            </div>
                            <div style={{ flex: 1, position: 'relative', marginTop: 15, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <div ref={adminMapContainerRef} style={{ width: '100%', height: '100%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
