import React, { useState } from 'react';
import { Task } from '../types';
import api from '../services/api';
import { X, Calendar, Flag, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskModalProps {
  task?: Task;
  projectId: string;
  initialStatus?: string;
  onClose: () => void;
  onSaved: () => void;
}

const TaskModal = ({ task, projectId, initialStatus = 'TODO', onClose, onSaved }: TaskModalProps) => {
  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || initialStatus);
  const [priority, setPriority] = useState(task?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const data = { title, description, status, priority, dueDate: dueDate || null };
    
    try {
      if (isEditing) {
        await api.patch(`/tasks/${task.id}`, data);
      } else {
        await api.post(`/tasks/project/${projectId}`, data);
      }
      onSaved();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files?.length) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      await api.post(`/attachments/task/${task.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSaved(); // trigger re-fetch to see new attachment
    } catch (error) {
      console.error('File upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/attachments/${attachmentId}`);
      onSaved();
    } catch (error) {
      console.error('File delete failed', error);
    }
  };
  
  const handleDeleteTask = async () => {
    if (!task || !confirm('Delete task?')) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      onSaved();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-dark-800 rounded-xl border border-dark-700 shadow-2xl w-full max-w-2xl my-8">
        <div className="p-6 border-b border-dark-700 flex justify-between items-center sticky top-0 bg-dark-800 rounded-t-xl z-10">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              required
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 h-32 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
              <select
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
                <Flag className="w-3 h-3 mr-1" /> Priority
              </label>
              <select
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center">
                <Calendar className="w-3 h-3 mr-1" /> Due Date
              </label>
              <input
                type="date"
                className="w-full bg-dark-900 border border-dark-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {isEditing && (
            <div className="border-t border-dark-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Paperclip className="w-4 h-4 mr-2" /> Attachments
                </h3>
                <label className="cursor-pointer text-xs font-medium text-primary-500 hover:text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-full transition-colors flex items-center">
                  {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <PlusIcon className="w-3 h-3 mr-1" />}
                  Add File
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              
              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {task.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between bg-dark-900 border border-dark-700 p-2 rounded-lg group">
                      <a href={att.url} target="_blank" rel="noreferrer" className="text-xs text-primary-400 hover:underline truncate mr-2 block flex-1">
                        {att.filename}
                      </a>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No attachments.</p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-dark-700 sticky bottom-0 bg-dark-800 rounded-b-xl py-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDeleteTask}
                className="text-sm font-medium text-red-400 hover:text-red-300 px-3 py-2 rounded-md hover:bg-red-400/10 transition-colors"
              >
                Delete Task
              </button>
            ) : <div />}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const PlusIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default TaskModal;
