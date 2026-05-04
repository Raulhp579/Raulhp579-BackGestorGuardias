import { useState, useEffect, useRef } from "react";
import {
    getProfile,
    updateProfile,
    changePassword,
} from "../services/ProfileService";

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
            <div className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                    >
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="text-muted">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
                <div
                    className="text-center card border-0 shadow-sm p-5 rounded-4"
                    style={{ maxWidth: "400px" }}
                >
                    <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
                    <h4 className="fw-bold mb-3">Error</h4>
                    <p className="text-muted mb-4">{error}</p>
                    <button
                        className="btn btn-primary w-100 rounded-3"
                        onClick={loadProfile}
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const avatarUrl =
        avatarPreview || (user?.avatarUrl ? `/${user.avatarUrl}` : null);

    return (
        <div className="bg-light min-vh-100">
            <div className="container-fluid pt-5 mt-4 pb-5">
                <div className="mx-auto" style={{ maxWidth: "900px" }}>
                <h2 className="fw-bold mb-4 text-dark">Mi Perfil</h2>

                {/* Card principal */}
                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-4 p-md-5">
                        <div className="row align-items-center">
                            {/* Columna Izquierda (Avatar y Botón) */}
                            <div className="col-md-4 text-center border-md-end pe-md-4">
                                <div
                                    className="position-relative d-inline-block mb-3"
                                    onClick={
                                        editMode ? handleAvatarClick : undefined
                                    }
                                    style={{
                                        cursor: editMode
                                            ? "pointer"
                                            : "default",
                                    }}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="rounded-circle shadow-sm"
                                            style={{
                                                width: "160px",
                                                height: "160px",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rounded-circle bg-success-subtle text-success border border-success-subtle d-flex align-items-center justify-content-center shadow-sm"
                                            style={{
                                                width: "160px",
                                                height: "160px",
                                                fontSize: "3rem",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {getInitials(user?.name)}
                                        </div>
                                    )}
                                    {editMode && (
                                        <div
                                            className="position-absolute bottom-0 end-0 bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                border: "1px solid #eee",
                                            }}
                                        >
                                            <i className="bi bi-camera-fill text-secondary"></i>
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
                                        className="btn btn-light border shadow-sm text-dark fw-medium mt-4 w-100 rounded-3"
                                        onClick={startEdit}
                                    >
                                        <i className="bi bi-pencil-square me-2"></i>
                                        Editar Perfil
                                    </button>
                                )}
                            </div>

                            {/* Columna Derecha (Datos) */}
                            <div className="col-md-8 ps-md-5">
                                <div className="d-flex align-items-center mb-4">
                                    {editMode ? (
                                        <input
                                            type="text"
                                            className="form-control form-control-lg rounded-3 me-3"
                                            value={editName}
                                            onChange={(e) =>
                                                setEditName(e.target.value)
                                            }
                                            placeholder="Tu nombre"
                                        />
                                    ) : (
                                        <h3 className="fw-bold mb-0 me-3 text-dark">
                                            {user?.name || "Usuario"}
                                        </h3>
                                    )}
                                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2 flex-shrink-0">
                                        {getRoleLabel(
                                            sessionStorage.getItem("roles"),
                                        )}
                                    </span>
                                </div>

                                <div className="row g-4">
                                    <div className="col-sm-6">
                                        <p className="text-muted small fw-bold text-uppercase mb-1">
                                            <i className="bi bi-envelope me-1"></i>{" "}
                                            Email
                                        </p>
                                        <p className="fs-6 fw-medium text-dark mb-4 text-break">
                                            {user?.email || "-"}
                                        </p>
                                    </div>
                                    <div className="col-sm-6">
                                        <p className="text-muted small fw-bold text-uppercase mb-1">
                                            <i className="bi bi-calendar3 me-1"></i>{" "}
                                            Cuenta creada
                                        </p>
                                        <p className="fs-6 fw-medium text-dark mb-4">
                                            {user?.created_at
                                                ? new Date(
                                                      user.created_at,
                                                  ).toLocaleDateString(
                                                      "es-ES",
                                                      {
                                                          year: "numeric",
                                                          month: "long",
                                                          day: "numeric",
                                                      },
                                                  )
                                                : "-"}
                                        </p>
                                    </div>
                                </div>

                                {/* Mensaje de estado */}
                                {saveMsg && (
                                    <div
                                        className={`alert mt-4 py-2 px-3 small rounded-3 ${saveMsg.includes("Error") ? "alert-danger" : "alert-success"}`}
                                    >
                                        {saveMsg}
                                    </div>
                                )}

                                {/* Botones de edición */}
                                {editMode && (
                                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                                        <button
                                            className="btn btn-light rounded-3 px-4"
                                            onClick={cancelEdit}
                                            disabled={saving}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="btn rounded-3 px-4 shadow-sm"
                                            style={{
                                                backgroundColor: "#006236",
                                                color: "white",
                                            }}
                                            onClick={saveProfile}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <span
                                                        className="spinner-border spinner-border-sm me-2"
                                                        role="status"
                                                        aria-hidden="true"
                                                    ></span>
                                                    Guardando...
                                                </>
                                            ) : (
                                                "Guardar Cambios"
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta Secundaria (Seguridad) */}
                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-4">
                        <h5 className="fw-bold mb-3">Acciones de cuenta</h5>
                        <div className="d-flex flex-wrap gap-3">
                            <button
                                className="btn btn-outline-dark rounded-3 px-4"
                                onClick={openPasswordModal}
                            >
                                <i className="bi bi-shield-lock me-2"></i>
                                Cambiar Contraseña
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* Modal Cambiar Contraseña (Rediseñado con Bootstrap) */}
            {passwordModalOpen && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0 pt-4 px-4">
                                <h5 className="modal-title fw-bold">
                                    Cambiar Contraseña
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closePasswordModal}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                {passwordError && (
                                    <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                                        {passwordError}
                                    </div>
                                )}
                                {passwordSuccess && (
                                    <div className="alert alert-success py-2 px-3 small rounded-3 mb-3">
                                        {passwordSuccess}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">
                                        Contraseña Actual
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                        className="form-control rounded-3"
                                        placeholder="Tu contraseña actual"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label small fw-bold text-muted text-uppercase">
                                        Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        className="form-control rounded-3"
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                </div>

                                <div className="mb-0">
                                    <label className="form-label small fw-bold text-muted text-uppercase">
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        className="form-control rounded-3"
                                        placeholder="Repite la nueva contraseña"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button
                                    className="btn btn-light rounded-3 px-4"
                                    onClick={closePasswordModal}
                                    disabled={changingPassword}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn rounded-3 px-4"
                                    style={{
                                        backgroundColor: "#006236",
                                        color: "white",
                                    }}
                                    onClick={handleChangePassword}
                                    disabled={changingPassword}
                                >
                                    {changingPassword
                                        ? "Cambiando..."
                                        : "Actualizar Contraseña"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
