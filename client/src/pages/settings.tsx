import { useState } from "react";
import { 
  Search, 
  User, 
  Shield, 
  Bell, 
  Lock, 
  Palette, 
  Sliders, 
  Keyboard, 
  Globe, 
  Plug, 
  Key, 
  Webhook, 
  HardDrive, 
  Download, 
  Trash2,
  Upload,
  Check,
  Plus,
  Monitor,
  Smartphone,
  Mail,
  Clock,
  Eye,
  Database,
  Image as ImageIcon,
  Moon,
  Sun,
  Laptop,
  Command,
  AlertTriangle,
  FileText,
  FolderArchive,
  ShoppingBag,
  Share2,
  Video,
  Megaphone,
  Store,
  Shirt,
  Package,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);
  const { toast } = useToast();

  const handleTabSelect = (tabName: string) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false);
  };

  const navGroups = [
    {
      label: "ACCOUNT",
      items: [
        { name: "Profile", icon: User },
        { name: "Security", icon: Shield },
        { name: "Notifications", icon: Bell },
        { name: "Privacy", icon: Lock },
      ]
    },
    {
      label: "PREFERENCES",
      items: [
        { name: "Appearance", icon: Palette },
        { name: "Generation Defaults", icon: Sliders },
        { name: "Keyboard Shortcuts", icon: Keyboard },
      ]
    },
    {
      label: "INTEGRATIONS",
      items: [
        { name: "Connected Apps", icon: Plug },
      ]
    },
    {
      label: "DATA & STORAGE",
      items: [
        { name: "Storage", icon: HardDrive },
        { name: "Export Data", icon: Download },
        { name: "Delete Account", icon: Trash2, danger: true },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "Profile":
        return <ProfileSettings />;
      case "Security":
        return <SecuritySettings />;
      case "Notifications":
        return <NotificationsSettings />;
      case "Privacy":
        return <PrivacySettings />;
      case "Appearance":
        return <AppearanceSettings />;
      case "Generation Defaults":
        return <GenerationDefaultsSettings />;
      case "Keyboard Shortcuts":
        return <KeyboardShortcutsSettings />;
      case "Connected Apps":
        return <ConnectedAppsSettings />;
      case "Storage":
        return <StorageSettings />;
      case "Export Data":
        return <ExportDataSettings />;
      case "Delete Account":
        return <DeleteAccountSettings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-[#71717A]">
            <div className="w-16 h-16 bg-[#F4F4F5] dark:bg-[#1F1F25] rounded-full flex items-center justify-center mb-4">
              <Sliders className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-2">Work in Progress</h3>
            <p>The {activeTab} settings are coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen bg-background flex font-sans text-foreground overflow-hidden">
      {/* Main Sidebar */}
      <Sidebar className="hidden md:flex border-r border-border/50" />
      
      <main className="flex-1 flex h-full overflow-hidden bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA] relative">
        {/* Settings Navigation Panel */}
        <div className={cn(
          "w-full md:w-[260px] flex-shrink-0 border-r border-[#E4E4E7] dark:border-[#1F1F23] bg-[#F8F8F8] dark:bg-[#0A0A0B] h-full overflow-y-auto py-8 transition-all absolute md:relative z-20",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <div className="px-6 mb-8">
            <h1 className="text-2xl font-bold text-[#18181B] dark:text-[#FAFAFA] mb-4">Settings</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#71717A]" />
              <input 
                type="text" 
                placeholder="Search settings..." 
                className="w-full bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-[10px] py-2.5 pl-10 pr-3 text-sm text-[#18181B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#52525B] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <h3 className="px-6 text-[10px] font-bold text-[#71717A] dark:text-[#52525B] uppercase tracking-[1px] mb-2">
                  {group.label}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleTabSelect(item.name)}
                      className={cn(
                        "w-full flex items-center gap-3 px-6 py-2.5 text-sm transition-all border-l-2 border-transparent",
                        activeTab === item.name 
                          ? "bg-white dark:bg-[#111113] text-[#18181B] dark:text-[#FAFAFA] border-l-[#7C3AED] font-medium shadow-sm dark:shadow-none" 
                          : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-white dark:hover:bg-[#111113] hover:text-[#18181B] dark:hover:text-[#FAFAFA]",
                        item.danger && "text-[#DC2626] hover:text-[#DC2626] dark:text-[#DC2626] dark:hover:text-[#DC2626]"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px]", item.danger && "text-[#DC2626]")} />
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Content Panel */}
        <div className={cn(
          "flex-1 h-full overflow-y-auto bg-white dark:bg-[#09090B] p-6 md:p-12 w-full absolute md:relative transition-all",
          mobileMenuOpen ? "translate-x-full md:translate-x-0" : "translate-x-0"
        )}>
          <div className="max-w-[720px] mx-auto pb-20">
            {/* Mobile Back Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Settings
            </button>
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileSettings() {
  const { toast } = useToast();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Profile</h2>
        <p className="text-sm text-[#71717A] mt-1">Manage your personal information and public profile</p>
      </div>

      {/* Profile Photo */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-4">Profile Photo</h3>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#F4F4F5] dark:bg-[#1F1F25] flex items-center justify-center overflow-hidden border border-[#E4E4E7] dark:border-[#2A2A30]">
            <User className="h-8 w-8 text-[#71717A] dark:text-[#52525B]" />
          </div>
          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#F4F4F5] dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-[10px] text-[13px] font-semibold text-[#18181B] dark:text-[#FAFAFA] hover:bg-[#E4E4E7] dark:hover:bg-[#2A2A30] transition-colors">
              <Upload className="h-4 w-4" />
              Upload photo
            </button>
            <button className="text-[13px] text-[#71717A] hover:text-[#DC2626] transition-colors text-left ml-1">
              Remove photo
            </button>
            <p className="text-xs text-[#71717A] dark:text-[#52525B] mt-1">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-5">Basic Information</h3>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">First Name</label>
              <input 
                defaultValue="John"
                className="w-full bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-[10px] px-4 py-3 text-sm text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Last Name</label>
              <input 
                defaultValue="Doe"
                className="w-full bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-[10px] px-4 py-3 text-sm text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Display Name</label>
            <input 
              defaultValue="johndoe"
              className="w-full bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-[10px] px-4 py-3 text-sm text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
            />
            <p className="text-xs text-[#71717A] dark:text-[#52525B]">This is how your name appears publicly</p>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Email</label>
            <div className="relative">
              <input 
                defaultValue="john@example.com"
                className="w-full bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-[10px] px-4 py-3 text-sm text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20">
                <Check className="h-3 w-3 text-[#16A34A]" />
                <span className="text-[11px] font-medium text-[#16A34A]">Verified</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Bio</label>
            <textarea 
              placeholder="Tell us about yourself..."
              className="w-full bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-[10px] px-4 py-3 text-sm text-[#18181B] dark:text-[#FAFAFA] min-h-[100px] focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all resize-y"
            />
            <div className="text-right text-xs text-[#71717A] dark:text-[#52525B]">0 / 200</div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Social Links</h3>
          <span className="px-2 py-1 rounded-full bg-[#F4F4F5] dark:bg-[#1F1F25] text-[11px] text-[#71717A] dark:text-[#52525B]">Optional</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {[
            { icon: Globe, label: "Website", placeholder: "https://yourwebsite.com" },
            { icon: Check, label: "Twitter", placeholder: "https://twitter.com/username" }, // Check is placeholder for Twitter icon
            { icon: Check, label: "LinkedIn", placeholder: "https://linkedin.com/in/username" }, // Check is placeholder
            { icon: Check, label: "Instagram", placeholder: "https://instagram.com/username" } // Check is placeholder
          ].map((social, i) => (
            <div key={i} className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#52525B]">
                <social.icon className="h-4 w-4" />
              </div>
              <input 
                placeholder={social.placeholder}
                className="w-full bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-[10px] py-3 pl-11 pr-4 text-sm text-[#18181B] dark:text-[#FAFAFA] focus:outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all"
              />
            </div>
          ))}
          
          <button className="flex items-center gap-2 text-[13px] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors mt-1 w-fit">
            <Plus className="h-4 w-4" />
            Add link
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-8">
        <button className="px-5 py-3 text-sm font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors">
          Cancel
        </button>
        <button 
          onClick={() => toast({ title: "Profile updated", description: "Your changes have been saved successfully." })}
          className="px-6 py-3 bg-[#7C3AED] hover:brightness-110 text-white rounded-[10px] text-sm font-semibold transition-all shadow-lg shadow-[#7C3AED]/20"
        >
          Save changes
        </button>
      </div>
    </motion.div>
  );
}

function SecuritySettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Security</h2>
        <p className="text-sm text-[#71717A] mt-1">Manage your account security and authentication methods</p>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Password</h3>
          <span className="text-xs text-[#71717A] dark:text-[#52525B]">Last changed 3 months ago</span>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-base text-[#71717A] tracking-[2px] font-mono">••••••••••••</div>
          <button className="px-4 py-2 bg-[#F4F4F5] dark:bg-[#1F1F25] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-lg text-[13px] text-[#18181B] dark:text-[#FAFAFA] hover:bg-[#E4E4E7] dark:hover:bg-[#2A2A30] transition-colors">
            Change password
          </button>
        </div>
      </div>

      {/* 2FA */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Shield className="h-5 w-5 text-[#16A34A]" />
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Two-Factor Authentication</h3>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-[#71717A] dark:text-[#A1A1AA] max-w-md">Add an extra layer of security to your account by requiring a code when logging in.</p>
          <Switch checked={true} />
        </div>

        <div className="bg-[#F4F4F5] dark:bg-[#1A1A1F] rounded-xl p-4 border border-[#E4E4E7] dark:border-[#2A2A30]">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-4 w-4 text-[#16A34A]" />
            <span className="text-[13px] font-medium text-[#16A34A]">Authenticator app configured</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#71717A]">Recovery codes: 8 remaining</span>
            <div className="flex gap-3">
              <button className="text-xs text-[#18181B] dark:text-[#FAFAFA] hover:underline">View recovery codes</button>
              <button className="text-xs text-[#18181B] dark:text-[#FAFAFA] hover:underline">Reconfigure</button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions - Compact Mobile */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Active Sessions</h3>
          <button className="text-xs font-medium text-[#DC2626] hover:underline bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-md">Sign out all</button>
        </div>
        
        <div className="space-y-4">
          {[
            { icon: Monitor, name: "MacBook Pro", browser: "Chrome", loc: "San Francisco, CA", active: "Active now", current: true },
            { icon: Smartphone, name: "iPhone 15", browser: "Safari", loc: "San Francisco, CA", active: "2h ago", current: false },
            { icon: Monitor, name: "Windows PC", browser: "Firefox", loc: "Unknown", active: "5 days ago", current: false }
          ].map((session, i) => (
            <div key={i} className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="h-8 w-8 bg-[#F4F4F5] dark:bg-[#1F1F25] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <session.icon className="h-4 w-4 text-[#71717A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{session.name} <span className="text-[#71717A] font-normal">- {session.browser}</span></span>
                    {session.current && (
                      <span className="px-1.5 py-0.5 bg-[#7C3AED]/10 text-[#7C3AED] text-[9px] font-bold rounded-md uppercase border border-[#7C3AED]/20">Current</span>
                    )}
                  </div>
                  <div className="text-xs text-[#71717A] dark:text-[#52525B] mt-0.5 flex items-center gap-1.5">
                    <span>{session.loc}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-[#71717A]" />
                    <span>{session.active}</span>
                  </div>
                </div>
              </div>
              <button className="text-xs text-[#71717A] border border-border px-2 py-1 rounded hover:bg-muted transition-colors">Sign out</button>
            </div>
          ))}
        </div>
      </div>

      {/* Login History - Compact List for Mobile */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-5">
        <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-4">Recent Login Activity</h3>
        
        {/* Mobile List View */}
        <div className="space-y-3">
          {[
            { date: "Dec 15, 2:30 PM", loc: "San Francisco, CA", device: "Chrome on Mac", status: "Success", statusColor: "text-[#16A34A] bg-[#16A34A]/10" },
            { date: "Dec 14, 9:15 AM", loc: "San Francisco, CA", device: "Safari on iPhone", status: "Success", statusColor: "text-[#16A34A] bg-[#16A34A]/10" },
            { date: "Dec 13, 11:00 PM", loc: "Unknown", device: "Firefox on Windows", status: "Blocked", statusColor: "text-[#DC2626] bg-[#DC2626]/10" }
          ].map((login, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#F9FAFB] dark:bg-[#1A1A1F] rounded-xl border border-[#E4E4E7] dark:border-[#1F1F23]">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{login.device}</div>
                <div className="text-xs text-[#71717A] flex items-center gap-1.5">
                  <span>{login.date}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-[#71717A]" />
                  <span>{login.loc}</span>
                </div>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide", login.statusColor)}>
                {login.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function NotificationsSettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Notifications</h2>
        <p className="text-sm text-[#71717A] mt-1">Choose what notifications you receive and how</p>
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Mail className="h-5 w-5 text-[#18181B] dark:text-[#FAFAFA]" />
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Email Notifications</h3>
        </div>

        <div className="divide-y divide-[#F4F4F5] dark:divide-[#1F1F23]">
          {[
            { title: "Generation Complete", desc: "Get notified when your image generation is finished", default: true },
            { title: "Weekly Summary", desc: "Receive a weekly summary of your usage and credits", default: true },
            { title: "Product Updates", desc: "Learn about new features and improvements", default: false },
            { title: "Tips & Tutorials", desc: "Get helpful tips to improve your creations", default: false },
            { title: "Marketing", desc: "Receive promotional offers and announcements", default: false }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center py-4 first:pt-2 last:pb-0">
              <div>
                <div className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{item.title}</div>
                <div className="text-[13px] text-[#71717A]">{item.desc}</div>
              </div>
              <Switch defaultChecked={item.default} />
            </div>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Bell className="h-5 w-5 text-[#18181B] dark:text-[#FAFAFA]" />
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Push Notifications</h3>
        </div>

        <div className="flex justify-between items-center mb-6 pb-6 border-b border-[#F4F4F5] dark:border-[#1F1F23]">
          <span className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">Enable push notifications</span>
          <Switch />
        </div>

        <div className="opacity-50 pointer-events-none">
          <p className="text-sm text-[#71717A] dark:text-[#52525B] mb-4">Receive notifications in your browser</p>
          {/* Reusing same structure as email for simplicity */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Generation Complete</span>
               <Switch disabled />
             </div>
             <div className="flex justify-between items-center">
               <span className="text-sm text-[#71717A] dark:text-[#A1A1AA]">Direct Messages</span>
               <Switch disabled />
             </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Clock className="h-5 w-5 text-[#18181B] dark:text-[#FAFAFA]" />
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Quiet Hours</h3>
        </div>

        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">Pause notifications during quiet hours</span>
          <Switch />
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-lg text-sm text-[#18181B] dark:text-[#FAFAFA]">10:00 PM</div>
          <span className="text-[#71717A] dark:text-[#52525B]">to</span>
          <div className="px-4 py-2 bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30] rounded-lg text-sm text-[#18181B] dark:text-[#FAFAFA]">8:00 AM</div>
          <span className="text-xs text-[#71717A] dark:text-[#52525B] ml-2">Pacific Time (PT)</span>
        </div>
      </div>
    </motion.div>
  );
}

function PrivacySettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Privacy</h2>
        <p className="text-sm text-[#71717A] mt-1">Control your privacy settings and data</p>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Eye className="h-5 w-5 text-[#18181B] dark:text-[#FAFAFA]" />
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Profile Visibility</h3>
        </div>

        <div className="space-y-2">
          {[
            { label: "Public", desc: "Anyone can view your profile and public creations", checked: false },
            { label: "Private", desc: "Only you can see your profile", checked: true },
            { label: "Hidden", desc: "Your profile is completely hidden from search", checked: false }
          ].map((option, i) => (
            <label key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F4F4F5] dark:hover:bg-[#1A1A1F] cursor-pointer transition-colors border border-transparent hover:border-[#E4E4E7] dark:hover:border-[#2A2A30]">
              <div className="mt-0.5">
                <div className={cn(
                  "h-4 w-4 rounded-full border flex items-center justify-center",
                  option.checked ? "border-[#7C3AED]" : "border-[#71717A] dark:border-[#52525B]"
                )}>
                  {option.checked && <div className="h-2 w-2 rounded-full bg-[#7C3AED]" />}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{option.label}</div>
                <div className="text-[13px] text-[#71717A]">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Collection */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <Database className="h-5 w-5 text-[#18181B] dark:text-[#FAFAFA]" />
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Data Collection</h3>
        </div>

        <div className="divide-y divide-[#F4F4F5] dark:divide-[#1F1F23]">
          {[
            { title: "Usage Analytics", desc: "Help improve the product with anonymous usage data", default: true },
            { title: "Personalization", desc: "Allow personalized recommendations based on your activity", default: true },
            { title: "Third-party Analytics", desc: "Share data with analytics partners", default: false }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center py-4 first:pt-2 last:pb-0">
              <div>
                <div className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{item.title}</div>
                <div className="text-[13px] text-[#71717A]">{item.desc}</div>
              </div>
              <Switch defaultChecked={item.default} />
            </div>
          ))}
        </div>
      </div>

      {/* Content Visibility */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <ImageIcon className="h-5 w-5 text-[#18181B] dark:text-[#FAFAFA]" />
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Content Visibility</h3>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <div>
             <div className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">Allow Remixing</div>
             <div className="text-[13px] text-[#71717A]">Allow other users to use your public creations as references</div>
          </div>
          <Switch defaultChecked={true} />
        </div>
      </div>
    </motion.div>
  );
}

function AppearanceSettings() {
  const { toast } = useToast();
  const [theme, setTheme] = useState("system");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Appearance</h2>
        <p className="text-sm text-[#71717A] mt-1">Customize the look and feel of your interface</p>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-5">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: "light", name: "Light", icon: Sun },
            { id: "dark", name: "Dark", icon: Moon },
            { id: "system", name: "System", icon: Laptop },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all",
                theme === t.id 
                  ? "bg-[#7C3AED]/5 border-[#7C3AED] text-[#7C3AED]" 
                  : "bg-[#F4F4F5] dark:bg-[#1A1A1F] border-transparent text-[#71717A] hover:bg-[#E4E4E7] dark:hover:bg-[#2A2A30]"
              )}
            >
              <t.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
           <div>
             <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Reduced Motion</h3>
             <p className="text-xs text-[#71717A] mt-1">Minimize animations for a simplified experience</p>
           </div>
           <Switch />
        </div>
        <div className="flex items-center justify-between">
           <div>
             <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">High Contrast</h3>
             <p className="text-xs text-[#71717A] mt-1">Increase contrast for better visibility</p>
           </div>
           <Switch />
        </div>
      </div>
    </motion.div>
  );
}

function GenerationDefaultsSettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Generation Defaults</h2>
        <p className="text-sm text-[#71717A] mt-1">Set your preferred settings for new creations</p>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6 space-y-6">
        <div className="space-y-3">
          <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Default Model</label>
          <Select defaultValue="v5.2">
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="v5.2">Ugli V5.2 (Recommended)</SelectItem>
              <SelectItem value="v5.1">Ugli V5.1</SelectItem>
              <SelectItem value="v5.0">Ugli V5.0</SelectItem>
              <SelectItem value="niji">Niji (Anime)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Default Aspect Ratio</label>
          <div className="flex gap-2">
            {["1:1", "16:9", "9:16", "4:3", "3:4"].map(ratio => (
              <button 
                key={ratio}
                className={cn(
                  "px-3 py-2 rounded-md text-xs font-medium border transition-colors",
                  ratio === "1:1" 
                    ? "bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]" 
                    : "bg-[#F4F4F5] dark:bg-[#1A1A1F] border-transparent text-[#71717A] hover:bg-[#E4E4E7] dark:hover:bg-[#2A2A30]"
                )}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-[13px] font-medium text-[#71717A] dark:text-[#A1A1AA]">Default Steps</label>
            <span className="text-xs font-mono text-[#71717A]">30</span>
          </div>
          <Slider defaultValue={[30]} max={50} step={1} />
        </div>
      </div>

       <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6">
        <div className="flex items-center justify-between">
           <div>
             <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Private Mode</h3>
             <p className="text-xs text-[#71717A] mt-1">Make all generations private by default</p>
           </div>
           <Switch />
        </div>
      </div>
    </motion.div>
  );
}

function KeyboardShortcutsSettings() {
  const shortcuts = [
    { keys: ["⌘", "K"], action: "Open command palette" },
    { keys: ["⌘", "Enter"], action: "Generate image" },
    { keys: ["/"], action: "Focus prompt input" },
    { keys: ["Esc"], action: "Close modal / Clear selection" },
    { keys: ["⌘", "S"], action: "Save current image" },
    { keys: ["⌘", "D"], action: "Download selected" },
    { keys: ["⌘", "Shift", "L"], action: "Toggle dark mode" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Keyboard Shortcuts</h2>
        <p className="text-sm text-[#71717A] mt-1">Speed up your workflow with these hotkeys</p>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl overflow-hidden">
        {shortcuts.map((shortcut, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-[#F4F4F5] dark:border-[#1F1F23] last:border-0">
            <span className="text-sm text-[#18181B] dark:text-[#FAFAFA]">{shortcut.action}</span>
            <div className="flex gap-1.5">
              {shortcut.keys.map((key, k) => (
                <kbd key={k} className="px-2 py-1 bg-[#F4F4F5] dark:bg-[#27272A] rounded-[6px] border border-[#E4E4E7] dark:border-[#3F3F46] text-[11px] font-mono font-semibold text-[#71717A] dark:text-[#A1A1AA] min-w-[24px] text-center">
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ConnectedAppsSettings() {
  const apps = [
    { 
      name: "Shopify", 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M20.4 7.5c-.6-2.5-2.6-4.3-5.2-4.5-1.3-.1-2.6.3-3.6 1.1-1-.8-2.3-1.2-3.6-1.1-2.6.2-4.6 2-5.2 4.5-.3 1.3 0 2.7.8 3.8L8 20.5c.3 1.1 1.3 1.9 2.5 1.9h2.8c1.2 0 2.2-.8 2.5-1.9l4.4-9.2c.8-1.1 1.1-2.5.8-3.8zM9.5 6.5c.8 0 1.5.6 1.6 1.4H7.9c.1-.8.8-1.4 1.6-1.4zm5 0c.8 0 1.5.6 1.6 1.4h-3.2c.1-.8.8-1.4 1.6-1.4z"/>
        </svg>
      ), 
      color: "#96bf48", 
      status: "Coming Soon" 
    },
    { 
      name: "Meta", 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          <path d="M17.64 9.5c-1.16-1.58-2.85-2.1-4.23-1.3-1.07.62-1.8 1.85-1.8 3.3s.73 2.68 1.8 3.3c1.38.8 3.07.28 4.23-1.3.63-1.03 1.36-2.5 1.36-2.5s-.73-1.47-1.36-2.5zM6.36 9.5c1.16-1.58 2.85-2.1 4.23-1.3 1.07.62 1.8 1.85 1.8 3.3s-.73 2.68-1.8 3.3c-1.38.8-3.07.28-4.23-1.3-.63-1.03-1.36-2.5-1.36-2.5s.73-1.47 1.36-2.5z"/>
        </svg>
      ), 
      color: "#0668E1", 
      status: "Coming Soon" 
    },
    { 
      name: "TikTok", 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ), 
      color: "#000000", 
      status: "Coming Soon" 
    },
    { 
      name: "Google Ads", 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
           <path d="M21.4 14.4l-7.9-13.7c-.8-1.3-2.6-1.3-3.4 0L2.2 14.4c-.8 1.4.2 3.1 1.8 3.1h15.7c1.6 0 2.6-1.7 1.7-3.1zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
        </svg>
      ), 
      color: "#4285F4", 
      status: "Coming Soon" 
    },
    { 
      name: "Etsy", 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M20 8h-3.5c-.3 0-.5.2-.5.5v2c0 .3.2.5.5.5H20c.3 0 .5.2.5.5v2c0 .3-.2.5-.5.5h-3.5c-.3 0-.5.2-.5.5v2c0 .3.2.5.5.5H20c.3 0 .5.2.5.5v2c0 .3-.2.5-.5.5H9c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h11c.3 0 .5.2.5.5v2c0 .3-.2.5-.5.5z"/>
        </svg>
      ), 
      color: "#F1641E", 
      status: "Coming Soon" 
    },
    { 
      name: "Printful", 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2L2 19h20L12 2zm0 3.5L17.5 17h-11L12 5.5z"/>
          <path d="M12 10l-2 4h4l-2-4z" fillOpacity="0.5"/>
        </svg>
      ), 
      color: "#E4383A", 
      status: "Coming Soon" 
    },
    { 
      name: "Printify", 
      icon: (props: any) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      ), 
      color: "#C3FA37", 
      status: "Coming Soon" 
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Connected Apps</h2>
        <p className="text-sm text-[#71717A] mt-1">Integrate with your favorite platforms (Coming Soon)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {apps.map((app, i) => (
          <div key={i} className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-3 right-3">
              <ExternalLink className="h-4 w-4 text-[#71717A] opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${app.color}15` }}
            >
              <app.icon className="h-8 w-8" style={{ color: app.color }} />
            </div>
            
            <h3 className="text-lg font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-1">{app.name}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F4F4F5] dark:bg-[#1F1F25] text-[#71717A] border border-[#E4E4E7] dark:border-[#2A2A30]">
              {app.status}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StorageSettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Storage</h2>
        <p className="text-sm text-[#71717A] mt-1">Manage your cloud storage and local cache</p>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Cloud Storage</h3>
          <span className="text-xs font-medium text-[#7C3AED]">Upgrade Plan</span>
        </div>
        
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-[#71717A]">12.5 GB used</span>
          <span className="text-[#18181B] dark:text-[#FAFAFA] font-medium">50 GB total</span>
        </div>
        <div className="w-full h-2 bg-[#F4F4F5] dark:bg-[#27272A] rounded-full overflow-hidden mb-6">
          <div className="h-full bg-[#7C3AED] w-[25%] rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30]">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-[#7C3AED]" />
              <span className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">Images</span>
            </div>
            <span className="text-xl font-bold text-[#18181B] dark:text-[#FAFAFA]">8.2 GB</span>
          </div>
          <div className="p-4 rounded-xl bg-[#F4F4F5] dark:bg-[#1A1A1F] border border-[#E4E4E7] dark:border-[#2A2A30]">
            <div className="flex items-center gap-2 mb-2">
              <FolderArchive className="h-4 w-4 text-[#EC4899]" />
              <span className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">Archives</span>
            </div>
            <span className="text-xl font-bold text-[#18181B] dark:text-[#FAFAFA]">4.3 GB</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6">
         <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-2">Local Cache</h3>
         <p className="text-sm text-[#71717A] mb-4">Clear temporary files to free up space on your device.</p>
         <Button variant="outline" className="text-[#DC2626] hover:text-[#DC2626] border-[#DC2626]/20 hover:bg-[#DC2626]/5">
           Clear Cache (142 MB)
         </Button>
      </div>
    </motion.div>
  );
}

function ExportDataSettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Export Data</h2>
        <p className="text-sm text-[#71717A] mt-1">Download a copy of your data</p>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 bg-[#F4F4F5] dark:bg-[#1F1F25] rounded-full flex items-center justify-center">
            <Download className="h-6 w-6 text-[#18181B] dark:text-[#FAFAFA]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Download your archive</h3>
            <p className="text-sm text-[#71717A]">Get a copy of your creations, prompts, and settings.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-[#E4E4E7] dark:border-[#2A2A30] rounded-xl">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#71717A]" />
              <div className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">JSON Data (Prompts & Settings)</div>
            </div>
            <Button variant="outline" size="sm">Download</Button>
          </div>
          <div className="flex items-center justify-between p-3 border border-[#E4E4E7] dark:border-[#2A2A30] rounded-xl">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-[#71717A]" />
              <div className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">All Generated Images (ZIP)</div>
            </div>
            <Button variant="outline" size="sm">Request Archive</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DeleteAccountSettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-[22px] font-semibold text-[#DC2626]">Delete Account</h2>
        <p className="text-sm text-[#71717A] mt-1">Permanently remove your account and data</p>
      </div>

      <div className="bg-[#FEF2F2] dark:bg-[#7F1D1D]/10 border border-[#FECACA] dark:border-[#7F1D1D]/30 rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-[#DC2626] shrink-0" />
          <div>
            <h3 className="text-[15px] font-bold text-[#DC2626] mb-2">Warning: This action is irreversible</h3>
            <p className="text-sm text-[#B91C1C] dark:text-[#FCA5A5] leading-relaxed mb-4">
              If you delete your account, you will lose access to all your generated images, projects, settings, and credits. This action cannot be undone.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-[#DC2626] hover:bg-[#B91C1C]">
                  Delete my account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-[#DC2626] hover:bg-[#B91C1C]">Delete Account</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
