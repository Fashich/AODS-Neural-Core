import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Wallet,
  Trophy,
  Heart,
  Vote,
  Package,
  Gamepad2,
  FileText,
  Bell,
  Moon,
  Sun,
  Globe,
  HelpCircle,
  Sparkles,
  Crown,
  Zap,
  BarChart3,
  Lock,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Camera,
  Video,
  Edit3,
  Save,
  X,
  Check,
  Upload,
  Trash2,
  AlertTriangle,
  Fingerprint,
  ScanFace,
  QrCode,
  History,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Languages,
  Palette,
  Database,
  Download,
  Share2,
  Link2,
  Unlink,
  ExternalLink,
  Copy,
  CheckCircle2,
  Circle,
  MoreVertical,
  MessageSquare,
  Star,
  BadgeCheck,
  Verified,
  Award,
  TrendingUp,
  Activity,
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  Phone,
  AtSign,
  Hash,
  Info,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ProfileDropdownProps {
  className?: string;
}

interface UserStats {
  level: number;
  xp: number;
  maxXp: number;
  reputation: number;
  achievements: number;
  tokens: number;
  nfts: number;
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  coverImage: string;
  videoProfile: string;
  location: string;
  website: string;
  joinedAt: string;
  isVerified: boolean;
  isPremium: boolean;
  stats: UserStats;
  socials: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
  };
}

const mockUserProfile: UserProfile = {
  id: "user_123",
  name: "Alex Johnson",
  username: "alexj",
  email: "alex@example.com",
  bio: "Blockchain enthusiast | Web3 developer | Gaming aficionado",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  coverImage: "",
  videoProfile: "",
  location: "San Francisco, CA",
  website: "https://alexj.dev",
  joinedAt: "2024-01-15",
  isVerified: true,
  isPremium: true,
  stats: {
    level: 42,
    xp: 8750,
    maxXp: 10000,
    reputation: 98,
    achievements: 156,
    tokens: 12500,
    nfts: 23,
  },
  socials: {
    twitter: "@alexj",
    github: "alexj-dev",
    linkedin: "alex-johnson",
    discord: "alexj#1234",
  },
};

