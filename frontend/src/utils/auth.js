// utils/auth.js
export const saveToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");
export const clearToken = () => localStorage.removeItem("token");
export const saveUserInfo = (userInfo) =>
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
export const getUserInfo = () => JSON.parse(localStorage.getItem("userInfo"));
