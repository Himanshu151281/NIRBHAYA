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
      // Parse error response for AI validation failures
      const errorData = await response.json().catch(() => null);
      
      // Check if it's an AI validation error
      if (response.status === 400 && errorData?.detail?.error === 'INVALID_INCIDENT') {
        const error = new Error(errorData.detail.message || "Invalid incident submission");
        // Attach additional error details
        (error as any).isAIRejection = true;
        (error as any).aiReason = errorData.detail.reason;
        (error as any).aiConfidence = errorData.detail.confidence;
        throw error;
      }
      
      // Generic error for other cases
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
