'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Users, Mail, Clock, Target, Settings, 
  ArrowRight, ArrowLeft, Check, AlertCircle, 
  Flame, Thermometer, Snowflake, Tag, Calendar,
  Send, Pause, Edit3, Trash2, Zap
} from 'lucide-react';

interface CampaignCreationWizardProps {
  onClose: () => void;
  onCampaignCreated: (campaign: any) => void;
}

interface CampaignStep {
  id: string;
  stepNumber: number;
  name: string;
  delayDays: number;
  isActive: boolean;
  subject: string;
  body: string;
}

interface CampaignForm {
  // Basic Info
  name: string;
  description: string;
  channel: 'EMAIL' | 'SMS' | 'TELEGRAM';
  
  // Targeting
  targetTags: string[];
  minLeadScore: 'ALL' | 'WARM' | 'HOT';
  excludePrevious: boolean;
  
  // Scheduling
  dailySendLimit: number;
  sendingWindow: {
    start: string;
    end: string;
    weekdaysOnly: boolean;
  };
  timezone: string;
  
  // Steps
  steps: CampaignStep[];

  // Test mode (do not email real leads)
  testModeEnabled?: boolean;
  testEmail?: string;
}

const CampaignCreationWizard: React.FC<CampaignCreationWizardProps> = ({
  onClose,
  onCampaignCreated
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState({ count: 0, contacts: [] });
  const [showAIEmailGenerator, setShowAIEmailGenerator] = useState(false);
  const [currentStepIdForAI, setCurrentStepIdForAI] = useState<string | null>(null);
  const [aiEmailData, setAIEmailData] = useState({
    campaignGoal: '',
    targetIndustry: '',
    tone: 'professional',
    emailType: 'initial_outreach',
    customInstructions: ''
  });
  
  const [formData, setFormData] = useState<CampaignForm>({
    name: '',
    description: '',
    channel: 'EMAIL',
    targetTags: [],
    minLeadScore: 'ALL',
    excludePrevious: true,
    dailySendLimit: 150,
    sendingWindow: {
      start: '09:00',
      end: '17:00',
      weekdaysOnly: true
    },
    timezone: 'UTC',
    steps: [
      {
        id: 'step-1',
        stepNumber: 1,
        name: 'Initial Outreach',
        delayDays: 0,
        isActive: true,
        subject: '',
        body: ''
      }
    ],
    testModeEnabled: false,
    testEmail: ''
  });

  // Prefill name/description when invoked from Edit
  useEffect(() => {
    const existing: any = (window as any).__editCampaign;
    if (existing && existing.id) {
      setFormData(prev => ({
        ...prev,
        name: existing.name || prev.name,
        description: existing.description || prev.description,
      }));
    }
  }, []);

  // Mock contact tags for targeting
  const availableTags = [
    'Tech', 'SaaS', 'Startup', 'Enterprise', 'Founder', 'CEO', 'CTO', 'VP Sales',
    'Director', 'Manager', 'Marketing', 'Engineering', 'C-Level', 'Decision Maker'
  ];

  // Update audience preview when targeting changes
  useEffect(() => {
    updateAudiencePreview();
  }, [formData.targetTags, formData.minLeadScore, formData.excludePrevious]);

  const updateAudiencePreview = async () => {
    // In real implementation, this would call an API
    // For now, simulate audience calculation
    let baseCount = 450; // Mock total contacts
    
    if (formData.targetTags.length > 0) {
      baseCount = Math.floor(baseCount * 0.3); // Tag filtering reduces audience
    }
    
    if (formData.minLeadScore === 'WARM') {
      baseCount = Math.floor(baseCount * 0.4);
    } else if (formData.minLeadScore === 'HOT') {
      baseCount = Math.floor(baseCount * 0.15);
    }
    
    if (formData.excludePrevious) {
      baseCount = Math.floor(baseCount * 0.8); // Exclude previously contacted
    }

    setAudiencePreview({ count: baseCount, contacts: [] });
  };

  const addCampaignStep = () => {
    const newStep: CampaignStep = {
      id: `step-${formData.steps.length + 1}`,
      stepNumber: formData.steps.length + 1,
      name: `Follow-up ${formData.steps.length}`,
      delayDays: 3,
      isActive: true,
      subject: '',
      body: ''
    };
    
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const updateStep = (stepId: string, updates: Partial<CampaignStep>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  };

  // AI Email Generation Function
  const generateAIEmailForStep = (stepId: string) => {
    setCurrentStepIdForAI(stepId);
    setShowAIEmailGenerator(true);
  };

  const handleAIEmailGeneration = async () => {
    if (!currentStepIdForAI) return;

    try {
      const response = await fetch('/api/ai/email-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiEmailData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const content = data.emailContent;
        // Update the specific step with AI-generated content
        updateStep(currentStepIdForAI, {
          subject: content.subjectLines[0], // Use the first subject line
          body: content.emailBody
        });
        setShowAIEmailGenerator(false);
        setCurrentStepIdForAI(null);
      } else {
        alert(data.error || 'Failed to generate email content');
      }
    } catch (error) {
      console.error('AI email generation error:', error);
      alert('Failed to generate email content');
    }
  };

  const removeStep = (stepId: string) => {
    if (formData.steps.length <= 1) return; // Must have at least one step
    
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
        .map((step, index) => ({ ...step, stepNumber: index + 1 }))
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Campaign name is required');
      }
      
      if (formData.steps.some(step => !step.subject.trim() || !step.body.trim())) {
        throw new Error('All email steps must have subject and body');
      }

      // If test mode is enabled, send a single test email and exit without creating a campaign
      if (formData.testModeEnabled) {
        if (!formData.testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.testEmail)) {
          throw new Error('Please enter a valid test email address');
        }

        const firstActiveStep = formData.steps.find(s => s.isActive) || formData.steps[0];
        const res = await fetch('/api/test-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.testEmail,
            subject: firstActiveStep.subject || `${formData.name} – Test Email`,
            html: firstActiveStep.body || '<p>Test message</p>'
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to send test email');
        }
        alert('Test email sent successfully to ' + formData.testEmail);
        return; // Do not proceed to create campaign
      }

      // Submit to API
      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      const result = await response.json();
      if (result.success) {
        onCampaignCreated(result.campaign);
      } else {
        throw new Error(result.error || 'Failed to create campaign');
      }
      
    } catch (error) {
      console.error('Campaign creation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Info', icon: Settings },
    { number: 2, title: 'Targeting', icon: Target },
    { number: 3, title: 'Email Sequence', icon: Mail },
    { number: 4, title: 'Review & Launch', icon: Check }
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.number;
        const isCompleted = currentStep > step.number;
        
        return (
          <React.Fragment key={step.number}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
              isActive 
                ? 'border-blue-500 bg-blue-500 text-white' 
                : isCompleted 
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-600 text-gray-400'
            }`}>
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            <div className="ml-3 mr-6">
              <p className={`text-sm font-medium ${
                isActive ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
              }`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-gray-600 mr-6" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Q1 SaaS Outreach Campaign"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Target SaaS founders for product demo..."
          rows={3}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Channel
        </label>
        <div className="flex gap-3">
          {(['EMAIL', 'SMS', 'TELEGRAM'] as const).map((channel) => (
            <button
              key={channel}
              onClick={() => setFormData(prev => ({ ...prev, channel }))}
              disabled={channel !== 'EMAIL'} // Only email supported for now
              className={`flex-1 p-4 rounded-lg border transition-all ${
                formData.channel === channel
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                  : channel === 'EMAIL'
                    ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                    : 'border-gray-800 bg-gray-900 text-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="text-center">
                <Mail className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">{channel}</p>
                {channel !== 'EMAIL' && (
                  <p className="text-xs text-gray-500 mt-1">Coming Soon</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTargeting = () => (
    <div className="space-y-6">
      {/* Target Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Target by Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  targetTags: prev.targetTags.includes(tag)
                    ? prev.targetTags.filter(t => t !== tag)
                    : [...prev.targetTags, tag]
                }));
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                formData.targetTags.includes(tag)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Tag className="h-3 w-3 inline mr-1" />
              {tag}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Select tags to filter your audience. Leave empty to target all contacts.
        </p>
      </div>

      {/* Lead Score Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Minimum Lead Score
        </label>
        <div className="flex gap-3">
          {([
            { value: 'ALL', label: 'All Contacts', icon: Users, color: 'gray' },
            { value: 'WARM', label: 'Warm & Hot', icon: Thermometer, color: 'orange' },
            { value: 'HOT', label: 'Hot Only', icon: Flame, color: 'red' }
          ] as const).map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setFormData(prev => ({ ...prev, minLeadScore: value }))}
              className={`flex-1 p-4 rounded-lg border transition-all ${
                formData.minLeadScore === value
                  ? `border-${color}-500 bg-${color}-500/10 text-${color}-300`
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <Icon className="h-5 w-5 mx-auto mb-2" />
                <p className="font-medium text-sm">{label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Exclude Previously Contacted */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div>
          <p className="font-medium text-gray-300">Exclude Previously Contacted</p>
          <p className="text-sm text-gray-500">Skip contacts who have been messaged before</p>
        </div>
        <button
          onClick={() => setFormData(prev => ({ ...prev, excludePrevious: !prev.excludePrevious }))}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            formData.excludePrevious ? 'bg-blue-500' : 'bg-gray-600'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
            formData.excludePrevious ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* Audience Preview */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-400" />
          <div>
            <p className="font-medium text-blue-300">
              Audience Size: {audiencePreview.count} contacts
            </p>
            <p className="text-sm text-blue-400">
              Based on your current filters
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSequence = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Email Sequence</h3>
        <button
          onClick={addCampaignStep}
          disabled={formData.steps.length >= 5}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Step ({formData.steps.length}/5)
        </button>
      </div>

      <div className="space-y-4">
        {formData.steps.map((step, index) => (
          <div key={step.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step.stepNumber}
                </div>
                <input
                  type="text"
                  value={step.name}
                  onChange={(e) => updateStep(step.id, { name: e.target.value })}
                  className="bg-transparent text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
                />
              </div>
              
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="h-4 w-4" />
                    <input
                      type="number"
                      value={step.delayDays}
                      onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="30"
                      className="w-16 bg-gray-700 text-white text-center rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span>days after previous</span>
                  </div>
                )}
                
                <button
                  onClick={() => updateStep(step.id, { isActive: !step.isActive })}
                  className={`p-2 rounded ${step.isActive ? 'text-green-400' : 'text-gray-500'}`}
                  title={step.isActive ? 'Active' : 'Disabled'}
                >
                  {step.isActive ? <Send className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                
                {formData.steps.length > 1 && (
                  <button
                    onClick={() => removeStep(step.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                    title="Remove step"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Subject Line *
                  </label>
                  <button
                    type="button"
                    onClick={() => generateAIEmailForStep(step.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-md hover:from-purple-600 hover:to-blue-600 transition-all"
                  >
                    <Zap className="h-3 w-3" />
                    AI Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={step.subject}
                  onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                  placeholder="Quick question about [company]"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Body *
                </label>
                <textarea
                  value={step.body}
                  onChange={(e) => updateStep(step.id, { body: e.target.value })}
                  placeholder={`Hi [firstName],

I noticed [company] is in the [industry] space...

Best regards,
[senderName]`}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use variables: [firstName], [lastName], [company], [position], [senderName]
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sending Settings */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">Sending Settings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Send Limit
            </label>
            <input
              type="number"
              value={formData.dailySendLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, dailySendLimit: parseInt(e.target.value) || 150 }))}
              min="1"
              max="1000"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 50-200 emails per day</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sending Window
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={formData.sendingWindow.start}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sendingWindow: { ...prev.sendingWindow, start: e.target.value }
                }))}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400 self-center">to</span>
              <input
                type="time"
                value={formData.sendingWindow.end}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sendingWindow: { ...prev.sendingWindow, end: e.target.value }
                }))}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-300">Weekdays Only</p>
            <p className="text-sm text-gray-500">Skip weekends for better deliverability</p>
          </div>
          <button
            onClick={() => setFormData(prev => ({
              ...prev,
              sendingWindow: {
                ...prev.sendingWindow,
                weekdaysOnly: !prev.sendingWindow.weekdaysOnly
              }
            }))}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              formData.sendingWindow.weekdaysOnly ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              formData.sendingWindow.weekdaysOnly ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Test Mode */}
        <div className="mt-6 p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-yellow-300">Test Mode (Safe)</p>
              <p className="text-sm text-yellow-400">Send a single test email to your inbox. No contacts will be messaged.</p>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, testModeEnabled: !prev.testModeEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                formData.testModeEnabled ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                formData.testModeEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          {formData.testModeEnabled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Test Email Address</label>
              <input
                type="email"
                value={formData.testEmail || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, testEmail: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReviewLaunch = () => (
    <div className="space-y-6">
      {/* Campaign Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">Campaign Summary</h4>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400">Campaign Name</p>
            <p className="font-medium text-white">{formData.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Channel</p>
            <p className="font-medium text-white">{formData.channel}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Target Audience</p>
            <p className="font-medium text-white">{audiencePreview.count} contacts</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Email Steps</p>
            <p className="font-medium text-white">{formData.steps.filter(s => s.isActive).length} active steps</p>
          </div>
        </div>

        {formData.targetTags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Target Tags</p>
            <div className="flex flex-wrap gap-2">
              {formData.targetTags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Launch Options */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h4 className="font-medium text-white mb-4">Launch Options</h4>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="launch-draft"
              name="launch-option"
              defaultChecked
              className="text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="launch-draft" className="text-gray-300">
              <span className="font-medium">Save as Draft</span>
              <p className="text-sm text-gray-500">Create campaign but don&apos;t start sending yet</p>
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="launch-schedule"
              name="launch-option"
              className="text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="launch-schedule" className="text-gray-300">
              <span className="font-medium">Schedule Launch</span>
              <p className="text-sm text-gray-500">Start sending at a specific date and time</p>
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="radio"
              id="launch-now"
              name="launch-option"
              className="text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="launch-now" className="text-gray-300">
              <span className="font-medium">Launch Now</span>
              <p className="text-sm text-gray-500">Start sending emails immediately</p>
            </label>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-300">Ready to Launch?</p>
            <p className="text-sm text-yellow-400 mt-1">
              Make sure your email content is finalized. You can pause the campaign anytime, 
              but individual emails cannot be recalled once sent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Create New Campaign</h2>
            <p className="text-sm text-gray-400">Build your outreach sequence step by step</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="p-6 border-b border-gray-800">
          {renderStepIndicator()}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 1 && renderBasicInfo()}
          {currentStep === 2 && renderTargeting()}
          {currentStep === 3 && renderEmailSequence()}
          {currentStep === 4 && renderReviewLaunch()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-800">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-colors font-medium"
              >
                {isSubmitting ? 'Creating...' : 'Create Campaign'}
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Email Generator Modal */}
      {showAIEmailGenerator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">AI Email Generator</h3>
                  <p className="text-sm text-gray-400">Let AI craft your perfect outreach email</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIEmailGenerator(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Campaign Goal *
                </label>
                <input
                  type="text"
                  value={aiEmailData.campaignGoal}
                  onChange={(e) => setAIEmailData(prev => ({ ...prev, campaignGoal: e.target.value }))}
                  placeholder="e.g., Book demos for our SaaS platform"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Industry *
                </label>
                <input
                  type="text"
                  value={aiEmailData.targetIndustry}
                  onChange={(e) => setAIEmailData(prev => ({ ...prev, targetIndustry: e.target.value }))}
                  placeholder="e.g., SaaS, E-commerce, Healthcare"
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tone
                  </label>
                  <select
                    value={aiEmailData.tone}
                    onChange={(e) => setAIEmailData(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="professional" className="bg-[#1a1a1a]">Professional</option>
                    <option value="casual" className="bg-[#1a1a1a]">Casual</option>
                    <option value="direct" className="bg-[#1a1a1a]">Direct</option>
                    <option value="humorous" className="bg-[#1a1a1a]">Humorous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Type
                  </label>
                  <select
                    value={aiEmailData.emailType}
                    onChange={(e) => setAIEmailData(prev => ({ ...prev, emailType: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="initial_outreach" className="bg-[#1a1a1a]">Initial Outreach</option>
                    <option value="follow_up" className="bg-[#1a1a1a]">Follow-up</option>
                    <option value="break_up" className="bg-[#1a1a1a]">Break-up Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={aiEmailData.customInstructions}
                  onChange={(e) => setAIEmailData(prev => ({ ...prev, customInstructions: e.target.value }))}
                  placeholder="Any specific requirements or style preferences..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAIEmailGenerator(false)}
                className="flex-1 px-4 py-3 bg-white/[0.02] border border-white/[0.08] text-gray-300 rounded-lg hover:bg-white/[0.05] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAIEmailGeneration}
                disabled={!aiEmailData.campaignGoal || !aiEmailData.targetIndustry}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Generate Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignCreationWizard; 