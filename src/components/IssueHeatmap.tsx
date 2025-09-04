import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { MapPin, TrendingUp, AlertTriangle, Activity } from 'lucide-react'
import { ticketsAPI } from '../utils/api'

interface HeatmapData {
  ward: string
  issueCount: number
  criticalCount: number
  averageUpvotes: number
  categories: { [key: string]: number }
  density: 'low' | 'medium' | 'high' | 'critical'
}

interface IssueHeatmapProps {
  userRole?: 'citizen' | 'authority'
  className?: string
}

export default function IssueHeatmap({ userRole = 'citizen', className = '' }: IssueHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('week')

  useEffect(() => {
    loadHeatmapData()
  }, [timeFilter, selectedWard])

  const loadHeatmapData = async () => {
    setLoading(true)
    try {
      const { heatmapData } = await ticketsAPI.getHeatmapData(timeFilter, selectedWard)
      setHeatmapData(heatmapData)
    } catch (error) {
      console.error('Error loading heatmap data:', error)
      // Fallback to mock data for demo
      setHeatmapData(generateMockHeatmapData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockHeatmapData = (): HeatmapData[] => {
    const wards = [
      'Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Rohini',
      'Janakpuri', 'Vasant Kunj', 'Saket', 'Mayur Vihar', 'Preet Vihar'
    ]
    
    return wards.map(ward => {
      const issueCount = Math.floor(Math.random() * 50) + 10
      const criticalCount = Math.floor(issueCount * 0.3)
      const averageUpvotes = Math.floor(Math.random() * 15) + 5
      
      return {
        ward,
        issueCount,
        criticalCount,
        averageUpvotes,
        categories: {
          'road-repair': Math.floor(Math.random() * 15) + 5,
          'garbage-collection': Math.floor(Math.random() * 12) + 3,
          'street-lights': Math.floor(Math.random() * 10) + 2,
          'water-supply': Math.floor(Math.random() * 8) + 1,
          'drainage': Math.floor(Math.random() * 6) + 1
        },
        density: issueCount > 40 ? 'critical' : issueCount > 25 ? 'high' : issueCount > 15 ? 'medium' : 'low'
      }
    })
  }

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'critical':
        return 'bg-red-500 text-white'
      case 'high':
        return 'bg-orange-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-black'
      case 'low':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getDensityBorderColor = (density: string) => {
    switch (density) {
      case 'critical':
        return 'border-red-200'
      case 'high':
        return 'border-orange-200'
      case 'medium':
        return 'border-yellow-200'
      case 'low':
        return 'border-green-200'
      default:
        return 'border-gray-200'
    }
  }

  const getTopCategories = (categories: { [key: string]: number }) => {
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category: category.replace('-', ' '), count }))
  }

  const getTotalIssues = () => {
    return heatmapData.reduce((sum, ward) => sum + ward.issueCount, 0)
  }

  const getCriticalWards = () => {
    return heatmapData.filter(ward => ward.density === 'critical').length
  }

  const getAverageUpvotes = () => {
    const total = heatmapData.reduce((sum, ward) => sum + ward.averageUpvotes, 0)
    return Math.round(total / Math.max(heatmapData.length, 1))
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading heatmap...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Issue Heatmap
          </CardTitle>
          <div className="flex space-x-2">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">3 Months</SelectItem>
              </SelectContent>
            </Select>
            {userRole === 'authority' && (
              <Select value={selectedWard} onValueChange={setSelectedWard}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {heatmapData.map(ward => (
                    <SelectItem key={ward.ward} value={ward.ward}>
                      {ward.ward}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{getTotalIssues()}</div>
            <div className="text-sm text-muted-foreground">Total Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{getCriticalWards()}</div>
            <div className="text-sm text-muted-foreground">Critical Wards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{getAverageUpvotes()}</div>
            <div className="text-sm text-muted-foreground">Avg Upvotes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((heatmapData.filter(w => w.density === 'low').length / heatmapData.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Low Density</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Low (1-15)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Medium (16-25)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">High (26-40)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Critical (40+)</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {heatmapData
            .sort((a, b) => b.issueCount - a.issueCount)
            .map((ward) => (
              <Card
                key={ward.ward}
                className={`transition-all hover:shadow-md border-2 ${getDensityBorderColor(ward.density)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm truncate">{ward.ward}</h3>
                    </div>
                    <Badge className={getDensityColor(ward.density)}>
                      {ward.density.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Issues:</span>
                      <span className="ml-1 font-medium">{ward.issueCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Critical:</span>
                      <span className="ml-1 font-medium text-red-600">{ward.criticalCount}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Avg Upvotes:</span>
                      <span className="ml-1 font-medium">{ward.averageUpvotes}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground mb-1">Top Issues:</div>
                    {getTopCategories(ward.categories).map(({ category, count }) => (
                      <div key={category} className="flex items-center justify-between text-xs">
                        <span className="capitalize truncate">{category}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {heatmapData.length === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No heatmap data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}