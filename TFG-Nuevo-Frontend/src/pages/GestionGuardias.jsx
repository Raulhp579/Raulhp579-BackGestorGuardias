import { useEffect, useMemo, useState } from "react";
import "../styles/GestionGuardias.css";
import { getDuties } from "../services/DutyService";

export default function GestionGuardias() {
  // Modal "Asignar jefe automáticamente"
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado tabla (empieza vacío)
  const [guardias, setGuardias] = useState([]);

  // estados extra para UX
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // cargar guardias desde API al montar
  useEffect(() => {
    let alive = true;

    async function loadDuties() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await getDuties(); // tu endpoint
        const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (alive) setGuardias(arr);
      } catch (e) {
        console.error(e);
        if (alive) {
          setGuardias([]);
          setLoadError("No se pudieron cargar las guardias.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDuties();
    return () => {
      alive = false;
    };
  }, []);

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

  // Modal borrar
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

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
      id_chief_worker: row.id_chief_worker == null ? "" : String(row.id_chief_worker),
    });
    setEditOpen(true);
  }

  function handleSaveEdit(e) {
    e?.preventDefault?.();

    if (!editForm.date) return alert("La fecha es obligatoria.");
    if (!editForm.duty_type) return alert("El tipo es obligatorio.");

    const updated = {
      date: editForm.date,
      duty_type: editForm.duty_type,
      id_speciality: Number(editForm.id_speciality || 0),
      id_worker: Number(editForm.id_worker || 0),
      id_chief_worker: editForm.id_chief_worker === "" ? null : Number(editForm.id_chief_worker),
    };

    setGuardias((prev) => prev.map((g) => (g.id === editRowId ? { ...g, ...updated } : g)));
    setEditOpen(false);
    setEditRowId(null);
  }

  // Borrar
  function handleDelete(row) {
    setDeleteRow(row);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    if (!deleteRow) return;
    setGuardias((prev) => prev.filter((g) => g.id !== deleteRow.id));
    setDeleteOpen(false);
    setDeleteRow(null);
  }

  function cancelDelete() {
    setDeleteOpen(false);
    setDeleteRow(null);
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
              {loading ? "Cargando..." : `${guardias.length} registros · Página ${page} / ${totalPages}`}
            </div>
          </div>

          {/* error de carga */}
          {loadError && (
            <div style={{ padding: "10px 14px", color: "#b91c1c", fontWeight: 700 }}>
              {loadError}
            </div>
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
                  <th className="ggColActions">ACCIONES</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="ggEmpty" colSpan={6}>
                      Cargando guardias...
                    </td>
                  </tr>
                ) : pagedGuardias.length === 0 ? (
                  <tr>
                    <td className="ggEmpty" colSpan={6}>
                      No hay guardias registradas.
                    </td>
                  </tr>
                ) : (
                  pagedGuardias.map((g) => (
                    <tr key={g.id}>
                      <td className="ggColDate ggMono">{g.date}</td>

                      <td className="ggColCenter">
                        <span className={`ggPill ${pillClass(g.duty_type)}`}>{g.duty_type}</span>
                      </td>

                      <td className="ggColCenter ggMono">{g.speciality}</td>
                      <td className="ggColCenter ggMono">{g.worker}</td>
                      <td className="ggColCenter ggMono">{g.chief_worker ?? "—"}</td>

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
                          >
                            <span className="material-icons-outlined">delete</span>
                          </button>
                        </div>
                      </td>
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
          <button className="ctaBtn" type="button" onClick={() => setIsModalOpen(true)}>
            <span className="material-icons">add_circle_outline</span>
            <span>Asignar jefe automaticamente</span>
          </button>
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

                <div className="formGrid">
                  <label className="label">
                    Fecha
                    <input
                      className="control"
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))}
                      required
                    />
                  </label>

                  <label className="label">
                    Tipo
                    <select
                      className="control"
                      value={editForm.duty_type}
                      onChange={(e) => setEditForm((p) => ({ ...p, duty_type: e.target.value }))}
                    >
                      <option value="CA">CA (Continuidad)</option>
                      <option value="PF">PF (Presencia Física)</option>
                      <option value="LOC">LOC (Localizada)</option>
                    </select>
                  </label>

                  <label className="label">
                    ID Especialidad
                    <input
                      className="control"
                      type="number"
                      min="0"
                      value={editForm.id_speciality}
                      onChange={(e) => setEditForm((p) => ({ ...p, id_speciality: e.target.value }))}
                    />
                  </label>

                  <label className="label">
                    ID Trabajador
                    <input
                      className="control"
                      type="number"
                      min="0"
                      value={editForm.id_worker}
                      onChange={(e) => setEditForm((p) => ({ ...p, id_worker: e.target.value }))}
                    />
                  </label>

                  <label className="label">
                    ID Jefe (opcional)
                    <input
                      className="control"
                      type="number"
                      min="0"
                      value={editForm.id_chief_worker}
                      onChange={(e) => setEditForm((p) => ({ ...p, id_chief_worker: e.target.value }))}
                      placeholder="Vacío = sin jefe"
                    />
                  </label>
                </div>
              </div>

              <div className="modalFooter">
                <button className="btnPrimary" type="submit">
                  Guardar cambios
                </button>
                <button className="btnSecondary" type="button" onClick={() => setEditOpen(false)}>
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
                  <div className="modalSubtitle">Esta acción no se puede deshacer. Confirma si quieres eliminarla.</div>
                </div>
              </div>

              <div className="formGrid">
                <div className="label">
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
            </div>

            <div className="modalFooter">
              <button type="button" onClick={confirmDelete} className="btnPrimary" style={{ background: "#b91c1c" }}>
                Eliminar
              </button>
              <button type="button" onClick={cancelDelete} className="btnSecondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal original: Asignar jefe */}
      {isModalOpen && (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Asignar Jefe de Guardia">
          <div className="modalSheet">
            <div className="modalBody">
              <div className="modalHeader">
                <div className="modalIcon">
                  <span className="material-icons">admin_panel_settings</span>
                </div>
                <div>
                  <div className="modalTitle">Asignar Jefe de Guardia</div>
                  <div className="modalSubtitle">Asignación manual con motivo y autorización.</div>
                </div>
              </div>

              <div className="formGrid">
                <label className="label">
                  Profesional
                  <select className="control">
                    <option>Seleccione un profesional...</option>
                    <option>Dr. Ana Sánchez</option>
                    <option>Dr. Juan Gómez</option>
                    <option>Dra. Beatriz López</option>
                  </select>
                </label>

                <label className="label">
                  Motivo del cambio
                  <textarea className="control" rows={3} placeholder="Especifique la razón del cambio manual..." />
                </label>

                <label className="label">
                  Código de autorización
                  <div className="codeField">
                    <span className="material-icons">lock</span>
                    <input className="codeInput" placeholder="0000" />
                    <span className="codeBadge">REQ</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="modalFooter">
              <button className="btnPrimary" onClick={() => setIsModalOpen(false)} type="button">
                Confirmar
              </button>
              <button className="btnSecondary" onClick={() => setIsModalOpen(false)} type="button">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
