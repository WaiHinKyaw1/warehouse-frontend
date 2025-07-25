
import { apiRequest } from '@/lib/api';

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),

  me: () => apiRequest("/auth/me"),
}
