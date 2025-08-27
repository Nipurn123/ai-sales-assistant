'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Star, Phone, 
  Bot, Target, TrendingUp,
  Activity, BarChart, Shield, Users
} from 'lucide-react';
import Link from 'next/link';
import BlackHoleBackground from '../components/BlackHole/BlackHoleBackground';
import BlackHoleAudio from '../components/BlackHole/BlackHoleAudio';
import HeroSection from '../components/HeroSection';
import OrbitalIntegration from '../components/OrbitalIntegration';
import TalkToAIButton from '../components/TalkToAIButton';

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Autonomous AI Sales Agent",
      description: "Advanced AI that conducts full sales conversations, handles objections, and closes deals without human intervention",
      metric: "97% human-like accuracy"
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: "24/7 Outbound Calling",
      description: "Your AI agent makes hundreds of calls daily, qualifying prospects and booking meetings while you focus on strategy",
      metric: "500+ calls per day"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Intelligent Lead Scoring",
      description: "Advanced algorithms analyze prospect behavior and engagement to prioritize your highest-value opportunities",
      metric: "85% lead conversion"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Revenue Acceleration",
      description: "AI-driven insights and automated follow-ups ensure no opportunity is missed, accelerating your sales velocity",
      metric: "300% ROI increase"
    }
  ];

  const companies = [
    "Microsoft",
    "Shiprocket", 
    "Google",
    "hyperpure",
    "Amazon",
    "Airlearn",
    "Meta",
    "district",
    "OpenAI",
    "Shopify",
    "Stripe",
    "Salesforce",
    "HubSpot",
    "Zoom",
    "Slack",
    "Notion"
  ];

  return (
    <BlackHoleBackground>
      <div className="min-h-screen text-white relative z-10">

        {/* Navigation - Cleaner design */}
        <nav className="fixed w-full z-50 bg-black/40 backdrop-blur-2xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-black font-bold text-lg">100X</span>
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">
                  100X Prompt
                </span>
                <div className="hidden lg:flex items-center ml-6">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-green-400 font-semibold tracking-wide">AI ACTIVE</span>
                </div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="hidden lg:flex items-center space-x-8 text-gray-300">
                  <a href="#features" className="hover:text-white transition-colors font-medium">Capabilities</a>
                  <a href="#testimonials" className="hover:text-white transition-colors font-medium">Results</a>
                </div>
                <Link href="/setup" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-8 py-3 rounded-xl text-black font-bold text-lg transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transform">
                  Deploy Agent
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <HeroSection />

        {/* Trusted Companies Section */}
        <section id="testimonials" className="py-32 bg-black/10 backdrop-blur-sm overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-white">Trusted by </span>
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                  Enterprises
                </span>
                <span className="text-white"> across industries</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
                Empowering industry leaders to scale smarter, faster, and better
              </p>
            </motion.div>

            {/* Animated Company Names */}
            <div className="relative w-full">
              <div className="flex space-x-16" style={{
                animation: 'scroll 30s linear infinite',
              }}>
                {[...companies, ...companies].map((company, index) => (
                  <motion.div
                    key={`${company}-${index}`}
                    className="flex-shrink-0 text-4xl md:text-5xl lg:text-6xl font-bold text-white/80 hover:text-white transition-colors duration-300 whitespace-nowrap cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    style={{
                      fontFamily: company === 'hyperpure' ? 'system-ui' : 
                                  company === 'district' ? 'monospace' :
                                  company === 'Airlearn' ? 'sans-serif' : 'inherit'
                    }}
                  >
                    {company}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <style jsx global>{`
            @keyframes scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div 
              className="text-center mb-24"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center space-x-3 bg-blue-500/10 border border-blue-400/30 rounded-2xl px-8 py-4 mb-12 backdrop-blur-md">
                <Activity className="w-6 h-6 text-blue-400" />
                <span className="text-blue-400 font-bold text-lg tracking-wide">AI CAPABILITIES</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent mb-8 drop-shadow-2xl">
                Beyond Human Performance
              </h2>
              <p className="text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed font-light">
                AI sales agents that build relationships, handle objections, and close deals with superhuman consistency.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
              <div className="space-y-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className={`p-10 rounded-3xl border-2 cursor-pointer transition-all duration-500 backdrop-blur-lg ${
                      activeFeature === index
                        ? 'bg-gradient-to-br from-blue-600/10 to-purple-600/10 border-blue-400/40 shadow-2xl shadow-blue-500/20'
                        : 'bg-black/20 border-white/10 hover:border-white/20 hover:bg-black/30'
                    }`}
                    onMouseEnter={() => setActiveFeature(index)}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start space-x-6">
                      <div className={`p-4 rounded-2xl ${activeFeature === index ? 'bg-blue-500/80' : 'bg-white/10'} backdrop-blur-sm`}>
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
                        <p className="text-gray-200 mb-6 leading-relaxed text-lg">{feature.description}</p>
                        <div className="inline-flex items-center bg-green-400/10 border border-green-400/30 rounded-2xl px-6 py-3 backdrop-blur-md">
                          <TrendingUp className="w-5 h-5 text-green-400 mr-3" />
                          <span className="text-green-400 font-bold text-lg">{feature.metric}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-10 border border-white/20 shadow-2xl">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-white">Live Agent Performance</h4>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-sm font-medium">ACTIVE</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-600/20 rounded-lg p-4 text-center border border-blue-500/30">
                        <div className="text-3xl font-bold text-blue-400 mb-1">47</div>
                        <div className="text-gray-400 text-sm">Calls Today</div>
                      </div>
                      <div className="bg-green-600/20 rounded-lg p-4 text-center border border-green-500/30">
                        <div className="text-3xl font-bold text-green-400 mb-1">12</div>
                        <div className="text-gray-400 text-sm">Meetings Booked</div>
                      </div>
                      <div className="bg-purple-600/20 rounded-lg p-4 text-center border border-purple-500/30">
                        <div className="text-3xl font-bold text-purple-400 mb-1">89%</div>
                        <div className="text-gray-400 text-sm">Connect Rate</div>
                      </div>
                      <div className="bg-cyan-600/20 rounded-lg p-4 text-center border border-cyan-500/30">
                        <div className="text-3xl font-bold text-cyan-400 mb-1">34%</div>
                        <div className="text-gray-400 text-sm">Conversion</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">Lead Qualification</span>
                      <span className="text-green-400 font-semibold">+2 Qualified</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">Objection Handling</span>
                      <span className="text-blue-400 font-semibold">Price → Value</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <span className="text-gray-300">Meeting Scheduled</span>
                      <span className="text-purple-400 font-semibold">Tomorrow 2PM</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Seamless Integration Section */}
        <section className="py-32 bg-black/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              className="text-center mb-20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
                <span className="text-white">Seamless </span>
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                  Integration
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
                Connect Salesforce, HubSpot, Pipedrive & more to your AI agent with a single click
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left side - 3D Orbital Integration */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <OrbitalIntegration />
              </motion.div>

              {/* Right side - Company Logos Grid */}
              <motion.div
                className="grid grid-cols-2 gap-8"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {[
                  { 
                    name: 'WooCommerce', 
                    logo: 'WOO',
                    colors: 'from-purple-600 to-purple-400',
                    bgClass: 'bg-white',
                    textClass: 'text-purple-600'
                  },
                  { 
                    name: 'Zoho', 
                    logo: 'ZOHO',
                    colors: 'from-red-600 to-orange-600',
                    bgClass: 'bg-gradient-to-r from-red-600 to-orange-600',
                    textClass: 'text-white'
                  },
                  { 
                    name: 'Oracle', 
                    logo: 'ORACLE',
                    colors: 'from-red-700 to-red-500',
                    bgClass: 'bg-red-600',
                    textClass: 'text-white'
                  },
                  { 
                    name: 'Cashfree Payments', 
                    logo: 'Cashfree',
                    colors: 'from-green-600 to-teal-500',
                    bgClass: 'bg-gradient-to-r from-green-600 to-teal-500',
                    textClass: 'text-white'
                  },
                  { 
                    name: 'Delhivery', 
                    logo: 'DELHIVERY',
                    colors: 'from-blue-700 to-blue-500',
                    bgClass: 'bg-blue-600',
                    textClass: 'text-white'
                  },
                  { 
                    name: 'Exotel', 
                    logo: 'exotel',
                    colors: 'from-gray-700 to-gray-500',
                    bgClass: 'bg-gray-700',
                    textClass: 'text-white'
                  }
                ].map((platform, index) => (
                  <motion.div
                    key={platform.name}
                    className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10 cursor-pointer group"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      perspective: '1000px'
                    }}
                  >
                    <div className={`w-16 h-16 ${platform.bgClass} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <span className={`${platform.textClass} font-bold text-xs text-center leading-tight`}>
                        {platform.logo}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-tight">{platform.name}</h3>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Integration benefits */}
            <motion.div
              className="grid md:grid-cols-3 gap-8 mt-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">One-Click Setup</h3>
                <p className="text-gray-400">Connect all your tools in under 60 seconds</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔄</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real-time Sync</h3>
                <p className="text-gray-400">Data flows seamlessly across all platforms</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🛡️</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Enterprise Security</h3>
                <p className="text-gray-400">Bank-level encryption for all integrations</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-black/30 backdrop-blur-lg">
          <div className="max-w-5xl mx-auto text-center px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent drop-shadow-2xl">
                Ready to 100X Your Sales?
              </h2>
              
              <p className="text-2xl md:text-3xl text-gray-200 max-w-4xl mx-auto leading-relaxed font-light">
                Join thousands of companies using AI sales agents to scale revenue. 
                Deploy your first agent in minutes, not months.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8">
                <Link href="/setup" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 px-12 py-6 rounded-2xl text-black font-bold text-2xl transition-all shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transform">
                  Deploy AI Agent Now
                  <ArrowRight className="ml-4 w-7 h-7 inline" />
                </Link>
                
                <button type="button" className="border-2 border-white/20 hover:border-white/40 px-12 py-6 rounded-2xl text-white font-bold text-2xl transition-all hover:bg-white/5 backdrop-blur-md group">
                  Watch Live Demo
                  <Star className="ml-4 w-7 h-7 inline group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black/50 backdrop-blur-lg border-t border-white/10 py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold">100X</span>
                </div>
                <span className="text-2xl font-bold text-white">100X Prompt</span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-12 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart className="w-5 h-5 text-purple-400" />
                  <span>Real-time Analytics</span>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500">
                <p>&copy; 2024 100X Prompt. All rights reserved. Powered by advanced AI.</p>
                <div className="text-gray-400">Calls in Progress: 12,847</div>
              </div>
            </motion.div>
          </div>
        </footer>
        {/* Talk to AI Assistant Button */}
        <TalkToAIButton />
        
        {/* Black Hole Audio */}
        <BlackHoleAudio autoPlay={false} volume={0.2} />
      </div>
    </BlackHoleBackground>
  );
}