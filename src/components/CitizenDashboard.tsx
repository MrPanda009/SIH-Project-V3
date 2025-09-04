import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Plus, MapPin, List, Thermometer, User, LogOut, Activity } from 'lucide-react'
import { ticketsAPI, authAPI } from '../utils/api'
import RaiseTicketFlow from './RaiseTicketFlow'
import TicketsList from './TicketsList'
import NearbyIssues from './NearbyIssues'
import NotificationCenter from './NotificationCenter'
import IssueHeatmap from './IssueHeatmap'
import EditableProfile from './EditableProfile'
import LocationPermissionGate from './LocationPermissionGate'
import Footer from './Footer'

interface CitizenDashboardProps {
  user: any
  onLogout: () => void
}

type TabType = 'dashboard' | 'raise-ticket' | 'my-tickets' | 'nearby' | 'heatmap' | 'profile'

export default function CitizenDashboard({ user, onLogout }: CitizenDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(user)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    loadRecentTickets()
  }, [])

  const loadRecentTickets = async () => {
    try {
      const { tickets } = await ticketsAPI.getMyTickets()
      setRecentTickets(tickets.slice(0, 3)) // Show only 3 most recent
    } catch (error) {
      console.error('Error loading recent tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.signOut()
      onLogout()
    } catch (error) {
      console.error('Error logging out:', error)
      onLogout() // Logout anyway
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

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 rounded-lg">
          <h1 className="text-2xl mb-1">Hello, {user?.user_metadata?.name || 'Citizen'}!</h1>
          <p className="opacity-90">Ready to make a difference in your community?</p>
        </div>

        <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setActiveTab('raise-ticket')}>
          <CardContent className="p-6 text-center">
            <Plus className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg mb-2">Raise a New Issue</h3>
            <p className="text-muted-foreground mb-4">Report problems in your area</p>
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Recent Tickets</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('my-tickets')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tickets yet. Report your first issue!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">#{ticket.id}</p>
                      <p className="text-sm text-muted-foreground capitalize">{ticket.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardContent()
      case 'raise-ticket':
        return (
          <RaiseTicketFlow 
            onSuccess={() => {
              setActiveTab('my-tickets')
              loadRecentTickets()
            }}
            onCancel={() => setActiveTab('dashboard')}
          />
        )
      case 'my-tickets':
        return <TicketsList />
      case 'nearby':
        return <NearbyIssues />
      case 'heatmap':
        return <IssueHeatmap userRole="citizen" />
      case 'profile':
        return (
          <div className="space-y-4">
            <EditableProfile 
              user={currentUser} 
              onUpdate={(updatedUser) => setCurrentUser(updatedUser)}
            />
            <Card>
              <CardContent className="p-4">
                <Button variant="destructive" onClick={handleLogout} className="w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return renderDashboardContent()
    }
  }

  const handleLocationGranted = (coords: { latitude: number; longitude: number }) => {
    setUserLocation(coords)
  }

  return (
    <LocationPermissionGate onLocationGranted={handleLocationGranted}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg sm:text-xl font-semibold">Civic Platform</h1>
              <div className="flex items-center space-x-2">
                <NotificationCenter userRole="citizen" userId={currentUser?.id} />
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('profile')} className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 flex-1">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>

            {/* Sidebar Navigation (Desktop) */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-sm">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant={activeTab === 'my-tickets' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('my-tickets')}
                  >
                    <List className="h-4 w-4 mr-2" />
                    My Tickets
                  </Button>
                  <Button
                    variant={activeTab === 'nearby' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('nearby')}
                  >
                    <Thermometer className="h-4 w-4 mr-2" />
                    Nearby Issues
                  </Button>
                  <Button
                    variant={activeTab === 'heatmap' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('heatmap')}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Issue Heatmap
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer variant="minimal" />

        {/* Bottom Navigation (Mobile) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
          <div className="flex justify-around max-w-sm mx-auto">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('dashboard')}
              className="flex-col h-auto py-2 px-2 min-w-0 flex-1"
            >
              <MapPin className="h-4 w-4 mb-1" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant={activeTab === 'my-tickets' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('my-tickets')}
              className="flex-col h-auto py-2 px-2 min-w-0 flex-1"
            >
              <List className="h-4 w-4 mb-1" />
              <span className="text-xs">Tickets</span>
            </Button>
            <Button
              variant={activeTab === 'nearby' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('nearby')}
              className="flex-col h-auto py-2 px-2 min-w-0 flex-1"
            >
              <Thermometer className="h-4 w-4 mb-1" />
              <span className="text-xs">Nearby</span>
            </Button>
            <Button
              variant={activeTab === 'heatmap' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('heatmap')}
              className="flex-col h-auto py-2 px-2 min-w-0 flex-1"
            >
              <Activity className="h-4 w-4 mb-1" />
              <span className="text-xs">Heat</span>
            </Button>
            <Button
              variant={activeTab === 'profile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('profile')}
              className="flex-col h-auto py-2 px-2 min-w-0 flex-1"
            >
              <User className="h-4 w-4 mb-1" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>

        {/* Add bottom padding for mobile navigation */}
        <div className="lg:hidden h-20"></div>
      </div>
    </LocationPermissionGate>
  )
}