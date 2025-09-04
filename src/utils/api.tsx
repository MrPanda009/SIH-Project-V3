import { projectId, publicAnonKey } from './supabase/info'
import { supabase } from './supabase/client'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a75d69fe`

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`
  }
  
  return headers
}

// Authentication API
export const authAPI = {
  signUp: async (email: string, password: string, name: string, aadhaar: string, role: 'citizen' | 'authority' = 'citizen') => {
    const response = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name, aadhaar, role })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Signup failed')
    }
    
    return response.json()
  },
  
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  forgotPassword: async (aadhaar: string) => {
    const response = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ aadhaar })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send OTP')
    }
    
    return response.json()
  },

  verifyForgotPasswordOTP: async (aadhaar: string, otp: string) => {
    const response = await fetch(`${API_BASE}/verify-forgot-password-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ aadhaar, otp })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Invalid OTP')
    }
    
    return response.json()
  },

  resetPassword: async (aadhaar: string, newPassword: string) => {
    const response = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ aadhaar, newPassword })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reset password')
    }
    
    return response.json()
  }
}

// Tickets API
export const ticketsAPI = {
  submit: async (ticketData: {
    category: string
    description?: string
    location: { lat: number, lng: number, address?: string, ward?: string }
    imageUrl?: string
  }) => {
    const response = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(ticketData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error submitting ticket:', error)
      throw new Error(error.error || 'Failed to submit ticket')
    }
    
    return response.json()
  },
  
  getMyTickets: async () => {
    const response = await fetch(`${API_BASE}/tickets/my`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching tickets:', error)
      throw new Error(error.error || 'Failed to fetch tickets')
    }
    
    return response.json()
  },
  
  getNearbyTickets: async (lat: number, lng: number, radius: number = 5) => {
    const response = await fetch(`${API_BASE}/tickets/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching nearby tickets:', error)
      throw new Error(error.error || 'Failed to fetch nearby tickets')
    }
    
    return response.json()
  },
  
  updateStatus: async (ticketId: string, status: string, resolution?: string, proofImageUrl?: string) => {
    const response = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, resolution, proofImageUrl })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error updating ticket status:', error)
      throw new Error(error.error || 'Failed to update ticket')
    }
    
    return response.json()
  },
  
  upvote: async (ticketId: string) => {
    const response = await fetch(`${API_BASE}/tickets/${ticketId}/upvote`, {
      method: 'POST',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error upvoting ticket:', error)
      throw new Error(error.error || 'Failed to upvote ticket')
    }
    
    return response.json()
  },

  getHeatmapData: async (timeFilter: string = 'week', wardFilter: string = 'all') => {
    const response = await fetch(`${API_BASE}/tickets/heatmap?timeFilter=${timeFilter}&wardFilter=${wardFilter}`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching heatmap data:', error)
      throw new Error(error.error || 'Failed to fetch heatmap data')
    }
    
    return response.json()
  },

  getAllTickets: async (ward?: string, status?: string, dateFrom?: string, dateTo?: string, sortBy?: string) => {
    const params = new URLSearchParams()
    if (ward && ward !== 'all') params.append('ward', ward)
    if (status && status !== 'all') params.append('status', status)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    if (sortBy) params.append('sortBy', sortBy)
    
    const response = await fetch(`${API_BASE}/tickets/all?${params.toString()}`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching all tickets:', error)
      throw new Error(error.error || 'Failed to fetch tickets')
    }
    
    return response.json()
  }
}

// File upload API
export const uploadAPI = {
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const { data: { session } } = await supabase.auth.getSession()
    const headers: HeadersInit = {}
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`
    }
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error uploading file:', error)
      throw new Error(error.error || 'Failed to upload file')
    }
    
    return response.json()
  }
}

// Profile API
export const profileAPI = {
  updateProfile: async (profileData: {
    name: string
    phone?: string
    address?: string
    department?: string
    designation?: string
    employeeId?: string
    profileImage?: string
  }) => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(profileData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error updating profile:', error)
      throw new Error(error.error || 'Failed to update profile')
    }
    
    return response.json()
  },
  
  getProfile: async () => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching profile:', error)
      throw new Error(error.error || 'Failed to fetch profile')
    }
    
    return response.json()
  },

  sendProfileUpdateOTP: async (email: string) => {
    const response = await fetch(`${API_BASE}/profile/send-otp`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ email })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error sending profile update OTP:', error)
      throw new Error(error.error || 'Failed to send OTP')
    }
    
    return response.json()
  },

  verifyProfileUpdateOTP: async (otp: string, profileData: any) => {
    const response = await fetch(`${API_BASE}/profile/verify-otp`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ otp, profileData })
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error verifying profile update OTP:', error)
      throw new Error(error.error || 'Failed to verify OTP')
    }
    
    return response.json()
  }
}

// Notifications API
export const notificationsAPI = {
  getNotifications: async () => {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'GET',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error fetching notifications:', error)
      throw new Error(error.error || 'Failed to fetch notifications')
    }
    
    return response.json()
  },

  markAsRead: async (notificationId: string) => {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error marking notification as read:', error)
      throw new Error(error.error || 'Failed to mark notification as read')
    }
    
    return response.json()
  },

  markAllAsRead: async () => {
    const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: await getAuthHeaders()
    })
    
    if (!response.ok) {
      const error = await response.json()
      console.error('Error marking all notifications as read:', error)
      throw new Error(error.error || 'Failed to mark all notifications as read')
    }
    
    return response.json()
  }
}