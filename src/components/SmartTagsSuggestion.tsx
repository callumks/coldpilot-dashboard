'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';

interface SmartTagsSuggestionProps {
  contact: {
    company?: string;
    position?: string;
    email?: string;
  };
  existingTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxSuggestions?: number;
}

const SmartTagsSuggestion: React.FC<SmartTagsSuggestionProps> = ({
  contact,
  existingTags,
  onTagsChange,
  maxSuggestions = 5
}) => {
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const generateSmartTags = (): string[] => {
    const tags: string[] = [];
    
    // Company-based tags
    if (contact.company) {
      const company = contact.company.toLowerCase();
      
      // Industry tags
      if (company.includes('tech') || company.includes('software') || company.includes('ai')) {
        tags.push('Tech', 'Software');
      }
      if (company.includes('health') || company.includes('medical')) {
        tags.push('Healthcare', 'Medical');
      }
      if (company.includes('finance') || company.includes('bank') || company.includes('fintech')) {
        tags.push('Finance', 'FinTech');
      }
      if (company.includes('market') || company.includes('agency')) {
        tags.push('Marketing', 'Agency');
      }
      if (company.includes('consult')) {
        tags.push('Consulting', 'Services');
      }
      if (company.includes('startup') || company.includes('labs')) {
        tags.push('Startup', 'Early-Stage');
      }
      if (company.includes('enterprise') || company.includes('corp')) {
        tags.push('Enterprise', 'Large Company');
      }
      if (company.includes('ecommerce') || company.includes('retail')) {
        tags.push('E-commerce', 'Retail');
      }
      if (company.includes('data') || company.includes('analytics')) {
        tags.push('Data', 'Analytics');
      }
      if (company.includes('cloud') || company.includes('saas')) {
        tags.push('SaaS', 'Cloud');
      }
    }

    // Position-based tags
    if (contact.position) {
      const position = contact.position.toLowerCase();
      
      // Seniority tags
      if (position.includes('ceo') || position.includes('founder') || position.includes('president')) {
        tags.push('C-Level', 'Decision Maker', 'Founder');
      }
      if (position.includes('vp') || position.includes('vice president')) {
        tags.push('VP', 'Executive');
      }
      if (position.includes('director') || position.includes('head of')) {
        tags.push('Director', 'Management');
      }
      if (position.includes('manager') || position.includes('lead')) {
        tags.push('Manager', 'Team Lead');
      }
      if (position.includes('senior')) {
        tags.push('Senior', 'Experienced');
      }
      if (position.includes('junior') || position.includes('associate')) {
        tags.push('Junior', 'Entry Level');
      }
      
      // Department tags
      if (position.includes('engineer') || position.includes('developer') || position.includes('technical')) {
        tags.push('Engineering', 'Technical');
      }
      if (position.includes('marketing') || position.includes('growth')) {
        tags.push('Marketing', 'Growth');
      }
      if (position.includes('sales') || position.includes('business development')) {
        tags.push('Sales', 'Business Development');
      }
      if (position.includes('product')) {
        tags.push('Product', 'Product Management');
      }
      if (position.includes('design') || position.includes('ux') || position.includes('ui')) {
        tags.push('Design', 'UX/UI');
      }
      if (position.includes('data') || position.includes('analyst')) {
        tags.push('Data', 'Analytics');
      }
      if (position.includes('hr') || position.includes('people')) {
        tags.push('HR', 'People Operations');
      }
      if (position.includes('finance') || position.includes('accounting')) {
        tags.push('Finance', 'Accounting');
      }
      if (position.includes('operations') || position.includes('ops')) {
        tags.push('Operations', 'Business Ops');
      }
    }

    // Email domain tags
    if (contact.email) {
      const domain = contact.email.split('@')[1]?.toLowerCase();
      if (domain) {
        if (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('hotmail')) {
          tags.push('Personal Email');
        } else {
          tags.push('Business Email');
        }
      }
    }

    // Remove duplicates and filter out existing tags
    const uniqueTags = [...new Set(tags)]
      .filter(tag => !existingTags.includes(tag))
      .slice(0, maxSuggestions);

    return uniqueTags;
  };

  useEffect(() => {
    const smartTags = generateSmartTags();
    setSuggestedTags(smartTags);
  }, [contact, existingTags]);

  const handleAddSuggested = (tag: string) => {
    const newTags = [...existingTags, tag];
    onTagsChange(newTags);
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  const handleAddCustom = () => {
    if (customTag.trim() && !existingTags.includes(customTag.trim())) {
      const newTags = [...existingTags, customTag.trim()];
      onTagsChange(newTags);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = existingTags.filter(tag => tag !== tagToRemove);
    onTagsChange(newTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing Tags */}
      {existingTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full text-xs"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-blue-100 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Smart Suggestions */}
      {showSuggestions && suggestedTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Smart Suggestions</span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddSuggested(tag)}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-xs hover:bg-purple-500/20 transition-colors group"
              >
                <Plus className="h-3 w-3 group-hover:scale-110 transition-transform" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Tag Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add custom tag..."
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <button
          onClick={handleAddCustom}
          disabled={!customTag.trim()}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {!showSuggestions && suggestedTags.length > 0 && (
        <button
          onClick={() => setShowSuggestions(true)}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Show {suggestedTags.length} smart suggestions
        </button>
      )}
    </div>
  );
};

export default SmartTagsSuggestion; 