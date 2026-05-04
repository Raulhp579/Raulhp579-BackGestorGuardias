import { useState, useEffect } from "react";
import { getSwaps, acceptSwap, rejectSwap, approveSwap, declineSwap } from "../services/SwapService";
import { getProfile } from "../services/ProfileService";
import { getWorkerDuties } from "../services/DutyService";
import { markAllAsRead } from "../services/NotificationService";
import SwapRequestModal from "../components/SwapRequestModal";
import "../styles/RequestsInbox.css";

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
};

const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return 'schedule';
        case 'accepted': return 'check_circle';
        case 'rejected':
        case 'declined': return 'cancel';
        case 'approved': return 'verified';
        default: return 'info';
    }
};

const translateStatus = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending': return 'Pendiente';
        case 'accepted': return 'Aceptada';
        case 'rejected': return 'Rechazada';
        case 'declined': return 'Denegada';
        case 'approved': return 'Aprobada';
        default: return status;
    }
};

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

        markAllAsRead()
            .then(() => window.dispatchEvent(new CustomEvent("notificationsRead")))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleOpenModal = async () => {
        try {
            const duties = await getWorkerDuties(workerId);
            if (duties.length === 0) {
                setToast({ type: "error", message: "No tienes guardias para cambiar" });
                return;
            }
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

    if (loading) {
        return (
            <div className="riLoadingState">
                <span className="material-icons-outlined riSpinner" style={{ animation: "spin 1s linear infinite", fontSize: "3rem", color: "var(--primary-color, #1a7f37)" }}>sync</span>
                <p>Cargando buzón...</p>
            </div>
        );
    }

    const myRequests = swaps.filter(s => s.id_worker_requester == workerId);
    const requestsToMe = swaps.filter(s => s.id_worker_target == workerId && s.status === 'pending');
    const chiefApprovals = swaps.filter(s => s.status === 'accepted' && s.duty_from?.speciality?.id_chief == workerId);

    return (
        <div className="riPage">
            <div className="riHeaderRow">
                <div className="riTitleWrap">
                    <span className="material-icons-outlined riTitleIcon">forum</span>
                    <h1 className="riTitle">Bandeja de Solicitudes</h1>
                </div>
                <button className="riBtn riBtn--primary" onClick={handleOpenModal}>
                    <span className="material-icons-outlined">add</span>
                    Nueva Solicitud
                </button>
            </div>

            {error && (
                <div className="riError">
                    <span className="material-icons-outlined">error_outline</span>
                    {error}
                </div>
            )}

            {toast && (
                <div className={`riToast riToast--${toast.type}`}>
                    <span className="material-icons-outlined">
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {toast.message}
                </div>
            )}

            <section className="riSection">
                <div className="riSectionHeader">
                    <span className="material-icons-outlined">mail</span>
                    <h2>Solicitudes para Mí</h2>
                </div>
                <div className="riGrid">
                    {requestsToMe.length === 0 ? (
                        <div className="riEmptyState">
                            <span className="material-icons-outlined">inbox</span>
                            <p>No tienes solicitudes de cambio pendientes.</p>
                        </div>
                    ) : requestsToMe.map(s => (
                        <div key={s.id} className="riCard">
                            <div className="riCardHeader">
                                <div className="riUserInfo">
                                    <div className="riAvatar">{s.requester?.name?.charAt(0).toUpperCase()}</div>
                                    <div className="riUserMeta">
                                        <span className="riMetaLabel">Solicitado por</span>
                                        <span className="riUserName">{s.requester?.name}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="riCardBody">
                                <div className="riSwapDatesWrapper">
                                    <div className="riDateBox riDateBox--from">
                                        <span className="material-icons-outlined">event_busy</span>
                                        <span className="riDateText">{formatDate(s.duty_from?.date)}</span>
                                    </div>
                                    <span className="material-icons-outlined riArrowIcon">arrow_forward</span>
                                    <div className="riDateBox riDateBox--to">
                                        <span className="material-icons-outlined">event_available</span>
                                        <span className="riDateText">{formatDate(s.duty_to?.date)}</span>
                                    </div>
                                </div>
                                {s.comments && (
                                    <div className="riComments">
                                        <span className="material-icons-outlined">chat_bubble_outline</span>
                                        <p>"{s.comments}"</p>
                                    </div>
                                )}
                            </div>
                            <div className="riActions">
                                <button className="riBtn riBtn--accept" onClick={() => handleAction(s.id, acceptSwap, "Solicitud aceptada")}>
                                    <span className="material-icons-outlined">check_circle</span>
                                    Aceptar
                                </button>
                                <button className="riBtn riBtn--reject" onClick={() => handleAction(s.id, rejectSwap, "Solicitud rechazada")}>
                                    <span className="material-icons-outlined">cancel</span>
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="riSection">
                <div className="riSectionHeader">
                    <span className="material-icons-outlined">send</span>
                    <h2>Mis Solicitudes Enviadas</h2>
                </div>
                <div className="riGrid">
                    {myRequests.length === 0 ? (
                        <div className="riEmptyState">
                            <span className="material-icons-outlined">drafts</span>
                            <p>No has enviado ninguna solicitud.</p>
                        </div>
                    ) : myRequests.map(s => (
                        <div key={s.id} className="riCard">
                            <div className="riCardHeader">
                                <div className="riUserInfo">
                                    <div className="riAvatar">{s.target?.name?.charAt(0).toUpperCase()}</div>
                                    <div className="riUserMeta">
                                        <span className="riMetaLabel">Para</span>
                                        <span className="riUserName">{s.target?.name}</span>
                                    </div>
                                </div>
                                <span className={`riStatus riStatus--${s.status.toLowerCase()}`}>
                                    <span className="material-icons-outlined">{getStatusIcon(s.status)}</span>
                                    {translateStatus(s.status)}
                                </span>
                            </div>
                            <div className="riCardBody">
                                <div className="riSwapDatesWrapper">
                                    <div className="riDateBox riDateBox--from">
                                        <span className="material-icons-outlined">event_busy</span>
                                        <span className="riDateText">{formatDate(s.duty_from?.date)}</span>
                                    </div>
                                    <span className="material-icons-outlined riArrowIcon">arrow_forward</span>
                                    <div className="riDateBox riDateBox--to">
                                        <span className="material-icons-outlined">event_available</span>
                                        <span className="riDateText">{formatDate(s.duty_to?.date)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {chiefApprovals.length > 0 && (
                <section className="riSection">
                    <div className="riSectionHeader">
                        <span className="material-icons-outlined">gavel</span>
                        <h2>Aprobaciones como Jefe</h2>
                    </div>
                    <div className="riGrid">
                        {chiefApprovals.map(s => (
                            <div key={s.id} className="riCard">
                                <div className="riCardHeader">
                                    <div className="riUsersDual">
                                        <div className="riDualAvatar riDualAvatar--left">{s.requester?.name?.charAt(0).toUpperCase()}</div>
                                        <div className="riDualAvatar riDualAvatar--right">{s.target?.name?.charAt(0).toUpperCase()}</div>
                                        <div className="riUserMeta" style={{marginLeft: '12px'}}>
                                            <span className="riMetaLabel">Intercambio acordado entre</span>
                                            <span className="riUserName">{s.requester?.name.split(' ')[0]} y {s.target?.name.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="riCardBody">
                                    <div className="riSwapDatesWrapper">
                                        <div className="riDateBox riDateBox--from">
                                            <span className="material-icons-outlined">calendar_today</span>
                                            <span className="riDateText">{formatDate(s.duty_from?.date)}</span>
                                        </div>
                                        <span className="material-icons-outlined riArrowIcon">swap_horiz</span>
                                        <div className="riDateBox riDateBox--to">
                                            <span className="material-icons-outlined">calendar_today</span>
                                            <span className="riDateText">{formatDate(s.duty_to?.date)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="riActions">
                                    <button className="riBtn riBtn--approve" onClick={() => handleAction(s.id, approveSwap, "Cambio aprobado")}>
                                        <span className="material-icons-outlined">thumb_up</span>
                                        Aprobar
                                    </button>
                                    <button className="riBtn riBtn--decline" onClick={() => handleAction(s.id, declineSwap, "Cambio denegado")}>
                                        <span className="material-icons-outlined">thumb_down</span>
                                        Denegar
                                    </button>
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
