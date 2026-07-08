import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaChartBar, FaFolder, FaTasks, FaUsers, FaCalendarAlt, FaBell, FaCog, 
  FaSignOutAlt, FaPlus, FaTrash, FaEdit, FaCheckCircle, FaUserPlus, 
  FaCheck, FaArrowLeft, FaArrowRight, FaTimes, FaCalendarDay, FaUserCircle
} from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Backend States
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for My Tasks
  const [taskProjectFilter, setTaskProjectFilter] = useState('all');
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('all');

  // Modals visibility state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  // Selected object state
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form Fields
  const [projectForm, setProjectForm] = useState({
    name: '', description: '', priority: 'medium', deadline: '', category: 'general', members: []
  });
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'medium', deadline: '', status: 'todo', assignee: '', project: '', labels: '', checklistInput: ''
  });
  const [checklist, setChecklist] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', role: user?.role || 'member' });

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, role: user.role });
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projsRes, tasksRes, usersRes, notifsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/users'),
        api.get('/notifications').catch(() => ({ data: [] }))
      ]);

      setProjects(projsRes.data);
      setTasks(tasksRes.data);
      setTeam(usersRes.data);
      setNotifications(notifsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper: Generates unique visual colors for avatars based on email hash
  const getAvatarColor = (str = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 40%)`;
  };

  // Project Actions
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.name) return toast.error('Project Name is required');
    try {
      const res = await api.post('/projects', projectForm);
      setProjects([...projects, res.data]);
      setShowProjectModal(false);
      setProjectForm({ name: '', description: '', priority: 'medium', deadline: '', category: 'general', members: [] });
      toast.success('Project created successfully');
      fetchData(); // reload
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating project');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${selectedProject._id}`, projectForm);
      setProjects(projects.map(p => p._id === selectedProject._id ? res.data : p));
      setShowEditProjectModal(false);
      toast.success('Project updated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating project');
    }
  };

  const handleDeleteProject = async (projId) => {
    if (!window.confirm('Are you sure you want to delete this project and all its settings?')) return;
    try {
      await api.delete(`/projects/${projId}`);
      setProjects(projects.filter(p => p._id !== projId));
      toast.success('Project deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting project');
    }
  };

  // Task Actions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.project) return toast.error('Title and Project are required');
    try {
      const parsedLabels = taskForm.labels.split(',').map(l => l.trim()).filter(l => l !== '');
      const res = await api.post('/tasks', {
        ...taskForm,
        labels: parsedLabels,
        checklist
      });
      setTasks([...tasks, res.data]);
      setShowTaskModal(false);
      setTaskForm({
        title: '', description: '', priority: 'medium', deadline: '', status: 'todo', assignee: '', project: '', labels: '', checklistInput: ''
      });
      setChecklist([]);
      toast.success('Task created successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating task');
    }
  };

  const openEditTask = (task) => {
    setSelectedTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      status: task.status || 'todo',
      assignee: task.assignee?._id || '',
      project: task.project?._id || '',
      labels: task.labels ? task.labels.join(', ') : '',
      checklistInput: ''
    });
    setChecklist(task.checklist || []);
    setComments(task.comments || []);
    setShowEditTaskModal(true);
  };

  const handleUpdateTask = async (e) => {
    if (e) e.preventDefault();
    try {
      const parsedLabels = taskForm.labels.split(',').map(l => l.trim()).filter(l => l !== '');
      const res = await api.put(`/tasks/${selectedTask._id}`, {
        ...taskForm,
        labels: parsedLabels,
        checklist,
        comments
      });
      setTasks(tasks.map(t => t._id === selectedTask._id ? res.data : t));
      setShowEditTaskModal(false);
      toast.success('Task updated successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating task');
    }
  };

  const moveTaskStatus = async (task, newStatus) => {
    try {
      const res = await api.put(`/tasks/${task._id}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === task._id ? res.data : t));
      toast.success(`Task status: ${newStatus}`);
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      setShowEditTaskModal(false);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // Notification Actions
  const handleMarkNotificationsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Error updating notifications');
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  // Profile Action
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name) return toast.error('Name cannot be empty');
    try {
      await api.put(`/users/${user.id}`, profileForm);
      // Update local storage
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      savedUser.name = profileForm.name;
      savedUser.role = profileForm.role;
      localStorage.setItem('user', JSON.stringify(savedUser));
      toast.success('Profile updated! Refresh to apply globally.');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  // Checklist Helpers
  const addChecklistItem = () => {
    if (!taskForm.checklistInput.trim()) return;
    setChecklist([...checklist, { title: taskForm.checklistInput.trim(), done: false }]);
    setTaskForm({ ...taskForm, checklistInput: '' });
  };

  const toggleChecklistItem = (index) => {
    const updated = [...checklist];
    updated[index].done = !updated[index].done;
    setChecklist(updated);
  };

  const removeChecklistItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  // Comment Helpers
  const addComment = () => {
    if (!newComment.trim()) return;
    const commentWithAuthor = `${user?.name || 'User'}: ${newComment.trim()}`;
    const updatedComments = [...comments, commentWithAuthor];
    setComments(updatedComments);
    setNewComment('');
    
    // Save comment immediately if selectedTask exists
    if (selectedTask) {
      api.put(`/tasks/${selectedTask._id}`, { comments: updatedComments })
        .then((res) => {
          setTasks(tasks.map(t => t._id === selectedTask._id ? res.data : t));
          toast.success('Comment posted');
        }).catch(() => toast.error('Failed to post comment'));
    }
  };

  // Calculations for dashboard stats & charts
  const totalProjects = projects.length;
  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => {
    return t.status !== 'done' && t.deadline && new Date(t.deadline) < new Date();
  }).length;

  const stats = [
    { title: 'Total Projects', value: totalProjects, tone: 'from-indigo-500 to-violet-500' },
    { title: 'Active Tasks', value: activeTasks, tone: 'from-cyan-500 to-sky-500' },
    { title: 'Completed Tasks', value: completedTasks, tone: 'from-emerald-500 to-green-500' },
    { title: 'Overdue Tasks', value: overdueTasks, tone: 'from-rose-500 to-orange-500' }
  ];

  // Recharts task priority chart data
  const priorityChartData = [
    { name: 'Low', tasks: tasks.filter(t => t.priority === 'low').length },
    { name: 'Medium', tasks: tasks.filter(t => t.priority === 'medium').length },
    { name: 'High', tasks: tasks.filter(t => t.priority === 'high').length }
  ];

  // Recharts status distribution data
  const statusDistribution = [
    { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length, color: '#6366f1' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#22d3ee' },
    { name: 'In Review', value: tasks.filter(t => t.status === 'in-review').length, color: '#f59e0b' },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: '#10b981' }
  ].filter(item => item.value > 0);

  // Calendar calculations
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    // Prefix padding
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ dayNum: new Date(year, month, -i).getDate(), dateObj: new Date(year, month, -i), isPadding: true });
    }
    // Main days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ dayNum: i, dateObj: new Date(year, month, i), isPadding: false });
    }
    // Suffix padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ dayNum: new Date(year, month + 1, i).getDate(), dateObj: new Date(year, month + 1, i), isPadding: true });
    }
    return days;
  };

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-50 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        
        {/* Header Section */}
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-sm text-cyan-400">Welcome, {user?.name || 'Developer'}</p>
            <h1 className="text-2xl font-semibold capitalize">{activeTab} Workspace</h1>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationDrawer(!showNotificationDrawer)} 
                className="relative rounded-full border border-slate-700 p-3 text-slate-300 transition hover:bg-slate-800"
              >
                <FaBell />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotificationDrawer && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <button onClick={handleMarkNotificationsRead} className="text-xs text-cyan-400 hover:underline">Mark all read</button>
                    </div>
                    <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-4">No notifications yet</p>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif._id} 
                            onClick={() => handleMarkSingleRead(notif._id)}
                            className={`p-2 rounded-xl text-xs transition cursor-pointer border ${notif.read ? 'bg-slate-950/40 border-transparent text-slate-400' : 'bg-slate-800/60 border-slate-700 text-slate-200'}`}
                          >
                            <div className="font-medium text-[13px]">{notif.title}</div>
                            <div className="mt-1 leading-normal">{notif.message}</div>
                            <div className="mt-1 text-[9px] text-slate-500">{new Date(notif.createdAt).toLocaleDateString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {activeTab === 'Projects' && (
              <button 
                onClick={() => {
                  setProjectForm({ name: '', description: '', priority: 'medium', deadline: '', category: 'general', members: [] });
                  setShowProjectModal(true);
                }} 
                className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 font-medium text-white shadow-lg transition hover:brightness-110"
              >
                + New Project
              </button>
            )}

            {activeTab === 'My Tasks' && (
              <button 
                onClick={() => {
                  if (projects.length === 0) return toast.error('Create a project first!');
                  setTaskForm({
                    title: '', description: '', priority: 'medium', deadline: '', status: 'todo', assignee: '', project: projects[0]?._id, labels: '', checklistInput: ''
                  });
                  setChecklist([]);
                  setShowTaskModal(true);
                }} 
                className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 font-medium text-white shadow-lg transition hover:brightness-110"
              >
                + New Task
              </button>
            )}
          </div>
        </header>

        {/* Workspace Layout */}
        <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
          
          {/* Navigation Sidebar */}
          <aside className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="mb-8 flex items-center gap-3 text-xl font-bold tracking-wider text-cyan-400">
                <FaTasks /> NovaWork
              </div>
              <nav className="space-y-2 text-sm text-slate-300">
                {[
                  ['Dashboard', <FaChartBar />],
                  ['Projects', <FaFolder />],
                  ['My Tasks', <FaTasks />],
                  ['Team', <FaUsers />],
                  ['Calendar', <FaCalendarAlt />],
                  ['Settings', <FaCog />]
                ].map(([label, icon]) => (
                  <button 
                    key={label} 
                    onClick={() => setActiveTab(label)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${activeTab === label ? 'bg-slate-800 text-white font-medium shadow-md border-l-4 border-cyan-400' : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'}`}
                  >
                    <span className={activeTab === label ? 'text-cyan-400' : 'text-slate-500'}>{icon}</span>
                    {label}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* User Footer Profile & Logout */}
            <div className="mt-8 border-t border-slate-800 pt-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white shadow" style={{ backgroundColor: getAvatarColor(user?.email) }}>
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold truncate">{user?.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-2 text-xs text-rose-400 transition hover:bg-rose-950/20"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </aside>

          {/* Core Content Container */}
          <main className="space-y-6">
            {loading ? (
              <div className="flex h-96 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-cyan-400" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                
                {/* 1. Dashboard Overview Tab */}
                {activeTab === 'Dashboard' && (
                  <motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {stats.map((item) => (
                        <div key={item.title} className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${item.tone} p-[1px]`}>
                          <div className="rounded-[calc(1.5rem-1px)] bg-slate-950/90 p-5">
                            <p className="text-xs text-slate-400 font-medium">{item.title}</p>
                            <p className="mt-2 text-3xl font-bold tracking-tight">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart Widgets */}
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                      
                      {/* Priority chart */}
                      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl shadow-xl">
                        <h2 className="text-[15px] font-semibold text-slate-300 mb-4">Task Priority Breakdown</h2>
                        <div className="h-64">
                          {tasks.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-xs text-slate-500">No tasks created yet</div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={priorityChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                                <Bar dataKey="tasks" fill="#818cf8" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Status Distribution */}
                      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                        <h2 className="text-[15px] font-semibold text-slate-300">Task Status Distribution</h2>
                        <div className="h-64 flex items-center justify-center">
                          {tasks.length === 0 ? (
                            <div className="text-xs text-slate-500">No tasks created yet</div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={4}>
                                  {statusDistribution.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                        {statusDistribution.length > 0 && (
                          <div className="flex justify-center gap-4 flex-wrap text-xs text-slate-400 mt-2">
                            {statusDistribution.map(item => (
                              <span key={item.name} className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}: {item.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active Projects Tracker */}
                    <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                      
                      {/* Active Projects Widget */}
                      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                          <h2 className="text-[15px] font-semibold text-slate-300">Active Projects</h2>
                          <button onClick={() => setActiveTab('Projects')} className="rounded-full bg-slate-800 p-2 text-cyan-400 hover:bg-slate-700 transition">
                            <FaPlus />
                          </button>
                        </div>
                        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                          {projects.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">No projects created yet. Start by adding one!</p>
                          ) : (
                            projects.slice(0, 3).map((project) => {
                              const projTasks = tasks.filter(t => t.project?._id === project._id);
                              const comp = projTasks.filter(t => t.status === 'done').length;
                              const progress = projTasks.length > 0 ? Math.round((comp / projTasks.length) * 100) : 0;
                              return (
                                <div key={project._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="font-semibold text-sm">{project.name}</h3>
                                      <p className="text-[11px] text-slate-500 capitalize">{project.status}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-cyan-400">{progress}%</span>
                                  </div>
                                  <div className="mt-3 h-1.5 rounded-full bg-slate-800">
                                    <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{ width: `${progress}%` }} />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Today Task Deadlines Widget */}
                      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl shadow-xl">
                        <h2 className="text-[15px] font-semibold text-slate-300 mb-4">Upcoming Deadlines</h2>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {tasks.filter(t => t.status !== 'done' && t.deadline).length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">No upcoming task deadlines!</p>
                          ) : (
                            tasks
                              .filter(t => t.status !== 'done' && t.deadline)
                              .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                              .slice(0, 4)
                              .map((task) => (
                                <div key={task._id} onClick={() => openEditTask(task)} className="rounded-2xl border border-slate-850 bg-slate-950/60 p-3 flex items-center justify-between cursor-pointer transition hover:bg-slate-900">
                                  <div className="overflow-hidden pr-2">
                                    <h4 className="font-medium text-xs truncate">{task.title}</h4>
                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{task.project?.name || 'No project'}</p>
                                  </div>
                                  <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full whitespace-nowrap">
                                    {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 2. Projects Page Tab */}
                {activeTab === 'Projects' && (
                  <motion.div key="projects" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-slate-350">Workspace Projects</h3>
                      <button 
                        onClick={() => {
                          setProjectForm({ name: '', description: '', priority: 'medium', deadline: '', category: 'general', members: [] });
                          setShowProjectModal(true);
                        }}
                        className="flex items-center gap-1 text-xs bg-slate-900 border border-white/10 hover:bg-slate-800 transition px-3.5 py-2 rounded-xl text-cyan-400"
                      >
                        <FaPlus /> Add Project
                      </button>
                    </div>

                    {projects.length === 0 ? (
                      <div className="rounded-[2rem] border border-white/5 bg-slate-900/40 p-12 text-center text-slate-500">
                        <FaFolder className="mx-auto text-4xl mb-3 text-slate-700" />
                        <h4 className="text-sm font-semibold mb-1 text-slate-400">No projects created yet</h4>
                        <p className="text-xs max-w-sm mx-auto">Get started by creating a new workspace project. You can assign team members and track tasks inside it.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => {
                          const isOwner = project.owner?._id === user?.id || project.owner === user?.id;
                          return (
                            <div key={project._id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition shadow">
                              <div>
                                <div className="flex justify-between items-start mb-3">
                                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">{project.category}</span>
                                  <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-md border ${
                                    project.priority === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                                    project.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                    'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                                  }`}>{project.priority}</span>
                                </div>
                                <h3 className="font-semibold text-base mb-1 text-slate-100">{project.name}</h3>
                                <p className="text-xs text-slate-400 mb-6 leading-relaxed line-clamp-2 h-8">{project.description || 'No description provided.'}</p>
                              </div>

                              <div className="border-t border-slate-800 pt-4 space-y-4">
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  <span>Deadline</span>
                                  <span className="font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'None'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex -space-x-2 overflow-hidden">
                                    <div className="h-6 w-6 rounded-full border border-slate-900 bg-slate-800 text-[9px] font-bold flex items-center justify-center cursor-help text-cyan-300" title={`Owner: ${project.owner?.name}`}>
                                      {project.owner?.name ? project.owner.name[0].toUpperCase() : 'O'}
                                    </div>
                                    {project.members?.map((m) => (
                                      <div key={m._id} className="h-6 w-6 rounded-full border border-slate-900 bg-slate-700 text-[9px] font-bold flex items-center justify-center cursor-help text-slate-200" title={`Member: ${m.name}`}>
                                        {m.name[0].toUpperCase()}
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button 
                                      onClick={() => {
                                        setTaskProjectFilter(project._id);
                                        setActiveTab('My Tasks');
                                      }}
                                      className="text-xs bg-slate-800 hover:bg-slate-700 transition px-2.5 py-1.5 rounded-lg text-slate-200"
                                    >
                                      Tasks
                                    </button>
                                    {isOwner && (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setSelectedProject(project);
                                            setProjectForm({
                                              name: project.name,
                                              description: project.description || '',
                                              priority: project.priority || 'medium',
                                              deadline: project.deadline ? project.deadline.split('T')[0] : '',
                                              category: project.category || 'general',
                                              members: project.members?.map(m => m._id) || []
                                            });
                                            setShowEditProjectModal(true);
                                          }}
                                          className="text-slate-400 hover:text-cyan-400 p-1.5 transition"
                                        >
                                          <FaEdit size={13} />
                                        </button>
                                        <button onClick={() => handleDeleteProject(project._id)} className="text-slate-400 hover:text-rose-500 p-1.5 transition">
                                          <FaTrash size={12} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. My Tasks Page Tab */}
                {activeTab === 'My Tasks' && (
                  <motion.div key="tasks" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="space-y-6">
                    {/* Filters & Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="text-xs text-slate-400">
                          Project:
                          <select 
                            value={taskProjectFilter} 
                            onChange={(e) => setTaskProjectFilter(e.target.value)}
                            className="ml-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                          >
                            <option value="all">All Projects</option>
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-slate-400">
                          Assignee:
                          <select 
                            value={taskAssigneeFilter} 
                            onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                            className="ml-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                          >
                            <option value="all">Everyone</option>
                            <option value="me">Assigned to Me</option>
                            {team.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                          </select>
                        </label>
                      </div>
                      <button 
                        onClick={() => {
                          if (projects.length === 0) return toast.error('Create a project first!');
                          setTaskForm({
                            title: '', description: '', priority: 'medium', deadline: '', status: 'todo', assignee: '', project: taskProjectFilter === 'all' ? projects[0]?._id : taskProjectFilter, labels: '', checklistInput: ''
                          });
                          setChecklist([]);
                          setShowTaskModal(true);
                        }}
                        className="flex items-center gap-1.5 self-end sm:self-auto bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-2 rounded-full font-medium text-xs text-white transition hover:brightness-110 shadow-lg"
                      >
                        <FaPlus /> New Task
                      </button>
                    </div>

                    {/* Kanban Columns */}
                    <div className="grid gap-4 md:grid-cols-4">
                      {['todo', 'in-progress', 'in-review', 'done'].map((columnStatus) => {
                        const statusColors = {
                          'todo': 'border-t-indigo-500',
                          'in-progress': 'border-t-cyan-400',
                          'in-review': 'border-t-amber-400',
                          'done': 'border-t-emerald-500'
                        };
                        const displayNames = {
                          'todo': 'Todo',
                          'in-progress': 'In Progress',
                          'in-review': 'In Review',
                          'done': 'Completed'
                        };

                        const filtered = tasks.filter(t => {
                          if (t.status !== columnStatus) return false;
                          if (taskProjectFilter !== 'all' && t.project?._id !== taskProjectFilter) return false;
                          if (taskAssigneeFilter !== 'all') {
                            if (taskAssigneeFilter === 'me') {
                              return t.assignee?._id === user?.id;
                            }
                            return t.assignee?._id === taskAssigneeFilter;
                          }
                          return true;
                        });

                        return (
                          <div key={columnStatus} className={`rounded-3xl border border-white/10 bg-slate-900/40 p-4 border-t-4 ${statusColors[columnStatus]} flex flex-col min-h-[400px]`}>
                            <div className="mb-4 flex items-center justify-between">
                              <span className="font-semibold text-xs text-slate-300 uppercase tracking-wider">{displayNames[columnStatus]}</span>
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">{filtered.length}</span>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto">
                              {filtered.length === 0 ? (
                                <div className="h-full border border-dashed border-slate-800 rounded-2xl flex items-center justify-center text-[10px] text-slate-600 py-8">
                                  No tasks
                                </div>
                              ) : (
                                filtered.map(task => {
                                  const isOverdue = task.status !== 'done' && task.deadline && new Date(task.deadline) < new Date();
                                  return (
                                    <div 
                                      key={task._id} 
                                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow cursor-pointer transition hover:border-slate-650 hover:bg-slate-900/50"
                                      onClick={() => openEditTask(task)}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                          task.priority === 'high' ? 'bg-rose-500/10 text-rose-400' :
                                          task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                                          'bg-cyan-500/10 text-cyan-400'
                                        }`}>{task.priority}</span>
                                      </div>
                                      
                                      <h4 className="font-medium text-xs text-slate-200 line-clamp-2">{task.title}</h4>
                                      
                                      {task.deadline && (
                                        <div className="mt-3 flex items-center gap-1 text-[9px]">
                                          <FaCalendarAlt className={isOverdue ? 'text-rose-400 animate-pulse' : 'text-slate-500'} />
                                          <span className={isOverdue ? 'text-rose-400 font-medium' : 'text-slate-400'}>
                                            {new Date(task.deadline).toLocaleDateString()} {isOverdue && '(Overdue)'}
                                          </span>
                                        </div>
                                      )}

                                      <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                          {task.assignee ? (
                                            <div 
                                              className="h-5 w-5 rounded-full text-[9px] font-bold flex items-center justify-center text-white" 
                                              style={{ backgroundColor: getAvatarColor(task.assignee.email) }}
                                              title={`Assigned to: ${task.assignee.name}`}
                                            >
                                              {task.assignee.name[0].toUpperCase()}
                                            </div>
                                          ) : (
                                            <FaUserCircle className="text-slate-600 h-5 w-5" title="Unassigned" />
                                          )}
                                          <span className="text-[9px] text-slate-500 truncate max-w-[80px]">{task.project?.name}</span>
                                        </div>

                                        {/* Status shifter */}
                                        <div className="flex gap-1.5">
                                          {columnStatus !== 'todo' && (
                                            <button 
                                              onClick={() => {
                                                const statuses = ['todo', 'in-progress', 'in-review', 'done'];
                                                const prevIdx = statuses.indexOf(columnStatus) - 1;
                                                moveTaskStatus(task, statuses[prevIdx]);
                                              }}
                                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-white"
                                            >
                                              <FaArrowLeft size={8} />
                                            </button>
                                          )}
                                          {columnStatus !== 'done' && (
                                            <button 
                                              onClick={() => {
                                                const statuses = ['todo', 'in-progress', 'in-review', 'done'];
                                                const nextIdx = statuses.indexOf(columnStatus) + 1;
                                                moveTaskStatus(task, statuses[nextIdx]);
                                              }}
                                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-white"
                                            >
                                              <FaArrowRight size={8} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 4. Team Page Tab */}
                {activeTab === 'Team' && (
                  <motion.div key="team" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-350">Workspace Collaborators</h3>
                    
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {team.map((userObj) => (
                        <div key={userObj._id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 flex items-center gap-4 hover:border-slate-700 transition shadow">
                          <div 
                            className="h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-inner"
                            style={{ backgroundColor: getAvatarColor(userObj.email) }}
                          >
                            {userObj.name[0].toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-semibold text-sm text-slate-100">{userObj.name}</h4>
                            <p className="text-xs text-slate-400 truncate">{userObj.email}</p>
                            <span className="inline-block mt-2 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md font-medium capitalize">{userObj.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. Calendar Tab */}
                {activeTab === 'Calendar' && (
                  <motion.div key="calendar" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-slate-300 capitalize">
                        {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 border border-slate-800 bg-slate-900 rounded-xl hover:bg-slate-800 text-xs">
                          <FaArrowLeft />
                        </button>
                        <button onClick={nextMonth} className="p-2 border border-slate-800 bg-slate-900 rounded-xl hover:bg-slate-800 text-xs">
                          <FaArrowRight />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 uppercase py-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1 border border-white/10 bg-slate-900/30 rounded-3xl overflow-hidden p-1 shadow">
                      {getDaysInMonth(calendarDate).map(({ dayNum, dateObj, isPadding }, idx) => {
                        const dateStr = dateObj.toISOString().split('T')[0];
                        const dayTasks = tasks.filter(t => t.deadline && t.deadline.split('T')[0] === dateStr);

                        return (
                          <div 
                            key={idx} 
                            className={`min-h-24 p-2 rounded-2xl flex flex-col justify-between border ${
                              isPadding ? 'bg-slate-950/20 border-transparent text-slate-650' : 'bg-slate-950 border-slate-850 hover:bg-slate-900'
                            }`}
                          >
                            <span className={`text-[10px] self-end font-semibold ${isPadding ? 'text-slate-600' : 'text-slate-400'}`}>{dayNum}</span>
                            <div className="space-y-1 overflow-y-auto max-h-16 mt-1.5">
                              {dayTasks.map(t => (
                                <div 
                                  key={t._id} 
                                  onClick={() => openEditTask(t)}
                                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded truncate text-white border ${
                                    t.status === 'done' ? 'bg-emerald-500/20 border-emerald-500/10 text-emerald-400' :
                                    t.priority === 'high' ? 'bg-rose-500/20 border-rose-500/10 text-rose-400' :
                                    'bg-cyan-500/20 border-cyan-500/10 text-cyan-400'
                                  } cursor-pointer`}
                                >
                                  {t.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 6. Settings Page Tab */}
                {activeTab === 'Settings' && (
                  <motion.div key="settings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="max-w-xl mx-auto rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">Profile Settings</h3>
                      <p className="text-xs text-slate-400">Update your workspace details and role classification</p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-400 mb-2">Display Name</span>
                        <input 
                          type="text" 
                          value={profileForm.name} 
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white"
                          placeholder="Alex Morgan" 
                        />
                      </label>

                      <label className="block">
                        <span className="block text-xs font-semibold text-slate-400 mb-2">Workspace Role</span>
                        <select 
                          value={profileForm.role} 
                          onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white"
                        >
                          <option value="owner">Owner / Lead</option>
                          <option value="member">Member</option>
                          <option value="manager">Project Manager</option>
                          <option value="guest">Guest</option>
                        </select>
                      </label>

                      <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-semibold text-sm text-white transition hover:brightness-110 shadow-lg shadow-cyan-500/10">
                        Save Updates
                      </button>
                    </form>
                  </motion.div>
                )}

              </AnimatePresence>
            )}
          </main>
        </div>

        {/* ========================================================================= */}
        {/* MODAL WINDOWS */}
        {/* ========================================================================= */}

        {/* A. Create Project Modal */}
        {showProjectModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
              <button onClick={() => setShowProjectModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-white transition"><FaTimes /></button>
              <h3 className="text-xl font-bold mb-1 text-slate-100">Create New Project</h3>
              <p className="text-xs text-slate-450 mb-6">Initialize a new board and assign team members.</p>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Project Name *</span>
                  <input required type="text" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" placeholder="Product Catalog Refresh" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Description</span>
                  <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white h-20 resize-none" placeholder="Task tracking for marketing rollout..." />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Category</span>
                    <input type="text" value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" placeholder="Design, Dev, Marketing..." />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Priority</span>
                    <select value={projectForm.priority} onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Deadline</span>
                  <input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" />
                </label>
                
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Team Members</span>
                  <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto border border-slate-800 p-2 rounded-2xl bg-slate-950">
                    {team.map(u => (
                      <label key={u._id} className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={projectForm.members.includes(u._id)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProjectForm({ ...projectForm, members: [...projectForm.members, u._id] });
                            } else {
                              setProjectForm({ ...projectForm, members: projectForm.members.filter(mId => mId !== u._id) });
                            }
                          }}
                          className="rounded border-slate-800 bg-slate-900" 
                        />
                        {u.name}
                      </label>
                    ))}
                  </div>
                </label>

                <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-semibold text-sm text-white transition hover:brightness-110 shadow-lg mt-2">
                  Create Project
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* B. Edit Project Modal */}
        {showEditProjectModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
              <button onClick={() => setShowEditProjectModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-white transition"><FaTimes /></button>
              <h3 className="text-xl font-bold mb-1 text-slate-100">Edit Project Settings</h3>
              <p className="text-xs text-slate-450 mb-6">Manage settings and member invitations.</p>
              
              <form onSubmit={handleUpdateProject} className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Project Name *</span>
                  <input required type="text" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Description</span>
                  <textarea value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white h-20 resize-none" />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Category</span>
                    <input type="text" value={projectForm.category} onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Priority</span>
                    <select value={projectForm.priority} onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Deadline</span>
                  <input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" />
                </label>
                
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Team Members</span>
                  <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto border border-slate-800 p-2 rounded-2xl bg-slate-950">
                    {team.map(u => (
                      <label key={u._id} className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={projectForm.members.includes(u._id)} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProjectForm({ ...projectForm, members: [...projectForm.members, u._id] });
                            } else {
                              setProjectForm({ ...projectForm, members: projectForm.members.filter(mId => mId !== u._id) });
                            }
                          }}
                          className="rounded border-slate-800 bg-slate-900" 
                        />
                        {u.name}
                      </label>
                    ))}
                  </div>
                </label>

                <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-semibold text-sm text-white transition hover:brightness-110 shadow-lg mt-2">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* C. Create Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
              <button onClick={() => setShowTaskModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-white transition"><FaTimes /></button>
              <h3 className="text-xl font-bold mb-1 text-slate-100">Create New Task</h3>
              <p className="text-xs text-slate-450 mb-6">Build a work item inside a project workflow.</p>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Project *</span>
                  <select required value={taskForm.project} onChange={(e) => setTaskForm({ ...taskForm, project: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Task Title *</span>
                  <input required type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" placeholder="Implement REST Endpoints" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Description</span>
                  <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white h-16 resize-none" placeholder="Provide implementation specs..." />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Priority</span>
                    <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Status</span>
                    <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="in-review">In Review</option>
                      <option value="done">Completed</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Assignee</span>
                    <select value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                      <option value="">Unassigned</option>
                      {team.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-xs font-medium text-slate-400 mb-2">Deadline</span>
                    <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" />
                  </label>
                </div>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Labels (comma separated)</span>
                  <input type="text" value={taskForm.labels} onChange={(e) => setTaskForm({ ...taskForm, labels: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" placeholder="frontend, documentation, bug" />
                </label>

                {/* Simple Checklist creator */}
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-2">Subtasks Checklist</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={taskForm.checklistInput} 
                      onChange={(e) => setTaskForm({ ...taskForm, checklistInput: e.target.value })} 
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 outline-none focus:border-cyan-400 text-xs text-white"
                      placeholder="Add subtask..." 
                    />
                    <button type="button" onClick={addChecklistItem} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs text-cyan-400 font-medium">Add</button>
                  </div>
                  {checklist.length > 0 && (
                    <div className="mt-2 space-y-1.5 border border-slate-850 p-2.5 rounded-2xl bg-slate-950 max-h-24 overflow-y-auto">
                      {checklist.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span>{item.title}</span>
                          <button type="button" onClick={() => removeChecklistItem(idx)} className="text-rose-500 hover:underline">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-semibold text-sm text-white transition hover:brightness-110 shadow-lg mt-2">
                  Create Task
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* D. Edit Task Modal */}
        {showEditTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl rounded-[2.5rem] border border-white/10 bg-slate-900 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowEditTaskModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-white transition"><FaTimes /></button>
              
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedTask.project?.name || 'Unassigned Project'}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-6">{selectedTask.title}</h3>

              <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
                
                {/* Left side: details & status edit */}
                <form onSubmit={handleUpdateTask} className="space-y-4">
                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-400 mb-2">Description</span>
                    <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white h-24 resize-none" />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-400 mb-2">Status</span>
                      <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="in-review">In Review</option>
                        <option value="done">Completed</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-400 mb-2">Priority</span>
                      <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-400 mb-2">Assignee</span>
                      <select value={taskForm.assignee} onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white">
                        <option value="">Unassigned</option>
                        {team.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs font-semibold text-slate-400 mb-2">Deadline</span>
                      <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" />
                    </label>
                  </div>

                  <label className="block">
                    <span className="block text-xs font-semibold text-slate-400 mb-2">Labels (comma separated)</span>
                    <input type="text" value={taskForm.labels} onChange={(e) => setTaskForm({ ...taskForm, labels: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-sm text-white" />
                  </label>

                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-400 px-4 py-3 font-semibold text-xs text-white transition hover:brightness-110 shadow-lg">
                      Save Changes
                    </button>
                    <button type="button" onClick={() => handleDeleteTask(selectedTask._id)} className="rounded-2xl border border-slate-850 hover:bg-rose-950/20 text-rose-400 px-5 py-3 transition">
                      <FaTrash />
                    </button>
                  </div>
                </form>

                {/* Right side: Checklist and Comments */}
                <div className="space-y-6 border-l border-slate-850 pl-6">
                  {/* Checklist Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Subtasks</h4>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={taskForm.checklistInput} 
                        onChange={(e) => setTaskForm({ ...taskForm, checklistInput: e.target.value })} 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 outline-none focus:border-cyan-400 text-xs text-white"
                        placeholder="Add subtask item..." 
                      />
                      <button type="button" onClick={addChecklistItem} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs rounded-xl font-medium">Add</button>
                    </div>

                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                      {checklist.length === 0 ? (
                        <p className="text-[10px] text-slate-650">No subtasks defined.</p>
                      ) : (
                        checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-950/50 border border-slate-850 p-2.5 rounded-xl text-xs">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={item.done} 
                                onChange={() => toggleChecklistItem(idx)}
                                className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-0 focus:ring-offset-0" 
                              />
                              <span className={item.done ? 'line-through text-slate-500' : 'text-slate-300'}>{item.title}</span>
                            </label>
                            <button type="button" onClick={() => removeChecklistItem(idx)} className="text-slate-500 hover:text-rose-400 transition"><FaTimes size={10} /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity & Comments</h4>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 outline-none focus:border-cyan-400 text-xs text-white"
                        placeholder="Write a comment..." 
                      />
                      <button type="button" onClick={addComment} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 text-xs rounded-xl font-medium">Post</button>
                    </div>

                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                      {comments.length === 0 ? (
                        <p className="text-[10px] text-slate-650">No comments posted yet.</p>
                      ) : (
                        comments.map((comment, idx) => {
                          const parts = comment.split(': ');
                          const author = parts[0];
                          const body = parts.slice(1).join(': ');
                          return (
                            <div key={idx} className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-xl text-xs leading-normal">
                              <span className="font-bold text-[11px] text-slate-400 mr-2">{author}</span>
                              <span className="text-slate-350">{body}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
