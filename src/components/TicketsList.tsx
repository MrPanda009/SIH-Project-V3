import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Search, Calendar, MapPin, Eye } from 'lucide-react'
import { ticketsAPI } from '../utils/api'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' }
]

export default function TicketsList() {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null as any)

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, activeFilter, searchTerm])

  const loadTickets = async () => {
    try {
      const { tickets } = await ticketsAPI.getMyTickets()
      setTickets(tickets)
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter((ticket: any) => ticket.status === activeFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((ticket: any) =>
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTickets(filtered)
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

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'submitted', label: 'Submitted', completed: true },
      { key: 'in-progress', label: 'In Progress', completed: false },
      { key: 'completed', label: 'Completed', completed: false }
    ]

    let currentStepIndex = steps.findIndex(step => step.key === status)
    if (currentStepIndex === -1) currentStepIndex = 0

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      current: index === currentStepIndex
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading your tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={activeFilter === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {tickets.length === 0 ? 'No tickets found. Report your first issue!' : 'No tickets match your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket: any) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">#{ticket.id}</h3>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Ticket Details - #{selectedTicket?.id}</DialogTitle>
                          </DialogHeader>
                          <TicketDetails ticket={selectedTicket} />
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="capitalize">{ticket.category.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {ticket.location?.ward || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {ticket.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    )}

                    {/* Status Progress */}
                    <div className="mt-3 flex items-center space-x-2">
                      {getStatusSteps(ticket.status).map((step, index) => (
                        <React.Fragment key={step.key}>
                          <div className={`w-3 h-3 rounded-full ${
                            step.completed ? 'bg-primary' : 
                            step.current ? 'bg-primary/50' : 'bg-muted'
                          }`} />
                          {index < getStatusSteps(ticket.status).length - 1 && (
                            <div className={`h-0.5 w-8 ${
                              step.completed ? 'bg-primary' : 'bg-muted'
                            }`} />
                          )}
                        </React.Fragment>
                      ))}
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

function TicketDetails({ ticket }: { ticket: any }) {
  if (!ticket) return null

  const statusSteps = [
    { key: 'submitted', label: 'Submitted', date: ticket.createdAt },
    { key: 'in-progress', label: 'In Progress', date: ticket.status === 'in-progress' ? ticket.updatedAt : null },
    { key: 'completed', label: 'Completed', date: ticket.status === 'completed' ? ticket.updatedAt : null }
  ]

  return (
    <div className="space-y-6">
      {/* Image */}
      {ticket.imageUrl && (
        <div>
          <img 
            src={ticket.imageUrl} 
            alt="Issue evidence" 
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Category</h4>
          <Badge variant="outline" className="capitalize">
            {ticket.category.replace('-', ' ')}
          </Badge>
        </div>
        <div>
          <h4 className="font-medium mb-2">Status</h4>
          <Badge className={
            ticket.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
            ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
            ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }>
            {ticket.status.replace('-', ' ').toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-muted-foreground bg-muted p-3 rounded-lg">
            {ticket.description}
          </p>
        </div>
      )}

      {/* Location */}
      <div>
        <h4 className="font-medium mb-2">Location</h4>
        <div className="bg-muted p-3 rounded-lg text-sm">
          <p><strong>Address:</strong> {ticket.location?.address || 'N/A'}</p>
          <p><strong>Ward:</strong> {ticket.location?.ward || 'N/A'}</p>
          {ticket.location?.digiPin && <p><strong>DigiPin:</strong> {ticket.location.digiPin}</p>}
        </div>
      </div>

      {/* Status Timeline */}
      <div>
        <h4 className="font-medium mb-4">Status Timeline</h4>
        <div className="space-y-4">
          {statusSteps.map((step, index) => {
            const isCompleted = index === 0 || (ticket.status === 'in-progress' && index <= 1) || (ticket.status === 'completed' && index <= 2)
            const isCurrent = 
              (ticket.status === 'submitted' && index === 0) ||
              (ticket.status === 'in-progress' && index === 1) ||
              (ticket.status === 'completed' && index === 2)
            
            return (
              <div key={step.key} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  isCompleted ? 'bg-primary' : 
                  isCurrent ? 'bg-primary/50 ring-2 ring-primary ring-offset-2' : 
                  'bg-muted'
                }`} />
                <div className="flex-1">
                  <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  {step.date && isCompleted && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(step.date).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Authority Updates */}
      {ticket.resolution && (
        <div>
          <h4 className="font-medium mb-2">Authority Update</h4>
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <p className="text-sm">{ticket.resolution.notes}</p>
            {ticket.resolution.proofImageUrl && (
              <img 
                src={ticket.resolution.proofImageUrl} 
                alt="Resolution proof" 
                className="mt-2 w-full h-32 object-cover rounded"
              />
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Resolved on {new Date(ticket.resolution.resolvedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Upvotes */}
      <div className="text-sm text-muted-foreground">
        <p>Community Upvotes: {ticket.upvotes || 0}</p>
      </div>
    </div>
  )
}