'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Home,
  MessageCircle,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

const navigationItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: MessageCircle, label: "Conversations", href: "/conversations" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Users, label: "Contacts", href: "/contacts" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="fixed left-0 top-0 w-64 bg-[#111] border-r border-gray-800 p-4 flex flex-col h-screen z-40">
      {/* Coldpilot Logo */}
      <div className="mb-4 flex-shrink-0">
        <div className="relative h-6">
          <Image
            src="/coldpilot-wm-dark-mode.png"
            alt="Coldpilot"
            fill
            className="object-contain object-left"
          />
        </div>
      </div>

      {/* Navigation - Scrollable if content overflows */}
      <nav className="flex flex-col gap-3 text-gray-400 flex-1 overflow-y-auto mb-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <SidebarLink 
              key={item.href}
              icon={<Icon size={18} />} 
              label={item.label} 
              href={item.href}
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* User Profile Section - Always visible at bottom */}
      {user && (
        <div className="border-t border-gray-800 pt-4 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <UserButton 
              appearance={{
                variables: {
                  colorPrimary: '#3b82f6',
                  colorBackground: '#111111',
                  colorInputBackground: '#1a1a1a',
                  colorInputText: '#ffffff',
                  colorText: '#ffffff',
                  colorTextSecondary: '#9ca3af',
                  colorShimmer: '#374151',
                  colorSuccess: '#10b981',
                  colorWarning: '#f59e0b',
                  colorDanger: '#ef4444',
                  borderRadius: '0.75rem',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopover: "bg-[#111111] border border-gray-800 shadow-2xl",
                  userButtonPopoverCard: "bg-[#111111]",
                  userButtonPopoverActions: "bg-[#111111]",
                  userButtonPopoverActionButton: "text-gray-300 hover:text-white hover:bg-white/5",
                  userButtonPopoverActionButtonText: "text-gray-300",
                  userButtonPopoverFooter: "bg-[#111111] border-t border-gray-800",
                  modalContent: "bg-[#111111] border border-gray-800",
                  modalCloseButton: "text-gray-400 hover:text-white",
                  card: "bg-[#111111] border border-gray-800 shadow-2xl",
                  navbar: "bg-[#0a0a0a] border-r border-gray-800",
                  pageScrollBox: "bg-[#111111]",
                  page: "bg-[#111111]",
                  profileSectionTitle: "text-white",
                  profileSectionTitleText: "text-white",
                  profileSectionContent: "text-gray-300",
                  formFieldLabel: "text-gray-300 font-medium",
                  formFieldInput: "bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500 focus:border-blue-500",
                  formButtonPrimary: "bg-blue-500 hover:bg-blue-600 text-white font-medium",
                  formButtonSecondary: "border-gray-700 text-gray-300 hover:bg-white/5",
                  badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  alert: "bg-gray-800 border-gray-700 text-gray-300",
                  alertText: "text-gray-300",
                }
              }}
              userProfileMode="modal"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.fullName || user.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-gray-400">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SidebarLink({ 
  icon, 
  label, 
  href, 
  isActive 
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
        isActive 
          ? 'bg-white/10 text-white border border-white/20' 
          : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
} 