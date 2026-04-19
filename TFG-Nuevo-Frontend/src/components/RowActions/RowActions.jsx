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
    chiefTitle = "Designar como Jefe de Especialidad",
}) {
    return (
        <div className="raWrap">
            {onSetChief && (
                <button
                    type="button"
                    className={`raIconBtn raStar ${isChief ? "raActive" : ""}`}
                    onClick={() => onSetChief?.(row)}
                    disabled={disabled}
                    title={isChief ? "Es Jefe de Especialidad" : chiefTitle}
                >
                    <span className="material-icons">
                        {isChief ? "star" : "star_border"}
                    </span>
                </button>
            )}
            <button
                type="button"
                className="raIconBtn"
                onClick={() => onEdit?.(row)}
                disabled={disabled}
                title={editTitle}
            >
                <span className="material-icons-outlined">edit</span>
            </button>

            <button
                type="button"
                className="raIconBtn raDanger"
                onClick={() => onDelete?.(row)}
                disabled={disabled}
                title={deleteTitle}
            >
                <span className="material-icons-outlined">delete</span>
            </button>
        </div>
    );
}
