// Utility for local profile storage as fallback when backend is not available
export interface ProfileData {
  name: string
  phone?: string
  address?: string
  department?: string
  designation?: string
  employeeId?: string
  profileImage?: string
  lastProfileUpdate?: string
}

export const profileStorage = {
  // Save profile data to localStorage
  saveProfile: (userId: string, profileData: ProfileData) => {
    try {
      const key = `profile_${userId}`
      const dataWithTimestamp = {
        ...profileData,
        lastProfileUpdate: new Date().toISOString()
      }
      localStorage.setItem(key, JSON.stringify(dataWithTimestamp))
      return true
    } catch (error) {
      console.error('Failed to save profile to localStorage:', error)
      return false
    }
  },

  // Get profile data from localStorage
  getProfile: (userId: string): ProfileData | null => {
    try {
      const key = `profile_${userId}`
      const data = localStorage.getItem(key)
      if (data) {
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      console.error('Failed to get profile from localStorage:', error)
      return null
    }
  },

  // Remove profile data from localStorage
  removeProfile: (userId: string) => {
    try {
      const key = `profile_${userId}`
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Failed to remove profile from localStorage:', error)
      return false
    }
  },

  // Clear all profile data (useful for logout)
  clearAllProfiles: () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('profile_'))
      keys.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error('Failed to clear all profiles from localStorage:', error)
      return false
    }
  }
}