export function ProfileDropdown({ className }: ProfileDropdownProps) {
  const [theme, setTheme] = useState<string>("dark");
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: true,
    emailNotifications: true,
    pushNotifications: false,
    loginAlerts: true,
    transactionConfirmations: true,
    privateProfile: false,
    hideBalance: false,
    showActivity: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    activityVisibility: "friends",
    inventoryVisibility: "public",
    allowFriendRequests: true,
    allowMessages: "friends",
    dataSharing: false,
    analytics: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleLogout = async () => {
    await disconnect();
    await logout();
    navigate("/login");
  };

  const handleSaveProfile = () => {
    setProfile((prev) => ({
      ...prev,
      name: editForm.name,
      bio: editForm.bio,
      location: editForm.location,
      website: editForm.website,
    }));
    toast.success("Profile updated successfully!");
    setActiveDialog(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate upload completion
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        avatar: URL.createObjectURL(file),
      }));
      setIsUploading(false);
      toast.success("Profile photo updated!");
    }, 2500);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Uploading video profile...");

    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        videoProfile: URL.createObjectURL(file),
      }));
      setIsUploading(false);
      toast.success("Video profile updated!");
    }, 3000);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard!");
    }
  };

  const menuItems = [
    {
      group: "Profile",
      items: [
        {
          id: "profile",
          label: "My Profile",
          icon: User,
          description: "View and edit your profile",
          shortcut: "⌘P",
        },
        {
          id: "wallet",
          label: "Wallet",
          icon: Wallet,
          description: "Manage your crypto assets",
          badge: `${balance?.slice(0, 6)} ETH`,
        },
        {
          id: "achievements",
          label: "Achievements",
          icon: Trophy,
          description: `${profile.stats.achievements} achievements unlocked`,
        },
        {
          id: "nfts",
          label: "My NFTs",
          icon: Sparkles,
          description: `${profile.stats.nfts} collectibles`,
        },
      ],
    },
    {
      group: "Apps",
      items: [
        {
          id: "healthcare",
          label: "Healthcare",
          icon: Heart,
          description: "Medical records & appointments",
        },
        {
          id: "voting",
          label: "e-Voting",
          icon: Vote,
          description: "Participate in elections",
        },
        {
          id: "supply-chain",
          label: "Supply Chain",
          icon: Package,
          description: "Track products & shipments",
        },
        {
          id: "gaming",
          label: "Gaming",
          icon: Gamepad2,
          description: "Tournaments & leaderboards",
        },
        {
          id: "identity",
          label: "Digital Identity",
          icon: Fingerprint,
          description: "Manage your credentials",
        },
      ],
    },
    {
      group: "Settings",
      items: [
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          description: "Account preferences",
          shortcut: "⌘,",
        },
        {
          id: "security",
          label: "Security & Privacy",
          icon: Shield,
          description: "Protect your account",
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          description: "Manage alerts",
          badge: "3",
        },
      ],
    },
  ];

  const renderDialog = () => {
    switch (activeDialog) {
      case "profile":
        return (
          <Dialog open onOpenChange={() => setActiveDialog(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Edit Profile
                </DialogTitle>
                <DialogDescription>
                  Customize your profile information and appearance
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="media">Photos & Video</TabsTrigger>
                  <TabsTrigger value="social">Social Links</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">@</span>
                      <Input
                        id="username"
                        value={profile.username}
                        disabled
                        className="flex-1"
                      />
                      <Badge variant="secondary">Verified</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                      }
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={editForm.location}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      value={editForm.website}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, website: e.target.value }))
                      }
                      placeholder="https://your-website.com"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Profile Photo</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={profile.avatar} />
                          <AvatarFallback>{profile.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Label
                              htmlFor="avatar-upload"
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                                <Camera className="w-4 h-4" />
                                Change Photo
                              </div>
                              <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                              />
                            </Label>
                            <Button variant="outline" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          {isUploading && (
                            <Progress value={uploadProgress} className="h-2" />
                          )}
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG or GIF. Max 5MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="mb-2 block">Cover Image</Label>
                      <div className="h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                        {profile.coverImage ? (
                          <img
                            src={profile.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mt-2">
                              Upload cover image
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="mb-2 block">Video Profile</Label>
                      <div className="space-y-2">
                        {profile.videoProfile ? (
                          <video
                            src={profile.videoProfile}
                            controls
                            className="w-full max-h-48 rounded-lg"
                          />
                        ) : (
                          <div className="h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                            <div className="text-center">
                              <Video className="w-8 h-8 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-2">
                                Upload video introduction
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Label
                            htmlFor="video-upload"
                            className="cursor-pointer flex-1"
                          >
                            <div className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                              <Video className="w-4 h-4" />
                              {profile.videoProfile ? "Change Video" : "Add Video"}
                            </div>
                            <Input
                              id="video-upload"
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleVideoUpload}
                            />
                          </Label>
                          {profile.videoProfile && (
                            <Button variant="outline" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          MP4 or WebM. Max 100MB. 30 seconds max.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">@</span>
                      <Input
                        id="twitter"
                        defaultValue={profile.socials.twitter}
                        placeholder="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      defaultValue={profile.socials.github}
                      placeholder="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      defaultValue={profile.socials.linkedin}
                      placeholder="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discord">Discord</Label>
                    <Input
                      id="discord"
                      defaultValue={profile.socials.discord}
                      placeholder="username#0000"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );

      case "security":
        return (
          <Dialog open onOpenChange={() => setActiveDialog(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Privacy
                </DialogTitle>
                <DialogDescription>
                  Manage your account security and privacy settings
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="security" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  <TabsTrigger value="devices">Devices</TabsTrigger>
                </TabsList>

                <TabsContent value="security" className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Authentication
                    </h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.twoFactor}
                        onCheckedChange={(checked) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            twoFactor: checked,
                          }))
                        }
                      />
                    </div>

                    {securitySettings.twoFactor && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Authenticator app enabled</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <QrCode className="w-4 h-4 mr-2" />
                          Setup Backup Codes
                        </Button>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <Label>Change Password</Label>
                      <div className="space-y-2">
                        <Input type="password" placeholder="Current password" />
                        <Input type="password" placeholder="New password" />
                        <Input type="password" placeholder="Confirm new password" />
                      </div>
                      <Button size="sm">Update Password</Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Change Email</Label>
                      <div className="flex gap-2">
                        <Input defaultValue={profile.email} />
                        <Button variant="outline" size="sm">
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Notifications
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Email notifications</Label>
                        <Switch
                          checked={securitySettings.emailNotifications}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              emailNotifications: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Push notifications</Label>
                        <Switch
                          checked={securitySettings.pushNotifications}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              pushNotifications: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Login alerts</Label>
                        <Switch
                          checked={securitySettings.loginAlerts}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              loginAlerts: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Transaction confirmations</Label>
                        <Switch
                          checked={securitySettings.transactionConfirmations}
                          onCheckedChange={(checked) =>
                            setSecuritySettings((prev) => ({
                              ...prev,
                              transactionConfirmations: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Profile Visibility
                    </h4>

                    <div className="space-y-2">
                      <Label>Who can see your profile</Label>
                      <Select
                        value={privacySettings.profileVisibility}
                        onValueChange={(value) =>
                          setPrivacySettings((prev) => ({
                            ...prev,
                            profileVisibility: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Everyone</SelectItem>
                          <SelectItem value="friends">Friends only</SelectItem>
                          <SelectItem value="private">Only me</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Activity visibility</Label>
                      <Select
                        value={privacySettings.activityVisibility}
                        onValueChange={(value) =>
                          setPrivacySettings((prev) => ({
                            ...prev,
                            activityVisibility: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Everyone</SelectItem>
                          <SelectItem value="friends">Friends only</SelectItem>
                          <SelectItem value="private">Only me</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Private profile</Label>
                        <p className="text-xs text-muted-foreground">
                          Hide your profile from search engines
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.privateProfile}
                        onCheckedChange={(checked) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            privateProfile: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Hide balance</Label>
                        <p className="text-xs text-muted-foreground">
                          Don&apos;t show your token balance
                        </p>
                      </div>
                      <Switch
                        checked={securitySettings.hideBalance}
                        onCheckedChange={(checked) =>
                          setSecuritySettings((prev) => ({
                            ...prev,
                            hideBalance: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Social
                    </h4>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Allow friend requests</Label>
                      <Switch
                        checked={privacySettings.allowFriendRequests}
                        onCheckedChange={(checked) =>
                          setPrivacySettings((prev) => ({
                            ...prev,
                            allowFriendRequests: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Who can message you</Label>
                      <Select
                        value={privacySettings.allowMessages}
                        onValueChange={(value) =>
                          setPrivacySettings((prev) => ({
                            ...prev,
                            allowMessages: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="friends">Friends only</SelectItem>
                          <SelectItem value="none">No one</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Data
                    </h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Data sharing</Label>
                        <p className="text-xs text-muted-foreground">
                          Share data with partners
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.dataSharing}
                        onCheckedChange={(checked) =>
                          setPrivacySettings((prev) => ({
                            ...prev,
                            dataSharing: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Analytics</Label>
                        <p className="text-xs text-muted-foreground">
                          Help improve our services
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.analytics}
                        onCheckedChange={(checked) =>
                          setPrivacySettings((prev) => ({
                            ...prev,
                            analytics: checked,
                          }))
                        }
                      />
                    </div>

                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download My Data
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="devices" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Active Sessions</h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">iPhone 15 Pro</p>
                            <p className="text-xs text-muted-foreground">
                              Last active: Now
                            </p>
                          </div>
                        </div>
                        <Badge>Current</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Globe className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">Chrome on MacOS</p>
                            <p className="text-xs text-muted-foreground">
                              Last active: 2 hours ago
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Lock className="w-4 h-4 mr-2" />
                      Log Out All Devices
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setActiveDialog(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );

      case "settings":
        return (
          <Dialog open onOpenChange={() => setActiveDialog(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="language">Language</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Theme</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="w-6 h-6" />
                        <span>Light</span>
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="w-6 h-6" />
                        <span>Dark</span>
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setTheme("system")}
                      >
                        <Monitor className="w-6 h-6" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="space-y-3">
                      {[
                        { label: "Email notifications", default: true },
                        { label: "Push notifications", default: false },
                        { label: "Marketing emails", default: false },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between"
                        >
                          <Label className="text-sm">{item.label}</Label>
                          <Switch defaultChecked={item.default} />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Accent Color</h4>
                    <div className="flex gap-2">
                      {[
                        "bg-blue-500",
                        "bg-purple-500",
                        "bg-green-500",
                        "bg-orange-500",
                        "bg-pink-500",
                        "bg-red-500",
                      ].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full ${color} hover:scale-110 transition-transform`}
                        />
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Font Size</h4>
                    <Slider defaultValue={[16]} min={12} max={24} step={1} />
                  </div>
                </TabsContent>

                <TabsContent value="language" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="id">Bahasa Indonesia</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="jpy">JPY (¥)</SelectItem>
                        <SelectItem value="idr">IDR (Rp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Blockchain</h4>
                    <div className="space-y-2">
                      <Label>Default Network</Label>
                      <Select defaultValue="ethereum">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="polygon">Polygon</SelectItem>
                          <SelectItem value="bsc">BSC</SelectItem>
                          <SelectItem value="arbitrum">Arbitrum</SelectItem>
                          <SelectItem value="optimism">Optimism</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Auto-confirm transactions</Label>
                        <p className="text-xs text-muted-foreground">
                          Skip confirmation for small amounts
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-destructive">Danger Zone</h4>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete your account and remove your data from our
                            servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative h-10 w-10 rounded-full p-0 hover:bg-muted",
              className
            )}
          >
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {profile.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {profile.isPremium && (
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-0.5">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-80"
          align="end"
          sideOffset={8}
          forceMount
        >
          {/* User Header */}
          <div className="p-4 border-b">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-semibold truncate">{profile.name}</p>
                  {profile.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  @{profile.username}
                </p>
                {address && (
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="font-mono">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold">{profile.stats.level}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold">{profile.stats.tokens}</p>
                <p className="text-xs text-muted-foreground">Tokens</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold">{profile.stats.nfts}</p>
                <p className="text-xs text-muted-foreground">NFTs</p>
              </div>
              <div className="text-center p-2 bg-muted rounded-lg">
                <p className="text-lg font-bold">{profile.stats.reputation}</p>
                <p className="text-xs text-muted-foreground">Rep</p>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">XP Progress</span>
                <span className="font-medium">
                  {profile.stats.xp} / {profile.stats.maxXp}
                </span>
              </div>
              <Progress
                value={(profile.stats.xp / profile.stats.maxXp) * 100}
                className="h-2"
              />
            </div>
          </div>

          {/* Menu Items */}
          <div className="max-h-[400px] overflow-y-auto">
            {menuItems.map((group, groupIndex) => (
              <div key={group.group}>
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
                  {group.group}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {group.items.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setActiveDialog(item.id)}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.shortcut && (
                        <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                {groupIndex < menuItems.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                <span className="text-sm">Theme</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be signed out of your account on this device.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {renderDialog()}
    </>
  );
}

// Helper component for system monitor icon
function Monitor({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}
