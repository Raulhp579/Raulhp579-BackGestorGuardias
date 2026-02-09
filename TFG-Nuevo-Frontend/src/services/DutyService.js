const endpoint = "/api";

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
    if (Array.isArray(payload?.duties)) return payload.duties;
    return [];
}

// helper mínimo: normaliza respuestas tipo {} o {data: {}} o {duty: {}}
function normalizeItem(payload) {
    if (payload && typeof payload === "object") {
        if (payload.data && typeof payload.data === "object") return payload.data;
        if (payload.duty && typeof payload.duty === "object") return payload.duty;
    }
    return payload;
}

export async function getDuties(params) {
    try {
        // NUEVO: soporta query params opcionales (name, start, end)
        let url = `${endpoint}/duties`;

        if (params && typeof params === "object") {
            const qs = new URLSearchParams();

            if (params.start) qs.set("start", params.start);
            if (params.end) qs.set("end", params.end);
            if (params.name) qs.set("name", params.name);

            const q = qs.toString();
            if (q) url += `?${q}`;
        }

        let response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        // devuelve siempre lista consistente
        return normalizeList(json);
    } catch (error) {
        console.error("Error al obtener guardias:", error);
        throw error;
    }
}

export async function updateDuty(id, data) {
    try {
        let response = await fetch(`${endpoint}/duties/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        // por si backend envía {data:{...}}
        return normalizeItem(json);
    } catch (error) {
        console.error("Error al actualizar guardia:", error);
        throw error;
    }
}

export async function deleteDuty(id) {
    try {
        let response = await fetch(`${endpoint}/duties/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al eliminar guardia:", error);
        throw error;
    }
}

// Obtener guardias de un trabajador específico
export async function getWorkerDuties(workerId) {
    try {
        // ahora getDuties siempre devuelve array (por normalizeList)
        const allDuties = await getDuties();
        return allDuties.filter((duty) => duty.id_worker === workerId);
    } catch (error) {
        console.error("Error al obtener guardias del trabajador:", error);
        throw error;
    }
}

export async function createDuty(data) {
    try {
        const response = await fetch(`${endpoint}/duties`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            // intentamos sacar mensaje del backend
            let msg = `HTTP error! status: ${response.status}`;
            try {
                const err = await response.json();
                msg = err?.message || err?.error || msg;
            } catch (_) { }
            throw new Error(msg);
        }

        const json = await response.json();
        // importante para que el calendario tenga id/date/duty_type
        return normalizeItem(json);
    } catch (error) {
        console.error("Error al crear guardia:", error);
        throw error;
    }
}


export async function getDutiesLastUpdate(params = {}) {
    try {
        let url = `${endpoint}/duties/last-update`;

        if (params && typeof params === "object") {
            const qs = new URLSearchParams();
            if (params.start) qs.set("start", params.start);
            if (params.end) qs.set("end", params.end);
            if (params.name) qs.set("name", params.name);

            const q = qs.toString();
            if (q) url += `?${q}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            let msg = `HTTP error! status: ${response.status}`;
            try {
                const err = await response.json();
                msg = err?.message || err?.error || msg;
            } catch (_) { }
            throw new Error(msg);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al obtener last-update:", error);
        throw error;
    }
}