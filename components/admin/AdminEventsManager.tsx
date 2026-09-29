import React, { useState } from 'react';
import {
  Plus,
  MapPin,
  ShieldAlert,
  Trash2,
  Edit3,
  Calendar,
  Users,
  CheckCircle2,
  Filter,
  Search,
  Building,
  Clock,
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowUpDown,
  Download,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export type EventCategory = 'Open Day' | 'Advising Session' | 'Workshop' | 'Webinar' | 'Campus Tour';

export interface EventItem {
  id?: string;
  title: string;
  category: EventCategory;
  host: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  registeredCount?: number;
}

interface AdminEventsManagerProps {
  userPermissions?: string[]; // e.g. ['manage_events'] or ['super_admin']
  onPermissionsChange?: (perms: string[]) => void;
}

export const AdminEventsManager: React.FC<AdminEventsManagerProps> = ({
  userPermissions = ['manage_events', 'super_admin'],
  onPermissionsChange
}) => {
  // Current Permissions State (Supports Interactive Simulation)
  const [currentPermissions, setCurrentPermissions] = useState<string[]>(userPermissions);

  // Check RBAC Permissions: 'manage_events' OR 'super_admin'
  const canManageEvents =
    currentPermissions.includes('manage_events') || currentPermissions.includes('super_admin');

  // Initial Events Database Seed
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: 'evt-1',
      title: 'University Spring Open Day & Campus Discovery 2026',
      category: 'Open Day',
      host: 'Vice-Chancellor Prof. Mark Sterling & Faculty Deans',
      description: 'Experience campus life firsthand! Meet academic deans, explore robotics and science labs, join guided architectural tours, and attend live faculty panels.',
      date: '2026-09-12T09:30',
      location: 'Main University Campus, The Great Hall',
      capacity: 1500,
      registeredCount: 842,
    },
    {
      id: 'evt-2',
      title: '1-on-1 Personalized Admissions & Scholarship Consultation',
      category: 'Advising Session',
      host: 'Senior Admissions Advisors (Sarah Jenkins, Liam Patel)',
      description: 'Private 30-minute advising sessions for high school seniors and transfer students to evaluate ATAR/GPA prerequisites and financial aid.',
      date: '2026-09-18T10:00',
      location: 'Student Admissions Center (Room 104) & Google Meet',
      capacity: 40,
      registeredCount: 32,
    },
    {
      id: 'evt-3',
      title: 'Computer Science & Generative AI Hands-On Masterclass',
      category: 'Workshop',
      host: 'Prof. Nathan Reed & Dr. Sarah Lin',
      description: 'Interactive coding lab session where prospective students build and train neural network agents in our high-performance GPU lab.',
      date: '2026-09-22T14:00',
      location: 'Turing Computer Lab 3, Engineering Precinct',
      capacity: 60,
      registeredCount: 58,
    },
    {
      id: 'evt-4',
      title: 'International Student Visa & Accommodation Briefing',
      category: 'Webinar',
      host: 'International Student Recruitment & Compliance Team',
      description: 'Global briefing webinar covering Subclass 500 visa guidelines, work rights, health cover (OSHC), and on-campus residential housing.',
      date: '2026-09-25T18:00',
      location: 'Online Live Stream via Google Meet',
      capacity: 500,
      registeredCount: 310,
    },
    {
      id: 'evt-5',
      title: 'Twilight Campus Architecture & Residential Colleges Tour',
      category: 'Campus Tour',
      host: 'Senior Student Ambassadors',
      description: 'Sunset walking tour of historic quadrangles, modern research hub, athletic complex, and student dining halls.',
      date: '2026-09-28T16:30',
      location: 'Starts at Visitor Information Welcome Pavilion',
      capacity: 80,
      registeredCount: 65,
    }
  ]);

  // Filtering & Search State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<EventItem>({
    title: '',
    category: 'Open Day',
    host: '',
    description: '',
    date: '',
    location: '',
    capacity: 100,
    registeredCount: 0,
  });

  // Toast Feedback State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const togglePermissionRole = (role: 'super_admin' | 'manage_events' | 'read_only') => {
    let newPerms: string[] = [];
    if (role === 'super_admin') {
      newPerms = ['super_admin', 'manage_events'];
    } else if (role === 'manage_events') {
      newPerms = ['manage_events'];
    } else {
      newPerms = ['view_analytics'];
    }
    setCurrentPermissions(newPerms);
    if (onPermissionsChange) onPermissionsChange(newPerms);
    showToast(`Role switched to: ${role === 'read_only' ? 'Read-Only (Access Denied)' : role}`, 'info');
  };

  const handleOpenAddModal = () => {
    setEditingEventId(null);
    setFormData({
      title: '',
      category: 'Open Day',
      host: '',
      description: '',
      date: '',
      location: '',
      capacity: 100,
      registeredCount: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEditingEventId(event.id || null);
    setFormData({
      title: event.title,
      category: event.category,
      host: event.host,
      description: event.description,
      date: event.date,
      location: event.location,
      capacity: event.capacity,
      registeredCount: event.registeredCount || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.date || !formData.host.trim()) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    if (editingEventId) {
      // Edit existing event
      setEvents(prev =>
        prev.map(item => (item.id === editingEventId ? { ...formData, id: editingEventId } : item))
      );
      showToast(`Event "${formData.title}" updated successfully!`, 'success');
    } else {
      // Add new event
      const newEvent: EventItem = {
        ...formData,
        id: `evt-${Date.now()}`,
        registeredCount: 0,
      };
      setEvents(prev => [newEvent, ...prev]);
      showToast(`New event "${formData.title}" created!`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id?: string, title?: string) => {
    if (confirm(`Are you sure you want to delete "${title || 'this event'}"?`)) {
      setEvents(prev => prev.filter(event => event.id !== id));
      showToast(`Event deleted successfully.`, 'info');
    }
  };

  // Category badge styling helper
  const getCategoryBadgeClass = (category: EventCategory) => {
    switch (category) {
      case 'Open Day':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Advising Session':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Workshop':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Webinar':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Campus Tour':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Filtered Events
  const filteredEvents = events.filter(ev => {
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || ev.category === selectedCategoryFilter;
    const matchesSearch =
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Access Denied State rendering if user permissions check fails
  if (!canManageEvents) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 space-y-6">
        {/* Permission Simulator Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-2xl">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                RBAC Security Layer Active
              </span>
              <span className="text-sm font-semibold text-white">
                Current Role: <span className="text-rose-400 font-mono">Read-Only Staff (No manage_events)</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Simulate Authorization:</span>
            <button
              onClick={() => togglePermissionRole('super_admin')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Grant `super_admin`
            </button>
            <button
              onClick={() => togglePermissionRole('manage_events')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Grant `manage_events`
            </button>
          </div>
        </div>

        {/* Centered Access Denied Alert Card */}
        <div className="p-8 max-w-xl mx-auto text-center bg-rose-50/80 rounded-3xl border border-rose-200 text-rose-800 space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-rose-950">Access Restricted</h3>
            <p className="text-xs text-rose-700 mt-2 leading-relaxed">
              You do not have the required RBAC permissions (<code className="bg-rose-100 font-mono font-bold px-1.5 py-0.5 rounded text-rose-900">manage_events</code> or <code className="bg-rose-100 font-mono font-bold px-1.5 py-0.5 rounded text-rose-900">super_admin</code>) to create or manage institutional calendar events.
            </p>
          </div>
          <div className="pt-2 text-xs text-slate-500">
            Contact your EduPulse System Administrator to request elevated calendar management privileges.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all duration-300 animate-slide-in bg-slate-900 text-white border border-slate-700">
          <CheckCircle2 className={`w-4 h-4 ${toast.type === 'success' ? 'text-emerald-400' : 'text-purple-400'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & RBAC Role Simulation Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider border border-purple-200">
                RBAC Security Protected
              </span>
              <span className="text-xs text-slate-400 font-medium">&bull; EduPulse Admissions Calendar</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Events & Calendar Management
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Create, edit, and schedule prospective student open days, campus tours, and advising masterclasses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-purple-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
            <button
              onClick={() => showToast('Exporting event RSVPs CSV report...', 'success')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" /> Export RSVPs
            </button>
          </div>
        </div>

        {/* Live RBAC Permission Tester Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs">
          <div className="flex items-center gap-2 text-purple-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Authorized Permissions: <strong className="font-mono text-purple-950">[`manage_events`, `super_admin`]</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Test RBAC Access:</span>
            <button
              onClick={() => togglePermissionRole('super_admin')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                currentPermissions.includes('super_admin')
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              SuperAdmin
            </button>
            <button
              onClick={() => togglePermissionRole('manage_events')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                currentPermissions.includes('manage_events') && !currentPermissions.includes('super_admin')
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Event Manager
            </button>
            <button
              onClick={() => togglePermissionRole('read_only')}
              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold text-[11px] transition-all"
            >
              Revoke Access (Test Lockout)
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {['ALL', 'Open Day', 'Advising Session', 'Workshop', 'Webinar', 'Campus Tour'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search event, host or location..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </div>
      </div>

      {/* Responsive Data Table & Grid Container */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 min-w-[240px]">Event Title & Venue</th>
                <th className="p-4">Category</th>
                <th className="p-4 min-w-[160px]">Presenter / Host</th>
                <th className="p-4 min-w-[150px]">Date & Time</th>
                <th className="p-4 min-w-[140px]">RSVP Capacity</th>
                <th className="p-4 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No events found matching criteria. Click <strong>"Add Event"</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(event => {
                  const registered = event.registeredCount || 0;
                  const pct = Math.round((registered / event.capacity) * 100);

                  return (
                    <tr key={event.id} className="hover:bg-purple-50/20 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">{event.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate max-w-xs">{event.location}</span>
                        </div>
                        {event.description && (
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            {event.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border ${getCategoryBadgeClass(event.category)}`}>
                          {event.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-800 font-semibold">{event.host}</td>
                      <td className="p-4 text-slate-700">
                        <div className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-semibold">
                            <span className="text-slate-800">{registered} / {event.capacity}</span>
                            <span className={pct >= 90 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                              {pct}% Full
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${pct >= 90 ? 'bg-rose-500' : 'bg-purple-600'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(event)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id, event.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingEventId ? 'Edit Calendar Event' : 'Add New Calendar Event'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure prospective student admissions event details and RSVP limits.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University Spring Open Day 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as EventCategory })}
                  >
                    <option value="Open Day">Open Day</option>
                    <option value="Advising Session">Advising Session</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Campus Tour">Campus Tour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capacity (Max RSVPs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Host / Presenter</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vice-Chancellor Prof. Mark Sterling"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.host}
                  onChange={e => setFormData({ ...formData, host: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / Meeting Link</label>
                  <input
                    type="text"
                    required
                    placeholder="Campus venue or Google Meet URL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide overview details about this admissions event..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md transition-all"
                >
                  {editingEventId ? 'Update Event' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
