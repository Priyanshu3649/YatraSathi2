// Travel Plan API utilities
const API_BASE_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const travelPlanApi = {
  // Get all travel plans
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/travel-plans`, {
      headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch travel plans');
    }
    return data;
  },

  // Get travel plan by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/travel-plans/${id}`, {
      headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch travel plan');
    }
    return data;
  },

  // Create travel plan
  create: async (planData) => {
    const response = await fetch(`${API_BASE_URL}/travel-plans`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(planData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create travel plan');
    }
    return data;
  },

  // Update travel plan
  update: async (id, planData) => {
    const response = await fetch(`${API_BASE_URL}/travel-plans/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(planData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update travel plan');
    }
    return data;
  },

  // Delete travel plan
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/travel-plans/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete travel plan');
    }
    return data;
  },

  // Share travel plan
  share: async (id, shareData) => {
    const response = await fetch(`${API_BASE_URL}/travel-plans/${id}/share`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(shareData)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to share travel plan');
    }
    return data;
  },

  // Get shared users
  getSharedUsers: async (id) => {
    const response = await fetch(`${API_BASE_URL}/travel-plans/${id}/shared-users`, {
      headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get shared users');
    }
    return data;
  },

  // Remove shared user
  removeSharedUser: async (id, userId) => {
    const response = await fetch(`${API_BASE_URL}/travel-plans/${id}/shared-users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove shared user');
    }
    return data;
  }
};
