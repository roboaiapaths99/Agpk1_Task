import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Heading1, Heading2, Heading3, Quote, Minus, Undo, Redo,
    Link as LinkIcon, Image as ImageIcon, Sparkles, Loader2, Upload
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { aiService, attachmentService } from '../../services/api/apiServices';
import toast from 'react-hot-toast';

const MenuButton = ({ onClick, active, disabled, children, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={cn(
            'p-1.5 rounded-lg transition-all duration-150',
            active
                ? 'bg-primary/10 text-primary'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
            disabled && 'opacity-30 cursor-not-allowed'
        )}
    >
        {children}
    </button>
);

const DocEditor = ({ content, onUpdate, readOnly = false }) => {
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [showAiInput, setShowAiInput] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                codeBlock: { HTMLAttributes: { class: 'bg-slate-900 text-green-400 rounded-xl p-4 font-mono text-sm' } },
            }),
            Link.configure({ openOnClick: true, HTMLAttributes: { class: 'text-primary underline cursor-pointer' } }),
            Image.configure({ HTMLAttributes: { class: 'rounded-2xl border border-slate-200 shadow-lg max-w-full h-auto my-6' } }),
            Placeholder.configure({ placeholder: 'Start writing your document here...' }),
        ],
        content: content || '<p></p>',
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (onUpdate) onUpdate(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none min-h-[400px] focus:outline-none px-2 py-4 text-slate-800 leading-relaxed',
            },
        },
    });

    const addLink = useCallback(() => {
        if (linkUrl && editor) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
            setLinkUrl('');
            setShowLinkInput(false);
        }
    }, [editor, linkUrl]);

    const handleAIGenerate = async () => {
        if (!aiPrompt || !editor) return;
        setIsGenerating(true);
        try {
            const res = await aiService.generateContent(aiPrompt);
            const markdownToInsert = res.data?.content || "AI Generation failed to produce text.";
            // Since Tiptap can parse HTML normally, but markdown requires an extension, we'll just insert as text block or generic HTML 
            // The enterprise version would pipe this through marked.js, but we'll insert raw for now
            editor.chain().focus().insertContent(`<pre><code>${markdownToInsert}</code></pre>`).run();
            setAiPrompt('');
            setShowAiInput(false);
            toast.success("AI content generated successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to generate AI content");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const loadingId = toast.loading(`Uploading ${file.name}...`);

        try {
            const res = await attachmentService.upload(formData);
            const attachment = res.data?.attachment || res.data?.data;

            if (attachment) {
                // Use a relative path or resolve backend URL
                const fileUrl = `${window.location.protocol}//${window.location.hostname}:5000/uploads/${attachment.filename}`;

                if (file.type.startsWith('image/')) {
                    editor.chain().focus().setImage({ src: fileUrl, alt: file.name }).run();
                    toast.success("Image uploaded and inserted!", { id: loadingId });
                } else {
                    // For docs/others, insert a link with an icon representation if possible, or just a linked text
                    editor.chain().focus().extendMarkRange('link').setLink({ href: fileUrl }).insertContent(`[Attachment: ${file.name}]`).run();
                    toast.success("Document uploaded and linked!", { id: loadingId });
                }
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error(err.response?.data?.message || err.message || "Upload failed", { id: loadingId });
        }
    };

    if (!editor) return null;

    return (
        <div className="doc-editor">
            {/* Toolbar */}
            {!readOnly && (
                <div className="sticky top-0 z-10 flex items-center gap-0.5 p-2 border-b border-slate-100 bg-white/80 backdrop-blur-xl rounded-t-2xl flex-wrap">
                    <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                        <Bold className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                        <Italic className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                        <Strikethrough className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
                        <Code className="w-4 h-4" />
                    </MenuButton>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                        <Heading1 className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                        <Heading2 className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                        <Heading3 className="w-4 h-4" />
                    </MenuButton>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                        <List className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
                        <ListOrdered className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
                        <Quote className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
                        <Minus className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                        <Code className="w-4 h-4" />
                    </MenuButton>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <MenuButton onClick={() => setShowLinkInput(!showLinkInput)} active={editor.isActive('link')} title="Link">
                        <LinkIcon className="w-4 h-4" />
                    </MenuButton>

                    {/* AI and Upload Actions */}
                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <MenuButton onClick={() => setShowAiInput(!showAiInput)} active={showAiInput} title="Ask AI to Write">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                    </MenuButton>

                    <label className="cursor-pointer" title="Upload Document">
                        <MenuButton as="span">
                            <Upload className="w-4 h-4 text-slate-500" />
                        </MenuButton>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                    </label>

                    <div className="flex-grow" />

                    <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                        <Undo className="w-4 h-4" />
                    </MenuButton>
                    <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                        <Redo className="w-4 h-4" />
                    </MenuButton>

                    {showLinkInput && (
                        <div className="flex items-center gap-2 w-full mt-2 p-2 bg-slate-50 rounded-xl">
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && addLink()}
                            />
                            <button onClick={addLink} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90 transition-all">
                                Add
                            </button>
                        </div>
                    )}

                    {showAiInput && (
                        <div className="flex items-center gap-2 w-full mt-2 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mx-2" />
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ask AI to write a brief overview of API limits..."
                                className="flex-1 px-3 py-1.5 text-sm bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none placeholder:text-slate-300"
                                onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                                disabled={isGenerating}
                            />
                            <button
                                onClick={handleAIGenerate}
                                disabled={isGenerating || !aiPrompt}
                                className="px-4 py-1.5 text-xs font-bold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Write"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Content */}
            <div className="p-4 md:p-8">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default DocEditor;
