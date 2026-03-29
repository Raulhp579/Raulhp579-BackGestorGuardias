const endpoint = "/api/admin";

// Helper para obtener headers con token
function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// helper mínimo: normaliza respuestas tipo [] o {data: []}
function normalizeList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

// helper mínimo: normaliza respuestas tipo {} o {data: {}}
function normalizeItem(payload) {
    if (payload && typeof payload === "object") {
        if (payload.data && typeof payload.data === "object")
            return payload.data;
    }
    return payload;
}

export async function getFichajes() {
    try {
        let response = await fetch(`${endpoint}/fichajes`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return normalizeList(json);
    } catch (error) {
        console.error("Error al obtener fichajes:", error);
        throw error;
    }
}

export async function createFichaje(data) {
    try {
        const response = await fetch(`${endpoint}/fichajes`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            let msg = `HTTP error! status: ${response.status}`;
            try {
                const err = await response.json();
                msg = err?.message || err?.error || msg;
            } catch (_) {}
            throw new Error(msg);
        }

        const json = await response.json();
        return normalizeItem(json);
    } catch (error) {
        console.error("Error al crear fichaje:", error);
        throw error;
    }
}

export async function updateFichaje(id, data) {
    try {
        let response = await fetch(`${endpoint}/fichajes/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        return normalizeItem(json);
    } catch (error) {
        console.error("Error al actualizar fichaje:", error);
        throw error;
    }
}

export async function deleteFichaje(id) {
    try {
        let response = await fetch(`${endpoint}/fichajes/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al eliminar fichaje:", error);
        throw error;
    }
}

// User Endpoints
export async function punchClock() {
    try {
        const response = await fetch('/api/fichajes', {
            method: 'POST',
            headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
            let msg = `HTTP error! status: ${response.status}`;
            try {
                const err = await response.json();
                msg = err?.message || err?.error || msg;
            } catch (_) {}
            throw new Error(msg);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

export async function getLastThreePunches() {
    try {
        const response = await fetch('/api/fichajes/mis-ultimos-tres', {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const json = await response.json();
        return normalizeList(json);
    } catch (error) {
        throw error;
    }
}
