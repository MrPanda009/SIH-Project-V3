import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', logger(console.log))
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Initialize storage buckets
async function initializeBuckets() {
  const bucketName = 'make-a75d69fe-civic-uploads'
  
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
      allowedMimeTypes: ['image/*', 'video/*']
    })
    if (error) {
      console.error('Error creating bucket:', error)
    } else {
      console.log('Bucket created successfully')
    }
  }
}

// Initialize buckets on startup
initializeBuckets()

// Authentication middleware
async function requireAuth(request: Request, next: () => Promise<Response>) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1]
  
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'No authorization token provided' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  
  if (!user?.id || error) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Add user to context for next handlers
  request.userId = user.id
  request.userEmail = user.email
  return await next()
}

// User signup
app.post('/make-server-a75d69fe/signup', async (c) => {
  try {
    const { email, password, name, aadhaar, role } = await c.req.json()
    
    if (!email || !password || !name || !aadhaar) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    // Validate Aadhaar format (12 digits)
    if (!/^\d{12}$/.test(aadhaar)) {
      return c.json({ error: 'Invalid Aadhaar number format' }, 400)
    }
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        aadhaar,
        role: role || 'citizen'
      },
      email_confirm: true
    })
    
    if (error) {
      console.error('Error creating user during signup:', error)
      return c.json({ error: error.message }, 400)
    }
    
    // Store user profile in KV store
    await kv.set(`user_profile_${data.user.id}`, {
      id: data.user.id,
      name,
      email,
      aadhaar,
      role: role || 'citizen',
      createdAt: new Date().toISOString()
    })
    
    return c.json({ user: data.user, message: 'User created successfully' })
  } catch (error) {
    console.error('Error during signup process:', error)
    return c.json({ error: 'Internal server error during signup' }, 500)
  }
})

// Submit a ticket
app.post('/make-server-a75d69fe/tickets', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const body = await c.req.json()
    const { category, description, location, imageUrl } = body
    
    if (!category || !location) {
      return c.json({ error: 'Category and location are required' }, 400)
    }
    
    const ticketId = `TKT${Date.now()}`
    const ticket = {
      id: ticketId,
      userId: user.id,
      category,
      description: description || '',
      location,
      imageUrl: imageUrl || null,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: null,
      resolution: null,
      upvotes: 0
    }
    
    await kv.set(`ticket_${ticketId}`, ticket)
    
    // Add to user's tickets
    const userTickets = await kv.get(`user_tickets_${user.id}`) || []
    userTickets.push(ticketId)
    await kv.set(`user_tickets_${user.id}`, userTickets)
    
    // Create notification for authorities about new ticket
    const allProfiles = await kv.getByPrefix('user_profile_')
    const authorities = allProfiles.filter(profile => profile.role === 'authority')
    
    for (const authority of authorities) {
      await createNotification(
        authority.id,
        'new_ticket',
        'New Issue Reported',
        `A new ${category.replace('-', ' ')} issue has been reported in ${location.ward || 'your area'}`,
        ticketId
      )
    }
    
    return c.json({ ticket, message: 'Ticket submitted successfully' })
  } catch (error) {
    console.error('Error submitting ticket:', error)
    return c.json({ error: 'Internal server error while submitting ticket' }, 500)
  }
})

// Get user's tickets
app.get('/make-server-a75d69fe/tickets/my', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const userTickets = await kv.get(`user_tickets_${user.id}`) || []
    const tickets = []
    
    for (const ticketId of userTickets) {
      const ticket = await kv.get(`ticket_${ticketId}`)
      if (ticket) {
        tickets.push(ticket)
      }
    }
    
    // Sort by creation date, newest first
    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return c.json({ tickets })
  } catch (error) {
    console.error('Error fetching user tickets:', error)
    return c.json({ error: 'Internal server error while fetching tickets' }, 500)
  }
})

