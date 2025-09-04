import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { MapPin, ThumbsUp, RefreshCw, Navigation } from 'lucide-react'
import { ticketsAPI } from '../utils/api'

export default function NearbyIssues() {
  const [nearbyTickets, setNearbyTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userLocation, setUserLocation] = useState(null as any)
  const [upvotedTickets, setUpvotedTickets] = useState(new Set<string>())
  const [searchRadius, setSearchRadius] = useState(5)

  useEffect(() => {
    getCurrentLocationAndLoadTickets()
  }, [])

  const getCurrentLocationAndLoadTickets = async () => {
    setLoading(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          await loadNearbyTickets(latitude, longitude, searchRadius)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setError('Unable to get your location. Please enable location services.')
          // Load with default coordinates
          setUserLocation({ lat: 28.6139, lng: 77.2090 })
          loadNearbyTickets(28.6139, 77.2090, searchRadius)
        }
      )
    } else {
      setError('Geolocation is not supported by this browser.')
      // Load with default coordinates
      setUserLocation({ lat: 28.6139, lng: 77.2090 })
      loadNearbyTickets(28.6139, 77.2090, searchRadius)
    }
  }

  const loadNearbyTickets = async (lat: number, lng: number, radius: number = 5) => {
    try {
      const { tickets } = await ticketsAPI.getNearbyTickets(lat, lng, radius)
      setNearbyTickets(tickets.filter((ticket: any) => ticket.id)) // Filter out invalid tickets
      setError('')
    } catch (error: any) {
      console.error('Error loading nearby tickets:', error)
      setError(error.message || 'Failed to load nearby issues')
    } finally {
      setLoading(false)
    }
  }

  const handleUpvote = async (ticketId: string) => {
    if (upvotedTickets.has(ticketId)) {
      return // Already upvoted
    }

    try {
      await ticketsAPI.upvote(ticketId)
      setUpvotedTickets(prev => new Set(prev).add(ticketId))
      
      // Update local state to reflect the upvote
      setNearbyTickets(prev => prev.map((ticket: any) => 
        ticket.id === ticketId 
          ? { ...ticket, upvotes: (ticket.upvotes || 0) + 1 }
          : ticket
      ))
    } catch (error: any) {
      console.error('Error upvoting ticket:', error)
      if (error.message.includes('Already upvoted')) {
        setUpvotedTickets(prev => new Set(prev).add(ticketId))
      }
    }
  }

  const handleRefresh = () => {
    if (userLocation) {
      loadNearbyTickets(userLocation.lat, userLocation.lng, searchRadius)
    } else {
      getCurrentLocationAndLoadTickets()
    }
  }

  const handleRadiusChange = (radius: string) => {
    const newRadius = parseInt(radius)
    setSearchRadius(newRadius)
    if (userLocation) {
      loadNearbyTickets(userLocation.lat, userLocation.lng, newRadius)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    // You could return different icons based on category
    return '🏛️' // Generic civic icon
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Finding nearby issues...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center">
                <Navigation className="h-5 w-5 mr-2" />
                Nearby Issues
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Issues within {searchRadius}km of your location
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={searchRadius.toString()} onValueChange={handleRadiusChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 km</SelectItem>
                  <SelectItem value="2">2 km</SelectItem>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="15">15 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="25">25 km</SelectItem>
                  <SelectItem value="30">30 km</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Location Info */}
          {userLocation && (
            <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span>Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              </div>
            </div>
          )}

          {nearbyTickets.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No issues found in your area.</p>
              <p className="text-sm text-muted-foreground">Be the first to report an issue!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nearbyTickets.map((ticket: any) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getCategoryIcon(ticket.category)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">#{ticket.id}</h3>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
                            {ticket.category.replace('-', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {ticket.distance ? `${ticket.distance.toFixed(1)}km` : 'N/A'}
                        </div>
                        <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Image */}
                    {ticket.imageUrl && (
                      <div className="mb-3">
                        <img 
                          src={ticket.imageUrl} 
                          alt="Issue" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Description */}
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                    )}

                    {/* Location */}
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{ticket.location?.address || 'Location not available'}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        variant={upvotedTickets.has(ticket.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpvote(ticket.id)}
                        disabled={upvotedTickets.has(ticket.id)}
                        className="flex items-center space-x-1"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>{ticket.upvotes || 0}</span>
                        <span className="ml-1">
                          {upvotedTickets.has(ticket.id) ? 'Upvoted' : 'Upvote'}
                        </span>
                      </Button>
                      
                      <div className="text-xs text-muted-foreground">
                        Ward: {ticket.location?.ward || 'N/A'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}