import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Camera, Upload, MapPin, CheckCircle, ArrowLeft, X } from 'lucide-react'
import { ticketsAPI, uploadAPI } from '../utils/api'
import opencage, { geocode } from 'opencage-api-client';
import type { GeocodingRequest, GeocodingResponse } from 'opencage-api-client';

interface RaiseTicketFlowProps {
  onSuccess: () => void
  onCancel: () => void
}

type Step = 1 | 2 | 3

const ISSUE_CATEGORIES = [
  'garbage-management',
  'pothole',
  'streetlight',
  'water-supply',
  'drainage',
  'traffic',
  'noise-pollution',
  'other'
]

export default function RaiseTicketFlow({ onSuccess, onCancel }: RaiseTicketFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ticketData, setTicketData] = useState({
    category: '',
    description: '',
    location: null as any,
    imageFile: null as File | null,
    imageUrl: ''
  })
  const [locationLoading, setLocationLoading] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState(null as any)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 1) {
      getCurrentLocation()
    }
  }, [step])


  
  const getCurrentLocation = () => {
    setLocationLoading(true)
    setError('')

     if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const opencagekey = '3d55f322619442a49ab49f48dfb7dfe5';

          async function getdigipin() {
            try {
              const request: GeocodingResponse = await opencage.geocode({q: `${latitude}, ${longitude}`, key: opencagekey});
              if (request.results.length > 0) {
                const place = request.results[0];
                const DIGIPIN = place.annotations?.DIGIPIN;
                const adr = place.formatted; 
                return {DIGIPIN , adr} ;
              }
              return null;
            } catch (err) {
              console.error('Error fetching DIGIPIN:', err);
              return null;
            }
          }

          
          // In a real app, you'd reverse geocode to get address and ward
          // For demo, we'll create mock data
          const digipinresult = await getdigipin();
          const realLocation = {
            lat: latitude,
            lng: longitude,
            address: digipinresult?.adr,
            ward: `Ward ${Math.floor(Math.random() * 50) + 1}`,
            digiPin: digipinresult?.DIGIPIN
          }
            
            setTicketData(prev => ({ ...prev, location: locationData }))

          } catch (apiError) {
            // Silently handle reverse geocoding errors
            const fallbackLocation = {
              lat: latitude,
              lng: longitude,
              address: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              ward: `Ward ${Math.floor(Math.random() * 50) + 1}`,
              digiPin: `DG${Math.floor(Math.random() * 1000000)}`
            }
            setTicketData(prev => ({ ...prev, location: fallbackLocation }))
          } finally {
            setLocationLoading(false)
          }
        },
        () => {
          // Silently handle geolocation errors - provide fallback location
          const fallbackLocation = {
            lat: 28.6139,
            lng: 77.2090,
            address: 'New Delhi, India (Default Location)',
            ward: 'Ward 25',
            digiPin: 'DG123456'
          }
          setTicketData(prev => ({ ...prev, location: fallbackLocation }))
          setLocationLoading(false)
        },
        {
          timeout: 10000, // 10 second timeout
          enableHighAccuracy: false, // Don't require high accuracy to avoid additional prompts
          maximumAge: 300000 // Accept cached position up to 5 minutes old
        }
      )
    } else {
      // Browser doesn't support geolocation - provide fallback silently
      const fallbackLocation = {
        lat: 28.6139,
        lng: 77.2090,
        address: 'New Delhi, India (Default Location)',
        ward: 'Ward 25',
        digiPin: 'DG123456'
      }
      setTicketData(prev => ({ ...prev, location: fallbackLocation }))
      setLocationLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return
    
    // Check for file size (10MB in bytes)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please upload an image under 10 MB.')
      return; // Stop the function here
    }
    
    setLoading(true)
    setError('') // Clear previous errors
    try {
      const { url } = await uploadAPI.uploadFile(file)
      setTicketData(prev => ({ 
        ...prev, 
        imageFile: file,
        imageUrl: url 
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      setError('Failed to upload image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleStep1Next = () => {
    if (!ticketData.location) {
      setError('Location is required. Please allow location access.')
      return
    }
    setStep(2)
    setError('')
  }

  const handleStep2Next = () => {
    if (!ticketData.category) {
      setError('Please select an issue category.')
      return
    }
    setStep(3)
    setError('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const { ticket } = await ticketsAPI.submit({
        category: ticketData.category,
        description: ticketData.description,
        location: ticketData.location,
        imageUrl: ticketData.imageUrl
      })
      
      setSubmittedTicket(ticket)
    } catch (error: any) {
      setError(error.message || 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  if (submittedTicket) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl mb-2">Ticket Submitted!</h2>
          <p className="text-muted-foreground mb-4">
            Your issue has been reported successfully.
          </p>
          <div className="bg-primary/5 p-4 rounded-lg mb-6">
            <p className="font-medium">Ticket ID</p>
            <p className="text-lg text-primary">#{submittedTicket.id}</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onSuccess} className="flex-1">
              Track Ticket
            </Button>
            <Button onClick={onSuccess} className="flex-1">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base sm:text-lg">
            {step > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((step - 1) as Step)}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <span className="hidden sm:inline">Raise New Issue - Step {step} of 3</span>
            <span className="sm:hidden">Step {step}/3</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-2 flex-1 rounded ${
                num <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Capture & Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg mb-2">Capture Evidence</h3>
              <p className="text-muted-foreground mb-4">Take a photo or upload an image of the issue</p>
              <p className="text-sm text-muted-foreground -mt-3 mb-4">(Max file size: 10 MB)</p>
              
              {ticketData.imageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={ticketData.imageUrl} 
                    alt="Issue evidence" 
                    className="w-64 h-48 object-cover rounded-lg border-2 border-dashed border-primary/30"
                  />
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => setTicketData(prev => ({ ...prev, imageFile: null, imageUrl: '' }))}
                    className="absolute -top-2 -right-2 rounded-full p-1 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-8">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {loading ? 'Uploading...' : 'Take Photo'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              )}
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location Information
              </h4>
              
              {locationLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Getting your location...</p>
                </div>
              ) : ticketData.location ? (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="sm:col-span-2">
                        <p className="text-muted-foreground">Address</p>
                        <p className="break-words">{ticketData.location.address}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ward</p>
                        <p>{ticketData.location.ward}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">DigiPin</p>
                        <div className="flex items-center gap-2 w-full">
                          <input 
                            value={ticketData.location.digiPin}
                            onChange={(e) => setTicketData(prev => ({ 
                              ...prev, 
                              location: { ...prev.location, digiPin: e.target.value }
                            }))}
                            className="text-sm bg-transparent border-b border-dashed border-muted-foreground/50 focus:border-primary focus:outline-none px-1 py-0.5 flex-1 min-w-0"
                            placeholder="Enter DigiPin"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-muted-foreground">Coordinates</p>
                        <p className="break-all">{ticketData.location.lat.toFixed(4)}, {ticketData.location.lng.toFixed(4)}</p>
                      </div>
                    </div>
                    {ticketData.location.address.includes('Default Location') && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                        <p>📍 Using default location. You can still proceed with your report.</p>
                      </div>
                    )}
                    <div className="mt-3 flex flex-col sm:flex-row justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        className="w-full sm:w-auto"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Update Location
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (ticketData.location) {
                            const autoDigiPin = `DG${Math.floor(ticketData.location.lat * 1000)}${Math.floor(ticketData.location.lng * 1000)}`
                            setTicketData(prev => ({ 
                              ...prev, 
                              location: { ...prev.location, digiPin: autoDigiPin }
                            }))
                          }
                        }}
                        disabled={locationLoading}
                        className="w-full sm:w-auto"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Auto DigiPin
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button onClick={getCurrentLocation} disabled={locationLoading}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Current Location
                </Button>
              )}
            </div>

            <Button onClick={handleStep1Next} className="w-full" size="lg">
              Confirm Location & Proceed
            </Button>
          </div>
        )}

        {/* Step 2: Add Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg mb-2">Issue Details</h3>
              <p className="text-muted-foreground">Provide information about the issue</p>
            </div>

            {ticketData.imageUrl && (
              <div className="text-center">
                <img 
                  src={ticketData.imageUrl} 
                  alt="Issue evidence" 
                  className="w-32 h-24 object-cover rounded-lg mx-auto"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Issue Category *</Label>
                <Select 
                  value={ticketData.category} 
                  onValueChange={(value) => setTicketData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  value={ticketData.description}
                  onChange={(e) => setTicketData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            <Button onClick={handleStep2Next} className="w-full" size="lg">
              Continue
            </Button>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg mb-2">Review & Submit</h3>
              <p className="text-muted-foreground">Please review your submission</p>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                {ticketData.imageUrl && (
                  <div>
                    <img 
                      src={ticketData.imageUrl} 
                      alt="Issue evidence" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <Badge variant="outline">
                      {ticketData.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ward</p>
                    <p>{ticketData.location?.ward}</p>
                  </div>
                </div>

                {ticketData.description && (
                  <div>
                    <p className="text-muted-foreground mb-1">Description</p>
                    <p className="text-sm bg-muted p-2 rounded">{ticketData.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-muted-foreground mb-1">Location</p>
                  <p className="text-sm">{ticketData.location?.address}</p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} className="w-full" size="lg" disabled={loading}>
              {loading ? 'Submitting Ticket...' : 'Submit Ticket'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