// Get nearby tickets
app.get('/make-server-a75d69fe/tickets/nearby', async (c) => {
  try {
    const lat = parseFloat(c.req.query('lat') || '0')
    const lng = parseFloat(c.req.query('lng') || '0')
    const radius = parseFloat(c.req.query('radius') || '5') // 5km default
    
    // Get all tickets (in a real app, you'd use spatial queries)
    const allTickets = await kv.getByPrefix('ticket_')
    const nearbyTickets = []
    
    for (const ticket of allTickets) {
      if (ticket.location?.lat && ticket.location?.lng) {
        const distance = calculateDistance(lat, lng, ticket.location.lat, ticket.location.lng)
        if (distance <= radius) {
          nearbyTickets.push({ ...ticket, distance })
        }
      }
    }
    
    // Sort by distance
    nearbyTickets.sort((a, b) => a.distance - b.distance)
    
    return c.json({ tickets: nearbyTickets })
  } catch (error) {
    console.error('Error fetching nearby tickets:', error)
    return c.json({ error: 'Internal server error while fetching nearby tickets' }, 500)
  }
})

// Update ticket status (for authorities)
app.put('/make-server-a75d69fe/tickets/:ticketId/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Check if user has authority role
    const userProfile = await kv.get(`user_profile_${user.id}`)
    if (!userProfile || userProfile.role !== 'authority') {
      return c.json({ error: 'Insufficient permissions' }, 403)
    }
    
    const ticketId = c.req.param('ticketId')
    const { status, resolution, proofImageUrl } = await c.req.json()
    
    const ticket = await kv.get(`ticket_${ticketId}`)
    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404)
    }
    
    ticket.status = status
    ticket.updatedAt = new Date().toISOString()
    ticket.assignedTo = user.id
    
    if (resolution) {
      ticket.resolution = {
        notes: resolution,
        proofImageUrl: proofImageUrl || null,
        resolvedBy: user.id,
        resolvedAt: new Date().toISOString()
      }
    }
    
    await kv.set(`ticket_${ticketId}`, ticket)
    
    // Create notification for ticket owner about status update
    const ticketOwnerProfile = await kv.get(`user_profile_${ticket.userId}`)
    if (ticketOwnerProfile) {
      const statusMessage = status === 'completed' ? 'resolved' : status.replace('-', ' ')
      await createNotification(
        ticket.userId,
        'ticket_update',
        'Ticket Status Updated',
        `Your ticket #${ticketId} has been ${statusMessage}`,
        ticketId
      )
      
      // If completed with proof, send resolution notification
      if (status === 'completed' && proofImageUrl) {
        await createNotification(
          ticket.userId,
          'resolution',
          'Issue Resolved',
          `Your ticket #${ticketId} has been completed with proof of resolution`,
          ticketId
        )
      }
    }
    
    return c.json({ ticket, message: 'Ticket updated successfully' })
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return c.json({ error: 'Internal server error while updating ticket' }, 500)
  }
})

// Upvote a ticket
app.post('/make-server-a75d69fe/tickets/:ticketId/upvote', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const ticketId = c.req.param('ticketId')
    const ticket = await kv.get(`ticket_${ticketId}`)
    
    if (!ticket) {
      return c.json({ error: 'Ticket not found' }, 404)
    }
    
    // Check if user already upvoted
    const upvoteKey = `upvote_${ticketId}_${user.id}`
    const existingUpvote = await kv.get(upvoteKey)
    
    if (existingUpvote) {
      return c.json({ error: 'Already upvoted' }, 400)
    }
    
    // Add upvote
    await kv.set(upvoteKey, { userId: user.id, ticketId, createdAt: new Date().toISOString() })
    ticket.upvotes = (ticket.upvotes || 0) + 1
    await kv.set(`ticket_${ticketId}`, ticket)
    
    // Create notification for ticket owner about upvote
    if (ticket.userId !== user.id) {
      await createNotification(
        ticket.userId,
        'ticket_upvote',
        'Your Issue Got Support',
        `Someone upvoted your ticket #${ticketId}. Total votes: ${ticket.upvotes}`,
        ticketId
      )
    }
    
    return c.json({ ticket, message: 'Upvoted successfully' })
  } catch (error) {
    console.error('Error upvoting ticket:', error)
    return c.json({ error: 'Internal server error while upvoting' }, 500)
  }
})

