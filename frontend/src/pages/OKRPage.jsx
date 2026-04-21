import React, { useState } from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {
    Target, Plus, ChevronDown, ChevronRight, TrendingUp, AlertTriangle,
    AlertCircle, CheckCircle2, User, Calendar, Loader2, X, Link as LinkIcon,
    BarChart3, ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { okrService } from '../services/api/apiServices';

const STATUS_CONFIG = {
    on_track: { label: 'On Track', color: 'bg-green-100 text-green-700', icon: TrendingUp },
    at_risk: { label: 'At Risk', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    behind: { label: 'Behind', color: 'bg-red-100 text-red-700', icon: AlertCircle },
    completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
};

const LEVEL_CONFIG = {
    company: { label: 'Company', color: 'from-violet-500 to-purple-600' },
    department: { label: 'Department', color: 'from-blue-500 to-indigo-600' },
    team: { label: 'Team', color: 'from-emerald-500 to-teal-600' },
    individual: { label: 'Individual', color: 'from-amber-500 to-orange-600' },
};

const ProgressBar = ({ value, size = 'md' }) => {
    const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
    let color = 'bg-green-500';
    if (value < 40) color = 'bg-red-500';
    else if (value < 70) color = 'bg-amber-500';

    return (
        <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', h)}>
            <div
                className={cn('h-full rounded-full transition-all duration-500', color)}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    );
};

const KeyResultCard = ({ kr }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{kr.title}</p>
            <div className="flex items-center gap-3 mt-1.5">
                <ProgressBar value={kr.progress} size="sm" />
                <span className="text-xs font-bold text-slate-500 shrink-0 w-10 text-right">{kr.progress}%</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                <span>{kr.currentValue} / {kr.targetValue} {kr.unit}</span>
                {kr.linkedTasks?.length > 0 && (
                    <span className="flex items-center gap-0.5">
                        <LinkIcon className="w-2.5 h-2.5" />{kr.linkedTasks.length} tasks
                    </span>
                )}
            </div>
        </div>
    </div>
);

const ObjectiveCard = ({ objective }) => {
    const [expanded, setExpanded] = useState(false);
    const status = STATUS_CONFIG[objective.status] || STATUS_CONFIG.on_track;
    const level = LEVEL_CONFIG[objective.level] || LEVEL_CONFIG.team;
    const StatusIcon = status.icon;

    return (
        <div className="glass-card overflow-hidden">
            <div
                className="p-4 cursor-pointer hover:bg-slate-50/50 transition-all"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start gap-3">
                    <div className={cn('w-1 h-12 rounded-full bg-gradient-to-b shrink-0', level.color)} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded', status.color)}>
                                {status.label}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{level.label}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{objective.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <ProgressBar value={objective.progress} />
                            <span className="text-xs font-black text-slate-600 shrink-0 w-10 text-right">{objective.progress}%</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {objective.owner && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {objective.owner.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                    {objective.description && <p className="text-xs text-slate-500 mb-3">{objective.description}</p>}
                    {objective.keyResults && objective.keyResults.length > 0 ? (
                        objective.keyResults.map((kr) => <KeyResultCard key={kr._id} kr={kr} />)
                    ) : (
                        <p className="text-xs text-slate-400 text-center py-4">No key results defined yet</p>
                    )}
                </div>
            )}
        </div>
    );
};

const CreateOKRModal = ({ isOpen, onClose, onSubmit, isPending }) => {
    const [form, setForm] = useState({
        title: '', description: '', level: 'team', period: 'Q2-2026', owner: '',
    });
    const [krList, setKrList] = useState([]);
    const [newKR, setNewKR] = useState({ title: '', targetValue: 100, metricType: 'percentage', unit: '%' });

    if (!isOpen) return null;

    const addKR = () => {
        if (newKR.title.trim()) {
            setKrList([...krList, { ...newKR }]);
            setNewKR({ title: '', targetValue: 100, metricType: 'percentage', unit: '%' });
        }
    };

    const handleSubmit = () => {
        onSubmit({ objective: form, keyResults: krList });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 italic">New Objective</h2>
                        <p className="text-xs text-slate-400 mt-1">Define your goal and measurable key results</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Objective Title</label>
                        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Increase platform adoption by 50%" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Context and reasoning for this objective..." rows={2} className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Level</label>
                            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none">
                                <option value="company">Company</option>
                                <option value="department">Department</option>
                                <option value="team">Team</option>
                                <option value="individual">Individual</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Period</label>
                            <input type="text" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                                placeholder="Q2-2026" className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                        </div>
                    </div>

                    {/* Key Results */}
                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Key Results</h4>
                        {krList.map((kr, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg mb-2 text-sm text-green-700">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span className="flex-1">{kr.title}</span>
                                <span className="text-xs">Target: {kr.targetValue}{kr.unit}</span>
                                <button onClick={() => setKrList(krList.filter((_, j) => j !== i))} className="p-1 hover:bg-green-100 rounded"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input type="text" value={newKR.title} onChange={(e) => setNewKR({ ...newKR, title: e.target.value })}
                                placeholder="Key result title..." className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && addKR()} />
                            <input type="number" value={newKR.targetValue} onChange={(e) => setNewKR({ ...newKR, targetValue: Number(e.target.value) })}
                                className="w-20 px-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none text-center" />
                            <button onClick={addKR} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">Add</button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-6 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
                    <button onClick={handleSubmit} disabled={!form.title.trim() || isPending}
                        className="btn-primary text-xs">
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
                        Create Objective
                    </button>
                </div>
            </div>
        </div>
    );
};

const OKRPage = () => {
    const { useQuery, useMutation, useQueryClient } = ReactQuery;
    const queryClient = useQueryClient();
    const [period, setPeriod] = useState('Q2-2026');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['okr-dashboard', period],
        queryFn: async () => {
            const res = await okrService.getDashboard(period);
            return res;
        },
    });

    const createMutation = useMutation({
        mutationFn: async ({ objective, keyResults }) => {
            const objRes = await okrService.createObjective({ ...objective, owner: objective.owner || undefined });
            const createdObj = objRes.objective;
            // Create key results
            for (const kr of keyResults) {
                await okrService.createKeyResult({ ...kr, objectiveId: createdObj._id });
            }
            return createdObj;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['okr-dashboard'] });
            setIsCreateOpen(false);
        },
    });

    const stats = data?.stats || { total: 0, onTrack: 0, atRisk: 0, behind: 0, completed: 0, avgProgress: 0 };
    const byLevel = data?.byLevel || {};

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 italic tracking-tight">OKRs</h1>
                    <p className="text-sm text-slate-400 mt-1">Objectives & Key Results — track strategic goals</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}
                        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl outline-none">
                        <option value="Q1-2026">Q1 2026</option>
                        <option value="Q2-2026">Q2 2026</option>
                        <option value="Q3-2026">Q3 2026</option>
                        <option value="Q4-2026">Q4 2026</option>
                    </select>
                    <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
                        <Plus className="w-4 h-4" /> New Objective
                    </button>
                </div>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total', value: stats.total, icon: Target, color: 'text-slate-600' },
                    { label: 'On Track', value: stats.onTrack, icon: TrendingUp, color: 'text-green-600' },
                    { label: 'At Risk', value: stats.atRisk, icon: AlertTriangle, color: 'text-amber-600' },
                    { label: 'Behind', value: stats.behind, icon: AlertCircle, color: 'text-red-600' },
                    { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: BarChart3, color: 'text-primary' },
                ].map((s) => (
                    <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                        <s.icon className={cn('w-5 h-5', s.color)} />
                        <div>
                            <p className="text-xl font-black text-slate-900">{s.value}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
            ) : (
                /* Objectives by Level */
                Object.entries(LEVEL_CONFIG).map(([levelKey, levelCfg]) => {
                    const objectives = byLevel[levelKey] || [];
                    if (objectives.length === 0) return null;
                    return (
                        <div key={levelKey}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={cn('w-3 h-3 rounded-full bg-gradient-to-r', levelCfg.color)} />
                                <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">{levelCfg.label} Objectives</h2>
                                <span className="text-xs text-slate-400 ml-1">({objectives.length})</span>
                            </div>
                            <div className="space-y-3">
                                {objectives.map((obj) => <ObjectiveCard key={obj._id} objective={obj} />)}
                            </div>
                        </div>
                    );
                })
            )}

            {!isLoading && stats.total === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-6">
                        <Target className="w-10 h-10 text-violet-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 italic mb-2">Set Your First OKR</h2>
                    <p className="text-sm text-slate-400 max-w-sm mb-6">
                        Define objectives and measurable key results to align your team on strategic goals.
                    </p>
                    <button onClick={() => setIsCreateOpen(true)} className="btn-primary">
                        <Plus className="w-4 h-4" /> Create Objective
                    </button>
                </div>
            )}

            <CreateOKRModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={(data) => createMutation.mutate(data)}
                isPending={createMutation.isPending}
            />
        </div>
    );
};

export default OKRPage;
