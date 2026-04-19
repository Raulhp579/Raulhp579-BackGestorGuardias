const API_BASE_URL = "/api";

function getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getNotifications() {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Error fetching notifications");
    return await response.json();
}

export async function markAsRead(id) {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Error marking notification as read");
    return await response.json();
}

export async function markAllAsRead() {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Error marking all notifications as read");
    return await response.json();
}
