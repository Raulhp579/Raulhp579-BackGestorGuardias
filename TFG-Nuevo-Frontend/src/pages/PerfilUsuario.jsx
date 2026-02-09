import { useState, useEffect, useRef } from "react";
import {
    getProfile,
    updateProfile,
    changePassword,
} from "../services/ProfileService";
import "../styles/PerfilUsuario.css";

export default function PerfilUsuario() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Estado para edición
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    // Estado para cambio de contraseña
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    // Estado para próximas guardias
    const [upcomingDuties, setUpcomingDuties] = useState([]);
    const [loadingDuties, setLoadingDuties] = useState(false);

    // Estado para modal de detalles de guardia
    const [selectedDuty, setSelectedDuty] = useState(null);
    const [dutyModalOpen, setDutyModalOpen] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        setLoading(true);
        setError("");
        try {
            const data = await getProfile();
            setUser(data);
            setEditName(data.name || "");
        } catch (e) {
            setError("Error al cargar el perfil");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function getInitials(name) {
        if (!name) return "U";
        const parts = name.trim().split(/\s+/);
        const first = parts[0]?.[0] ?? "";
        const second = parts[1]?.[0] ?? "";
        return (first + second).toUpperCase() || "U";
    }

    function handleAvatarClick() {
        fileInputRef.current?.click();
    }

    function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        const validTypes = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/gif",
        ];
        if (!validTypes.includes(file.type)) {
            setSaveMsg("Solo se permiten imágenes (jpg, png, gif)");
            return;
        }

        // Validar tamaño (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setSaveMsg("La imagen no puede superar 2MB");
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setSaveMsg("");
    }

    function startEdit() {
        setEditMode(true);
        setEditName(user?.name || "");
        setAvatarFile(null);
        setAvatarPreview(null);
        setSaveMsg("");
    }

    function cancelEdit() {
        setEditMode(false);
        setEditName(user?.name || "");
        setAvatarFile(null);
        setAvatarPreview(null);
        setSaveMsg("");
    }

    async function saveProfile() {
        if (!editName.trim()) {
            setSaveMsg("El nombre es obligatorio");
            return;
        }

        setSaving(true);
        setSaveMsg("");

        try {
            // Si hay avatar, usar FormData
            if (avatarFile) {
                const formData = new FormData();
                formData.append("name", editName.trim());
                formData.append("avatar", avatarFile);

                const token = localStorage.getItem("token");
                const response = await fetch("/api/profile", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Error al actualizar perfil");
                }

                const result = await response.json();
                setUser(result.user);
            } else {
                // Sin avatar, usar JSON normal
                const result = await updateProfile({ name: editName.trim() });
                setUser(result.user);
            }

            setEditMode(false);
            setAvatarFile(null);
            setAvatarPreview(null);
            setSaveMsg("Perfil actualizado correctamente");
            setTimeout(() => setSaveMsg(""), 3000);
        } catch (e) {
            setSaveMsg("Error al guardar los cambios");
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    function openPasswordModal() {
        setPasswordModalOpen(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccess("");
    }

    function closePasswordModal() {
        setPasswordModalOpen(false);
    }

    async function handleChangePassword() {
        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Todos los campos son obligatorios");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "La nueva contraseña debe tener al menos 8 caracteres",
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("Las contraseñas no coinciden");
            return;
        }

        setChangingPassword(true);

        try {
            await changePassword({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            setPasswordSuccess("Contraseña actualizada correctamente");
            setTimeout(() => {
                closePasswordModal();
            }, 2000);
        } catch (e) {
            setPasswordError(
                "Error al cambiar la contraseña. Verifica tu contraseña actual.",
            );
            console.error(e);
        } finally {
            setChangingPassword(false);
        }
    }

    function getRoleLabel(rolesData) {
        // Parsear si es string JSON
        let roles = rolesData;
        if (typeof rolesData === "string") {
            try {
                roles = JSON.parse(rolesData);
            } catch {
                return "Usuario";
            }
        }

        if (!roles || !Array.isArray(roles) || roles.length === 0)
            return "Usuario";
        const roleNames = roles.map((r) => r.name || r);
        if (roleNames.includes("admin")) return "Administrador";
        if (roleNames.includes("empleado")) return "Empleado";
        return roleNames[0] || "Usuario";
    }

    if (loading) {
        return (
            <div className="puContent">
                <div className="puLoading">
                    <span className="material-icons-outlined puSpinner">
                        sync
                    </span>
                    <span>Cargando perfil...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="puContent">
                <div className="puError">
                    <span className="material-icons-outlined">error</span>
                    <span>{error}</span>
                    <button className="puBtn primary" onClick={loadProfile}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const avatarUrl =
        avatarPreview || (user?.avatarUrl ? `/${user.avatarUrl}` : null);

    return (
        <div className="puContent">
            <h2 className="puTitle">Mi Perfil</h2>

            {/* Card principal */}
            <section className="puCard">
                <div className="puCardTop">
                    {/* Avatar */}
                    <div className="puAvatarSection">
                        <div
                            className={`puAvatar ${editMode ? "editable" : ""}`}
                            onClick={editMode ? handleAvatarClick : undefined}
                            title={
                                editMode ? "Haz clic para cambiar la foto" : ""
                            }
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="puAvatarImg"
                                />
                            ) : (
                                <span className="puAvatarInitials">
                                    {getInitials(user?.name)}
                                </span>
                            )}
                            {editMode && (
                                <div className="puAvatarOverlay">
                                    <span className="material-icons-outlined">
                                        camera_alt
                                    </span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif"
                            style={{ display: "none" }}
                            onChange={handleAvatarChange}
                        />
                        {!editMode && (
                            <button
                                className="puBtn primary puEditBtn"
                                onClick={startEdit}
                            >
                                <span className="material-icons-outlined">
                                    edit
                                </span>
                                Editar Perfil
                            </button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="puInfoSection">
                        <div className="puUserHeader">
                            {editMode ? (
                                <input
                                    type="text"
                                    className="puNameInput"
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    placeholder="Tu nombre"
                                />
                            ) : (
                                <h3 className="puUserName">
                                    {user?.name || "Usuario"}
                                </h3>
                            )}
                            <span className="puUserRole">
                                {getRoleLabel(sessionStorage.getItem("roles"))}
                            </span>
                        </div>

                        <div className="puInfoGrid">
                            <div className="puInfoRow">
                                <span className="puInfoLabel">Nombre:</span>
                                <span className="puInfoValue">
                                    {user?.name || "-"}
                                </span>
                            </div>
                            <div className="puInfoRow">
                                <span className="puInfoLabel">Email:</span>
                                <span className="puInfoValue">
                                    {user?.email || "-"}
                                </span>
                            </div>
                            <div className="puInfoRow">
                                <span className="puInfoLabel">
                                    Cuenta creada:
                                </span>
                                <span className="puInfoValue">
                                    {user?.created_at
                                        ? new Date(
                                              user.created_at,
                                          ).toLocaleDateString("es-ES", {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                          })
                                        : "-"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mensaje de estado */}
                {saveMsg && (
                    <div
                        className={`puMessage ${saveMsg.includes("Error") ? "error" : "success"}`}
                    >
                        {saveMsg}
                    </div>
                )}

                {/* Botones de edición */}
                {editMode && (
                    <div className="puEditActions">
                        <button
                            className="puBtn light"
                            onClick={cancelEdit}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            className="puBtn primary"
                            onClick={saveProfile}
                            disabled={saving}
                        >
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                )}
            </section>

            {/* Acciones de cuenta */}
            <section className="puCard puActionsCard">
                <h4 className="puCardTitle">Acciones de Cuenta</h4>
                <div className="puActionsGrid">
                    <button className="puActionBtn" onClick={openPasswordModal}>
                        <span className="material-icons-outlined">lock</span>
                        <span>Cambiar Contraseña</span>
                    </button>
                </div>
            </section>

            {/* Modal Cambiar Contraseña */}
            {passwordModalOpen && (
                <div className="puModalOverlay" role="dialog" aria-modal="true">
                    <div className="puModalCard">
                        <div className="puModalHead">
                            <h3 className="puModalTitle">Cambiar Contraseña</h3>
                            <button
                                className="puModalClose"
                                onClick={closePasswordModal}
                                type="button"
                                aria-label="Cerrar"
                            >
                                <span className="material-icons-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        <div className="puModalBody">
                            {passwordError && (
                                <div className="puMessage error">
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="puMessage success">
                                    {passwordSuccess}
                                </div>
                            )}

                            <label className="puField">
                                <span>Contraseña Actual</span>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(e.target.value)
                                    }
                                    className="puControl"
                                    placeholder="Tu contraseña actual"
                                />
                            </label>

                            <label className="puField">
                                <span>Nueva Contraseña</span>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    className="puControl"
                                    placeholder="Mínimo 8 caracteres"
                                />
                            </label>

                            <label className="puField">
                                <span>Confirmar Nueva Contraseña</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className="puControl"
                                    placeholder="Repite la nueva contraseña"
                                />
                            </label>
                        </div>

                        <div className="puModalFooter">
                            <button
                                className="puBtn light"
                                type="button"
                                onClick={closePasswordModal}
                                disabled={changingPassword}
                            >
                                Cancelar
                            </button>
                            <button
                                className="puBtn primary"
                                type="button"
                                onClick={handleChangePassword}
                                disabled={changingPassword}
                            >
                                {changingPassword
                                    ? "Cambiando..."
                                    : "Cambiar Contraseña"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalles de Guardia */}
            {dutyModalOpen && selectedDuty && (
                <div className="puModalOverlay" role="dialog" aria-modal="true">
                    <div className="puModalCard puDutyModalCard">
                        <div className="puModalHead">
                            <h3 className="puModalTitle">
                                Detalles de la Guardia
                            </h3>
                            <button
                                className="puModalClose"
                                onClick={() => {
                                    setDutyModalOpen(false);
                                    setSelectedDuty(null);
                                }}
                                type="button"
                                aria-label="Cerrar"
                            >
                                <span className="material-icons-outlined">
                                    close
                                </span>
                            </button>
                        </div>

                        <div className="puModalBody puDutyModalBody">
                            {/* Fecha destacada */}
                            <div className="puDutyModalDate">
                                <span className="material-icons-outlined">
                                    calendar_today
                                </span>
                                <div className="puDutyModalDateText">
                                    <span className="puDutyModalDateFull">
                                        {new Date(
                                            selectedDuty.date,
                                        ).toLocaleDateString("es-ES", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Detalles en grid */}
                            <div className="puDutyModalGrid">
                                <div className="puDutyModalItem">
                                    <span className="puDutyModalLabel">
                                        <span className="material-icons-outlined">
                                            work
                                        </span>
                                        Tipo de Guardia
                                    </span>
                                    <span className="puDutyModalValue">
                                        {selectedDuty.duty_type}
                                    </span>
                                </div>

                                {selectedDuty.speciality && (
                                    <div className="puDutyModalItem">
                                        <span className="puDutyModalLabel">
                                            <span className="material-icons-outlined">
                                                local_hospital
                                            </span>
                                            Especialidad
                                        </span>
                                        <span className="puDutyModalValue">
                                            {selectedDuty.speciality}
                                        </span>
                                    </div>
                                )}

                                <div className="puDutyModalItem">
                                    <span className="puDutyModalLabel">
                                        <span className="material-icons-outlined">
                                            person
                                        </span>
                                        Trabajador
                                    </span>
                                    <span className="puDutyModalValue">
                                        {selectedDuty.worker ||
                                            user?.name ||
                                            "-"}
                                    </span>
                                </div>

                                {selectedDuty.chief_worker && (
                                    <div className="puDutyModalItem">
                                        <span className="puDutyModalLabel">
                                            <span className="material-icons-outlined">
                                                supervisor_account
                                            </span>
                                            Jefe de Guardia
                                        </span>
                                        <span className="puDutyModalValue">
                                            {selectedDuty.chief_worker}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Badge de jefe si aplica */}
                            {selectedDuty.is_chief && (
                                <div className="puDutyModalChiefBadge">
                                    <span className="material-icons-outlined">
                                        star
                                    </span>
                                    <span>Eres el Jefe de esta Guardia</span>
                                </div>
                            )}
                        </div>

                        <div className="puModalFooter">
                            <button
                                className="puBtn primary"
                                type="button"
                                onClick={() => {
                                    setDutyModalOpen(false);
                                    setSelectedDuty(null);
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
