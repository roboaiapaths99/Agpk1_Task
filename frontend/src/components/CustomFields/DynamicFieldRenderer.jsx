import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Renders the appropriate input for a custom field based on its type.
 * @param {Object} field - The custom field definition
 * @param {any} value - The current value
 * @param {Function} onChange - Callback when value changes
 * @param {boolean} readOnly - If true, renders as display-only
 */
const DynamicFieldRenderer = ({ field, value, onChange, readOnly = false, users = [] }) => {
    const baseInputClass = "w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all";

    if (readOnly) {
        let displayValue = value ?? '—';
        if (field.fieldType === 'checkbox') displayValue = value ? '✅ Yes' : '❌ No';
        if (field.fieldType === 'date' && value) displayValue = new Date(value).toLocaleDateString();
        if (field.fieldType === 'currency' && value) displayValue = `$${Number(value).toLocaleString()}`;
        if (field.fieldType === 'dropdown' && value) {
            const opt = field.options?.find(o => o.value === value);
            if (opt) displayValue = opt.label;
        }
        if (field.fieldType === 'url' && value) {
            return (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                    {value}
                </a>
            );
        }
        return <span className="text-sm text-slate-700">{displayValue}</span>;
    }

    switch (field.fieldType) {
        case 'text':
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={`Enter ${field.name}...`}
                    className={baseInputClass}
                />
            );

        case 'number':
            return (
                <input
                    type="number"
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="0"
                    className={baseInputClass}
                />
            );

        case 'currency':
            return (
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <input
                        type="number"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                        placeholder="0.00"
                        className={cn(baseInputClass, "pl-7")}
                    />
                </div>
            );

        case 'date':
            return (
                <input
                    type="date"
                    value={value ? new Date(value).toISOString().split('T')[0] : ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    className={baseInputClass}
                />
            );

        case 'dropdown':
            return (
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    className={baseInputClass}
                >
                    <option value="">Select {field.name}...</option>
                    {(field.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );

        case 'checkbox':
            return (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-slate-600">{value ? 'Yes' : 'No'}</span>
                </label>
            );

        case 'url':
            return (
                <input
                    type="url"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://..."
                    className={baseInputClass}
                />
            );

        case 'user':
            return (
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    className={baseInputClass}
                >
                    <option value="">Select user...</option>
                    {users.map((u) => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                </select>
            );

        default:
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={baseInputClass}
                />
            );
    }
};

export default DynamicFieldRenderer;
