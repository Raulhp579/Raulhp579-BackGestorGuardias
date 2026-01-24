const MAIN_URL = "/api"

export async function login(user){
    try {
    let response = await fetch(`${MAIN_URL}/login`,{
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            "Accept": "application/json",
        },
        body: JSON.stringify(user)
    })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
}

        return await response.json();
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}
