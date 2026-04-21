import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  User, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  PlusCircle, 
  Trash2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Share2
} from 'lucide-react';
import axios from '../../../services/api/axios';
import { auditService } from '../../../services/api/apiServices';
import { format } from 'date-fns';
import useSocket from '../../../hooks/useSocket';
import useAuthStore from '../../../store/useAuth';

const AuditTimeline = ({ entityId, entityType }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const { user } = useAuthStore();
  const { subscribeToEvent, unsubscribeFromEvent } = useSocket(user?.organizationId || user?.orgId);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await auditService.getEntityHistory(entityId);
        if (response.data.success) {
          setLogs(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch audit history:', err);
        setError('Could not load history');
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      fetchHistory();
    }
  }, [entityId]);

  useEffect(() => {
    const handleNewLog = (newLog) => {
      // Check if the log belongs to this entity
      if (newLog.entityId === entityId || newLog.entityId?._id === entityId) {
        setLogs(prev => {
          // Prevent duplicates if the socket and fetch happen simultaneously
          if (prev.find(l => l._id === newLog._id)) return prev;
          return [newLog, ...prev];
        });
      }
    };

    subscribeToEvent('audit:new', handleNewLog);
    return () => unsubscribeFromEvent('audit:new', handleNewLog);
  }, [entityId, subscribeToEvent, unsubscribeFromEvent]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await auditService.exportEntityHistory(entityId);
      if (response.data.success && response.data.url) {
        // Create an absolute URL if needed or use as is if it's relative to public
        const downloadUrl = response.data.url.startsWith('http') 
          ? response.data.url 
          : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.data.url}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `Audit_History_${entityId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <PlusCircle className="w-5 h-5 text-emerald-400" />;
      case 'UPDATE': return <Edit3 className="w-5 h-5 text-amber-400" />;
      case 'STATUS_CHANGE': return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      case 'DELETE': return <Trash2 className="w-5 h-5 text-rose-400" />;
      default: return <History className="w-5 h-5 text-slate-400" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
      case 'UPDATE': return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
      case 'STATUS_CHANGE': return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
      case 'DELETE': return 'from-rose-500/20 to-rose-500/5 border-rose-500/30';
      default: return 'from-slate-500/20 to-slate-500/5 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <History className="w-8 h-8 text-blue-500 opacity-50" />
        </motion.div>
        <p className="text-slate-400 animate-pulse text-sm font-medium">Scanning history archives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-rose-400 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
           <History className="w-8 h-8 opacity-30" />
        </div>
        <p className="text-sm">No recorded activity for this record yet.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900/80 backdrop-blur-md py-2 z-20 px-2 rounded-xl border border-white/5">
        <h3 className="text-white font-bold flex items-center space-x-2">
          <History className="w-5 h-5 text-blue-500" />
          <span>Audit Timeline</span>
        </h3>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold transition-all disabled:opacity-50"
        >
          {exporting ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Clock className="w-3.5 h-3.5" />
            </motion.div>
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{exporting ? 'Generating...' : 'Download Report'}</span>
        </button>
      </div>

      <div className="absolute left-6 top-10 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-slate-700/50 to-transparent"></div>
      
      <AnimatePresence>
        {logs.map((log, index) => (
          <motion.div
            key={log._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-14"
          >
            {/* Timeline Dot */}
            <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-2 bg-slate-900 z-10 
              ${log.action === 'CREATE' ? 'border-emerald-500' : 
                log.action === 'UPDATE' ? 'border-amber-500' : 
                log.action === 'DELETE' ? 'border-rose-500' : 'border-blue-500'}`}>
            </div>

            <div className={`bg-gradient-to-br p-4 rounded-2xl border backdrop-blur-md shadow-lg transition-all
              ${getActionColor(log.action)}`}>
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-900/50 rounded-lg border border-white/5">
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">
                      {log.action.replace('_', ' ')}
                    </h4>
                    <div className="flex items-center space-x-2 text-slate-400 text-xs">
                      <User className="w-3 h-3" />
                      <span>{log.userId?.name || 'System User'}</span>
                      <span className="opacity-30">•</span>
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(log.timestamp), 'MMM dd, yyyy • HH:mm')}</span>
                    </div>
                  </div>
                </div>
                
                {log.changes && log.changes.length > 0 && (
                  <button 
                    onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    {expandedId === log._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {log.action === 'CREATE' && (
                <p className="text-xs text-slate-300 ml-1">New {entityType} initialized in the system.</p>
              )}

              {log.action === 'STATUS_CHANGE' && log.changes?.find(c => c.field === 'status') && (
                <div className="flex items-center space-x-2 mt-2 ml-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] line-through">
                    {log.changes.find(c => c.field === 'status').oldValue}
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                    ${log.changes.find(c => c.field === 'status').newValue === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {log.changes.find(c => c.field === 'status').newValue}
                  </span>
                </div>
              )}

              <AnimatePresence>
                {expandedId === log._id && log.changes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4 pt-4 border-t border-white/10"
                  >
                    <div className="space-y-3">
                      {log.changes.map((change, idx) => (
                        <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                          <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">
                            {change.field.replace(/([A-Z])/g, ' $1')}
                          </label>
                          <div className="grid grid-cols-2 gap-4 items-center">
                            <div>
                               <p className="text-[10px] text-slate-600 mb-0.5">FROM</p>
                               <p className="text-xs text-rose-300/80 truncate font-mono">
                                 {JSON.stringify(change.oldValue) || 'NULL'}
                               </p>
                            </div>
                            <div>
                               <p className="text-[10px] text-slate-600 mb-0.5">TO</p>
                               <p className="text-xs text-emerald-300 font-medium truncate font-mono">
                                 {JSON.stringify(change.newValue)}
                               </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AuditTimeline;
