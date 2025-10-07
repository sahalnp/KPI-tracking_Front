
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  Shield, 
  LogOut, 
  Edit, 
  Save, 
  Eye, 
  EyeOff,
  X 
} from 'lucide-react'
import { toast } from 'sonner'
import { logoutAccountant } from '@/lib/logoutApi'
import { useDispatch } from 'react-redux'
import { clearUser } from '@/features/UserSlice'
import { axiosInstance } from '@/api/axios'
import { LoadingSpinner } from '../ui/spinner'

export function AccountantAccount() {
  const dispatch = useDispatch()

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState<any>({})
  const [editedData, setEditedData] = useState<any>({})
  const [showOldPin, setShowOldPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pinChangeData, setPinChangeData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  })

  const handleLogout = async () => {
    try {
      localStorage.removeItem('accesstoken')
      localStorage.removeItem('refreshtoken')
      await logoutAccountant()
      dispatch(clearUser())
      toast.success('Logged out successfully')
    } catch (err) {
      toast.error('Error signing out')
    }
  }

  const handleSaveProfile = async () => {
    try {
      if (!editedData.name || !editedData.mobile) {
        toast.error('Name and mobile number are required')
        return
      }

      if (editedData.mobile.length < 10) {
        toast.error('Please enter a valid mobile number')
        return
      }

      await axiosInstance.put('/accountant/update-profile', {
        name: editedData.name,
        mobile: editedData.mobile
      })
      
      setProfileData({ ...profileData, ...editedData })
      setIsEditingProfile(false)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('accesstoken')
        localStorage.removeItem('refreshtoken')
        await logoutAccountant()
        dispatch(clearUser())
        toast.error('Session Expired. Please login again')
      } else {
        toast.error(err.response?.data?.message || 'Failed to update profile')
      }
    }
  }

  const handleCancelEdit = () => {
    setEditedData({
      name: profileData.name || '',
      mobile: profileData.mobile || ''
    })
    setIsEditingProfile(false)
  }

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pinChangeData.currentPin || !pinChangeData.newPin || !pinChangeData.confirmPin) {
      toast.error('All PIN fields are required')
      return
    }

    if (pinChangeData.newPin !== pinChangeData.confirmPin) {
      toast.error('New PIN and confirmation do not match')
      return
    }
    
    if (pinChangeData.newPin.length !== 6 || !/^\d+$/.test(pinChangeData.newPin)) {
      toast.error('PIN must be exactly 4 digits')
      return
    }

    try {
      await axiosInstance.patch('/accountant/change-pin', {
        currentPin: pinChangeData.currentPin,
        newPin: pinChangeData.newPin
      })
      
      toast.success('PIN changed successfully')
      setPinChangeData({ currentPin: '', newPin: '', confirmPin: '' })
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('accesstoken')
        localStorage.removeItem('refreshtoken')
        await logoutAccountant()
        dispatch(clearUser())
        toast.error('Session Expired. Please login again')
      } else {
        toast.error(err.response?.data?.message || 'Failed to change PIN')
      }
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      owner: 'Owner',
      supervisor: 'Floor Manager/Supervisor',
      manager: 'Manager',
      accountant: 'Accountant',
      sales: 'Sales Executive'
    }
    return roleNames[role] || role
  }

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get('/accountant/getme')
        const userData = res.data.me
        setProfileData(userData)
        setEditedData({
          name: userData.name || '',
          mobile: userData.mobile || ''
        })
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('accesstoken')
          localStorage.removeItem('refreshtoken')
          await logoutAccountant()
          dispatch(clearUser())
          toast.error('Session Expired. Please login again')
        } else {
          toast.error(err.response?.data?.message || 'Failed to fetch profile')
        }
      }
      setLoading(false)
    }
    fetchProfile()
  }, [dispatch])

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Account Settings</h2>
          <p className="text-gray-600 mt-1">Manage your profile and account preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Avatar + Basic Info Card */}
            <Card className="relative">
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarFallback className="bg-[#FF3F33] text-white text-2xl">
                    {editedData.name?.split(' ').map(n => n[0]).join('') || profileData.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{editedData.name || profileData.name}</CardTitle>
                <CardDescription>{getRoleDisplayName(profileData.role)}</CardDescription>
              </CardHeader>
            </Card>

            {/* Info Card */}
            <Card className="lg:col-span-2 relative">
              {/* Active/Inactive Badge (bottom right) */}
              <div className="absolute bottom-3 right-3">
                {profileData.active_flag ? (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                )}
              </div>

              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Account details</CardDescription>
                </div>

                {/* Edit/Save/Cancel Buttons */}
                <div className="flex gap-2">
                  {!isEditingProfile ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex items-center gap-1 bg-[#FF3F33] hover:bg-[#E6362B]"
                        onClick={handleSaveProfile}
                      >
                        <Save className="h-4 w-4" /> Save
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Name - Editable */}
                  {isEditingProfile ? (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Name</Label>
                      <Input
                        value={editedData.name}
                        onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                        placeholder="Enter name"
                      />
                    </div>
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {profileData.name}
                    </p>
                  )}

                  {/* Mobile - Editable */}
                  {isEditingProfile ? (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Mobile</Label>
                      <Input
                        value={editedData.mobile}
                        onChange={(e) => setEditedData({ ...editedData, mobile: e.target.value })}
                        placeholder="Enter mobile number"
                        maxLength={10}
                      />
                    </div>
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium">Mobile:</span> {profileData.mobile}
                    </p>
                  )}

                  {/* Floor - View Only */}
                  {profileData.floor?.name && (
                    <p className="text-sm">
                      <span className="font-medium">Floor:</span> {profileData.floor.name}
                    </p>
                  )}

                  {/* Role - View Only */}
                  <p className="text-sm">
                    <span className="font-medium">Role:</span> {profileData.role}
                  </p>

                  {/* Section - View Only */}
                  {profileData.section && (
                    <p className="text-sm">
                      <span className="font-medium">Section:</span> {profileData.section}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-[#FF3F33]" />
                <span>Change PIN</span>
              </CardTitle>
              <CardDescription>Update your login PIN for security</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPin">Current PIN</Label>
                  <div className="relative">
                    <Input
                      id="currentPin"
                      type={showOldPin ? 'text' : 'password'}
                      value={pinChangeData.currentPin}
                      onChange={(e) =>
                        setPinChangeData({ ...pinChangeData, currentPin: e.target.value.replace(/\D/g, '') })
                      }
                      maxLength={6}
                      placeholder="Enter current PIN"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowOldPin(!showOldPin)}
                    >
                      {showOldPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPin">New PIN</Label>
                    <div className="relative">
                      <Input
                        id="newPin"
                        type={showNewPin ? 'text' : 'password'}
                        value={pinChangeData.newPin}
                        onChange={(e) =>
                          setPinChangeData({ ...pinChangeData, newPin: e.target.value.replace(/\D/g, '') })
                        }
                        maxLength={6}
                        placeholder="Enter new PIN"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowNewPin(!showNewPin)}
                      >
                        {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm New PIN</Label>
                    <div className="relative">
                      <Input
                        id="confirmPin"
                        type={showConfirmPin ? 'text' : 'password'}
                        value={pinChangeData.confirmPin}
                        onChange={(e) =>
                          setPinChangeData({ ...pinChangeData, confirmPin: e.target.value.replace(/\D/g, '') })
                        }
                        maxLength={6}
                        placeholder="Confirm new PIN"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                      >
                        {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="bg-[#FF3F33] hover:bg-[#E6362B] w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!pinChangeData.currentPin || !pinChangeData.newPin || !pinChangeData.confirmPin}
                >
                  Change PIN
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-[#FF3F33] hover:bg-[#E6362B] active:scale-95 text-white font-medium rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-transform duration-200"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </motion.div>
  )
}