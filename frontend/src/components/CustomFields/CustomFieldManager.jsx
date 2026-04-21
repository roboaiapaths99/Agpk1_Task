import React, { useState } from 'react';
import * as ReactQuery from '@tanstack/react-query';
import {
    Plus, Trash2, GripVertical, Type, Hash, Calendar, ChevronDown,
    CheckSquare, Link, User, DollarSign, X, Settings2, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { customFieldService } from '../../services/api/apiServices';

const FIELD_TYPES = [
    { value: 'text', label: 'Text', icon: Type },
    { value: 'number', label: 'Number', icon: Hash },
    { value: 'date', label: 'Date', icon: Calendar },
    { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
    { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
    { value: 'url', label: 'URL', icon: Link },
    { value: 'user', label: 'User', icon: User },
    { value: 'currency', label: 'Currency', icon: DollarSign },
];

const CustomFieldManager = ({ projectId }) => {
    const { useQuery, useMutation, useQueryClient } = ReactQuery;
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newField, setNewField] = useState({ name: '', fieldType: 'text', options: [], isRequired: false });
    const [newOption, setNewOption] = useState('');

    const { data: fieldsData, isLoading } = useQuery({
        queryKey: ['custom-fields', projectId],
        queryFn: async () => {
            const res = await customFieldService.getAll({ projectId, appliesTo: 'task' });
            return res.data.fields;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data) => customFieldService.create({ ...data, projectId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
            setIsCreating(false);
            setNewField({ name: '', fieldType: 'text', options: [], isRequired: false });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => customFieldService.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-fields'] }),
    });

    const addOption = () => {
        if (newOption.trim()) {
            setNewField({
                ...newField,
                options: [...newField.options, { label: newOption.trim(), value: newOption.trim().toLowerCase().replace(/\s+/g, '_') }],
            });
            setNewOption('');
        }
    };

    const removeOption = (index) => {
        setNewField({
            ...newField,
            options: newField.options.filter((_, i) => i !== index),
        });
    };

    const fields = fieldsData || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 italic">Custom Fields</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Define custom data points for your tasks.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary text-xs"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                </button>
            </div>

            {/* Existing Fields */}
            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : fields.length > 0 ? (
                <div className="space-y-2">
                    {fields.map((field) => {
                        const typeInfo = FIELD_TYPES.find(t => t.value === field.fieldType);
                        const Icon = typeInfo?.icon || Type;
                        return (
                            <div key={field._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-all group">
                                <GripVertical className="w-4 h-4 text-slate-200 group-hover:text-slate-400 cursor-grab" />
                                <div className={cn("p-2 rounded-lg", "bg-slate-100")}>
                                    <Icon className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-bold text-slate-800">{field.name}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider ml-2">{field.fieldType}</span>
                                    {field.isRequired && <span className="text-[10px] text-red-400 ml-2">REQUIRED</span>}
                                </div>
                                {field.fieldType === 'dropdown' && (
                                    <div className="flex gap-1 flex-wrap">
                                        {field.options.slice(0, 3).map((opt, i) => (
                                            <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{opt.label}</span>
                                        ))}
                                        {field.options.length > 3 && <span className="text-[10px] text-slate-400">+{field.options.length - 3}</span>}
                                    </div>
                                )}
                                <button
                                    onClick={() => deleteMutation.mutate(field._id)}
                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : !isCreating ? (
                <div className="text-center py-8">
                    <Settings2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No custom fields defined yet.</p>
                </div>
            ) : null}

            {/* Create New Field Form */}
            {isCreating && (
                <div className="glass-card p-6 space-y-4 border-primary/20">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">New Custom Field</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Field Name</label>
                            <input
                                type="text"
                                value={newField.name}
                                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                placeholder="e.g., Budget, Region, Risk Level"
                                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Field Type</label>
                            <select
                                value={newField.fieldType}
                                onChange={(e) => setNewField({ ...newField, fieldType: e.target.value, options: [] })}
                                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                {FIELD_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dropdown options */}
                    {newField.fieldType === 'dropdown' && (
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Options</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    placeholder="Add option..."
                                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    onKeyDown={(e) => e.key === 'Enter' && addOption()}
                                />
                                <button onClick={addOption} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200">
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {newField.options.map((opt, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                                        {opt.label}
                                        <button onClick={() => removeOption(i)}><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={newField.isRequired}
                            onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                            className="rounded"
                        />
                        Required field
                    </label>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => createMutation.mutate(newField)}
                            disabled={!newField.name.trim() || createMutation.isPending}
                            className="btn-primary text-xs"
                        >
                            {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Create Field
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomFieldManager;
