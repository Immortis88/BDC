import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { adminService } from '../services/adminService.js';
import {
  Inbox as InboxIcon,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  Lock,
  X,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import LoadingState from '../components/LoadingState.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function InboxAdminPage() {
  const { isSuperAdmin, hasPermission } = useAdminAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRead, setFilterRead] = useState('ALL'); // ALL, UNREAD, READ
  const [selectedMessage, setSelectedMessage] = useState(null);

  const canAccessInbox = isSuperAdmin || hasPermission('inbox.read');

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await adminService.inbox.getAll();
      if (res.success) {
        setMessages(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessInbox) {
      loadMessages();
    }
  }, [canAccessInbox]);

  const handleToggleRead = async (message, e) => {
    if (e) e.stopPropagation();
    const nextRead = !message.is_read;
    const res = await adminService.inbox.toggleRead(message.id, nextRead);
    if (res.success) {
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: nextRead } : m));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage(prev => ({ ...prev, is_read: nextRead }));
      }
    }
  };

  const handleDeleteMessage = async (message, e) => {
    if (e) e.stopPropagation();
    if (!isSuperAdmin) return;

    const result = await Swal.fire({
      title: 'Delete Inquiry?',
      text: `Delete inquiry from ${message.full_name || message.sender_name}? This will remove it from the inbox.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B91C1C',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await adminService.inbox.deleteMessage(message.id);
      if (res.success) {
        setMessages(prev => prev.filter(m => m.id !== message.id));
        if (selectedMessage?.id === message.id) {
          setSelectedMessage(null);
        }
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Inquiry removed successfully.',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: res.message || 'Unable to delete inquiry.'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Unexpected error occurred.'
      });
    }
  };

  const handleOpenDetail = (message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      handleToggleRead(message);
    }
  };

  if (!canAccessInbox) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-xs my-12">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Inbox Access Restricted</h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          Your administrator account does not possess the <code>inbox.read</code> permission grant required to view public contact messages.
        </p>
      </div>
    );
  }

  const filteredMessages = messages.filter(m => {
    const fullName = m.full_name || m.sender_name || '';
    const email = m.email || m.sender_email || '';
    const subject = m.subject || '';
    const message = m.message || '';
    const matchesSearch =
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      subject.toLowerCase().includes(search.toLowerCase()) ||
      message.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterRead === 'UNREAD') return !m.is_read;
    if (filterRead === 'READ') return m.is_read;
    return true;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-6">
      {/* Back to Camps Link */}
      <div>
        <Link
          to="/admin/camp"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Camps</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#102B46] tracking-tight">
              Contact Inquiries Inbox
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#981B24] text-white">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Incoming public inquiries submitted via the website contact form.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by sender, email, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#981B24]/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilterRead('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors ${filterRead === 'ALL' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
            >
              All ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRead('UNREAD')}
              className={`px-3 py-1 rounded-lg transition-colors ${filterRead === 'UNREAD' ? 'bg-white shadow-2xs font-bold text-[#981B24]' : 'text-slate-600'}`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterRead('READ')}
              className={`px-3 py-1 rounded-lg transition-colors ${filterRead === 'READ' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
            >
              Read ({messages.length - unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      {loading ? (
        <LoadingState message="Loading inbox messages..." />
      ) : filteredMessages.length === 0 ? (
        <EmptyState
          title="No Messages in Inbox"
          description={search ? 'No inquiries matched your search criteria.' : 'No public contact inquiries have been received yet.'}
          icon={InboxIcon}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredMessages.map(msg => (
            <div
              key={msg.id}
              onClick={() => handleOpenDetail(msg)}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                msg.is_read ? 'hover:bg-slate-50' : 'bg-rose-50/20 hover:bg-rose-50/40 font-medium'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => handleToggleRead(msg, e)}
                  title={msg.is_read ? 'Mark as Unread' : 'Mark as Read'}
                  className="mt-1 text-slate-400 hover:text-[#981B24] shrink-0"
                >
                  {msg.is_read ? (
                    <CheckCircle2 className="w-5 h-5 text-slate-400 hover:text-rose-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#981B24] fill-[#981B24]" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {msg.full_name || msg.sender_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      &lt;{msg.email || msg.sender_email}&gt;
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1">
                    {msg.subject}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                    {msg.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs text-slate-400 shrink-0 pl-8 sm:pl-0">
                <span>{new Date(msg.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} IST</span>
                <span className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#981B24] hover:border-slate-300" title="View inquiry">
                  <Eye className="w-3.5 h-3.5" />
                </span>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMessage(msg, e)}
                    className="p-1 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-rose-50"
                    title="Delete Inquiry (Super Admin)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Inquiry Details
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedMessage.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Meta Card */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">From:</span>
                <span className="font-bold text-slate-900">{selectedMessage.full_name || selectedMessage.sender_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <a href={`mailto:${selectedMessage.email || selectedMessage.sender_email}`} className="text-[#981B24] font-semibold hover:underline">
                  {selectedMessage.email || selectedMessage.sender_email}
                </a>
              </div>
              {selectedMessage.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Phone Number:</span>
                  <a href={`tel:${selectedMessage.phone}`} className="text-slate-800 font-semibold hover:underline">
                    {selectedMessage.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Received At:</span>
                <span className="text-slate-700">{new Date(selectedMessage.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase block mb-1.5">
                Message Content
              </span>
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-800 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {selectedMessage.message}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleRead(selectedMessage)}
                  className="text-xs font-semibold text-slate-600 hover:text-[#981B24]"
                >
                  {selectedMessage.is_read ? 'Mark as Unread' : 'Mark as Read'}
                </button>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(selectedMessage)}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
