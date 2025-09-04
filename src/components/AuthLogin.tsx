import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { authAPI } from '../utils/api'
import { Shield, Phone, KeyRound } from 'lucide-react'
import Footer from './Footer'

interface AuthLoginProps {
  onLoginSuccess: () => void
  onSwitchToSignup: () => void
}

export default function AuthLogin({ onLoginSuccess, onSwitchToSignup }: AuthLoginProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
    captcha: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState<1 | 2 | 3>(1)
  const [forgotPasswordData, setForgotPasswordData] = useState({
    aadhaar: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  })

  // JavaScript-generated OTP for testing (6-digit random number)
  const [generatedOtp, setGeneratedOtp] = useState('')

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    return {
      question: `${num1} + ${num2} = ?`,
      answer: num1 + num2
    }
  }

  const [captcha, setCaptcha] = useState(generateCaptcha())

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError('Email and Password are required')
      return
    }
    
    // TODO: Replace with real OTP service integration
    // Example: await otpService.sendOTP(formData.email, 'login')
    // This should integrate with your backend OTP service (SMS/Email provider)
    
    // Generate JavaScript OTP for testing (6-digit random number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedOtp(otp)
    
    console.log(`🔐 Login OTP (FOR TESTING ONLY): ${otp}`) // Log for easy testing
    setStep(2)
    setError('')
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. CAPTCHA Validation
      if (parseInt(formData.captcha, 10) !== captcha.answer) {
        throw new Error('Invalid CAPTCHA answer. Please try again.')
      }
      
      // 2. OTP Validation
      // TODO: Replace with real OTP verification service
      // Example: await otpService.verifyOTP(formData.email, formData.otp, 'login')
      if (formData.otp !== generatedOtp && formData.otp !== '123456') {
        throw new Error('Invalid OTP. Please check the browser console or use demo OTP: 123456')
      }

      if (!formData.password) {
        throw new Error('Password is required')
      }

      const result = await authAPI.signIn(formData.email, formData.password)
      
      if (result.session) {
        onLoginSuccess()
      } else {
        throw new Error('Login failed. Please check your credentials.')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
      // Regenerate captcha on failed attempt
      setCaptcha(generateCaptcha())
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPasswordStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordData.aadhaar || forgotPasswordData.aadhaar.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number')
      return
    }
    
    try {
      // TODO: Replace with real OTP service integration
      // Example: await otpService.sendOTP(forgotPasswordData.aadhaar, 'forgot_password')
      // This should send OTP to registered mobile and email
      
      // Generate JavaScript OTP for testing (6-digit random number)
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedOtp(otp)
      
      console.log(`🔐 Forgot Password OTP (FOR TESTING ONLY): ${otp}`)
      setForgotPasswordStep(2)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    }
  }

  const handleForgotPasswordStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError('') // Clear previous errors

    if (!forgotPasswordData.otp || forgotPasswordData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }
    
    // TODO: Replace with real OTP verification service
    // Example: await otpService.verifyOTP(forgotPasswordData.aadhaar, forgotPasswordData.otp, 'forgot_password')
    if (forgotPasswordData.otp === generatedOtp || forgotPasswordData.otp === '123456') {
      setForgotPasswordStep(3)
    } else {
      setError('Invalid OTP. Please check the browser console or use demo OTP: 123456')
    }
  }

  const handleForgotPasswordStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotPasswordData.newPassword || forgotPasswordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    try {
      await authAPI.resetPassword(forgotPasswordData.aadhaar, forgotPasswordData.newPassword)
      setError('')
      setShowForgotPassword(false)
      setForgotPasswordStep(1)
      setForgotPasswordData({ aadhaar: '', otp: '', newPassword: '', confirmPassword: '' })
      // Show success message
      alert('Password reset successfully! Please login with your new password.')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
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
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl break-words">Civic Issue Reporting</CardTitle>
            <CardDescription className="break-words">
              {step === 1 ? 'Enter your credentials to continue' : 'Complete verification'}
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="break-words">{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-readonly">Email Address</Label>
                <Input
                  id="email-readonly"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="captcha">Security Check: {captcha.question}</Label>
                <Input
                  id="captcha"
                  type="text"
                  placeholder="Enter the answer"
                  value={formData.captcha}
                  onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit OTP</Label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    maxLength={6}
                    className="text-center text-lg tracking-widest flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground break-words">Check browser console for OTP or use demo OTP: 123456</p>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  Resend OTP
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </div>
            </form>
          )}

          <div className="text-center space-y-2">
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-sm p-0 h-auto">
                  Forgot Password?
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center flex-wrap gap-2">
                    <KeyRound className="h-5 w-5 flex-shrink-0" />
                    <span className="break-words">Reset Password</span>
                  </DialogTitle>
                  <DialogDescription className="break-words">
                    Reset your password using your Aadhaar number. We'll send an OTP to your registered mobile and email.
                  </DialogDescription>
                </DialogHeader>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="break-words">{error}</AlertDescription>
                  </Alert>
                )}

                {forgotPasswordStep === 1 && (
                  <form onSubmit={handleForgotPasswordStep1} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar">Aadhaar Number</Label>
                      <Input
                        id="aadhaar"
                        type="text"
                        placeholder="Enter your 12-digit Aadhaar number"
                        value={forgotPasswordData.aadhaar}
                        onChange={(e) => setForgotPasswordData({
                          ...forgotPasswordData,
                          aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12)
                        })}
                        maxLength={12}
                        required
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground break-words">
                        We'll send an OTP to your registered mobile number and email
                      </p>
                    </div>
                    <Button type="submit" className="w-full">
                      Send OTP
                    </Button>
                  </form>
                )}

                {forgotPasswordStep === 2 && (
                  <form onSubmit={handleForgotPasswordStep2} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-otp">Enter OTP</Label>
                      <Input
                        id="forgot-otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={forgotPasswordData.otp}
                        onChange={(e) => setForgotPasswordData({
                          ...forgotPasswordData,
                          otp: e.target.value.replace(/\D/g, '').slice(0, 6)
                        })}
                        maxLength={6}
                        className="text-center text-lg tracking-widest w-full"
                        required
                      />
                      <p className="text-xs text-muted-foreground break-words">
                        Check browser console for OTP or use demo OTP: 123456
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button type="button" variant="outline" onClick={() => setForgotPasswordStep(1)} className="flex-1">
                        Back
                      </Button>
                      <Button type="submit" className="flex-1">
                        Verify OTP
                      </Button>
                    </div>
                  </form>
                )}

                {forgotPasswordStep === 3 && (
                  <form onSubmit={handleForgotPasswordStep3} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password (min 8 characters)"
                        value={forgotPasswordData.newPassword}
                        onChange={(e) => setForgotPasswordData({
                          ...forgotPasswordData,
                          newPassword: e.target.value
                        })}
                        required
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={forgotPasswordData.confirmPassword}
                        onChange={(e) => setForgotPasswordData({
                          ...forgotPasswordData,
                          confirmPassword: e.target.value
                        })}
                        required
                        className="w-full"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
            
            <div>
              <Button variant="link" onClick={onSwitchToSignup} className="text-sm break-words">
                Don't have an account? Sign up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </div>
  )
}