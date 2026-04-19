import { useState, useEffect } from "react";
import { getSwaps, acceptSwap, rejectSwap, approveSwap, declineSwap } from "../services/SwapService";
import { getProfile } from "../services/ProfileService";
import { getWorkerDuties } from "../services/DutyService";
import SwapRequestModal from "../components/SwapRequestModal";
import "../styles/RequestsInbox.css";

export default function RequestsInbox() {
    const [swaps, setSwaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [workerId, setWorkerId] = useState(null);
    const [idSpeciality, setIdSpeciality] = useState(null);
    const [toast, setToast] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialDuty, setInitialDuty] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const profile = await getProfile();
                setWorkerId(profile.worker_id);
                setIdSpeciality(profile.id_speciality);
                const data = await getSwaps();
                setSwaps(data);
            } catch (e) {
                setError("Error al cargar las solicitudes");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleOpenModal = async () => {
        try {
            const duties = await getWorkerDuties(workerId);
            if (duties.length === 0) {
                setToast({ type: "error", message: "No tienes guardias para cambiar" });
                return;
            }
            // Pass the first duty as "seed" so the modal knows the specialty
            // (The modal uses dutyFrom.id_speciality to filter others)
            setInitialDuty({
                ...duties[0],
                id_worker: workerId,
                id_speciality: idSpeciality
            });
            setIsModalOpen(true);
        } catch (e) {
            setToast({ type: "error", message: "Error al preparar la solicitud" });
        }
    };

    const handleAction = async (id, actionFn, successMsg) => {
        try {
            await actionFn(id);
            setToast({ type: "success", message: successMsg });
            const data = await getSwaps();
            setSwaps(data);
        } catch (e) {
            setToast({ type: "error", message: "Error al procesar la acción" });
        }
    };

    if (loading) return <div className="riLoading">Cargando...</div>;

    const myRequests = swaps.filter(s => s.id_worker_requester == workerId);
    const requestsToMe = swaps.filter(s => s.id_worker_target == workerId && s.status === 'pending');
    const chiefApprovals = swaps.filter(s => s.status === 'accepted' && s.duty_from?.speciality?.id_chief == workerId);

    return (
        <div className="riPage">
            <div className="riHeaderRow">
                <h1 className="riTitle">Bandeja de Solicitudes</h1>
                <button className="riBtn riBtn--primary" onClick={handleOpenModal}>
                    + Nueva Solicitud
                </button>
            </div>

            {error && (
                <div className="riError" style={{ color: 'red', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {toast && (
                <div className={`riToast riToast--${toast.type}`}>
                    {toast.message}
                </div>
            )}

            <section className="riSection">
                <h2>Solicitudes para Mí</h2>
                <div className="riGrid">
                    {requestsToMe.length === 0 ? <p>No tienes solicitudes pendientes.</p> : requestsToMe.map(s => (
                        <div key={s.id} className="riCard">
                            <p><strong>De:</strong> {s.requester?.name}</p>
                            <div className="riSwapDates">
                                <strong>Cambio:</strong> {s.duty_from?.date} por {s.duty_to?.date}
                            </div>
                            {s.comments && (
                                <div className="riComments">
                                    <strong>Nota:</strong> {s.comments}
                                </div>
                            )}
                            <div className="riActions">
                                <button className="riBtn riBtn--accept" onClick={() => handleAction(s.id, acceptSwap, "Solicitud aceptada")}>Aceptar</button>
                                <button className="riBtn riBtn--reject" onClick={() => handleAction(s.id, rejectSwap, "Solicitud rechazada")}>Rechazar</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="riSection">
                <h2>Mis Solicitudes Enviadas</h2>
                <div className="riGrid">
                    {myRequests.length === 0 ? <p>No has enviado solicitudes.</p> : myRequests.map(s => (
                        <div key={s.id} className="riCard">
                            <p><strong>Para:</strong> {s.target?.name}</p>
                            <p><strong>Estado:</strong> <span className={`riStatus riStatus--${s.status}`}>{s.status}</span></p>
                            <p><strong>Cambio:</strong> {s.duty_from?.date} por {s.duty_to?.date}</p>
                        </div>
                    ))}
                </div>
            </section>

            {chiefApprovals.length > 0 && (
                <section className="riSection">
                    <h2>Aprobaciones como Jefe</h2>
                    <div className="riGrid">
                        {chiefApprovals.map(s => (
                            <div key={s.id} className="riCard">
                                <p><strong>Participantes:</strong> {s.requester?.name} & {s.target?.name}</p>
                                <p><strong>Cambio:</strong> {s.duty_from?.date} por {s.duty_to?.date}</p>
                                <div className="riActions">
                                    <button className="riBtn riBtn--approve" onClick={() => handleAction(s.id, approveSwap, "Cambio aprobado")}>Aprobar</button>
                                    <button className="riBtn riBtn--decline" onClick={() => handleAction(s.id, declineSwap, "Cambio denegado")}>Denegar</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {isModalOpen && initialDuty && (
                <SwapRequestModal
                    dutyFrom={initialDuty}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        getSwaps().then(setSwaps);
                        setToast({ type: "success", message: "Solicitud enviada con éxito" });
                    }}
                />
            )}
        </div>
    );
}
