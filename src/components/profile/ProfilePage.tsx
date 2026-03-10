"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Shield,
  Wallet,
  Trophy,
  Heart,
  Vote,
  Package,
  Gamepad2,
  Fingerprint,
  Edit3,
  Camera,
  Video,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Share2,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Award,
  Target,
  Flame,
  Gem,
  Sparkles,
  BadgeCheck,
  Verified,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Check,
  Upload,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Filter,
  Search,
  Heart as HeartFilled,
  MessageCircle,
  Repeat2,
  Bookmark,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
  Globe,
  Mail,
  Phone,
  Hash,
  AtSign,
  Info,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ProfilePageProps {
  userId?: string;
  isOwnProfile?: boolean;
}

interface UserStats {
  level: number;
  xp: number;
  maxXp: number;
  reputation: number;
  achievements: number;
  tokens: number;
  nfts: number;
  followers: number;
  following: number;
  posts: number;
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
  badges: Badge[];
  activities: Activity[];
  nfts: NFT[];
  achievements: Achievement[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata: any;
}

interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  rarity: string;
  acquiredAt: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: string;
}

const mockUserProfile: UserProfile = {
  id: "user_123",
  name: "Alex Johnson",
  username: "alexj",
  email: "alex@example.com",
  bio: "Blockchain enthusiast | Web3 developer | Gaming aficionado | Building the future of decentralized applications 🚀",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  coverImage: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=400&fit=crop",
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
    followers: 1250,
    following: 380,
    posts: 89,
  },
  socials: {
    twitter: "@alexj",
    github: "alexj-dev",
    linkedin: "alex-johnson",
    discord: "alexj#1234",
  },
  badges: [
    {
      id: "1",
      name: "Early Adopter",
      description: "Joined during the beta phase",
      icon: "Zap",
      color: "yellow",
      earnedAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Top Contributor",
      description: "Top 1% of contributors",
      icon: "Star",
      color: "purple",
      earnedAt: "2024-03-20",
    },
    {
      id: "3",
      name: "Verified",
      description: "Identity verified",
      icon: "BadgeCheck",
      color: "blue",
      earnedAt: "2024-02-01",
    },
    {
      id: "4",
      name: "Premium",
      description: "Premium member",
      icon: "Crown",
      color: "gold",
      earnedAt: "2024-02-15",
    },
  ],
  activities: [
    {
      id: "1",
      type: "achievement",
      description: "Unlocked 'Blockchain Master' achievement",
      timestamp: "2024-03-09T10:30:00Z",
      metadata: { xp: 500 },
    },
    {
      id: "2",
      type: "nft",
      description: "Acquired 'Cosmic Voyager #42' NFT",
      timestamp: "2024-03-08T15:45:00Z",
      metadata: { collection: "Cosmic Voyagers" },
    },
    {
      id: "3",
      type: "vote",
      description: "Participated in DAO proposal #128",
      timestamp: "2024-03-07T09:20:00Z",
      metadata: { proposal: "Treasury Allocation" },
    },
    {
      id: "4",
      type: "game",
      description: "Won first place in AODS Tournament",
      timestamp: "2024-03-06T18:00:00Z",
      metadata: { prize: "500 AODS" },
    },
  ],
  nfts: [
    {
      id: "1",
      name: "Cosmic Voyager #42",
      image: "https://images.unsplash.com/photo-1634973357973-f2ed2657db3c?w=400&h=400&fit=crop",
      collection: "Cosmic Voyagers",
      rarity: "Legendary",
      acquiredAt: "2024-03-08",
    },
    {
      id: "2",
      name: "Digital Genesis #007",
      image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=400&fit=crop",
      collection: "Digital Genesis",
      rarity: "Epic",
      acquiredAt: "2024-02-20",
    },
    {
      id: "3",
      name: "Meta Warrior #1337",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
      collection: "Meta Warriors",
      rarity: "Rare",
      acquiredAt: "2024-01-25",
    },
  ],
  achievements: [
    {
      id: "1",
      name: "Blockchain Master",
      description: "Complete 100 blockchain transactions",
      icon: "LinkIcon",
      progress: 100,
      maxProgress: 100,
      completed: true,
      completedAt: "2024-03-09",
    },
    {
      id: "2",
      name: "Social Butterfly",
      description: "Connect with 500 friends",
      icon: "Users",
      progress: 380,
      maxProgress: 500,
      completed: false,
    },
    {
      id: "3",
      name: "NFT Collector",
      description: "Collect 50 NFTs",
      icon: "Sparkles",
      progress: 23,
      maxProgress: 50,
      completed: false,
    },
    {
      id: "4",
      name: "Tournament Champion",
      description: "Win 10 tournaments",
      icon: "Trophy",
      progress: 7,
      maxProgress: 10,
      completed: false,
    },
  ],
};

