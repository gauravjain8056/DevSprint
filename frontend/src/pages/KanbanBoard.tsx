import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import api from '../services/api';
import { Task, TaskStatus } from '../types';
import TaskModal from '../components/TaskModal';
import { Plus, GripVertical, MessageSquare, Paperclip, Flag, Clock } from 'lucide-react';
import { format } from 'date-fns';

const COLUMNS: { id: TaskStatus; title: string; border: string }[] = [
  { id: 'TODO', title: 'To Do', border: 'border-slate-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', border: 'border-blue-500' },
  { id: 'REVIEW', title: 'In Review', border: 'border-amber-500' },
  { id: 'DONE', title: 'Done', border: 'border-emerald-500' },
];

const priorityColors = {
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  HIGH: 'bg-red-500/10 text-red-400 border-red-500/20'
};

const KanbanBoard = () => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  
  const [activeTask, setActiveTask] = useState<Task | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>('TODO');

  useEffect(() => {
    fetchBoardData();
    window.addEventListener('ai-action-completed', fetchBoardData);
    return () => window.removeEventListener('ai-action-completed', fetchBoardData);
  }, [projectId]);

  const fetchBoardData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks/project/${projectId}`)
      ]);
      setProjectName(projRes.data.data.project.name);
      setTasks(tasksRes.data.data.tasks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const destStatus = destination.droppableId as TaskStatus;

    const newTasks = Array.from(tasks);
    const movedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
    const movedTask = { ...newTasks[movedTaskIndex] };
    newTasks.splice(movedTaskIndex, 1);

    const destTasks = newTasks.filter(t => t.status === destStatus).sort((a, b) => a.position - b.position);
    let newPosition = 1024;

    if (destTasks.length > 0) {
      if (destination.index === 0) {
        newPosition = destTasks[0].position / 2;
      } else if (destination.index >= destTasks.length) {
        newPosition = destTasks[destTasks.length - 1].position + 1024;
      } else {
        const prev = destTasks[destination.index - 1].position;
        const next = destTasks[destination.index].position;
        newPosition = (prev + next) / 2;
      }
    }

    movedTask.status = destStatus;
    movedTask.position = newPosition;
    newTasks.push(movedTask);
    setTasks(newTasks);

    try {
      await api.patch(`/tasks/${draggableId}`, {
        status: destStatus,
        position: newPosition
      });
    } catch (error) {
      console.error('Failed to update task position', error);
      fetchBoardData();
    }
  };

  const openNewTaskModal = (status: TaskStatus) => {
    setActiveTask(undefined);
    setInitialStatus(status);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setActiveTask(task);
    setIsModalOpen(true);
  };

  const handleModalSaved = () => {
    setIsModalOpen(false);
    fetchBoardData();
  };

  if (loading) return <div>Loading board...</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center text-sm text-slate-400 mb-1">
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <span className="mx-2">/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">{projectName}</Link>
          </div>
          <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
        </div>
        <button
          onClick={() => openNewTaskModal('TODO')}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full gap-6 min-w-max items-start">
            {COLUMNS.map(column => {
              const columnTasks = tasks.filter(t => t.status === column.id).sort((a,b) => a.position - b.position);
              
              return (
                <div key={column.id} className="w-80 flex flex-col bg-dark-800/50 rounded-xl border border-dark-700 max-h-full">
                  <div className={`p-4 border-t-2 ${column.border} flex items-center justify-between rounded-t-xl bg-dark-800`}>
                    <h3 className="font-semibold text-slate-200">{column.title}</h3>
                    <span className="bg-dark-700 text-slate-400 text-xs px-2 py-0.5 rounded-full font-medium">
                      {columnTasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-dark-700/30' : ''}`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => openEditTaskModal(task)}
                                className={`group bg-dark-800 p-4 mb-3 rounded-lg border border-dark-600 shadow-sm cursor-pointer transition-all ${
                                  snapshot.isDragging ? 'shadow-xl shadow-black/50 border-primary-500 rotate-2 scale-105' : 'hover:border-dark-500 hover:shadow-md'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase ${priorityColors[task.priority]}`}>
                                    {task.priority}
                                  </span>
                                  <GripVertical className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h4 className="text-sm font-medium text-slate-200 mb-2 leading-tight">{task.title}</h4>
                                
                                <div className="flex items-center justify-between mt-4">
                                  <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                                    {task.attachments && task.attachments.length > 0 && (
                                      <div className="flex items-center">
                                        <Paperclip className="w-3.5 h-3.5 mr-1" />
                                        {task.attachments.length}
                                      </div>
                                    )}
                                    {task.dueDate && (
                                      <div className={`flex items-center ${new Date(task.dueDate) < new Date() ? 'text-red-400' : ''}`}>
                                        <Clock className="w-3.5 h-3.5 mr-1" />
                                        {format(new Date(task.dueDate), 'MMM d')}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {task.assignee && (
                                    <div className="w-6 h-6 rounded-full bg-primary-900 border border-primary-600 flex items-center justify-center overflow-hidden" title={task.assignee.fullName}>
                                      {task.assignee.avatarUrl ? (
                                        <img src={task.assignee.avatarUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[10px] font-bold text-primary-500">{task.assignee.fullName.charAt(0)}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        <button
                          onClick={() => openNewTaskModal(column.id)}
                          className="w-full py-2.5 mt-2 rounded-lg border border-dashed border-dark-600 text-sm font-medium text-slate-500 hover:text-slate-300 hover:border-dark-500 hover:bg-dark-800 transition-all flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Task
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {isModalOpen && (
        <TaskModal
          task={activeTask}
          projectId={projectId as string}
          initialStatus={initialStatus}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
