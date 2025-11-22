import axios from 'axios';

const API_URL = 'http://localhost:5000/api/products';

export const fetchProducts = async (search = '', category = '') => {
    try {
        const response = await axios.get(`${API_URL}`, {
            params: { name: search, category } 
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching products", error);
        return [];
    }
};

export const importCSV = async (formData) => {
    return await axios.post(`${API_URL}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const updateProduct = async (id, productData) => {
    return await axios.put(`${API_URL}/${id}`, productData);
};

// NEW: Add Export Function
export const exportCSV = async () => {
    const response = await axios.get(`${API_URL}/export`, {
        responseType: 'blob', // Important for downloading files
    });
    // Create a download link programmatically
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'products.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const fetchHistory = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}/history`);
        return response.data;
    } catch (error) {
        console.error("Error fetching history", error);
        return [];
    }
};

export const deleteProduct = async (id) => {
    return await axios.delete(`${API_URL}/${id}`);
};

export const addProduct = async (productData) => {
    return await axios.post(`${API_URL}`, productData);
};