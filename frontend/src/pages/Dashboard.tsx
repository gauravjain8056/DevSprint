import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Project } from '../types';
import { Link } from 'react-router-dom';
import { Folder, Users, LayoutDashboard, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.data.projects);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { name: 'Total Projects', value: projects.length, icon: Folder, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Active Tasks', value: '-', icon: LayoutDashboard, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { name: 'Team Members', value: '-', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-dark-700 rounded"></div></div></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Overview of your projects and activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-dark-800 rounded-xl border border-dark-700 p-6 flex items-center shadow-lg">
            <div className={`p-4 rounded-lg ${stat.bg} mr-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Projects</h2>
          <Link to="/projects" className="text-sm text-primary-500 hover:text-primary-400 font-medium">View all</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.slice(0, 3).map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/kanban`} className="block group">
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 hover:border-primary-500/50 transition-colors shadow-lg h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-dark-700 rounded-lg group-hover:bg-primary-500/10 transition-colors">
                    <Folder className="w-6 h-6 text-primary-400" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-dark-700 text-slate-300 rounded-full">
                    {project.ownerId ? 'Owner' : 'Member'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 flex-1 mb-4">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-dark-700 text-xs text-slate-500">
                  <div className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    <span>Members</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    <span>{format(new Date(project.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 bg-dark-800 border border-dark-700 border-dashed rounded-xl">
              <Folder className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-center mb-4">You don't have any projects yet.</p>
              <Link to="/projects" className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors">
                Create Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
