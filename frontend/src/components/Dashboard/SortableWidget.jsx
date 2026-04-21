import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SortableWidget = ({ id, children, isEditMode, className }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative h-full transition-shadow duration-200',
                isDragging ? 'shadow-2xl opacity-80 scale-[1.02]' : '',
                className
            )}
        >
            {isEditMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing z-50 transition-colors"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}
            <div className={cn("h-full", isEditMode && "pointer-events-none")}>
                {children}
            </div>
        </div>
    );
};
