import "./RowActions.css";

export default function RowActions({
    row,
    onEdit,
    onDelete,
    disabled = false,
    editTitle = "Editar",
    deleteTitle = "Eliminar",
}) {
    return (
        <div className="raWrap">
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
