import React, { useState, useEffect } from 'react'
import { MapPin, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface LocationPermissionGateProps {
  children: React.ReactNode
  onLocationGranted: (coords: { latitude: number; longitude: number }) => void
}

export default function LocationPermissionGate({ children, onLocationGranted }: LocationPermissionGateProps) {
  const [permissionState, setPermissionState] = useState<'checking' | 'denied' | 'granted' | 'error'>('checking')
  const [isRequesting, setIsRequesting] = useState(false)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    checkLocationPermission()
  }, [])

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionState('error')
      return
    }

    try {
      // Check if permission is already granted
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        
        if (permission.state === 'granted') {
          getCurrentLocation()
        } else if (permission.state === 'denied') {
          setPermissionState('denied')
        } else {
          // Permission state is 'prompt', ask for permission
          requestLocationPermission()
        }
      } else {
        // Fallback for browsers that don't support permissions API
        requestLocationPermission()
      }
    } catch (error) {
      console.error('Error checking location permission:', error)
      requestLocationPermission()
    }
  }

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setUserCoords(coords)
        setPermissionState('granted')
        onLocationGranted(coords)
      },
      (error) => {
        console.error('Error getting location:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied')
        } else {
          setPermissionState('error')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const requestLocationPermission = () => {
    setIsRequesting(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setUserCoords(coords)
        setPermissionState('granted')
        setIsRequesting(false)
        onLocationGranted(coords)
      },
      (error) => {
        console.error('Location permission error:', error)
        setIsRequesting(false)
        
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied')
        } else {
          setPermissionState('error')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  const handleRetry = () => {
    setPermissionState('checking')
    checkLocationPermission()
  }

  // If location is granted, show the children
  if (permissionState === 'granted' && userCoords) {
    return <>{children}</>
  }

  // Show permission request screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            {permissionState === 'checking' ? (
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            ) : permissionState === 'error' || permissionState === 'denied' ? (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            ) : (
              <MapPin className="h-8 w-8 text-blue-600" />
            )}
          </div>
          
          <CardTitle className="text-xl">
            {permissionState === 'checking' ? 'Checking Location Access' : 
             permissionState === 'denied' ? 'Location Access Required' :
             permissionState === 'error' ? 'Location Error' : 'Enable Location Services'}
          </CardTitle>
          
          <CardDescription className="text-center">
            {permissionState === 'checking' ? 
              'Please wait while we check your location permissions...' :
             permissionState === 'denied' ? 
              'Location access is required to report civic issues. Please enable location services in your browser settings and refresh the page.' :
             permissionState === 'error' ? 
              'Unable to access your location. Please check if location services are enabled on your device.' :
              'We need access to your location to help you report civic issues in your area.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {permissionState === 'checking' && (
            <div className="text-center">
              <div className="animate-pulse text-sm text-muted-foreground">
                Requesting location permission...
              </div>
            </div>
          )}

          {(permissionState === 'denied' || permissionState === 'error') && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                <p className="mb-2">To enable location access:</p>
                <ol className="text-left space-y-1 list-decimal list-inside">
                  <li>Click the location icon in your browser's address bar</li>
                  <li>Select "Allow" for location access</li>
                  <li>Refresh the page if needed</li>
                </ol>
              </div>
              
              <Button 
                onClick={handleRetry} 
                className="w-full"
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Requesting Permission...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            </div>
          )}

          {permissionState !== 'checking' && permissionState !== 'denied' && permissionState !== 'error' && (
            <Button 
              onClick={requestLocationPermission} 
              className="w-full"
              disabled={isRequesting}
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Allow Location Access
                </>
              )}
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground text-center bg-blue-50 p-3 rounded-lg">
            <MapPin className="h-4 w-4 inline mr-1" />
            Your location helps us route issues to the correct authorities and show relevant nearby problems.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}