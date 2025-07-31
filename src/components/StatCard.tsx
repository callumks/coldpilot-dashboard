import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend }) => {
  return (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-white/[0.05] rounded-2xl p-4 hover:bg-gray-800/60 hover:border-white/[0.08] transition-all duration-300 group cursor-pointer h-full flex flex-col justify-center">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-2xl font-semibold text-white tracking-tight">
            {value}
          </p>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg flex-shrink-0 ${
          trend === 'up' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {trend === 'up' ? (
            <ArrowUpIcon className="h-3 w-3" />
          ) : (
            <ArrowDownIcon className="h-3 w-3" />
          )}
          <span className="text-xs font-medium">{change}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard; 