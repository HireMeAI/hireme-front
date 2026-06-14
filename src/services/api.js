/**
 * Unified API Client for HireMe AI Platform
 * Handles proxy requests through Vite to the Spring Cloud Gateway
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getAuthHeaders = () => {
  const token = localStorage.getItem('hireme_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }
  
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      try {
        errorMessage = await response.text() || errorMessage;
      } catch (textErr) {}
    }
    
    // Automatically log out if unauthorized/forbidden
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('hireme_token');
      localStorage.removeItem('hireme_user');
      // Dispatch custom event so Context can capture it
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (err) {
    return null;
  }
};

export const api = {
  // --- AUTH ENDPOINTS ---
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return handleResponse(res);
    },
    
    register: async (email, password, name, lastName, bio, title) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName: name, lastName, bio, title })
      });
      return handleResponse(res);
    },

    registerRecruiter: async (email, password, name, lastName, companyName) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/recruiter/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName: name, lastName, companyName })
      });
      return handleResponse(res);
    },

    registerAdmin: async (email, password, name, lastName) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName: name, lastName })
      });
      return handleResponse(res);
    },

    confirmEmail: async (token) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/confirm?token=${encodeURIComponent(token)}`, {
        method: 'GET'
      });
      if (res.ok) return await res.text();
      return handleResponse(res);
    },

    resendVerificationEmail: async (email) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return handleResponse(res);
    },

    resetPasswordEmail: async (email) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) return await res.text();
      return handleResponse(res);
    },

    validateResetToken: async (token) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/resetPassword?token=${encodeURIComponent(token)}`, {
        method: 'GET'
      });
      if (res.ok) return await res.text();
      return handleResponse(res);
    },

    confirmResetPassword: async (token, newPassword) => {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      if (res.ok) return await res.text();
      return handleResponse(res);
    }
  },

  // --- USER PROFILE (all roles) ---
  user: {
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/api/candidate/me`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      return handleResponse(res);
    }
  },

  // --- CANDIDATE PROFILE ---
  candidate: {
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/api/candidate/me`, {
        method: 'GET',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json' 
        }
      });
      return handleResponse(res);
    },

    updateProfile: async (profileData) => {
      // Map frontend naming (name, title) to backend DTO expectations (firstName, desiredJobTitle)
      const mappedData = {
        firstName: profileData.name !== undefined ? profileData.name : profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        desiredJobTitle: profileData.title !== undefined ? profileData.title : profileData.desiredJobTitle,
        availability: profileData.availability,
        contractPreferences: profileData.contractPreferences,
        autoApplyEnabled: profileData.autoApplyEnabled,
        openToRelocate: profileData.openToRelocate
      };

      const res = await fetch(`${API_BASE_URL}/api/candidate/updateProfile`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(mappedData)
      });
      return handleResponse(res);
    }
  },

  // --- RESUME OPERATIONS ---
  resumes: {
    list: async (userId) => {
      const url = userId ? `${API_BASE_URL}/api/resumes?userId=${userId}` : `${API_BASE_URL}/api/resumes`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    get: async (id) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${id}`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    create: async (resumeData) => {
      // resumeData: { userId, contactId, templateId, title, portfolioSlug, summary, visibility }
      const res = await fetch(`${API_BASE_URL}/api/resumes`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resumeData)
      });
      return handleResponse(res);
    },

    update: async (id, resumeData) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(resumeData)
      });
      return handleResponse(res);
    },

    delete: async (id) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    getBySlug: async (slug) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/slug/${slug}`, {
        method: 'GET'
      });
      return handleResponse(res);
    },

    // Skill Management on Resume
    addSkill: async (resumeId, skillId) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/skills/${skillId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    removeSkill: async (resumeId, skillId) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/skills/${skillId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    // Language Management on Resume
    addLanguage: async (resumeId, languageId) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/languages/${languageId}`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    removeLanguage: async (resumeId, languageId) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/languages/${languageId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    }
  },

  // --- CONTACTS ---
  contacts: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },
    
    create: async (contactData) => {
      // contactData: { phone, email, address, city, postalCode, linkedin }
      const res = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
      return handleResponse(res);
    },

    update: async (id, contactData) => {
      const res = await fetch(`${API_BASE_URL}/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
      return handleResponse(res);
    }
  },

  // --- EDUCATIONS (Resume sub-resource) ---
  educations: {
    list: async (resumeId) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/educations`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    create: async (resumeId, eduData) => {
      // eduData: { institution, degree, fieldOfStudy, startDate, endDate, description }
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/educations`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...eduData, resumeId })
      });
      return handleResponse(res);
    },

    update: async (resumeId, code, eduData) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/educations/${code}`, {
        method: 'PUT',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...eduData, resumeId })
      });
      return handleResponse(res);
    },

    delete: async (resumeId, code) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/educations/${code}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    }
  },

  // --- EXPERIENCES (Resume sub-resource) ---
  experiences: {
    list: async (resumeId) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/experiences`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    create: async (resumeId, expData) => {
      // expData: { company, title, description, startDate, endDate, current }
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/experiences`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...expData, resumeId })
      });
      return handleResponse(res);
    },

    update: async (resumeId, id, expData) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/experiences/${id}`, {
        method: 'PUT',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...expData, resumeId })
      });
      return handleResponse(res);
    },

    delete: async (resumeId, id) => {
      const res = await fetch(`${API_BASE_URL}/api/resumes/${resumeId}/experiences/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    }
  },

  // --- GLOBAL SKILLS ---
  skills: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/api/skills`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    create: async (title) => {
      const res = await fetch(`${API_BASE_URL}/api/skills`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      return handleResponse(res);
    }
  },

  // --- GLOBAL LANGUAGES ---
  languages: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/api/languages`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    create: async (title) => {
      const res = await fetch(`${API_BASE_URL}/api/languages`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      return handleResponse(res);
    }
  },

  // --- JOB OFFERS ---
  jobs: {
    create: async (jobData) => {
      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      return handleResponse(res);
    },

    getById: async (id) => {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    getByRecruiter: async (recruiterId) => {
      const res = await fetch(`${API_BASE_URL}/api/jobs/recruiter/${recruiterId}`, {
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    search: async ({ contractType, remotePolicy, keyword } = {}) => {
      const params = new URLSearchParams();
      if (contractType) params.append('contractType', contractType);
      if (remotePolicy) params.append('remotePolicy', remotePolicy);
      if (keyword) params.append('keyword', keyword);
      const res = await fetch(`${API_BASE_URL}/api/jobs?${params}`, {
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    update: async (id, jobData) => {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      return handleResponse(res);
    },

    delete: async (id) => {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    }
  },

  // --- TEMPLATES ---
  templates: {
    list: async () => {
      const res = await fetch(`${API_BASE_URL}/api/templates`, {
        method: 'GET',
        headers: { ...getAuthHeaders() }
      });
      return handleResponse(res);
    },

    create: async (templateData) => {
      const res = await fetch(`${API_BASE_URL}/api/templates`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      return handleResponse(res);
    }
  }
};
