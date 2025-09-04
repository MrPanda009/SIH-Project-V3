import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { Bell, BellRing, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { notificationsAPI } from '../utils/api'

interface Notification {
  id: string
  type: 'ticket_update' | 'ticket_upvote' | 'new_ticket' | 'resolution'
  title: string
  message: string
  ticketId?: string
  read: boolean
  createdAt: string
}

interface NotificationCenterProps {
  userRole: 'citizen' | 'authority'
  userId: string
}

export default function NotificationCenter({ userRole, userId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [userId])

  const loadNotifications = async () => {
    try {
      const { notifications } = await notificationsAPI.getNotifications()
      setNotifications(notifications)
      setUnreadCount(notifications.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Set empty notifications on error to prevent UI issues
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket_update':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'ticket_upvote':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'new_ticket':
        return <BellRing className="h-4 w-4 text-green-600" />
      case 'resolution':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ticket_update':
        return 'bg-blue-100 text-blue-800'
      case 'ticket_upvote':
        return 'bg-orange-100 text-orange-800'
      case 'new_ticket':
        return 'bg-green-100 text-green-800'
      case 'resolution':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </DialogTitle>
          <DialogDescription>
            View and manage your notifications for ticket updates and system alerts.
          </DialogDescription>
        </DialogHeader>

        {unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
            >
              {loading ? 'Marking...' : 'Mark all read'}
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 max-h-96">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className={getNotificationColor(notification.type)} variant="secondary">
                            {notification.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              {notifications.length} total notifications
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}