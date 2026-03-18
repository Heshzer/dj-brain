'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Edit2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import useSWR, { mutate } from 'swr';

interface Tag {
  id: string;
  name: string;
  color: string;
  is_permanent: boolean;
}

interface TagEditorProps {
  track: any;
  localTags: string[];
  allTags: Tag[];
  onSaveTags: (newTags: string[]) => void;
  onClose?: () => void;
  embedded?: boolean;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', 
  '#d946ef', '#f43f5e', '#78716c'
];

export default function TagEditor({ track, localTags, allTags, onSaveTags, onClose, embedded = false }: TagEditorProps) {
  const [adHocInput, setAdHocInput] = useState('');
  const [isCreatingPermanent, setIsCreatingPermanent] = useState(false);
  const [isEditingPermanentMode, setIsEditingPermanentMode] = useState(false);
  const [newPermName, setNewPermName] = useState('');
  const [newPermColor, setNewPermColor] = useState('#8b5cf6'); // Default purple
  
  // For editing an existing permanent tag
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const adHocInputRef = useRef<HTMLInputElement>(null);
  const permInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingPermanent && permInputRef.current) {
      permInputRef.current.focus();
    }
  }, [isCreatingPermanent]);

  const permanentTags = allTags.filter(t => t.is_permanent);
  
  // Create / Select tags
  const toggleTag = (tagName: string) => {
    const newTags = localTags.includes(tagName)
      ? localTags.filter(t => t !== tagName)
      : [...localTags, tagName];
    
    // Auto save immediately for seamless UX
    onSaveTags(newTags);
  };

  const addAdHocTag = () => {
    const tag = adHocInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    
    if (!localTags.includes(tag)) {
      onSaveTags([...localTags, tag]);
    }
    setAdHocInput('');
    adHocInputRef.current?.focus();
  };

  const savePermanentTag = async () => {
    const name = newPermName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: newPermColor })
      });
      if (res.ok) {
        mutate('/api/tags'); // trigger SWR revalidate
        setIsCreatingPermanent(false);
        setNewPermName('');
        
        // auto-apply the newly created permanent tag to this track
        if (!localTags.includes(name)) {
          onSaveTags([...localTags, name]);
        }
      }
    } catch (e) {
      console.error('Failed to create permanent tag', e);
    }
  };

  const updatePermanentTag = async () => {
    if (!editingTag) return;
    const name = editingTag.name.trim().toLowerCase().replace(/\s+/g, '-');
    const color = editingTag.color;
    
    try {
      const res = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color })
      });
      if (res.ok) {
        mutate('/api/tags');
        setEditingTag(null);
      }
    } catch (e) {
      console.error('Failed to update permanent tag', e);
    }
  };

  return (
    <div className={cn(
      embedded ? "w-full flex flex-col" : "fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col pt-12 pb-24 px-4 overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-200"
    )}>
      
      {/* Header - Only hide if deeply embedded */}
      {!embedded && (
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">Gérer les Tags</h2>
            <p className="text-zinc-400 text-sm truncate max-w-[250px]">{track.file_name}</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-700 transition"
            >
              <X size={20} />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col gap-6 w-full max-w-sm mx-auto">
        
        {/* === SECTION: PERMANENT TAGS === */}
        <section className="flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest text-center w-full">Tags Permanents</h3>
            <button 
              onClick={() => setIsEditingPermanentMode(!isEditingPermanentMode)}
              className={cn("absolute right-4 text-xs font-semibold px-2 py-1 rounded-md transition", 
                isEditingPermanentMode ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-white"
              )}
            >
              Éditer
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
            {permanentTags.map(tag => {
              const isSelected = localTags.includes(tag.name);
              
              if (editingTag?.id === tag.id) {
                // Editing inline
                return (
                  <div key="editing" className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-xl flex flex-col gap-3">
                    <input 
                      autoFocus
                      type="text" 
                      value={editingTag.name}
                      onChange={e => setEditingTag({ ...editingTag, name: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-2">
                       {COLORS.map(c => (
                         <button 
                           key={c}
                           onClick={() => setEditingTag({ ...editingTag, color: c })}
                           className={cn("w-6 h-6 rounded-full transition-transform", editingTag.color === c ? "scale-125 ring-2 ring-white" : "opacity-70 hover:opacity-100")}
                           style={{ backgroundColor: c }}
                         />
                       ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setEditingTag(null)} className="px-3 py-1.5 text-xs text-zinc-400">Annuler</button>
                      <button onClick={updatePermanentTag} className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-md">Sauver</button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={tag.id}
                  onClick={() => isEditingPermanentMode ? setEditingTag(tag) : toggleTag(tag.name)}
                  className={cn(
                    "relative px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg",
                    isSelected && !isEditingPermanentMode 
                      ? "text-white ring-2 ring-white ring-offset-2 ring-offset-zinc-950" 
                      : "text-zinc-100 opacity-90",
                    isEditingPermanentMode ? "animate-pulse" : ""
                  )}
                  style={{ backgroundColor: tag.color || '#444444' }}
                >
                  {tag.name}
                  {isEditingPermanentMode && <Edit2 size={12} className="ml-1 opacity-50" />}
                </button>
              );
            })}

            {/* + Button to add a new permanent tag */}
            {!isCreatingPermanent && !isEditingPermanentMode && (
              <button
                onClick={() => setIsCreatingPermanent(true)}
                className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border-2 border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 flex items-center gap-1"
              >
                <Plus size={16} /> Nouveau
              </button>
            )}
          </div>

          {/* Create Permanent Tag UI */}
          {isCreatingPermanent && (
            <div className="mt-6 w-full max-w-sm bg-zinc-900 border border-zinc-800 p-4 rounded-xl animate-in fade-in slide-in-from-top-4">
              <input
                ref={permInputRef}
                type="text"
                placeholder="Nom du tag global..."
                value={newPermName}
                onChange={e => setNewPermName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && savePermanentTag()}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white mb-3"
              />
              <div className="flex flex-wrap justify-between gap-1 mb-4">
                  {COLORS.map(c => (
                    <button 
                      key={c}
                      onClick={() => setNewPermColor(c)}
                      className={cn("w-6 h-6 rounded-full transition-transform", newPermColor === c ? "scale-125 ring-2 ring-white" : "opacity-50 hover:opacity-100")}
                      style={{ backgroundColor: c }}
                    />
                  ))}
              </div>
              <div className="flex justify-end gap-2">
                 <button onClick={() => setIsCreatingPermanent(false)} className="text-xs text-zinc-500 px-3 py-2 hover:text-white">Annuler</button>
                 <button 
                  onClick={savePermanentTag}
                  disabled={!newPermName.trim()}
                  className="text-xs bg-white text-black px-4 py-2 font-bold rounded-lg disabled:opacity-50"
                 >
                   Créer
                 </button>
              </div>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="h-px w-full max-w-sm mx-auto bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

        {/* === SECTION: AD-HOC TAGS / PRIVATE NOTES === */}
        <section className="flex flex-col items-center">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest text-center w-full mb-4">Note Privée / Tags Rapides</h3>
          
          <div className="w-full max-w-sm flex gap-2">
            <input
              ref={adHocInputRef}
              type="text"
              placeholder="Ex: drop min 2:00, ou note rapide..."
              value={adHocInput}
              onChange={e => setAdHocInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAdHocTag()}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-purple-500 focus:bg-zinc-800 transition-all text-white placeholder:text-zinc-600 shadow-inner"
            />
            <button
              onClick={addAdHocTag}
              disabled={!adHocInput.trim()}
              className="w-12 shrink-0 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white flex items-center justify-center rounded-xl transition-colors"
            >
              <CheckCircle2 size={20} />
            </button>
          </div>

          {/* List of current ad-hoc tags (tags that exist on this track but are NOT permanent) */}
          <div className="w-full max-w-sm flex flex-wrap gap-2 mt-4 mt-min-4 justify-center">
             {localTags.map(tag => {
                const isPerm = permanentTags.some(p => p.name === tag);
                if (isPerm) return null; // Only show non-permanent ones here
                
                return (
                  <span key={tag} className="group relative flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                    {tag}
                    <button 
                      onClick={() => toggleTag(tag)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
             })}
          </div>
        </section>

      </div>
    </div>
  );
}
