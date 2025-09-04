import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { authAPI } from '../utils/api'
import { UserPlus, Shield } from 'lucide-react'
import Footer from './Footer'

interface AuthSignupProps {
  onSignupSuccess: () => void
  onSwitchToLogin: () => void
}

export default function AuthSignup({ onSignupSuccess, onSwitchToLogin }: AuthSignupProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    aadhaar: '',
    role: 'citizen' as 'citizen' | 'authority'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validateAadhaar = (aadhaar: string) => {
    // Aadhaar validation: 12 digits
    return /^\d{12}$/.test(aadhaar)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validation
      if (!formData.name || !formData.email || !formData.password || !formData.aadhaar) {
        throw new Error('All fields are required')
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      if (!validateAadhaar(formData.aadhaar)) {
        throw new Error('Invalid Aadhaar number format (must be 12 digits)')
      }

      await authAPI.signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.aadhaar,
        formData.role
      )

      // Auto sign in after successful signup
      await authAPI.signIn(formData.email, formData.password)
      onSignupSuccess()
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>
              Join the civic reporting platform
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar Number</Label>
              <Input
                id="aadhaar"
                type="text"
                placeholder="Enter 12-digit Aadhaar number"
                value={formData.aadhaar}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                  setFormData({ ...formData, aadhaar: value })
                }}
                maxLength={12}
                required
              />
              <p className="text-xs text-muted-foreground">
                * For demo purposes only. Do not enter real Aadhaar numbers.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: 'citizen' | 'authority') => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citizen">Citizen</SelectItem>
                  <SelectItem value="authority">Government Authority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center">
            <Button variant="link" onClick={onSwitchToLogin} className="text-sm">
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  )
}