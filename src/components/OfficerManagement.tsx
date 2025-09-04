import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { UserPlus, Users, Phone, Mail, MapPin, Shield, UserCheck, Trash2, Edit } from 'lucide-react'

interface Officer {
  id: string
  name: string
  role: 'ward-officer' | 'field-officer'
  phone: string
  email: string
  ward?: string
  area?: string
  status: 'active' | 'inactive'
  createdAt: string
}

interface OfficerManagementProps {
  user: any
}

export default function OfficerManagement({ user }: OfficerManagementProps) {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [isAddingOfficer, setIsAddingOfficer] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null)
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Mock data for demonstration
  useEffect(() => {
    const mockOfficers: Officer[] = [
      {
        id: '1',
        name: 'Rajesh Kumar',
        role: 'ward-officer',
        phone: '+91-98765-43210',
        email: 'rajesh.kumar@gov.in',
        ward: 'Ward 12',
        status: 'active',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Priya Sharma',
        role: 'field-officer',
        phone: '+91-87654-32109',
        email: 'priya.sharma@gov.in',
        area: 'Zone A - Central District',
        status: 'active',
        createdAt: '2024-02-01T14:20:00Z'
      },
      {
        id: '3',
        name: 'Amit Singh',
        role: 'ward-officer',
        phone: '+91-76543-21098',
        email: 'amit.singh@gov.in',
        ward: 'Ward 8',
        status: 'inactive',
        createdAt: '2024-01-20T09:15:00Z'
      }
    ]
    setOfficers(mockOfficers)
  }, [])

  const filteredOfficers = officers.filter(officer => {
    const roleMatch = filterRole === 'all' || officer.role === filterRole
    const statusMatch = filterStatus === 'all' || officer.status === filterStatus
    return roleMatch && statusMatch
  })

  const handleAddOfficer = (officerData: Partial<Officer>) => {
    const newOfficer: Officer = {
      id: Date.now().toString(),
      name: officerData.name || '',
      role: officerData.role || 'field-officer',
      phone: officerData.phone || '',
      email: officerData.email || '',
      ward: officerData.ward,
      area: officerData.area,
      status: 'active',
      createdAt: new Date().toISOString()
    }
    setOfficers([...officers, newOfficer])
    setIsAddingOfficer(false)
  }

  const handleUpdateOfficer = (officerData: Officer) => {
    setOfficers(officers.map(officer => 
      officer.id === officerData.id ? officerData : officer
    ))
    setEditingOfficer(null)
  }

  const handleDeleteOfficer = (officerId: string) => {
    setOfficers(officers.filter(officer => officer.id !== officerId))
  }

  const toggleOfficerStatus = (officerId: string) => {
    setOfficers(officers.map(officer => 
      officer.id === officerId 
        ? { ...officer, status: officer.status === 'active' ? 'inactive' : 'active' }
        : officer
    ))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ward-officer': return 'bg-blue-100 text-blue-800'
      case 'field-officer': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl">Officer Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage Ward Officers and Field Officers
          </p>
        </div>
        
        <Dialog open={isAddingOfficer} onOpenChange={setIsAddingOfficer}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Officer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Officer</DialogTitle>
              <DialogDescription>
                Add a new Ward Officer or Field Officer to the system.
              </DialogDescription>
            </DialogHeader>
            <AddOfficerForm onSubmit={handleAddOfficer} onCancel={() => setIsAddingOfficer(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Officers</p>
                <p className="text-2xl">{officers.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ward Officers</p>
                <p className="text-2xl text-blue-600">
                  {officers.filter(o => o.role === 'ward-officer').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Field Officers</p>
                <p className="text-2xl text-green-600">
                  {officers.filter(o => o.role === 'field-officer').length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>All Officers</CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ward-officer">Ward Officers</SelectItem>
                  <SelectItem value="field-officer">Field Officers</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredOfficers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No officers match your filters.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredOfficers.map((officer) => (
                <Card key={officer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium truncate">{officer.name}</h3>
                          <Badge className={getRoleColor(officer.role)}>
                            {officer.role.replace('-', ' ').toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(officer.status)}>
                            {officer.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{officer.phone}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{officer.email}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{officer.ward || officer.area || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOfficerStatus(officer.id)}
                        >
                          {officer.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingOfficer(officer)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Officer</DialogTitle>
                              <DialogDescription>
                                Update officer information.
                              </DialogDescription>
                            </DialogHeader>
                            <EditOfficerForm 
                              officer={editingOfficer!} 
                              onSubmit={handleUpdateOfficer} 
                              onCancel={() => setEditingOfficer(null)} 
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOfficer(officer.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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

function AddOfficerForm({ onSubmit, onCancel }: { onSubmit: (data: Partial<Officer>) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'field-officer' as 'ward-officer' | 'field-officer',
    phone: '',
    email: '',
    ward: '',
    area: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.email) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.role === 'ward-officer' && !formData.ward) {
      setError('Ward is required for Ward Officers')
      return
    }

    if (formData.role === 'field-officer' && !formData.area) {
      setError('Area is required for Field Officers')
      return
    }

    onSubmit(formData)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Officer name"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Role *</label>
        <Select value={formData.role} onValueChange={(value: 'ward-officer' | 'field-officer') => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ward-officer">Ward Officer</SelectItem>
            <SelectItem value="field-officer">Field Officer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Phone *</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91-XXXXX-XXXXX"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Email *</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="officer@gov.in"
        />
      </div>

      {formData.role === 'ward-officer' && (
        <div>
          <label className="text-sm font-medium">Ward *</label>
          <Input
            value={formData.ward}
            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
            placeholder="Ward 12"
          />
        </div>
      )}

      {formData.role === 'field-officer' && (
        <div>
          <label className="text-sm font-medium">Area *</label>
          <Input
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="Zone A - Central District"
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">Add Officer</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

function EditOfficerForm({ officer, onSubmit, onCancel }: { officer: Officer, onSubmit: (data: Officer) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    ...officer
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.email) {
      setError('Please fill in all required fields')
      return
    }

    onSubmit(formData)
    setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Officer name"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Phone *</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+91-XXXXX-XXXXX"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Email *</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="officer@gov.in"
        />
      </div>

      {formData.role === 'ward-officer' && (
        <div>
          <label className="text-sm font-medium">Ward</label>
          <Input
            value={formData.ward || ''}
            onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
            placeholder="Ward 12"
          />
        </div>
      )}

      {formData.role === 'field-officer' && (
        <div>
          <label className="text-sm font-medium">Area</label>
          <Input
            value={formData.area || ''}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="Zone A - Central District"
          />
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">Update Officer</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}