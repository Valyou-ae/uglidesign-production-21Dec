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
  Image as ImageIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/sidebar";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("Profile");
  const { toast } = useToast();

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
        { name: "Language & Region", icon: Globe },
      ]
    },
    {
      label: "INTEGRATIONS",
      items: [
        { name: "Connected Apps", icon: Plug },
        { name: "API Keys", icon: Key },
        { name: "Webhooks", icon: Webhook },
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
      
      <main className="flex-1 flex h-full overflow-hidden bg-[#F8F8F8] dark:bg-[#0A0A0B] text-[#18181B] dark:text-[#FAFAFA]">
        {/* Settings Navigation Panel */}
        <div className="w-[260px] flex-shrink-0 border-r border-[#E4E4E7] dark:border-[#1F1F23] bg-[#F8F8F8] dark:bg-[#0A0A0B] h-full overflow-y-auto py-8">
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
                      onClick={() => setActiveTab(item.name)}
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
        <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#09090B] p-8 md:px-12">
          <div className="max-w-[720px] mx-auto pb-20">
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

      {/* Active Sessions */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA]">Active Sessions</h3>
          <button className="text-[13px] text-[#DC2626] hover:underline">Sign out all</button>
        </div>
        
        <div className="space-y-0">
          {[
            { icon: Monitor, name: "MacBook Pro - Chrome", loc: "San Francisco, CA · Active now", current: true },
            { icon: Smartphone, name: "iPhone 15 - Safari", loc: "San Francisco, CA · Last active 2h ago", current: false },
            { icon: Monitor, name: "Windows PC - Firefox", loc: "Unknown · Last active 5 days ago", current: false }
          ].map((session, i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b border-[#F4F4F5] dark:border-[#1F1F23] last:border-0">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-[#F4F4F5] dark:bg-[#1F1F25] rounded-full flex items-center justify-center">
                  <session.icon className="h-5 w-5 text-[#71717A]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">{session.name}</span>
                    {session.current && (
                      <span className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#7C3AED] text-[10px] font-bold rounded-full uppercase">Current</span>
                    )}
                  </div>
                  <div className="text-xs text-[#71717A] dark:text-[#52525B] mt-0.5">{session.loc}</div>
                </div>
              </div>
              <button className="text-[13px] text-[#71717A] hover:text-[#DC2626] transition-colors">Sign out</button>
            </div>
          ))}
        </div>
      </div>

      {/* Login History */}
      <div className="bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#1F1F23] rounded-2xl p-6">
        <h3 className="text-[15px] font-semibold text-[#18181B] dark:text-[#FAFAFA] mb-4">Recent Login Activity</h3>
        <div className="overflow-hidden rounded-lg border border-[#E4E4E7] dark:border-[#1F1F23]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F4F4F5] dark:bg-[#1A1A1F] text-[#71717A] text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#1F1F23]">
              <tr>
                <td className="px-4 py-3 text-[#18181B] dark:text-[#FAFAFA]">Dec 15, 2:30 PM</td>
                <td className="px-4 py-3 text-[#71717A] dark:text-[#A1A1AA]">San Francisco, CA</td>
                <td className="px-4 py-3 text-[#71717A] dark:text-[#A1A1AA]">Chrome on Mac</td>
                <td className="px-4 py-3"><span className="text-[#16A34A] text-xs font-medium bg-[#16A34A]/10 px-2 py-1 rounded-full">Success</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-[#18181B] dark:text-[#FAFAFA]">Dec 14, 9:15 AM</td>
                <td className="px-4 py-3 text-[#71717A] dark:text-[#A1A1AA]">San Francisco, CA</td>
                <td className="px-4 py-3 text-[#71717A] dark:text-[#A1A1AA]">Safari on iPhone</td>
                <td className="px-4 py-3"><span className="text-[#16A34A] text-xs font-medium bg-[#16A34A]/10 px-2 py-1 rounded-full">Success</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-[#18181B] dark:text-[#FAFAFA]">Dec 13, 11:00 PM</td>
                <td className="px-4 py-3 text-[#71717A] dark:text-[#A1A1AA]">Unknown</td>
                <td className="px-4 py-3 text-[#71717A] dark:text-[#A1A1AA]">Firefox on Windows</td>
                <td className="px-4 py-3"><span className="text-[#DC2626] text-xs font-medium bg-[#DC2626]/10 px-2 py-1 rounded-full">Blocked</span></td>
              </tr>
            </tbody>
          </table>
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
