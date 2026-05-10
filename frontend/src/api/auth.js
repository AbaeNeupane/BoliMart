import client from "./client"
import axios from "axios"
import { API_URL } from "../utils/constants"

export const register = (data) => client.post("/auth/register", data)
export const login = (email, password) =>
  axios.post(`${API_URL}/auth/login`, new URLSearchParams({ username: email, password }), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  })
export const refreshToken = (token) => axios.post(`${API_URL}/auth/refresh`, { refresh_token: token })
export const getMe = () => client.get("/users/me")