// Upload file
app.post('/make-server-a75d69fe/upload', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${user.id}_${timestamp}.${extension}`
    
    const bucketName = 'make-a75d69fe-civic-uploads'
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, file, {
        contentType: file.type,
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading file:', error)
      return c.json({ error: 'Failed to upload file' }, 500)
    }
    
    // Create signed URL for access
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filename, 60 * 60 * 24 * 7) // 1 week expiry
    
    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError)
      return c.json({ error: 'Failed to create file access URL' }, 500)
    }
    
    return c.json({ 
      filename: data.path, 
      url: signedUrl.signedUrl,
      message: 'File uploaded successfully' 
    })
  } catch (error) {
    console.error('Error during file upload process:', error)
    return c.json({ error: 'Internal server error during file upload' }, 500)
  }
})

// Forgot password - send OTP
app.post('/make-server-a75d69fe/forgot-password', async (c) => {
  try {
    const { aadhaar } = await c.req.json()
    
    if (!aadhaar || !/^\d{12}$/.test(aadhaar)) {
      return c.json({ error: 'Invalid Aadhaar number format' }, 400)
    }
    
    // Find user by Aadhaar
    const allProfiles = await kv.getByPrefix('user_profile_')
    const userProfile = allProfiles.find(profile => profile.aadhaar === aadhaar)
    
    if (!userProfile) {
      return c.json({ error: 'User not found with this Aadhaar number' }, 404)
    }
    
    // Generate and store OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpData = {
      aadhaar,
      otp,
      email: userProfile.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    }
    
    await kv.set(`forgot_password_otp_${aadhaar}`, otpData)
    
    // In a real app, you'd send SMS/email with the OTP
    console.log(`OTP for ${aadhaar}: ${otp}`)
    
    return c.json({ message: 'OTP sent to registered mobile and email', tempOtp: otp })
  } catch (error) {
    console.error('Error sending forgot password OTP:', error)
    return c.json({ error: 'Failed to send OTP' }, 500)
  }
})

// Verify forgot password OTP
app.post('/make-server-a75d69fe/verify-forgot-password-otp', async (c) => {
  try {
    const { aadhaar, otp } = await c.req.json()
    
    const otpData = await kv.get(`forgot_password_otp_${aadhaar}`)
    if (!otpData) {
      return c.json({ error: 'OTP not found or expired' }, 400)
    }
    
    if (new Date() > new Date(otpData.expiresAt)) {
      await kv.del(`forgot_password_otp_${aadhaar}`)
      return c.json({ error: 'OTP has expired' }, 400)
    }
    
    if (otpData.otp !== otp) {
      return c.json({ error: 'Invalid OTP' }, 400)
    }
    
    // Mark OTP as verified
    otpData.verified = true
    await kv.set(`forgot_password_otp_${aadhaar}`, otpData)
    
    return c.json({ message: 'OTP verified successfully' })
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return c.json({ error: 'Failed to verify OTP' }, 500)
  }
})

// Reset password
app.post('/make-server-a75d69fe/reset-password', async (c) => {
  try {
    const { aadhaar, newPassword } = await c.req.json()
    
    const otpData = await kv.get(`forgot_password_otp_${aadhaar}`)
    if (!otpData || !otpData.verified) {
      return c.json({ error: 'OTP not verified' }, 400)
    }
    
    // Find user profile
    const allProfiles = await kv.getByPrefix('user_profile_')
    const userProfile = allProfiles.find(profile => profile.aadhaar === aadhaar)
    
    if (!userProfile) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Update password in Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(userProfile.id, {
      password: newPassword
    })
    
    if (error) {
      console.error('Error updating password:', error)
      return c.json({ error: 'Failed to update password' }, 500)
    }
    
    // Clean up OTP data
    await kv.del(`forgot_password_otp_${aadhaar}`)
    
    return c.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return c.json({ error: 'Failed to reset password' }, 500)
  }
})

// Update user profile
app.put('/make-server-a75d69fe/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const profileData = await c.req.json()
    const { name, phone, address, department, designation, employeeId, profileImage } = profileData
    
    if (!name?.trim()) {
      return c.json({ error: 'Name is required' }, 400)
    }
    
    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name: name.trim(),
        phone: phone || '',
        address: address || '',
        department: department || '',
        designation: designation || '',
        employeeId: employeeId || '',
        profileImage: profileImage || '',
        lastProfileUpdate: new Date().toISOString()
      }
    })
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return c.json({ error: 'Failed to update profile' }, 500)
    }
    
    // Also update in KV store for consistency
    const userProfile = await kv.get(`user_profile_${user.id}`) || {}
    const updatedProfile = {
      ...userProfile,
      name: name.trim(),
      phone: phone || '',
      address: address || '',
      department: department || '',
      designation: designation || '',
      employeeId: employeeId || '',
      profileImage: profileImage || '',
      lastProfileUpdate: new Date().toISOString()
    }
    await kv.set(`user_profile_${user.id}`, updatedProfile)
    
    return c.json({ 
      profile: updatedProfile, 
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return c.json({ error: 'Internal server error while updating profile' }, 500)
  }
})

// Get user profile
app.get('/make-server-a75d69fe/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get profile from KV store first
    const profile = await kv.get(`user_profile_${user.id}`)
    
    if (profile) {
      // Return profile data (excluding sensitive fields like aadhaar)
      const { aadhaar, ...publicProfile } = profile
      return c.json(publicProfile)
    } else {
      // If no profile in KV store, return user metadata from auth
      const profileData = {
        name: user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        address: user.user_metadata?.address || '',
        department: user.user_metadata?.department || '',
        designation: user.user_metadata?.designation || '',
        employeeId: user.user_metadata?.employeeId || '',
        profileImage: user.user_metadata?.profileImage || '',
        lastProfileUpdate: user.user_metadata?.lastProfileUpdate || null
      }
      return c.json(profileData)
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return c.json({ error: 'Internal server error while fetching profile' }, 500)
  }
})

// Send profile update OTP
app.post('/make-server-a75d69fe/profile/send-otp', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { email } = await c.req.json()
    
    if (!email || email !== user.email) {
      return c.json({ error: 'Invalid email' }, 400)
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpData = {
      userId: user.id,
      email,
      otp,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    }
    
    await kv.set(`profile_update_otp_${user.id}`, otpData)
    
    // TODO: Send email with OTP
    console.log(`Profile Update OTP for ${email}: ${otp}`)
    
    return c.json({ message: 'OTP sent to email', tempOtp: otp })
  } catch (error) {
    console.error('Error sending profile update OTP:', error)
    return c.json({ error: 'Failed to send OTP' }, 500)
  }
})

// Verify profile update OTP and update profile
app.post('/make-server-a75d69fe/profile/verify-otp', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { otp, profileData } = await c.req.json()
    
    // Verify OTP
    const otpData = await kv.get(`profile_update_otp_${user.id}`)
    if (!otpData) {
      return c.json({ error: 'OTP not found or expired' }, 400)
    }
    
    if (new Date() > new Date(otpData.expiresAt)) {
      await kv.del(`profile_update_otp_${user.id}`)
      return c.json({ error: 'OTP has expired' }, 400)
    }
    
    if (otpData.otp !== otp) {
      return c.json({ error: 'Invalid OTP' }, 400)
    }
    
    const { name, phone, address, department, designation, employeeId, profileImage } = profileData
    
    if (!name?.trim()) {
      return c.json({ error: 'Name is required' }, 400)
    }
    
    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name: name.trim(),
        phone: phone || '',
        address: address || '',
        department: department || '',
        designation: designation || '',
        employeeId: employeeId || '',
        profileImage: profileImage || '',
        lastProfileUpdate: new Date().toISOString()
      }
    })
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError)
      return c.json({ error: 'Failed to update profile' }, 500)
    }
    
    // Also update in KV store for consistency
    const userProfile = await kv.get(`user_profile_${user.id}`) || {}
    const updatedProfile = {
      ...userProfile,
      name: name.trim(),
      phone: phone || '',
      address: address || '',
      department: department || '',
      designation: designation || '',
      employeeId: employeeId || '',
      profileImage: profileImage || '',
      lastProfileUpdate: new Date().toISOString()
    }
    await kv.set(`user_profile_${user.id}`, updatedProfile)
    
    // Clean up OTP
    await kv.del(`profile_update_otp_${user.id}`)
    
    return c.json({ 
      profile: updatedProfile, 
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('Error verifying OTP and updating profile:', error)
    return c.json({ error: 'Internal server error while updating profile' }, 500)
  }
})

// Get all tickets (for authorities)
app.get('/make-server-a75d69fe/tickets/all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get query parameters for filtering
    const ward = c.req.query('ward')
    const status = c.req.query('status')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    const sortBy = c.req.query('sortBy') || 'date'
    
    // Get all tickets
    let allTickets = await kv.getByPrefix('ticket_')
    
    // Apply filters
    if (ward && ward !== 'all') {
      allTickets = allTickets.filter(ticket => ticket.location?.ward === ward)
    }
    
    if (status && status !== 'all') {
      allTickets = allTickets.filter(ticket => ticket.status === status)
    }
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      allTickets = allTickets.filter(ticket => new Date(ticket.createdAt) >= fromDate)
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo)
      allTickets = allTickets.filter(ticket => new Date(ticket.createdAt) <= toDate)
    }
    
    // Sort tickets
    allTickets.sort((a, b) => {
      switch (sortBy) {
        case 'upvotes':
          return (b.upvotes || 0) - (a.upvotes || 0)
        case 'criticality':
          return (b.upvotes || 0) - (a.upvotes || 0)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'ward':
          return (a.location?.ward || '').localeCompare(b.location?.ward || '')
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    return c.json({ tickets: allTickets })
  } catch (error) {
    console.error('Error fetching all tickets:', error)
    return c.json({ error: 'Internal server error while fetching tickets' }, 500)
  }
})

// Get heatmap data
app.get('/make-server-a75d69fe/tickets/heatmap', async (c) => {
  try {
    const timeFilter = c.req.query('timeFilter') || 'week'
    const wardFilter = c.req.query('wardFilter') || 'all'
    
    // Get all tickets
    let allTickets = await kv.getByPrefix('ticket_')
    
    // Apply time filter
    const now = new Date()
    let dateThreshold = new Date()
    
    switch (timeFilter) {
      case 'day':
        dateThreshold.setDate(now.getDate() - 1)
        break
      case 'week':
        dateThreshold.setDate(now.getDate() - 7)
        break
      case 'month':
        dateThreshold.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        dateThreshold.setMonth(now.getMonth() - 3)
        break
    }
    
    if (timeFilter !== 'all') {
      allTickets = allTickets.filter(ticket => new Date(ticket.createdAt) >= dateThreshold)
    }
    
    // Apply ward filter
    if (wardFilter !== 'all') {
      allTickets = allTickets.filter(ticket => ticket.location?.ward === wardFilter)
    }
    
    // Group by ward and create heatmap data
    const wardData = {}
    
    allTickets.forEach(ticket => {
      const ward = ticket.location?.ward || 'Unknown'
      if (!wardData[ward]) {
        wardData[ward] = {
          ward,
          issueCount: 0,
          criticalCount: 0,
          totalUpvotes: 0,
          categories: {}
        }
      }
      
      wardData[ward].issueCount++
      if ((ticket.upvotes || 0) >= 15) {
        wardData[ward].criticalCount++
      }
      wardData[ward].totalUpvotes += ticket.upvotes || 0
      
      const category = ticket.category
      wardData[ward].categories[category] = (wardData[ward].categories[category] || 0) + 1
    })
    
    // Convert to array and add computed fields
    const heatmapData = Object.values(wardData).map((ward: any) => ({
      ...ward,
      averageUpvotes: ward.issueCount > 0 ? Math.round(ward.totalUpvotes / ward.issueCount) : 0,
      density: ward.issueCount > 40 ? 'critical' : 
               ward.issueCount > 25 ? 'high' : 
               ward.issueCount > 15 ? 'medium' : 'low'
    }))
    
    return c.json({ heatmapData })
  } catch (error) {
    console.error('Error generating heatmap data:', error)
    return c.json({ error: 'Internal server error while generating heatmap' }, 500)
  }
})

// Get notifications
app.get('/make-server-a75d69fe/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get user notifications
    const notifications = await kv.get(`notifications_${user.id}`) || []
    
    // Sort by creation date, newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return c.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return c.json({ error: 'Internal server error while fetching notifications' }, 500)
  }
})

// Mark notification as read
app.put('/make-server-a75d69fe/notifications/:notificationId/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const notificationId = c.req.param('notificationId')
    const notifications = await kv.get(`notifications_${user.id}`) || []
    
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    
    await kv.set(`notifications_${user.id}`, updatedNotifications)
    
    return c.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Mark all notifications as read
app.put('/make-server-a75d69fe/notifications/mark-all-read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const notifications = await kv.get(`notifications_${user.id}`) || []
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }))
    
    await kv.set(`notifications_${user.id}`, updatedNotifications)
    
    return c.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Helper function to create notification
async function createNotification(userId: string, type: string, title: string, message: string, ticketId?: string) {
  try {
    const notifications = await kv.get(`notifications_${userId}`) || []
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      ticketId,
      read: false,
      createdAt: new Date().toISOString()
    }
    
    notifications.unshift(notification) // Add to beginning
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(50)
    }
    
    await kv.set(`notifications_${userId}`, notifications)
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

Deno.serve(app.fetch)