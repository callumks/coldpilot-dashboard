'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Target, Users, Calendar, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../src/components/DashboardLayout';
import StatCard from '../../src/components/StatCard';

interface Metric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description: string;
}

interface Benchmark {
  metric: string;
  yourValue: number;
  industryAvg: number;
  isAbove: boolean;
}

interface TopCampaign {
  name: string;
  openRate: number;
  replyRate: number;
  emailsSent: number;
}

const Analytics: React.FC = () => {
  const [chartView, setChartView] = useState<'bar' | 'line'>('bar');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [topCampaign, setTopCampaign] = useState<TopCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState('Last 30 days');

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ period: selectedPeriod });
      const response = await fetch(`/api/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
        setBenchmarks(data.benchmarks);
        setTopCampaign(data.topCampaign);
        setPeriodLabel(data.periodLabel);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-medium text-white mb-3 tracking-tight">Analytics</h1>
            <p className="text-gray-400 text-base font-light">
              Track your outreach performance and optimize your campaigns
            </p>
            {!loading && <p className="text-sm text-gray-500 mt-2">{periodLabel}</p>}
          </div>
          
          {/* Time Period Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-300">Period:</span>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              disabled={loading}
              className="px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm disabled:opacity-50"
            >
              <option value="7d" className="bg-[#1a1a1a]">Last 7 days</option>
              <option value="30d" className="bg-[#1a1a1a]">Last 30 days</option>
              <option value="90d" className="bg-[#1a1a1a]">Last 90 days</option>
              <option value="1y" className="bg-[#1a1a1a]">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))
        ) : error ? (
          <div className="col-span-3 bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          metrics.map((metric, index) => (
            <StatCard key={index} {...metric} />
          ))
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Industry Benchmarks */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Industry Benchmarks</h3>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse flex items-center justify-between p-4 bg-white/[0.02] rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                    <div className="h-3 bg-gray-700 rounded w-32"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-700 rounded w-16"></div>
                    <div className="h-4 bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              ))
            ) : (
              benchmarks.map((benchmark, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">{benchmark.metric}</h4>
                    <p className="text-sm text-gray-400">vs. Industry Average</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">{benchmark.yourValue}%</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        benchmark.isAbove 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {benchmark.isAbove ? '↗' : '↘'} {benchmark.industryAvg}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Performing Campaign */}
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-medium text-white">Top Performing Campaign</h3>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-700 rounded"></div>
                <div className="h-16 bg-gray-700 rounded"></div>
              </div>
            </div>
          ) : topCampaign ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-white text-lg">{topCampaign.name}</h4>
                <p className="text-sm text-gray-400">
                  {topCampaign.emailsSent.toLocaleString()} emails sent
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/[0.02] rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{topCampaign.openRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-400">Open Rate</p>
                </div>
                <div className="text-center p-4 bg-white/[0.02] rounded-lg">
                  <p className="text-2xl font-bold text-green-400">{topCampaign.replyRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-400">Reply Rate</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No campaigns yet</p>
              <p className="text-sm text-gray-500 mt-2">Create a campaign to see performance data</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart Toggle */}
      <div className="bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Performance Over Time</h3>
          <div className="flex items-center gap-2 p-1 bg-white/[0.02] rounded-lg">
            <button
              onClick={() => setChartView('bar')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartView === 'bar'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartView('line')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartView === 'line'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chart visualization coming soon</p>
            <p className="text-sm mt-2">We&apos;re building advanced analytics charts</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

// Prevent static generation for this page since it uses Clerk auth
export const dynamic = 'force-dynamic';