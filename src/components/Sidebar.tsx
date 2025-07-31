'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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

  return (
    <aside className="w-64 bg-[#111] border-r border-gray-800 p-4 flex flex-col gap-6">
      {/* Coldpilot Logo */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src="/coldpilot-logo-dark-mode.png"
            alt="Coldpilot Logo"
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        <div className="relative h-6 flex-1">
          <Image
            src="/coldpilot-wm-dark-mode.png"
            alt="Coldpilot"
            fill
            className="object-contain object-left"
          />
        </div>
      </div>

      <nav className="flex flex-col gap-3 text-gray-400">
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