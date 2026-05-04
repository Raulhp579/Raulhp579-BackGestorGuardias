import "./RowActions.css";

export default function RowActions({
    row,
    onEdit,
    onDelete,
    disabled = false,
    onSetChief,
    isChief = false,
    editTitle = "Editar",
    deleteTitle = "Eliminar",
    hideEdit = false,
    hideDelete = false,
    disableEdit = false,
    disableDelete = false,
    chiefTitle = "Designar como Jefe de Especialidad",
}) {
    return (
        <div className="raWrap">
            {onSetChief && (
                <button
                    type="button"
                    className={`raIconBtn raStar ${isChief ? "raActive" : ""}`}
                    onClick={() => onSetChief?.(row)}
                    title={isChief ? "Es Jefe de Especialidad" : chiefTitle}
                    style={{ opacity: 1, pointerEvents: "auto", cursor: "pointer", color: "#fbbf24" }}
                >
                    <span className="material-icons" style={{ color: "#fbbf24" }}>
                        {isChief ? "star" : "star_border"}
                    </span>
                </button>
            )}

            {!hideEdit && (
                <button
                    type="button"
                    className="raIconBtn"
                    onClick={() => onEdit?.(row)}
                    disabled={disabled || disableEdit}
                    title={disableEdit ? "No se puede editar" : editTitle}
                    style={(disableEdit) ? { opacity: 0.3, pointerEvents: "none", cursor: "not-allowed" } : undefined}
                >
                    <span className="material-icons-outlined">edit</span>
                </button>
            )}

            {!hideDelete && (
                <button
                    type="button"
                    className="raIconBtn raDanger"
                    onClick={() => onDelete?.(row)}
                    disabled={disabled || disableDelete}
                    title={disableDelete ? "No se puede eliminar" : deleteTitle}
                    style={(disableDelete) ? { opacity: 0.3, pointerEvents: "none", cursor: "not-allowed" } : undefined}
                >
                    <span className="material-icons-outlined">delete</span>
                </button>
            )}
        </div>
    );
}
