import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./Select2.css";

export default function Select2({
    options = [],
    value = "",
    onChange,
    placeholder = "Seleccionar...",
    disabled = false,
    className = "",
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const searchRef = useRef(null);

    const selected = options.find(o => String(o.value) === String(value));

    const filtered = options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate dropdown position based on trigger rect
    const updateDropdownPosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = Math.min(310, window.innerHeight * 0.4);

        const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        setDropdownStyle({
            position: "fixed",
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }
            ),
        });
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target) &&
                !e.target.closest(".s2__dropdown-portal")
            ) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus search when opening
    useEffect(() => {
        if (open && searchRef.current) {
            searchRef.current.focus();
        }
    }, [open]);

    // Recalculate position on scroll/resize while open
    useEffect(() => {
        if (!open) return;
        const handler = () => updateDropdownPosition();
        window.addEventListener("scroll", handler, true);
        window.addEventListener("resize", handler);
        return () => {
            window.removeEventListener("scroll", handler, true);
            window.removeEventListener("resize", handler);
        };
    }, [open]);

    const handleOpen = () => {
        if (disabled) return;
        if (!open) updateDropdownPosition();
        setOpen(o => !o);
    };

    const handleSelect = (val) => {
        onChange?.(val);
        setOpen(false);
        setSearch("");
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange?.("");
        setSearch("");
    };

    return (
        <div
            ref={containerRef}
            className={`s2 ${open ? "s2--open" : ""} ${disabled ? "s2--disabled" : ""} ${className}`}
        >
            {/* Trigger */}
            <div
                className="s2__control"
                onClick={handleOpen}
            >
                <span className={`s2__value ${!selected ? "s2__placeholder" : ""}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <span className="s2__arrows">
                    {selected && !disabled && (
                        <span className="s2__clear" onMouseDown={handleClear}>×</span>
                    )}
                    <span className="s2__arrow">▾</span>
                </span>
            </div>

            {/* Dropdown via portal to escape overflow:hidden parents */}
            {open && createPortal(
                <div className="s2__dropdown s2__dropdown-portal" style={dropdownStyle}>
                    <div className="s2__search-wrap">
                        <input
                            ref={searchRef}
                            className="s2__search"
                            type="text"
                            placeholder="Buscar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <ul className="s2__list">
                        {filtered.length > 0 ? (
                            filtered.map(opt => (
                                <li
                                    key={opt.value}
                                    className={`s2__option ${String(opt.value) === String(value) ? "s2__option--selected" : ""}`}
                                    onMouseDown={() => handleSelect(opt.value)}
                                >
                                    {opt.label}
                                </li>
                            ))
                        ) : (
                            <li className="s2__option s2__option--empty">Sin resultados</li>
                        )}
                    </ul>
                </div>,
                document.body
            )}
        </div>
    );
}
