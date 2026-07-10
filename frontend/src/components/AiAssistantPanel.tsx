import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { Bot, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: any[];
}

const AiAssistantPanel = () => {
  const { projectId } = useParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am DevSprint AI. How can I help you manage this project today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !projectId || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/assist', {
        prompt: userMessage.content,
        projectId
      });
      
      const { responseText, actionsTaken } = response.data.data;
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        actions: actionsTaken
      }]);
      
      if (actionsTaken && actionsTaken.length > 0) {
        window.dispatchEvent(new CustomEvent('ai-action-completed'));
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400">
        <Bot className="w-12 h-12 mb-4 opacity-50" />
        <p>AI Assistant is only available within a specific project context.</p>
        <p className="text-sm mt-2">Please navigate to a project to use DevSprint AI.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-900 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-br-none' 
                : 'bg-dark-700 text-slate-200 rounded-bl-none border border-dark-600'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            
            {/* Actions Taken UI */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 space-y-2 w-full max-w-[85%]">
                {msg.actions.map((action, idx) => (
                  <div key={idx} className="bg-dark-800 border border-dark-700 rounded-lg p-3 text-xs flex items-start space-x-2">
                    {action.error ? (
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="font-semibold text-slate-300">Tool: {action.tool}</span>
                      <pre className="mt-1 text-[10px] text-slate-400 overflow-x-auto">
                        {JSON.stringify(action.args, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-dark-700 rounded-2xl rounded-bl-none px-4 py-3 border border-dark-600 flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-dark-700 bg-dark-800">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask DevSprint AI..."
            className="flex-1 bg-dark-900 border border-dark-600 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-primary-600 text-white rounded-xl px-4 py-2 flex items-center justify-center hover:bg-primary-500 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          AI can create tasks, update statuses, and summarize this project.
        </p>
      </div>
    </div>
  );
};

export default AiAssistantPanel;
