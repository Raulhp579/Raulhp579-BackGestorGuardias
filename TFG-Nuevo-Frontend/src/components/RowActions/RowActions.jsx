import "./RowActions.css";

export default function RowActions({
    row,
    onEdit,
    onDelete,
    disabled = false,
    editTitle = "Editar",
    deleteTitle = "Eliminar",
    hideEdit = false,
    hideDelete = false,
}) {
    return (
        <div className="raWrap">
            {!hideEdit && (
                <button
                    type="button"
                    className="raIconBtn"
                    onClick={() => onEdit?.(row)}
                    disabled={disabled}
                    title={editTitle}
                >
                    <span className="material-icons-outlined">edit</span>
                </button>
            )}

            {!hideDelete && (
                <button
                    type="button"
                    className="raIconBtn raDanger"
                    onClick={() => onDelete?.(row)}
                    disabled={disabled}
                    title={deleteTitle}
                >
                    <span className="material-icons-outlined">delete</span>
                </button>
            )}
        </div>
    );
}
