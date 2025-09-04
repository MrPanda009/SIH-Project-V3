import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Users, Shield } from 'lucide-react'
import Footer from './Footer'

interface RoleSelectionProps {
  onRoleSelect: (role: 'citizen' | 'authority') => void
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl mb-2">Welcome to Civic Platform</h1>
            <p className="text-muted-foreground">Choose your portal to continue</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105" 
                  onClick={() => onRoleSelect('citizen')}>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl mb-2">Citizen Portal</CardTitle>
                  <CardDescription className="mb-4">
                    Report issues, track tickets, and participate in community discussions
                  </CardDescription>
                  <Button className="w-full">
                    Go to Citizen Portal
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => onRoleSelect('authority')}>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <CardTitle className="text-xl mb-2">Authority Portal</CardTitle>
                  <CardDescription className="mb-4">
                    Manage tickets, update statuses, and review analytics dashboard
                  </CardDescription>
                  <Button variant="secondary" className="w-full">
                    Go to Authority Portal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}