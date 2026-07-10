import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Folder, User as UserIcon, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: Folder },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-dark-700">
        <h1 className="text-xl font-bold text-primary-500 tracking-wider">DEV<span className="text-white">SPRINT</span></h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-900/50 text-primary-500'
                    : 'text-slate-400 hover:bg-dark-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-dark-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-dark-700 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
