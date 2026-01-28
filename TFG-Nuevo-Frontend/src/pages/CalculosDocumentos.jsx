import { useEffect, useRef, useState } from "react";
import "../styles/CalculosDocumentos.css";
import "../styles/AppLayout.css";
import { importWorkersExcel } from "../services/importExcelService"
import { getWorkers, getAdmins } from "../services/userService";

export default function CalculosDocumentos() {
    // ver trabajadores y admins
    const [view, setView] = useState("workers");


    //para gettear los trabalhadores y users 

    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [admins, setAdmins] = useState([]);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [adminsError, setAdminsError] = useState("");

    // import excel
    const fileInputRef = useRef(null);
    const [importMsg, setImportMsg] = useState("");
    const [importing, setImporting] = useState(false);

    async function onPickExcel(e) {
        // coge el archivo elegido
        const file = e.target.files[0];
        e.target.value = "";// resetea el input para poder elegir el mismo archivo otra vez
        if (!file) return;

        // limpìa mensaje pa cuando importando
        setImportMsg("");
        setImporting(true);

        try {
            await importWorkersExcel(file);
            setImportMsg("Usuarios importados correctamente");
            setView("workers");
            await loadWorkers();

        } catch (err) {
            setImportMsg("Error al importar: " + err.message);
        } finally {
            setImporting(false);
        }
    }

    async function loadWorkers() {
        setLoading(true);
        setError("");
        try {
            const data = await getWorkers();
            setWorkers(data);
        } catch (e) {
            setError(e.message || "Error desconocido");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (view === "workers") {
            loadWorkers();
        } else {
            loadAdmins();
        }
    }, [view]);


    async function loadAdmins() {
        setAdminsLoading(true);
        setAdminsError("");
        try {
            const data = await getAdmins();
            setAdmins(data);
        } catch (e) {
            setAdminsError(e.message || "Error desconocido");
        } finally {
            setAdminsLoading(false);
        }
    }


    // clases botones 
    let workersBtnClass = "cdToggleBtn";
    let adminsBtnClass = "cdToggleBtn";

    if (view === "workers") {
        workersBtnClass += " isActive";
    } else {
        adminsBtnClass += " isActive";
    }

    // tabla 
    let title = "";
    let headers = [];
    let colSpan = 0;
    let rows = [];

    if (view === "workers") {
        title = "Trabajadores";
        headers = ["ID", "Nombre", "Rango", "Alta", "Baja", "Especialidad"];
        colSpan = 6;
        rows = workers;
    } else {
        title = "Administradores";
        headers = ["ID", "Nombre", "Email", "Creado"];
        colSpan = 4;
        rows = admins;
    }

    // filas
    let tableRows = null;

    if (view === "workers") {
        tableRows = rows.map((w) => (
            <tr key={w.id}>
                <td>{w.id}</td>
                <td>{w.name}</td>
                <td>{w.rank}</td>
                <td>{w.registration_date}</td>
                <td>{w.discharge_date ?? "-"}</td>
                <td>{w.id_speciality}</td>
            </tr>
        ));
    } else {
        tableRows = rows.map((a) => (
            <tr key={a.id}>
                <td>{a.id}</td>
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.created_at}</td>
            </tr>
        ));
    }


    return (
        <div className="cdPage">
            <main className="cdMain">

                <div className="cdActions">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xls,.xlsx"
                        style={{ display: "none" }}
                        onChange={onPickExcel}
                    />
                    <button
                        className="cdBtnSecondary"
                        type="button"
                        disabled={importing}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-icons excel">table_view</span>
                        {importing ? "Importando..." : "Importar usuarios"}
                    </button>
                    {importMsg && <p className="cdInfo">{importMsg}</p>}

                </div>

                <div className="cdToggle">
                    <button
                        className={workersBtnClass}
                        type="button"
                        onClick={() => setView("workers")}
                    >
                        Ver trabajadores
                    </button>

                    <button
                        className={adminsBtnClass}
                        type="button"
                        onClick={() => setView("admins")}
                    >
                        Ver administradores
                    </button>
                </div>

                <h3 className="cdSectionTitle">{title}</h3>

                {view === "workers" && loading && <p>Cargando trabajadores...</p>}
                {view === "workers" && error && <p className="cdError">{error}</p>}

                {view === "admins" && adminsLoading && <p>Cargando administradores...</p>}
                {view === "admins" && adminsError && <p className="cdError">{adminsError}</p>}

                <table className="cdTable">
                    <thead>
                        <tr>
                            {headers.map((header) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={colSpan}>No hay datos</td>
                            </tr>
                        )}

                        {tableRows}
                    </tbody>
                </table>

            </main>
        </div>
    );
}
