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
    <div className="bg-[#121826] border border-gray-800/50 rounded-xl p-6 shadow-md hover:scale-[1.01] hover:shadow-lg transition-all duration-150 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">{title}</h3>
        <div className={`flex items-center space-x-1 ${
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend === 'up' ? (
            <ArrowUpIcon className="h-4 w-4" />
          ) : (
            <ArrowDownIcon className="h-4 w-4" />
          )}
          <span className="text-sm font-semibold">{change}</span>
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default StatCard; 