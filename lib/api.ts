// Update the API base URL and authentication functions
const API_BASE_URL = "http://127.0.0.1:8000/api";

// Add token management
let authToken: string | null = null;

// Initialize token from localStorage
if (typeof window !== "undefined") {
  authToken = localStorage.getItem("auth_token");
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add Authorization header if token exists
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    headers,
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    // Handle empty responses for DELETE requests
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return { success: true };
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

export const getUserId = () => localStorage.getItem("user_id");

// Authentication API functions
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Handle different response structures
    const token =
      response.token || response.data?.token || response.access_token;
    let userData = response.user || response.data?.user || response.data;

    // If no separate user object, the response might be the user data itself
    if (!userData && response.id) {
      userData = response;
    }

    // Store the token if login is successful
    if (token) {
      authToken = token;
      localStorage.setItem("auth_token", token);
    }
    localStorage.setItem("user_id", userData.id);

    // Return the processed response
    return {
      user: userData,
      token: token,
      ...response,
    };
  },

  changePassword: (passwordData: {
    old_password: string;
    new_password: string;
    confirmed_password: string;
  }) =>
    apiRequest("/change-passwords", {
      method: "POST",
      body: JSON.stringify(passwordData),
    }),

  updateProfile: (profileData: { name: string; email: string }) =>
    apiRequest("/update_profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    }),

  logout: async () => {
    try {
      await apiRequest("/logout", {
        method: "POST",
      });
    } finally {
      // Clear token regardless of API response
      authToken = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("ngo_user");
    }
  },
};

// Helper function to set token (for when user data is loaded from localStorage)
export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem("auth_token", token);
};

// Helper function to clear token
export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem("auth_token");
  localStorage.removeItem("ngo_user");
};

// User API functions
export const userAPI = {
  create: (userData: any) =>
    apiRequest("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  getAll: () => apiRequest("/users"),

  getById: (id: number) => apiRequest(`/users/${id}`),

  update: (id: number, userData: any) =>
    apiRequest(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

  delete: (id: number) =>
    apiRequest(`/users/${id}`, {
      method: "DELETE",
    }),
};

// Item API functions
export const itemAPI = {
  create: (itemData: any) =>
    apiRequest("/items", {
      method: "POST",
      body: JSON.stringify(itemData),
    }),

  getAll: () => apiRequest("/items"),

  getById: (id: number) => apiRequest(`/items/${id}`),

  update: (id: number, itemData: any) =>
    apiRequest(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(itemData),
    }),

  delete: (id: number) =>
    apiRequest(`/items/${id}`, {
      method: "DELETE",
    }),
};

// Warehouse API functions
export const warehouseAPI = {
  create: (warehouseData: any) =>
    apiRequest("/warehouses", {
      method: "POST",
      body: JSON.stringify(warehouseData),
    }),

  getAll: () => apiRequest("/warehouses"),

  getById: (id: number) => apiRequest(`/warehouses/${id}`),

  update: (id: number, warehouseData: any) =>
    apiRequest(`/warehouses/${id}`, {
      method: "PUT",
      body: JSON.stringify(warehouseData),
    }),

  delete: (id: number) =>
    apiRequest(`/warehouses/${id}`, {
      method: "DELETE",
    }),
};

// NGO API functions
export const ngoAPI = {
  create: (ngoData: any) =>
    apiRequest("/ngos", {
      method: "POST",
      body: JSON.stringify(ngoData),
    }),

  getAll: () => apiRequest("/ngos"),

  getById: (id: number) => apiRequest(`/ngos/${id}`),

  update: (id: number, ngoData: any) =>
    apiRequest(`/ngos/${id}`, {
      method: "PUT",
      body: JSON.stringify(ngoData),
    }),

  delete: (id: number) =>
    apiRequest(`/ngos/${id}`, {
      method: "DELETE",
    }),
};

// Supply Request API functions
export const supplyRequestAPI = {
  create: (requestData: any) =>
    apiRequest("/supply-requests", {
      method: "POST",
      body: JSON.stringify(requestData),
    }),

  getAll: () => apiRequest("/supply-requests"),

  getById: (id: number) => apiRequest(`/supply-requests/${id}`),

  update: (id: number, requestData: any) =>
    apiRequest(`/supply-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(requestData),
    }),

  delete: (id: number) =>
    apiRequest(`/supply-requests/${id}`, {
      method: "DELETE",
    }),
};

// Delivery API functions
export const deliveryAPI = {
  create: (deliveryData: any) =>
    apiRequest("/deliveries", {
      method: "POST",
      body: JSON.stringify(deliveryData),
    }),

  getAll: () => apiRequest("/deliveries"),

  getById: (id: number) => apiRequest(`/deliveries/${id}`),

  update: (id: number, deliveryData: any) =>
    apiRequest(`/deliveries/${id}`, {
      method: "PUT",
      body: JSON.stringify(deliveryData),
    }),

  delete: (id: number) =>
    apiRequest(`/deliveries/${id}`, {
      method: "DELETE",
    }),
};

// Warehouse Items API functions
export const warehouseItemAPI = {
  create: (warehouseItemData: any) =>
    apiRequest("/warehouse-items", {
      method: "POST",
      body: JSON.stringify(warehouseItemData),
    }),

  getAll: () => apiRequest("/warehouse-items"),

  getById: (id: number) => apiRequest(`/warehouse-items/${id}`),

  update: (id: number, warehouseItemData: any) =>
    apiRequest(`/warehouse-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(warehouseItemData),
    }),

  delete: (id: number) =>
    apiRequest(`/warehouse-items/${id}`, {
      method: "DELETE",
    }),
};

// Driver API functions
export const driverAPI = {
  create: (driverData: any) =>
    apiRequest("/drivers", {
      method: "POST",
      body: JSON.stringify(driverData),
    }),

  getAll: () => apiRequest("/drivers"),

  getById: (id: number) => apiRequest(`/drivers/${id}`),

  update: (id: number, driverData: any) =>
    apiRequest(`/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(driverData),
    }),

  delete: (id: number) =>
    apiRequest(`/drivers/${id}`, {
      method: "DELETE",
    }),
};

// Truck API functions
export const truckAPI = {
  create: (truckData: any) =>
    apiRequest("/trucks", {
      method: "POST",
      body: JSON.stringify(truckData),
    }),

  getAll: () => apiRequest("/trucks"),

  getById: (id: number) => apiRequest(`/trucks/${id}`),

  update: (id: number, truckData: any) =>
    apiRequest(`/trucks/${id}`, {
      method: "PUT",
      body: JSON.stringify(truckData),
    }),

  delete: (id: number) =>
    apiRequest(`/trucks/${id}`, {
      method: "DELETE",
    }),
};
