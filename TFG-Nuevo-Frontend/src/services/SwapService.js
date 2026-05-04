import axios from "axios";

const API_URL = "/api";

function getHeaders() {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
}

export const getSwaps = async () => {
    const response = await axios.get(`${API_URL}/duty-swaps`, getHeaders());
    return response.data;
};

export const createSwapRequest = async (id_duty_from, id_duty_to, comments) => {
    const response = await axios.post(`${API_URL}/duty-swaps`, {
        id_duty_from,
        id_duty_to,
        comments,
    }, getHeaders());
    return response.data;
};

export const acceptSwap = async (id) => {
    const response = await axios.put(`${API_URL}/duty-swaps/${id}/accept`, {}, getHeaders());
    return response.data;
};

export const rejectSwap = async (id) => {
    const response = await axios.put(`${API_URL}/duty-swaps/${id}/reject`, {}, getHeaders());
    return response.data;
};

export const approveSwap = async (id) => {
    const response = await axios.put(`${API_URL}/duty-swaps/${id}/approve`, {}, getHeaders());
    return response.data;
};

export const declineSwap = async (id) => {
    const response = await axios.put(`${API_URL}/duty-swaps/${id}/decline`, {}, getHeaders());
    return response.data;
};
