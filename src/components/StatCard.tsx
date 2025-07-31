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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <div className={`flex items-center space-x-1 ${
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend === 'up' ? (
            <ArrowUpIcon className="h-3 w-3" />
          ) : (
            <ArrowDownIcon className="h-3 w-3" />
          )}
          <span className="text-xs font-medium">{change}</span>
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard; 