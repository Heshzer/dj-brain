'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { ListMusic, Lock, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { checkAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        if (!res.ok) {
          throw new Error(`Le serveur backend a répondu avec une erreur inattendue (Code ${res.status}). Le serveur est-il bien à jour avec la dernière version ?`);
        }
        throw new Error('Réponse invalide du serveur.');
      }
      
      if (res.ok) {
        await checkAuth();
        router.push('/');
      } else {
        setError(data?.error || 'Erreur de connexion');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau. Le serveur backend est-il lancé et accessible ?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center -mt-10" style={{ background: '#06060e', color: '#f1f0ff' }}>
      <div className="w-full max-w-md p-8 rounded-[2rem] relative overflow-hidden"
           style={{
             background: 'rgba(13,13,26,0.6)',
             border: '1px solid rgba(139,92,246,0.15)',
             backdropFilter: 'blur(20px)',
             boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.05)'
           }}>
        
        {/* Glow de fond */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] blur-[80px] rounded-full pointer-events-none" 
             style={{ background: 'rgba(124,58,237,0.15)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] blur-[80px] rounded-full pointer-events-none"
             style={{ background: 'rgba(236,72,153,0.1)' }} />

        <div className="relative text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl mb-6 flex items-center justify-center glow-violet"
               style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' }}>
            <ListMusic size={32} color="#fff" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 gradient-text">DJ Brain</h1>
          <p className="text-sm" style={{ color: '#6b6b9a' }}>
            Si la table est vide, la première connexion créera le compte admin.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm text-center"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="relative space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#6b6b9a' }} />
              <input 
                type="text"
                placeholder="Identifiant"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all"
                style={{
                  background: 'rgba(6,6,14,0.8)',
                  border: '1px solid rgba(139,92,246,0.1)',
                  color: '#f1f0ff'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.1)'}
                autoComplete="username"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#6b6b9a' }} />
              <input 
                type="password"
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all"
                style={{
                  background: 'rgba(6,6,14,0.8)',
                  border: '1px solid rgba(139,92,246,0.1)',
                  color: '#f1f0ff'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.1)'}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !username || !password}
            className="w-full mt-2 font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 glow-violet"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              color: '#fff'
            }}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Connexion Sécurisée'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
