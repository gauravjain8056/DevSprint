import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Camera, Loader2, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await api.patch('/profile', { fullName });
      updateUser(data.data.user);
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await api.patch('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.data.user);
    } catch (error) {
      console.error('Failed to upload avatar', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account details and preferences.</p>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-dark-900" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-900 flex items-center justify-center border-4 border-dark-900">
                  <span className="text-3xl font-medium text-primary-500">
                    {user.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:bg-black/80"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
              <p className="text-sm text-slate-400">{user.email}</p>
              <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 bg-dark-700 text-slate-300 rounded-full">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-8 pt-8 border-t border-dark-700 space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                className="w-full bg-dark-900/50 border border-dark-700 rounded-lg px-4 py-2 text-slate-400 cursor-not-allowed"
                value={user.email}
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
            </div>
            
            <button
              type="submit"
              disabled={isSaving || fullName === user.fullName}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
