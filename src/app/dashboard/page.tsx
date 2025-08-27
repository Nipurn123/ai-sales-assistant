'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  TrendingUp, 
  Settings,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useCallState } from '../../hooks/useCallState';
import ReactiveCallInterface from '../../components/ReactiveCallInterface';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [phoneNumbers, setPhoneNumbers] = useState([
    { id: 1, number: '+1234567890', name: 'John Doe', status: 'pending' },
    { id: 2, number: '+1987654321', name: 'Jane Smith', status: 'pending' },
    { id: 3, number: '+1555666777', name: 'Bob Johnson', status: 'completed' },
  ]);
  const [savedConfig, setSavedConfig] = useState(null);
  
  // Use the reactive call state hook
  const { 
    activeCalls, 
    totalCost, 
    callHistory, 
    isAnyCallActive, 
    startCall: startCallReactive 
  } = useCallState();

  // Load saved configuration on mount
  useEffect(() => {
    const config = localStorage.getItem('aiSalesConfig');
    if (config) {
      try {
        const parsedConfig = JSON.parse(config);
        setSavedConfig(parsedConfig);
        
        // Load saved phone numbers if available
        if (parsedConfig.phoneNumbers && parsedConfig.phoneNumbers.length > 0) {
          const loadedNumbers = parsedConfig.phoneNumbers.map((phone, index) => ({
            id: Date.now() + index,
            number: phone,
            name: `Contact ${index + 1}`,
            status: 'pending'
          }));
          setPhoneNumbers(prev => [...prev, ...loadedNumbers]);
        }
        
        console.log('✅ Loaded saved configuration');
      } catch (error) {
        console.error('Error loading saved config:', error);
      }
    }
  }, []);

  // Calculate dynamic call stats from reactive state
  const callStats = {
    totalCalls: callHistory.length + activeCalls.length,
    successfulCalls: callHistory.filter(call => call.status === 'ended').length,
    pendingCalls: phoneNumbers.filter(phone => phone.status === 'pending').length,
    averageCallTime: callHistory.length > 0 ? 
      Math.round(callHistory.reduce((sum, call) => sum + (call.duration || 0), 0) / callHistory.length / 1000) + 's' : 
      '0s',
    conversionRate: callHistory.length > 0 ? 
      Math.round((callHistory.filter(call => call.status === 'ended').length / callHistory.length) * 100) : 
      0
  };

  const startCall = async (phoneNumber, contactName) => {
    try {
      // Update phone number status immediately
      setPhoneNumbers(prev => 
        prev.map(phone => 
          phone.number === phoneNumber 
            ? { ...phone, status: 'calling' }
            : phone
        )
      );

      // Use the reactive call manager
      await startCallReactive({
        phoneNumber,
        contactName,
        systemPrompt: savedConfig?.systemPrompt || 'You are a professional AI sales assistant. Be helpful, friendly, and conversational while qualifying leads and scheduling appointments.'
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      
      // Reset phone number status on error
      setPhoneNumbers(prev => 
        prev.map(phone => 
          phone.number === phoneNumber 
            ? { ...phone, status: 'pending' }
            : phone
        )
      );
    }
  };

  const addPhoneNumber = () => {
    const newNumber = prompt('Enter phone number (with country code):');
    const newName = prompt('Enter contact name:');
    
    if (newNumber && newName) {
      setPhoneNumbers(prev => [...prev, {
        id: Date.now(),
        number: newNumber,
        name: newName,
        status: 'pending'
      }]);
    }
  };

  const removePhoneNumber = (id) => {
    setPhoneNumbers(prev => prev.filter(phone => phone.id !== id));
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
              {isAnyCallActive && (
                <div className="flex items-center space-x-2 bg-green-600/20 px-4 py-2 rounded-lg border border-green-600/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">{activeCalls.length} Active Call{activeCalls.length !== 1 ? 's' : ''}</span>
                  <span className="text-green-300 text-sm">${totalCost.toFixed(4)}</span>
                </div>
              )}
              <Link href="/setup" className="text-purple-400 hover:text-purple-300">
                <Settings className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-300">Manage your AI sales calls and monitor performance</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Calls</p>
                  <p className="text-2xl font-bold text-white">{callStats.totalCalls}</p>
                </div>
                <PhoneCall className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Successful</p>
                  <p className="text-2xl font-bold text-green-400">{callStats.successfulCalls}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{callStats.pendingCalls}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg. Time</p>
                  <p className="text-2xl font-bold text-white">{callStats.averageCallTime}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Conversion</p>
                  <p className="text-2xl font-bold text-green-400">{callStats.conversionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>
          </div>

          {/* Reactive Call Interface */}
          <ReactiveCallInterface />

          {/* Main Content Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-white/10 p-1 rounded-lg w-fit">
              {['overview', 'contacts', 'calls'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-md font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Contact List</h2>
                <button
                  onClick={addPhoneNumber}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Contact</span>
                </button>
              </div>

              <div className="space-y-4">
                {phoneNumbers.map((phone) => (
                  <div key={phone.id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{phone.name}</p>
                      <p className="text-gray-400">{phone.number}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        phone.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                        phone.status === 'calling' ? 'bg-green-600/20 text-green-400' :
                        phone.status === 'completed' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {phone.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startCall(phone.number, phone.name)}
                        disabled={isAnyCallActive && activeCalls.some((call: any) => call.phoneNumber === phone.number)}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call</span>
                      </button>
                      <button
                        onClick={() => removePhoneNumber(phone.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Calls Tab */}
          {activeTab === 'calls' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Call History</h2>
              
              <div className="space-y-4">
                {callHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No calls made yet</p>
                    <p className="text-gray-500">Start making calls to see your history here</p>
                  </div>
                ) : (
                  callHistory.map((call, index) => (
                    <div key={call.callId} className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{call.contactName}</p>
                        <p className="text-gray-400">{call.phoneNumber}</p>
                        <p className="text-gray-500 text-sm">
                          {new Date(call.startTime).toLocaleString()}
                          {call.duration && ` • ${Math.round(call.duration / 1000)}s`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-3">
                          <p className="text-white font-medium">${call.cost.toFixed(4)}</p>
                          <p className="text-gray-400 text-xs">cost</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          call.status === 'ended' ? 'bg-green-600/20 text-green-400' :
                          call.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                          'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {call.status}
                        </span>
                        <button className="text-purple-400 hover:text-purple-300 p-2">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={addPhoneNumber}
                      className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg text-white font-medium flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add New Contact</span>
                    </button>
                    <Link href="/setup" className="block">
                      <button className="w-full border border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-4 py-3 rounded-lg font-medium flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>Edit AI Configuration</span>
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {callHistory.slice(-3).map((call, index) => (
                      <div key={call.callId} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          call.status === 'ended' ? 'bg-green-400' :
                          call.status === 'failed' ? 'bg-red-400' :
                          'bg-yellow-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{call.contactName}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(call.startTime).toLocaleTimeString()} • ${call.cost.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {callHistory.length === 0 && (
                      <p className="text-gray-400 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Next Contacts to Call */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Next Contacts to Call</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phoneNumbers
                    .filter(phone => phone.status === 'pending')
                    .slice(0, 6)
                    .map((phone) => (
                      <div key={phone.id} className="bg-white/5 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{phone.name}</p>
                            <p className="text-gray-400 text-sm">{phone.number}</p>
                          </div>
                          <button
                            onClick={() => startCall(phone.number, phone.name)}
                            disabled={isAnyCallActive && activeCalls.some((call: any) => call.phoneNumber === phone.number)}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-2 rounded-lg text-white"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}