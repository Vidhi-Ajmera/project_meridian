import axios from "axios";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const signup = async (data) => {
  try {
    const response = await api.post("/auth/signup", data);
    return response.data;
  } catch (err) {
    console.error(err);
    return { error: err.response?.data?.detail || "Signup failed" };
  }
};

export const login = async (data) => {
  try {
    const formData = new URLSearchParams(data);
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return response.data;
  } catch (err) {
    console.error(err);
    return { error: err.response?.data?.detail || "Login failed" };
  }
};

export const createContest = async (token, data) => {
  try {
    const response = await api.post(
      `/contest/create?teacher_email=${data.teacher_email}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error(err);
    return { error: err.response?.data?.detail || "Contest creation failed" };
  }
};
