const MAIN_URL = "/api";

export async function login(user) {
    let response = await fetch(`${MAIN_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(user),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        // Get error message from backend response
        const errorMsg =
            data?.message ||
            data?.error ||
            `Error de autenticación (${response.status})`;
        throw new Error(errorMsg);
    }

    return data;
}
