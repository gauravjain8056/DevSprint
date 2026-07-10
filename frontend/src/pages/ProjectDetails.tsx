import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Project, ProjectMember } from '../types';
import { useAuth } from '../context/AuthContext';
import { Shield, UserMinus, UserPlus, Loader2, Trash2 } from 'lucide-react';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newMemberId, setNewMemberId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    fetchProjectAndMembers();
  }, [projectId]);

  const fetchProjectAndMembers = async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/members`)
      ]);
      setProject(projRes.data.data.project);
      setMembers(memRes.data.data.members);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMember(true);
    try {
      await api.post(`/projects/${projectId}/members`, { userId: newMemberId, role: 'MEMBER' });
      setNewMemberId('');
      fetchProjectAndMembers();
    } catch (error) {
      console.error(error);
      alert('Failed to add member. Ensure user ID is correct.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchProjectAndMembers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete project permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  const isOwner = project.ownerId === user?.id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name} Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage project details and team members.</p>
        </div>
        {isOwner && (
          <button
            onClick={handleDeleteProject}
            className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Project
          </button>
        )}
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-4">Team Members</h2>
        
        {isOwner && (
          <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Enter User ID to invite..."
              required
              className="flex-1 max-w-md bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 text-sm"
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
            />
            <button
              type="submit"
              disabled={isAddingMember}
              className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isAddingMember ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Add Member
            </button>
          </form>
        )}

        <div className="divide-y divide-dark-700 border border-dark-700 rounded-lg overflow-hidden">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700/50 transition-colors">
              <div className="flex items-center space-x-4">
                {member.user?.avatarUrl ? (
                  <img src={member.user.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-dark-600 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center border border-primary-600">
                    <span className="text-sm font-medium text-primary-500">
                      {member.user?.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    {member.user?.fullName}
                    {member.role === 'OWNER' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                  </p>
                  <p className="text-xs text-slate-400">{member.user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-xs font-medium px-2.5 py-1 bg-dark-900 border border-dark-600 text-slate-300 rounded-full">
                  {member.role}
                </span>
                
                {isOwner && member.userId !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                    title="Remove Member"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
