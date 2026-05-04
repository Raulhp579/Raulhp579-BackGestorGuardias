import { useState, useEffect } from "react";
import { getWorkerDuties } from "../services/DutyService";
import { getWorkersBySpeciality } from "../services/workerService";
import { createSwapRequest } from "../services/SwapService";
import "../styles/SwapRequestModal.css";

export default function SwapRequestModal({ dutyFrom, onClose, onSuccess }) {
    // Current user's duties
    const [myDuties, setMyDuties] = useState([]);
    const [selectedDutyFrom, setSelectedDutyFrom] = useState(dutyFrom.id);
    const [selectedMonth, setSelectedMonth] = useState(new Date(dutyFrom.date).getMonth());

    // Colleagues
    const [colleagues, setColleagues] = useState([]);
    const [selectedColleague, setSelectedColleague] = useState("");

    // Target duties
    const [colleagueDuties, setColleagueDuties] = useState([]);
    const [selectedDutyTo, setSelectedDutyTo] = useState("");
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                setError("");

                // 1. Load my duties
                try {
                    const myData = await getWorkerDuties(dutyFrom.id_worker);
                    setMyDuties(myData);
                } catch (err) {
                    console.error("Error loading my duties:", err);
                    setError("Error al cargar tus guardias");
                }

                // 2. Load colleagues from same specialty
                if (dutyFrom.id_speciality) {
                    try {
                        const filteredColleagues = await getWorkersBySpeciality(dutyFrom.id_speciality);
                        setColleagues(filteredColleagues.filter(w => w.id != dutyFrom.id_worker));
                    } catch (err) {
                        console.error("Error loading colleagues:", err);
                        setError(prev => prev ? prev + " / Especialidad" : "Error al cargar especialidad");
                    }
                } else {
                    setError("No tienes especialidad asignada");
                }
            } catch (e) {
                console.error("General error in modal:", e);
                setError("Error crítico al cargar el modal");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [dutyFrom]);

    // Load colleague duties when selectedColleague changes
    useEffect(() => {
        if (!selectedColleague) {
            setColleagueDuties([]);
            return;
        }

        const loadColleagueDuties = async () => {
            try {
                const data = await getWorkerDuties(selectedColleague);
                setColleagueDuties(data);
            } catch (e) {
                setError("Error al cargar guardias del compañero");
            }
        };
        loadColleagueDuties();
    }, [selectedColleague]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDutyFrom || !selectedDutyTo) return;

        setSubmitting(true);
        setError("");
        try {
            await createSwapRequest(selectedDutyFrom, selectedDutyTo, comments);
            onSuccess();
            onClose();
        } catch (e) {
            setError("Error al enviar la solicitud: " + (e.message || "Inténtalo de nuevo"));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMyDuties = myDuties.filter(d => new Date(d.date).getMonth() == selectedMonth);

    return (
        <div className="srmOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="srmModal">
                <div className="srmHeader">
                    <h3>Solicitar Cambio de Guardia</h3>
                    <button onClick={onClose} className="srmClose">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="srmBody">

                    {/* SECTION 1: MY DUTY */}
                    <div className="srmSection">
                        <label className="srmLabel">1. Tu guardia a cambiar</label>
                        <div className="srmFlexRow">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="srmSelect srmSelect--small"
                            >
                                {months.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                            <select
                                value={selectedDutyFrom}
                                onChange={(e) => setSelectedDutyFrom(e.target.value)}
                                className="srmSelect"
                                required
                            >
                                <option value="">-- Selecciona una de tus guardias --</option>
                                {filteredMyDuties.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.date} ({d.duty_type})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {filteredMyDuties.length === 0 && (
                            <p className="srmHint">No tienes guardias en este mes.</p>
                        )}
                    </div>

                    {/* SECTION 2: COLLEAGUE */}
                    <div className="srmSection">
                        <label className="srmLabel">2. Compañero de {dutyFrom.speciality || "especialidad"}</label>
                        <select
                            value={selectedColleague}
                            onChange={(e) => setSelectedColleague(e.target.value)}
                            className="srmSelect"
                            required
                            disabled={loading}
                        >
                            <option value="">-- Selecciona un compañero --</option>
                            {colleagues.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* SECTION 3: COLLEAGUE DUTY */}
                    <div className="srmSection">
                        <label className="srmLabel">3. Guardia del compañero</label>
                        <select
                            value={selectedDutyTo}
                            onChange={(e) => setSelectedDutyTo(e.target.value)}
                            className="srmSelect"
                            required
                            disabled={!selectedColleague}
                        >
                            <option value="">-- Selecciona la guardia de destino --</option>
                            {colleagueDuties.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.date} ({d.duty_type})
                                </option>
                            ))}
                        </select>
                        {!selectedColleague && <p className="srmHint">Selecciona un compañero primero.</p>}
                        {selectedColleague && colleagueDuties.length === 0 && <p className="srmHint">Este compañero no tiene guardias asignadas.</p>}
                    </div>

                    <div className="srmSection">
                        <label className="srmLabel">Notas (opcional)</label>
                        <textarea
                            className="srmTextarea"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Escribe un motivo o mensaje para el compañero..."
                        ></textarea>
                    </div>

                    {error && <div className="srmError">{error}</div>}

                    <div className="srmFooter">
                        <button type="button" onClick={onClose} className="srmBtn srmBtn--cancel">Cancelar</button>
                        <button type="submit" className="srmBtn srmBtn--submit" disabled={submitting || !selectedDutyFrom || !selectedDutyTo}>
                            {submitting ? "Enviando..." : "Enviar Solicitud"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
