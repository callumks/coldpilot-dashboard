'use client';

import React from 'react';
import { Flame, Thermometer, Snowflake } from 'lucide-react';

interface LeadScoreIndicatorProps {
  contact: {
    company?: string;
    position?: string;
    email: string;
    source?: string;
    lastContacted?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

type LeadScore = 'HOT' | 'WARM' | 'COLD';

const LeadScoreIndicator: React.FC<LeadScoreIndicatorProps> = ({ contact, size = 'sm' }) => {
  
  const calculateLeadScore = (): LeadScore => {
    let score = 0;
    
    // Company scoring
    if (contact.company) {
      const company = contact.company.toLowerCase();
      
      // High-value company indicators
      if (company.includes('inc') || company.includes('corp') || company.includes('ltd') || company.includes('llc')) {
        score += 2;
      }
      
      // Tech/SaaS companies (high-value for cold outreach)
      if (company.includes('tech') || company.includes('software') || company.includes('ai') || 
          company.includes('data') || company.includes('cloud') || company.includes('digital')) {
        score += 3;
      }
      
      // Startup indicators
      if (company.includes('startup') || company.includes('labs') || company.includes('studio')) {
        score += 2;
      }
    }
    
    // Position scoring
    if (contact.position) {
      const position = contact.position.toLowerCase();
      
      // Decision makers (high value)
      if (position.includes('ceo') || position.includes('founder') || position.includes('president') || 
          position.includes('director') || position.includes('vp') || position.includes('head of') ||
          position.includes('chief') || position.includes('owner')) {
        score += 4;
      }
      
      // Managers (medium-high value)
      if (position.includes('manager') || position.includes('lead') || position.includes('senior')) {
        score += 2;
      }
      
      // Technical roles (good for SaaS)
      if (position.includes('engineer') || position.includes('developer') || position.includes('architect') ||
          position.includes('devops') || position.includes('technical')) {
        score += 2;
      }
      
      // Marketing/Sales (good for outreach tools)
      if (position.includes('marketing') || position.includes('sales') || position.includes('growth') ||
          position.includes('business development')) {
        score += 3;
      }
    }
    
    // Email domain scoring
    const domain = contact.email.split('@')[1]?.toLowerCase();
    if (domain) {
      // Generic email providers (lower score)
      if (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('hotmail') || 
          domain.includes('outlook')) {
        score -= 1;
      } else {
        // Company email (higher score)
        score += 1;
      }
    }
    
    // Source scoring - premium data sources get bonus points
    if (contact.source === 'LINKEDIN' || contact.source === 'APOLLO') {
      score += 2; // Premium data sources typically higher quality
    } else if (contact.source === 'MANUAL') {
      score += 1; // Manually added = more intentional
    }
    
    // Recent activity bonus
    if (contact.lastContacted) {
      const lastContact = new Date(contact.lastContacted);
      const daysSince = (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSince <= 7) {
        score += 2; // Recent interaction
      } else if (daysSince <= 30) {
        score += 1;
      }
    }
    
    // Classification
    if (score >= 6) return 'HOT';
    if (score >= 3) return 'WARM';
    return 'COLD';
  };

  const leadScore = calculateLeadScore();
  
  const getScoreConfig = () => {
    switch (leadScore) {
      case 'HOT':
        return {
          icon: Flame,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          label: 'Hot',
          description: 'High-value prospect'
        };
      case 'WARM':
        return {
          icon: Thermometer,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          label: 'Warm',
          description: 'Good potential'
        };
      case 'COLD':
        return {
          icon: Snowflake,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          label: 'Cold',
          description: 'Needs nurturing'
        };
    }
  };

  const config = getScoreConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getTooltipText = () => {
    const factors = [];
    
    // Build tooltip based on scoring factors
    if (contact.company) {
      const company = contact.company.toLowerCase();
      if (company.includes('tech') || company.includes('software') || company.includes('ai')) {
        factors.push('✅ Tech company (+3 pts)');
      }
      if (company.includes('inc') || company.includes('corp')) {
        factors.push('✅ Established business (+2 pts)');
      }
    }
    
    if (contact.position) {
      const position = contact.position.toLowerCase();
      if (position.includes('ceo') || position.includes('founder') || position.includes('president')) {
        factors.push('✅ Decision maker (+4 pts)');
      } else if (position.includes('director') || position.includes('vp')) {
        factors.push('✅ Senior leadership (+4 pts)');
      }
    }
    
    const domain = contact.email.split('@')[1]?.toLowerCase();
    if (domain && !domain.includes('gmail') && !domain.includes('yahoo') && !domain.includes('hotmail')) {
      factors.push('✅ Business email (+1 pt)');
    }
    
    if (contact.source === 'LINKEDIN' || contact.source === 'APOLLO') {
      factors.push('✅ Premium data source (+2 pts)');
    }

    return `${config.description}\n\nScoring factors:\n${factors.join('\n') || 'Basic scoring applied'}`;
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${sizeClasses[size]} cursor-help`}
      title={getTooltipText()}
    >
      <Icon className={`${iconSizes[size]} ${config.color}`} />
      <span className={`font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

export default LeadScoreIndicator; 