'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const pathname = usePathname();
  
  const navigationItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Conversations', icon: ChatBubbleLeftRightIcon, path: '/conversations' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/analytics' },
    { name: 'Contacts', icon: UsersIcon, path: '/contacts' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-5">
        <a href="/dashboard" className="flex items-center">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">C</span>
          </div>
          <span className="ml-3 text-lg font-medium text-white">
            Coldpilot
          </span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <a
              key={item.name}
              href={item.path}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-0 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.name}
            </a>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-xs font-medium text-gray-300">JD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-200">John Doe</p>
            <p className="text-xs text-gray-500">john@coldpilot.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 