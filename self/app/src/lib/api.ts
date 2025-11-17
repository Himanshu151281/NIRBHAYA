// API configuration for NIRBHAYA backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Cache-busting fetch wrapper - always get fresh data
const fetchNoCache = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    cache: 'no-store',
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
};

export const api = {
  // Health check
  async healthCheck() {
    const response = await fetchNoCache(`${API_BASE_URL}/api/incidents/health/check`);
    return response.json();
  },

  // Submit new incident
  async submitIncident(formData: FormData) {
    const response = await fetchNoCache(`${API_BASE_URL}/api/incidents/submit`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Get all incidents
  async getIncidents(limit = 50, skip = 0) {
    const response = await fetchNoCache(
      `${API_BASE_URL}/api/incidents/list?limit=${limit}&skip=${skip}&_t=${Date.now()}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Get single incident
  async getIncident(id: string) {
    const response = await fetchNoCache(`${API_BASE_URL}/api/incidents/${id}?_t=${Date.now()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Verify incident integrity
  async verifyIncident(id: string) {
    const response = await fetchNoCache(`${API_BASE_URL}/api/incidents/verify/${id}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};
