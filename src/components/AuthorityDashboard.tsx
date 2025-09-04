import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { BarChart3, ClipboardList, MapPin, Users, TrendingUp, Calendar, Upload, LogOut, Activity, Filter, UserPlus, User } from 'lucide-react'
import { ticketsAPI, authAPI, uploadAPI } from '../utils/api'
import NotificationCenter from './NotificationCenter'
import IssueHeatmap from './IssueHeatmap'
import OfficerManagement from './OfficerManagement'
import EditableProfile from './EditableProfile'
import Footer from './Footer'

interface AuthorityDashboardProps {
  user: any
  onLogout: () => void
}

type TabType = 'overview' | 'tickets' | 'heatmap' | 'analytics' | 'officers' | 'profile'

export default function AuthorityDashboard({ user, onLogout }: AuthorityDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterWard, setFilterWard] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [selectedTicket, setSelectedTicket] = useState(null as any)
  const [currentUser, setCurrentUser] = useState(user)

  useEffect(() => {
    loadAllTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, filterStatus, filterWard, filterDate, sortBy])

  const loadAllTickets = async () => {
    try {
      const { tickets } = await ticketsAPI.getAllTickets()
      setTickets(tickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
      // Fallback to nearby tickets if getAllTickets fails
      try {
        const { tickets } = await ticketsAPI.getNearbyTickets(28.6139, 77.2090, 50)
        setTickets(tickets)
      } catch (fallbackError) {
        console.error('Error loading fallback tickets:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    if (filterStatus !== 'all') {
      filtered = filtered.filter((ticket: any) => ticket.status === filterStatus)
    }

    if (filterWard !== 'all') {
      filtered = filtered.filter((ticket: any) => ticket.location?.ward === filterWard)
    }

    if (filterDate !== 'all') {
      const now = new Date()
      const dateThreshold = new Date()
      
      switch (filterDate) {
        case 'today':
          dateThreshold.setDate(now.getDate())
          break
        case 'week':
          dateThreshold.setDate(now.getDate() - 7)
          break
        case 'month':
          dateThreshold.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter((ticket: any) => 
        new Date(ticket.createdAt) >= dateThreshold
      )
    }

    // Sort tickets
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'upvotes':
          return (b.upvotes || 0) - (a.upvotes || 0)
        case 'criticality':
          return (b.upvotes || 0) - (a.upvotes || 0) // Higher upvotes = higher criticality
        case 'status':
          return a.status.localeCompare(b.status)
        case 'ward':
          return (a.location?.ward || '').localeCompare(b.location?.ward || '')
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredTickets(filtered)
  }

  const handleLogout = async () => {
    try {
      await authAPI.signOut()
      onLogout()
    } catch (error) {
      console.error('Error logging out:', error)
      onLogout()
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

  const getCriticalityColor = (upvotes: number) => {
    if (upvotes >= 15) return 'bg-red-100 text-red-800'
    if (upvotes >= 10) return 'bg-orange-100 text-orange-800'
    if (upvotes >= 5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getKPIStats = () => {
    const total = tickets.length
    const submitted = tickets.filter((t: any) => t.status === 'submitted').length
    const inProgress = tickets.filter((t: any) => t.status === 'in-progress').length
    const completed = tickets.filter((t: any) => t.status === 'completed').length
    const closed = tickets.filter((t: any) => t.status === 'closed').length
    const critical = tickets.filter((t: any) => (t.upvotes || 0) >= 15).length

    return { total, submitted, inProgress, completed, closed, critical }
  }

  const getUniqueWards = () => {
    const wards = tickets.map((t: any) => t.location?.ward).filter(Boolean)
    return [...new Set(wards)].sort()
  }

  const renderOverview = () => {
    const stats = getKPIStats()

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Issues</p>
                  <p className="text-2xl">{stats.total}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl text-blue-600">{stats.submitted}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl text-yellow-600">{stats.inProgress}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl text-green-600">{stats.completed}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl text-red-600">{stats.critical}</p>
                </div>
                <Activity className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.slice(0, 5).map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">#{ticket.id}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {ticket.category.replace('-', ' ')} • {ticket.location?.ward || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <Badge className={getCriticalityColor(ticket.upvotes || 0)}>
                      {ticket.upvotes || 0} votes
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderTickets = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle>All Issues</CardTitle>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterWard} onValueChange={setFilterWard}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {getUniqueWards().map((ward) => (
                      <SelectItem key={ward} value={ward}>
                        {ward}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterDate} onValueChange={setFilterDate}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Latest First</SelectItem>
                    <SelectItem value="upvotes">Most Votes</SelectItem>
                    <SelectItem value="criticality">Critical First</SelectItem>
                    <SelectItem value="status">By Status</SelectItem>
                    <SelectItem value="ward">By Ward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tickets match your filters.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTickets.map((ticket: any) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">#{ticket.id}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {ticket.category.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getCriticalityColor(ticket.upvotes || 0)}>
                            {ticket.upvotes || 0} votes
                          </Badge>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Manage Ticket - #{selectedTicket?.id}</DialogTitle>
                                <DialogDescription>
                                  Update the status, add resolution notes, and upload proof of completion for this ticket.
                                </DialogDescription>
                              </DialogHeader>
                              <TicketManagement 
                                ticket={selectedTicket} 
                                onUpdate={() => {
                                  loadAllTickets()
                                  setSelectedTicket(null)
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {ticket.location?.ward || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Upvotes</p>
                          <p>{ticket.upvotes || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Criticality</p>
                          <Badge className={getCriticalityColor(ticket.upvotes || 0)} variant="outline">
                            {(ticket.upvotes || 0) >= 15 ? 'Critical' : 
                             (ticket.upvotes || 0) >= 10 ? 'High' :
                             (ticket.upvotes || 0) >= 5 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      </div>

                      {ticket.imageUrl && (
                        <img 
                          src={ticket.imageUrl} 
                          alt="Issue" 
                          className="mt-2 w-24 h-16 object-cover rounded"
                        />
                      )}
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">Authority Dashboard</h1>
              <p className="text-sm text-muted-foreground break-words">
                Welcome, {currentUser?.user_metadata?.name || 'Authority'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationCenter userRole="authority" userId={currentUser?.id} />
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex-1">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto">
          <Button 
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            size="sm"
            className="flex-shrink-0"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button 
            variant={activeTab === 'tickets' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tickets')}
            size="sm"
            className="flex-shrink-0"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Issues
          </Button>
          <Button 
            variant={activeTab === 'officers' ? 'default' : 'outline'}
            onClick={() => setActiveTab('officers')}
            size="sm"
            className="flex-shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Officers
          </Button>
          <Button 
            variant={activeTab === 'profile' ? 'default' : 'outline'}
            onClick={() => setActiveTab('profile')}
            size="sm"
            className="flex-shrink-0"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button 
            variant={activeTab === 'heatmap' ? 'default' : 'outline'}
            onClick={() => setActiveTab('heatmap')}
            size="sm"
            className="flex-shrink-0"
          >
            <Activity className="h-4 w-4 mr-2" />
            Heatmap
          </Button>
          <Button 
            variant={activeTab === 'analytics' ? 'default' : 'outline'}
            onClick={() => setActiveTab('analytics')}
            size="sm"
            className="flex-shrink-0"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'tickets' && renderTickets()}
        {activeTab === 'officers' && <OfficerManagement user={currentUser} />}
        {activeTab === 'profile' && (
          <div className="flex justify-center">
            <EditableProfile 
              user={currentUser} 
              onUpdate={(updatedUser) => setCurrentUser(updatedUser)} 
            />
          </div>
        )}
        {activeTab === 'heatmap' && <IssueHeatmap userRole="authority" />}
        {activeTab === 'analytics' && (
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Detailed analytics and reporting features would be implemented here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Footer */}
      <Footer variant="minimal" />
    </div>
  )
}

function TicketManagement({ ticket, onUpdate }: { ticket: any, onUpdate: () => void }) {
  const [status, setStatus] = useState(ticket?.status || 'submitted')
  const [resolution, setResolution] = useState('')
  const [proofFile, setProofFile] = useState(null as File | null)
  const [proofUrl, setProofUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleProofUpload = async (file: File) => {
    setLoading(true)
    try {
      const { url } = await uploadAPI.uploadFile(file)
      setProofFile(file)
      setProofUrl(url)
    } catch (error) {
      setError('Failed to upload proof image')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    // Proof of resolution is mandatory for completed status
    if (status === 'completed' && !proofUrl) {
      setError('Proof of resolution is mandatory when marking a ticket as completed.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await ticketsAPI.updateStatus(ticket.id, status, resolution, proofUrl)
      onUpdate()
    } catch (error: any) {
      setError(error.message || 'Failed to update ticket')
    } finally {
      setLoading(false)
    }
  }

  if (!ticket) return null

  return (
    <div className="space-y-6">
      {/* Ticket Info */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm text-muted-foreground">Category</p>
          <p className="capitalize">{ticket.category.replace('-', ' ')}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Status</p>
          <Badge className={
            ticket.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
            ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }>
            {ticket.status.replace('-', ' ').toUpperCase()}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Location</p>
          <p>{ticket.location?.address || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Reported</p>
          <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Upvotes</p>
          <p>{ticket.upvotes || 0}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Criticality</p>
          <Badge className={
            (ticket.upvotes || 0) >= 15 ? 'bg-red-100 text-red-800' :
            (ticket.upvotes || 0) >= 10 ? 'bg-orange-100 text-orange-800' :
            (ticket.upvotes || 0) >= 5 ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }>
            {(ticket.upvotes || 0) >= 15 ? 'Critical' : 
             (ticket.upvotes || 0) >= 10 ? 'High' :
             (ticket.upvotes || 0) >= 5 ? 'Medium' : 'Low'}
          </Badge>
        </div>
      </div>

      {/* Issue Image */}
      {ticket.imageUrl && (
        <div>
          <p className="text-sm font-medium mb-2">Issue Evidence</p>
          <img src={ticket.imageUrl} alt="Issue" className="w-full h-48 object-cover rounded-lg" />
        </div>
      )}

      {/* Description */}
      {ticket.description && (
        <div>
          <p className="text-sm font-medium mb-2">Description</p>
          <p className="text-sm bg-muted p-3 rounded">{ticket.description}</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Update Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Update Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Resolution Notes</label>
          <Textarea
            placeholder="Add notes about the resolution..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Upload Proof {status === 'completed' && <span className="text-red-500">*</span>}
          </label>
          <div className="mt-1">
            {proofUrl ? (
              <div className="relative">
                <img src={proofUrl} alt="Proof" className="w-full h-32 object-cover rounded-lg" />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setProofFile(null)
                    setProofUrl('')
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? 'Uploading...' : 'Upload Proof Image'}
                </Button>
                {status === 'completed' && (
                  <p className="text-xs text-red-500 mt-2">
                    Proof is required when marking as completed
                  </p>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleProofUpload(file)
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <Button onClick={handleUpdate} className="w-full" disabled={loading}>
        {loading ? 'Updating...' : 'Update Ticket'}
      </Button>
    </div>
  )
}