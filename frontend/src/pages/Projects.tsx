import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Project } from '../types';
import { Link } from 'react-router-dom';
import { Folder, Plus, MoreVertical, Kanban, Settings } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data.projects);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setIsCreateOpen(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  if (loading) return <div className="text-slate-400">Loading projects...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your workspaces and teams.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-dark-800 rounded-xl border border-dark-700 flex flex-col shadow-lg overflow-hidden group hover:border-dark-600 transition-colors">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Folder className="w-6 h-6" />
                </div>
                <button className="text-slate-500 hover:text-slate-300 p-1">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">
                {project.description || 'No description provided.'}
              </p>
            </div>
            <div className="bg-dark-900/50 p-4 border-t border-dark-700 flex justify-end gap-2">
              <Link 
                to={`/projects/${project.id}`}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-slate-300 bg-dark-700 hover:bg-dark-600 rounded-md transition-colors"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Settings
              </Link>
              <Link 
                to={`/projects/${project.id}/kanban`}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-primary-50 bg-primary-600 hover:bg-primary-500 rounded-md transition-colors"
              >
                <Kanban className="w-3.5 h-3.5 mr-1.5" />
                Board
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal - Inline for simplicity */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-xl font-bold text-white">Create New Project</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors h-24 resize-none"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
