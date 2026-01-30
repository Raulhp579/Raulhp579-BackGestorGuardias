const API_BASE_URL = "/api";

// Helper para obtener headers con token
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getProfile() {
    const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Error al obtener perfil");
    }

    return await response.json();
}

//revisar si funciona porque puede enviar un avatar o no
export async function updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
    });

    if (!response.ok) {
        throw new Error("Error al actualizar perfil");
    }

    return await response.json();
}

export async function changePassword(passwordData) {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
        throw new Error("Error al cambiar contraseña");
    }

    return await response.json();
}

export async function deleteProfile() {
    const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error("Error al eliminar perfil");
    }

    return await response.json();
}