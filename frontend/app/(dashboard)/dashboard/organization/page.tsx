'use client'

import { useState } from 'react'
import { ArrowLeft, Building2, Users, User, Mail, Shield, Plus, Crown, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/contexts/auth-context'
import { OrganizationMode, UserRole } from '@/lib/types/database'
import { cn } from '@/lib/utils'

// Mock data for team members (in production, fetch from API)
const mockTeamMembers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'van der Merwe',
    email: 'john@example.co.za',
    role: 'ADMIN' as UserRole,
    isActive: true,
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Smith',
    email: 'sarah@example.co.za',
    role: 'MANAGER' as UserRole,
    isActive: true,
  },
  {
    id: '3',
    firstName: 'David',
    lastName: 'Nkosi',
    email: 'david@example.co.za',
    role: 'DRIVER' as UserRole,
    isActive: true,
  },
  {
    id: '4',
    firstName: 'Maria',
    lastName: 'Botha',
    email: 'maria@example.co.za',
    role: 'DRIVER' as UserRole,
    isActive: false,
  },
]

export default function OrganizationPage() {
  const { user, isFleetMode, isSoloMode } = useAuth()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.DRIVER)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const handleInviteUser = async () => {
    if (!inviteEmail) return
    
    setIsInviting(true)
    try {
      // TODO: Call API to invite user
      // await fetch('/api/organization/invite', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setInviteEmail('')
      setInviteDialogOpen(false)
    } catch (error) {
      console.error('Failed to invite user:', error)
    } finally {
      setIsInviting(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'default'
      case 'MANAGER':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">Organization</h1>
            <p className="text-xs text-muted-foreground">Manage your organization settings</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Organization Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Org Name and Icon */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">
                  {user?.organizationName || 'My Organization'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={isSoloMode ? 'outline' : 'default'}>
                    {isSoloMode ? 'Individual' : 'Fleet'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Plan Type Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Crown className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Plan Type</p>
                    <p className="text-sm text-muted-foreground">
                      {isSoloMode ? 'Individual / Freelancer' : 'Fleet / Business'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Team Members</p>
                    <p className="text-sm text-muted-foreground">
                      {isSoloMode ? '1 user' : `${mockTeamMembers.length} members`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Card - Only shown for Fleet mode */}
        {isFleetMode && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Team Members
                  </CardTitle>
                  <CardDescription>
                    Manage your organization&apos;s users
                  </CardDescription>
                </div>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <UserPlus className="h-4 w-4" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your organization
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="colleague@example.co.za"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={inviteRole}
                          onValueChange={(value) => setInviteRole(value as UserRole)}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={UserRole.ADMIN}>
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <span>Admin - Full access</span>
                              </div>
                            </SelectItem>
                            <SelectItem value={UserRole.MANAGER}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Manager - View all, manage subset</span>
                              </div>
                            </SelectItem>
                            <SelectItem value={UserRole.DRIVER}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Driver - Assigned vehicles only</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleInviteUser}
                        disabled={!inviteEmail || isInviting}
                        className="w-full h-12"
                      >
                        {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border',
                      !member.isActive && 'opacity-60'
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn(
                        'text-sm font-medium',
                        member.role === 'ADMIN' && 'bg-primary/20 text-primary',
                        member.role === 'MANAGER' && 'bg-secondary text-secondary-foreground',
                        member.role === 'DRIVER' && 'bg-muted text-muted-foreground'
                      )}>
                        {getInitials(member.firstName, member.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        {!member.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Solo Mode Info */}
        {isSoloMode && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Individual Account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You&apos;re using a solo account for personal vehicle management.
              </p>
              <Button variant="outline" size="sm">
                Upgrade to Fleet Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
