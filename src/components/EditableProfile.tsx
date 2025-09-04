import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Edit, Save, X, Mail, Shield, MapPin, Clock, Upload, User, Building, IdCard } from 'lucide-react'
import { authAPI, profileAPI } from '../utils/api'
import { profileStorage } from '../utils/profileStorage'
import { toast } from 'sonner@2.0.3'
import { ImageWithFallback } from './ImageWithFallback'

interface EditableProfileProps {
  user: any
  onUpdate: (updatedUser: any) => void
}

export default function EditableProfile({ user, onUpdate }: EditableProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.name || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
    department: user?.user_metadata?.department || '',
    designation: user?.user_metadata?.designation || '',
    employeeId: user?.user_metadata?.employeeId || '',
    profileImage: user?.user_metadata?.profileImage || ''
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  
  const isGovernmentUser = user?.user_metadata?.role === 'authority'
  
  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown(prev => prev - 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [otpCountdown])

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setOtpSent(false)
    setOtp('')
    setError('')
    setOtpCountdown(0)
    
    // Clean up session storage
    sessionStorage.removeItem('profileUpdateOtp')
    sessionStorage.removeItem('otpTimestamp')
    
    // Reset to original values
    setProfileData({
      name: user?.user_metadata?.name || '',
      phone: user?.user_metadata?.phone || '',
      address: user?.user_metadata?.address || '',
      department: user?.user_metadata?.department || '',
      designation: user?.user_metadata?.designation || '',
      employeeId: user?.user_metadata?.employeeId || '',
      profileImage: user?.user_metadata?.profileImage || ''
    })
  }

  const sendOtp = async () => {
    if (!user?.email) {
      setError('Email not found')
      return
    }

    // Basic validation before sending OTP
    if (!profileData.name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Try to send OTP via backend API first
      try {
        await profileAPI.sendProfileUpdateOTP(user.email)
        setOtpSent(true)
        setOtpCountdown(60)
        toast.success(`OTP sent to ${user.email}`)
        return
      } catch (apiError) {
        console.warn('Backend OTP service not available, using mock OTP for testing')
      }

      // Fallback to mock OTP for testing
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // TODO: Replace with real OTP service integration
      // Example: await otpService.sendOTP(user.email, 'profile_update')
      // This should integrate with your backend OTP service (SMS/Email provider)
      
      // Generate a mock OTP for testing (6-digit random number)
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString()
      
      // In real implementation, send email via backend
      console.log('🔐 Profile Update OTP (FOR TESTING ONLY):', mockOtp)
      
      setOtpSent(true)
      setOtpCountdown(60) // 60 second countdown
      toast.success(`OTP sent to ${user.email} (Testing Mode)`)
      
      // Store mock OTP in sessionStorage for testing
      sessionStorage.setItem('profileUpdateOtp', mockOtp)
      sessionStorage.setItem('otpTimestamp', Date.now().toString())
      
    } catch (error) {
      setError('Failed to send OTP. Please try again.')
      toast.error('Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtpAndUpdate = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setVerifyingOtp(true)
    setError('')

    try {
      // Additional validation
      if (!profileData.name.trim()) {
        throw new Error('Name cannot be empty')
      }

      if (profileData.phone && !/^[+]?[\d\s-()]{10,}$/.test(profileData.phone)) {
        throw new Error('Please enter a valid phone number')
      }

      // Prepare profile data for backend
      const profileUpdateData = {
        name: profileData.name,
        phone: profileData.phone || '',
        address: profileData.address || '',
        department: profileData.department || '',
        designation: profileData.designation || '',
        employeeId: profileData.employeeId || '',
        profileImage: profileData.profileImage || ''
      }

      let backendSuccess = false

      // Try to verify OTP and update profile via backend API first
      try {
        await profileAPI.verifyProfileUpdateOTP(otp, profileUpdateData)
        backendSuccess = true
      } catch (apiError) {
        console.warn('Backend profile API not available, using fallback verification')
        
        // Fallback to mock OTP verification for testing
        const otpTimestamp = sessionStorage.getItem('otpTimestamp')
        if (otpTimestamp) {
          const otpAge = Date.now() - parseInt(otpTimestamp)
          if (otpAge > 5 * 60 * 1000) { // 5 minutes
            throw new Error('OTP has expired. Please request a new one.')
          }
        }

        const mockOtp = sessionStorage.getItem('profileUpdateOtp')
        if (otp !== mockOtp && otp !== '123456') { // Allow demo OTP
          throw new Error('Invalid OTP. Please check and try again.')
        }

        // Mock profile update delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Save to localStorage as fallback
        if (user?.id) {
          profileStorage.saveProfile(user.id, profileUpdateData)
        }
      }

      // Update local user data with the new profile information
      const updatedUserData = {
        ...profileUpdateData,
        lastProfileUpdate: new Date().toISOString()
      }

      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...updatedUserData
        }
      }

      onUpdate(updatedUser)
      setIsEditing(false)
      setOtpSent(false)
      setOtp('')
      setOtpCountdown(0)
      
      // Clean up session storage
      sessionStorage.removeItem('profileUpdateOtp')
      sessionStorage.removeItem('otpTimestamp')
      
      toast.success(backendSuccess ? 
        '✅ Profile updated and saved successfully!' : 
        '✅ Profile updated successfully! (Testing Mode)'
      )
      
    } catch (error: any) {
      setError(error.message || 'Failed to update profile')
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setProfileData(prev => ({
        ...prev,
        profileImage: imageUrl
      }))
      toast.success('Profile image updated')
    }
    reader.readAsDataURL(file)
  }

  const fillDemoData = () => {
    if (isGovernmentUser) {
      setProfileData({
        name: 'Dr. Rajesh Kumar',
        phone: '+91-98765-43210',
        address: 'Manipal University Jaipur, Dahmi Kalan',
        department: 'Municipal Corporation',
        designation: 'Assistant Engineer',
        employeeId: 'MUN001234',
        profileImage: ''
      })
    } else {
      setProfileData({
        name: 'John Doe',
        phone: '+91-98765-43210',
        address: 'Manipal University Jaipur, Dahmi Kalan',
        department: '',
        designation: '',
        employeeId: '',
        profileImage: ''
      })
    }
    toast.info('Demo data filled')
  }

  if (isEditing && !otpSent) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Edit Profile</span>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Profile Editing:</strong> For security, we'll send an OTP to your email address to verify any profile changes.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Profile Image Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {profileData.profileImage ? (
                <ImageWithFallback
                  src={profileData.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8"
                onClick={() => document.getElementById('profile-image-upload')?.click()}
              >
                <Upload className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Upload Image</p>
              <p className="text-xs text-muted-foreground mt-1">Max Size of File is 10 MB</p>
            </div>
            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                className="w-full"
              />
            </div>

            <div>
              <Label htmlFor="email-readonly">Email Address</Label>
              <Input
                id="email-readonly"
                value={user?.email || ''}
                disabled
                className="bg-muted w-full"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={profileData.address}
              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your address"
              className="w-full"
            />
          </div>

          {/* Government User Specific Fields */}
          {isGovernmentUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-primary">
                <Building className="h-5 w-5" />
                <h4 className="font-medium">Government Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter your department"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={profileData.designation}
                    onChange={(e) => setProfileData(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="Enter your designation"
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    value={profileData.employeeId}
                    onChange={(e) => setProfileData(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Enter your employee ID"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={fillDemoData}
              className="flex-1"
              type="button"
            >
              Fill Demo Data
            </Button>
            <Button onClick={sendOtp} disabled={loading} className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isEditing && otpSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Verify OTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center mb-4">
            <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Mail className="h-5 w-5 mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-blue-800">
                Verification code sent to:
              </p>
              <p className="font-medium text-blue-900 break-words text-center">{user?.email}</p>
              {otpCountdown > 0 && (
                <p className="text-xs text-blue-600 mt-1 flex items-center justify-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Resend available in {otpCountdown}s
                </p>
              )}
            </div>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 text-sm">
              💡 <strong>For testing:</strong> Check the browser console for the OTP code, or use the demo OTP: <code className="bg-green-100 px-1 rounded">123456</code>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the 6-digit verification code sent to your email
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={verifyOtpAndUpdate} 
              disabled={verifyingOtp} 
              className="flex-1"
            >
              {verifyingOtp ? 'Verifying...' : 'Verify & Update'}
            </Button>
          </div>

          <Button 
            variant="ghost" 
            onClick={sendOtp} 
            disabled={loading || otpCountdown > 0} 
            className="w-full text-sm"
          >
            {otpCountdown > 0 
              ? `Resend in ${otpCountdown}s` 
              : loading 
                ? 'Sending...' 
                : 'Didn\'t receive? Resend OTP'
            }
          </Button>
        </CardContent>
      </Card>
    )
  }

  // View mode
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>Profile</span>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Image */}
        <div className="flex justify-center">
          {user?.user_metadata?.profileImage ? (
            <ImageWithFallback
              src={user.user_metadata.profileImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
              <User className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="font-medium break-words">{user?.user_metadata?.name || 'Not set'}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="font-medium break-words">{user?.email || 'Not set'}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Phone</Label>
            <p className="font-medium break-words">{user?.user_metadata?.phone || 'Not set'}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Role</Label>
            <Badge variant="outline" className="capitalize w-fit">
              {user?.user_metadata?.role === 'authority' ? 'Government Authority' : 'Citizen'}
            </Badge>
          </div>
        </div>

        <div>
          <Label className="text-sm text-muted-foreground">Address</Label>
          <p className="font-medium break-words">{user?.user_metadata?.address || 'Not set'}</p>
        </div>

        {/* Government User Specific Information */}
        {isGovernmentUser && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-primary border-t pt-4">
              <Building className="h-5 w-5" />
              <h4 className="font-medium">Government Details</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Department</Label>
                <p className="font-medium break-words">{user?.user_metadata?.department || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Designation</Label>
                <p className="font-medium break-words">{user?.user_metadata?.designation || 'Not set'}</p>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-sm text-muted-foreground">Employee ID</Label>
                <p className="font-medium break-words">{user?.user_metadata?.employeeId || 'Not set'}</p>
              </div>
            </div>
          </div>
        )}

        {user?.user_metadata?.lastProfileUpdate && (
          <div className="border-t pt-4">
            <Label className="text-sm text-muted-foreground">Last Updated</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(user.user_metadata.lastProfileUpdate).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}