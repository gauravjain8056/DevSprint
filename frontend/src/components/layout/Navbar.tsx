import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bot, X } from 'lucide-react';
import AiAssistantPanel from '../AiAssistantPanel';

const Navbar = () => {
  const { user } = useAuth();
  const [isAiOpen, setIsAiOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-dark-800 border-b border-dark-700 flex items-center justify-between px-6 z-10">
        <div className="flex items-center md:hidden">
          <h1 className="text-xl font-bold text-primary-500">DEV<span className="text-white">SPRINT</span></h1>
        </div>
        
        <div className="hidden md:block flex-1"></div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsAiOpen(true)}
            className="flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full hover:bg-indigo-500/20 transition border border-indigo-500/20"
          >
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">Ask AI</span>
          </button>
          
          <div className="flex items-center space-x-3 pl-4 border-l border-dark-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">{user?.fullName}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-dark-600" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary-900 flex items-center justify-center border-2 border-primary-600">
                <span className="text-sm font-medium text-primary-500">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AI Slide-out Panel Overlay */}
      {isAiOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsAiOpen(false)} />
      )}
      
      {/* AI Slide-out Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-dark-800 z-50 transform transition-transform duration-300 ease-in-out border-l border-dark-700 ${isAiOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-dark-700 bg-dark-900/50">
            <div className="flex items-center text-indigo-400 space-x-2">
              <Bot className="w-5 h-5" />
              <h2 className="font-semibold">DevSprint AI</h2>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AiAssistantPanel />
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
