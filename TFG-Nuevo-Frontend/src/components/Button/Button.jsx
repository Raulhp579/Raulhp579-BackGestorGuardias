import React from "react";
import "./Button.css";

/**
 * Botón reutilizable basado en los estilos de GestionUsuarios.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {'primary' | 'secondary' | 'ghost' | 'danger'} [props.variant='primary'] - Estilo del botón
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Tamaño
 * @param {string} [props.icon] - Nombre del icono de Material Icons (opcional)
 * @param {string} [props.className] - Clases adicionales
 * @param {boolean} [props.isLoading] - Si está cargando muestra spinner/texto
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props - Resto de props (onClick, disabled, type...)
 */
export default function Button({
    children,
    variant = "primary",
    size = "md",
    icon,
    className = "",
    isLoading = false,
    disabled,
    type = "button",
    ...props
}) {
    const rootClass = `customBtn customBtn--${variant} customBtn--${size} ${className}`;

    return (
        <button
            type={type}
            className={rootClass}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                // Simple loading indicator using text or a spinner class if available
                <span className="material-icons spin">refresh</span>
            ) : (
                icon && <span className="material-icons btnIcon">{icon}</span>
            )}
            <span>{children}</span>
        </button>
    );
}
