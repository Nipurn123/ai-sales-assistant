'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Building, Target, Users, Briefcase, ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';

export default function Setup() {
  const [step, setStep] = useState(1);
  const [companyData, setCompanyData] = useState({
    companyName: '',
    industry: '',
    targetAudience: '',
    valueProposition: '',
    products: '',
    salesProcess: '',
    companyInfo: '',
    tone: 'professional',
    objectives: []
  });

  const [phoneNumbers, setPhoneNumbers] = useState(['']);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Real Estate', 'E-commerce',
    'Manufacturing', 'Education', 'Consulting', 'Marketing', 'Other'
  ];

  const tones = [
    { value: 'professional', label: 'Professional & Formal' },
    { value: 'friendly', label: 'Friendly & Conversational' },
    { value: 'enthusiastic', label: 'Enthusiastic & Energetic' },
    { value: 'consultative', label: 'Consultative & Advisory' }
  ];

  const objectives = [
    'Lead Qualification', 'Appointment Setting', 'Product Demos',
    'Follow-up Calls', 'Customer Support', 'Market Research'
  ];

  const handleCompanyDataChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handleObjectiveToggle = (objective) => {
    setCompanyData(prev => ({
      ...prev,
      objectives: prev.objectives.includes(objective)
        ? prev.objectives.filter(obj => obj !== objective)
        : [...prev.objectives, objective]
    }));
  };

  const addPhoneNumber = () => {
    setPhoneNumbers(prev => [...prev, '']);
  };

  const updatePhoneNumber = (index, value) => {
    setPhoneNumbers(prev => 
      prev.map((phone, i) => i === index ? value : phone)
    );
  };

  const removePhoneNumber = (index) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const generateSystemPrompt = async () => {
    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanyData(prev => ({ ...prev, systemPrompt: data.prompt }));
        setStep(4);
      }
    } catch (error) {
      console.error('Error generating system prompt:', error);
    }
  };

  const saveConfiguration = () => {
    // Save the complete configuration to localStorage
    localStorage.setItem('aiSalesConfig', JSON.stringify({
      ...companyData,
      phoneNumbers: phoneNumbers.filter(p => p.trim())
    }));
    
    console.log('✅ Configuration saved successfully');
    alert('Configuration saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/10 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Phone className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold text-white">AI Sales Assistant</span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-white">Step {step} of 4</div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Setup Progress</span>
              <span className="text-white font-medium">{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Company Information */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-center mb-6">
                <Building className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">Company Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={companyData.companyName}
                    onChange={(e) => handleCompanyDataChange('companyName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Industry *</label>
                  <select
                    value={companyData.industry}
                    onChange={(e) => handleCompanyDataChange('industry', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="">Select your industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry} className="bg-slate-800">{industry}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Company Description *</label>
                  <textarea
                    value={companyData.companyInfo}
                    onChange={(e) => handleCompanyDataChange('companyInfo', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                    placeholder="Describe what your company does, your mission, and key differentiators..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Target Audience *</label>
                  <textarea
                    value={companyData.targetAudience}
                    onChange={(e) => handleCompanyDataChange('targetAudience', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                    placeholder="Describe your ideal customers (demographics, job titles, company size, pain points)..."
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setStep(2)}
                  disabled={!companyData.companyName || !companyData.industry || !companyData.companyInfo}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl text-white font-bold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Products & Sales Process */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-center mb-6">
                <Briefcase className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">Products & Sales Process</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Products/Services *</label>
                  <textarea
                    value={companyData.products}
                    onChange={(e) => handleCompanyDataChange('products', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                    placeholder="List your key products/services, their benefits, pricing information, and how they solve customer problems..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Value Proposition *</label>
                  <textarea
                    value={companyData.valueProposition}
                    onChange={(e) => handleCompanyDataChange('valueProposition', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                    placeholder="What makes you different from competitors? Why should customers choose you?"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Sales Process & Methodology</label>
                  <textarea
                    value={companyData.salesProcess}
                    onChange={(e) => handleCompanyDataChange('salesProcess', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none"
                    placeholder="Describe your typical sales process, qualification criteria, and any specific methodologies you use..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Call Objectives *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {objectives.map(objective => (
                      <div
                        key={objective}
                        onClick={() => handleObjectiveToggle(objective)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          companyData.objectives.includes(objective)
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        <div className="text-sm font-medium text-center">{objective}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-3 rounded-xl font-medium transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!companyData.products || !companyData.valueProposition || companyData.objectives.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl text-white font-bold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Voice & Phone Numbers */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-center mb-6">
                <Phone className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">Voice & Contact Setup</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Voice Tone & Style *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tones.map(tone => (
                      <div
                        key={tone.value}
                        onClick={() => handleCompanyDataChange('tone', tone.value)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          companyData.tone === tone.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        <div className="font-medium">{tone.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Phone Numbers to Call *</label>
                  <div className="space-y-3">
                    {phoneNumbers.map((phone, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => updatePhoneNumber(index, e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
                          placeholder="+1234567890"
                        />
                        {phoneNumbers.length > 1 && (
                          <button
                            onClick={() => removePhoneNumber(index)}
                            className="text-red-400 hover:text-red-300 px-3 py-3"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addPhoneNumber}
                      className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                      + Add another phone number
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-3 rounded-xl font-medium transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={generateSystemPrompt}
                  disabled={phoneNumbers.filter(p => p.trim()).length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl text-white font-bold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Generate AI Prompt</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Generated System Prompt & Launch */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
            >
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-purple-400 mr-3" />
                <h2 className="text-3xl font-bold text-white">AI System Prompt Generated!</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-medium mb-2">Generated System Prompt</label>
                  <textarea
                    value={companyData.systemPrompt || 'Generating...'}
                    onChange={(e) => handleCompanyDataChange('systemPrompt', e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none resize-none text-sm"
                    placeholder="Your AI system prompt will appear here..."
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    You can edit this prompt to fine-tune your AI agent's behavior
                  </p>
                </div>

                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                  <h4 className="text-green-400 font-medium mb-2">Ready to Launch!</h4>
                  <p className="text-gray-300 text-sm">
                    Your AI sales agent is configured and ready to start making calls. 
                    Review the system prompt above and click "Start Calling" when ready.
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(3)}
                  className="border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-3 rounded-xl font-medium transition-all"
                >
                  Previous
                </button>
                <div className="space-x-4">
                  <button 
                    onClick={saveConfiguration}
                    className="border border-green-400 text-green-400 hover:bg-green-400 hover:text-white px-8 py-3 rounded-xl font-medium transition-all"
                  >
                    <Save className="w-5 h-5 inline mr-2" />
                    Save Configuration
                  </button>
                  <Link href="/dashboard">
                    <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8 py-3 rounded-xl text-white font-bold flex items-center space-x-2">
                      <Phone className="w-5 h-5" />
                      <span>Start Calling</span>
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}