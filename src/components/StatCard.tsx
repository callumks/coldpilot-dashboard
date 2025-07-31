import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description?: string; // New prop for tooltip descriptions
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, description }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative bg-gray-800/40 backdrop-blur-sm border border-white/[0.05] rounded-2xl p-4 hover:bg-gray-800/60 hover:border-white/[0.08] transition-all duration-300 group cursor-pointer h-full flex flex-col justify-center">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {title}
            </p>
            {description && (
              <div className="relative">
                <Info 
                  className="h-3 w-3 text-gray-500 hover:text-gray-300 cursor-help transition-colors"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 w-48 border border-gray-700">
                    {description}
                    <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            )}
          </div>
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
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          <span className="text-xs font-medium">{change}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard; 