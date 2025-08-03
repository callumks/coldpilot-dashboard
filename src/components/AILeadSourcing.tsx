'use client';

import React, { useState } from 'react';
import { Search, Zap, Target, CheckCircle, AlertCircle } from 'lucide-react';

interface AILeadSourcingProps {
  onLeadsSourced?: (results: any) => void;
}

const AILeadSourcing: React.FC<AILeadSourcingProps> = ({ onLeadsSourced }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    industry: '',
    companySize: '',
    jobTitles: [''],
    location: '',
    leadCount: 50,
    sources: ['apollo', 'linkedin']
  });
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJobTitleChange = (index: number, value: string) => {
    const newJobTitles = [...formData.jobTitles];
    newJobTitles[index] = value;
    setFormData(prev => ({ ...prev, jobTitles: newJobTitles }));
  };

  const addJobTitle = () => {
    setFormData(prev => ({ 
      ...prev, 
      jobTitles: [...prev.jobTitles, '']
    }));
  };

  const removeJobTitle = (index: number) => {
    if (formData.jobTitles.length > 1) {
      const newJobTitles = formData.jobTitles.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, jobTitles: newJobTitles }));
    }
  };

  const handleSourceLead = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/ai/lead-sourcing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jobTitles: formData.jobTitles.filter(title => title.trim())
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to source leads');
      }

      setResults(data.results);
      onLeadsSourced?.(data.results);
      
    } catch (err) {
      console.error('AI Lead Sourcing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to source leads');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.industry.trim() && 
                     formData.jobTitles.some(title => title.trim()) &&
                     formData.leadCount > 0;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium"
      >
        <Zap className="h-4 w-4" />
        AI Lead Sourcing
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Lead Sourcing</h2>
              <p className="text-sm text-gray-400">Let AI find your perfect prospects</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Industry *
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              placeholder="e.g., SaaS, E-commerce, Healthcare"
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Job Titles */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Job Titles *
            </label>
            {formData.jobTitles.map((title, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleJobTitleChange(index, e.target.value)}
                  placeholder="e.g., CEO, VP of Sales, Marketing Director"
                  className="flex-1 px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
                {formData.jobTitles.length > 1 && (
                  <button
                    onClick={() => removeJobTitle(index)}
                    className="px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addJobTitle}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              + Add another job title
            </button>
          </div>

          {/* Company Size & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Size
              </label>
              <select
                value={formData.companySize}
                onChange={(e) => handleInputChange('companySize', e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="" className="bg-[#1a1a1a]">Any size</option>
                <option value="1-10" className="bg-[#1a1a1a]">1-10 employees</option>
                <option value="11-50" className="bg-[#1a1a1a]">11-50 employees</option>
                <option value="51-200" className="bg-[#1a1a1a]">51-200 employees</option>
                <option value="201-1000" className="bg-[#1a1a1a]">201-1000 employees</option>
                <option value="1000+" className="bg-[#1a1a1a]">1000+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., United States, California, San Francisco"
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Lead Count */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Leads
            </label>
            <input
              type="number"
              value={formData.leadCount}
              onChange={(e) => handleInputChange('leadCount', parseInt(e.target.value))}
              min="1"
              max="500"
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 500 leads per search</p>
          </div>

          {/* Data Sources */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Data Sources
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sources.includes('apollo')}
                  onChange={(e) => {
                    const newSources = e.target.checked 
                      ? [...formData.sources, 'apollo']
                      : formData.sources.filter(s => s !== 'apollo');
                    handleInputChange('sources', newSources);
                  }}
                  className="rounded border-gray-600 bg-white/[0.02] text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-300">Apollo.io</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.sources.includes('linkedin')}
                  onChange={(e) => {
                    const newSources = e.target.checked 
                      ? [...formData.sources, 'linkedin']
                      : formData.sources.filter(s => s !== 'linkedin');
                    handleInputChange('sources', newSources);
                  }}
                  className="rounded border-gray-600 bg-white/[0.02] text-purple-500 focus:ring-purple-500"
                />
                <span className="text-gray-300">LinkedIn Sales Navigator</span>
              </label>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">Leads Successfully Sourced!</span>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• {results.leadsFound} leads found</p>
              <p>• {results.leadsSaved} new leads added to your contacts</p>
              <p>• Sources: Apollo ({results.sources.apollo}), LinkedIn ({results.sources.linkedin})</p>
              <p>• All leads AI-scored for relevance</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-3 bg-white/[0.02] border border-white/[0.08] text-gray-300 rounded-lg hover:bg-white/[0.05] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSourceLead}
            disabled={!isFormValid || isLoading || formData.sources.length === 0}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sourcing Leads...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Source {formData.leadCount} Leads
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AILeadSourcing;