export function ProfilePage({ userId, isOwnProfile = true }: ProfilePageProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile.name,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x1234...5678");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Address copied!");
  };

  const handleSaveProfile = () => {
    setProfile((prev) => ({
      ...prev,
      name: editForm.name,
      bio: editForm.bio,
      location: editForm.location,
      website: editForm.website,
    }));
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        avatar: URL.createObjectURL(file),
      }));
      setIsUploading(false);
      toast.success("Profile photo updated!");
    }, 2500);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      setProfile((prev) => ({
        ...prev,
        coverImage: URL.createObjectURL(file),
      }));
      setIsUploading(false);
      toast.success("Cover image updated!");
    }, 2000);
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

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlayingVideo) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlayingVideo(!isPlayingVideo);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "legendary":
        return "from-yellow-400 via-orange-500 to-red-500";
      case "epic":
        return "from-purple-400 via-pink-500 to-red-500";
      case "rare":
        return "from-blue-400 via-cyan-500 to-teal-500";
      default:
        return "from-gray-400 via-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.coverImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        {isOwnProfile && (
          <div className="absolute top-4 right-4">
            <Label
              htmlFor="cover-upload"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">Change Cover</span>
              <Input
                id="cover-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </Label>
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="relative">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background ring-4 ring-primary/20">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/60">
                  {profile.name[0]}
                </AvatarFallback>
              </Avatar>

              {profile.isPremium && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-2 shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              )}

              {profile.isVerified && (
                <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1.5 shadow-lg">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {isOwnProfile && (
              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-2 right-2 cursor-pointer inline-flex items-center justify-center w-10 h-10 bg-background rounded-full shadow-lg hover:bg-muted transition-colors"
              >
                <Camera className="w-5 h-5" />
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </Label>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 pt-4 md:pt-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                  {profile.isVerified && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                      <BadgeCheck className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {profile.isPremium && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 text-orange-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              <div className="flex items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            <p className="mt-4 text-foreground/80 max-w-2xl">{profile.bio}</p>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </div>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                {profile.website.replace("https://", "")}
              </a>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile.joinedAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 mt-4">
              <div className="flex items-center gap-1">
                <span className="font-bold">{profile.stats.following}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">{profile.stats.followers}</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">{profile.stats.posts}</span>
                <span className="text-muted-foreground">Posts</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">{profile.stats.tokens.toLocaleString()}</span>
                <span className="text-muted-foreground">AODS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level & XP */}
        <div className="mt-6 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">Level {profile.stats.level}</p>
                <p className="text-xs text-muted-foreground">
                  {profile.stats.xp.toLocaleString()} / {profile.stats.maxXp.toLocaleString()} XP
                </p>
              </div>
            </div>
            <Badge variant="secondary">{profile.stats.reputation} Reputation</Badge>
          </div>
          <Progress
            value={(profile.stats.xp / profile.stats.maxXp) * 100}
            className="h-2"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="nfts">NFTs</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            {profile.videoProfile && <TabsTrigger value="video">Video</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{profile.stats.achievements}</p>
                      <p className="text-xs text-muted-foreground">Achievements</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{profile.stats.nfts}</p>
                      <p className="text-xs text-muted-foreground">NFTs</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{profile.stats.tokens.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Tokens</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold">{profile.stats.reputation}</p>
                      <p className="text-xs text-muted-foreground">Reputation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.activities.slice(0, 4).map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          {activity.type === "achievement" && <Trophy className="w-5 h-5" />}
                          {activity.type === "nft" && <Sparkles className="w-5 h-5" />}
                          {activity.type === "vote" && <Vote className="w-5 h-5" />}
                          {activity.type === "game" && <Gamepad2 className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured NFTs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Featured NFTs
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("nfts")}>
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profile.nfts.slice(0, 4).map((nft) => (
                    <div
                      key={nft.id}
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-medium text-sm truncate">{nft.name}</p>
                          <p className="text-white/70 text-xs">{nft.collection}</p>
                        </div>
                      </div>
                      <div
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(
                          nft.rarity
                        )} text-white`}
                      >
                        {nft.rarity}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            {profile.activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 p-4 bg-card rounded-xl border"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {activity.type === "achievement" && <Trophy className="w-6 h-6" />}
                  {activity.type === "nft" && <Sparkles className="w-6 h-6" />}
                  {activity.type === "vote" && <Vote className="w-6 h-6" />}
                  {activity.type === "game" && <Gamepad2 className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                  {activity.metadata && (
                    <div className="mt-2 flex gap-2">
                      {Object.entries(activity.metadata).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {key}: {value as string}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* NFTs Tab */}
          <TabsContent value="nfts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input placeholder="Search NFTs..." className="w-64" />
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {profile.nfts.map((nft) => (
                <Card key={nft.id} className="overflow-hidden group cursor-pointer">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(
                        nft.rarity
                      )} text-white`}
                    >
                      {nft.rarity}
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{nft.name}</p>
                    <p className="text-xs text-muted-foreground">{nft.collection}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Acquired {new Date(nft.acquiredAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={cn(
                    "transition-all",
                    achievement.completed && "border-primary/50 bg-primary/5"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                          achievement.completed
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {achievement.completed ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Target className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{achievement.name}</p>
                          {achievement.completed && (
                            <Badge variant="default" className="text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>
                              {achievement.progress} / {achievement.maxProgress}
                            </span>
                            <span>
                              {Math.round(
                                (achievement.progress / achievement.maxProgress) * 100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={(achievement.progress / achievement.maxProgress) * 100}
                            className="h-2"
                          />
                        </div>
                        {achievement.completedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Completed on{" "}
                            {new Date(achievement.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.badges.map((badge) => (
                <Card key={badge.id} className="overflow-hidden">
                  <CardContent className="p-4 text-center">
                    <div
                      className={cn(
                        "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3",
                        badge.color === "yellow" && "bg-yellow-500/20 text-yellow-500",
                        badge.color === "purple" && "bg-purple-500/20 text-purple-500",
                        badge.color === "blue" && "bg-blue-500/20 text-blue-500",
                        badge.color === "gold" && "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                      )}
                    >
                      {badge.icon === "Zap" && <Zap className="w-8 h-8" />}
                      {badge.icon === "Star" && <Star className="w-8 h-8" />}
                      {badge.icon === "BadgeCheck" && <BadgeCheck className="w-8 h-8" />}
                      {badge.icon === "Crown" && <Crown className="w-8 h-8" />}
                    </div>
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Earned {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Video Tab */}
          {profile.videoProfile && (
            <TabsContent value="video" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={profile.videoProfile}
                      className="w-full h-full"
                      loop
                      muted={isMuted}
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={toggleVideo}
                        className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        {isPlayingVideo ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white ml-1" />
                        )}
                      </button>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <button
                        onClick={() => setShowVideoModal(true)}
                        className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <Maximize2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={editForm.website}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, website: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Video Profile</Label>
              <div className="flex gap-2">
                <Label
                  htmlFor="edit-video-upload"
                  className="cursor-pointer flex-1"
                >
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:bg-muted transition-colors">
                    <Video className="w-5 h-5" />
                    <span>Upload Video Profile</span>
                  </div>
                  <Input
                    id="edit-video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                  />
                </Label>
                {profile.videoProfile && (
                  <Button variant="outline" size="icon">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                MP4 or WebM. Max 100MB. 30 seconds max.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative aspect-video bg-black">
            <video
              src={profile.videoProfile}
              className="w-full h-full"
              controls
              autoPlay
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
