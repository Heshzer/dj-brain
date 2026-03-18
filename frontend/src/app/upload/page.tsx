'use client';

import React, { useState } from 'react';
import { RefreshCcw, HardDrive, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ count: number; tracks: string[] } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const scanFtp = async () => {
    setStatus('scanning');
    setResult(null);
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/tracks/scan', {
        method: 'POST',
      });
      
      if (res.ok) {
        const data = await res.json();
        setResult({ count: data.addedCount, tracks: data.addedTracks });
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg('La connexion au FTP a échoué. Vérifiez que le serveur est allumé.');
      }
    } catch (e) {
      setStatus('error');
      setErrorMsg('Erreur réseau.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="flex flex-col items-center justify-center text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mb-4 text-blue-400">
          <HardDrive size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Synchronisation FTP (FileZilla)</h1>
        <p className="text-zinc-400 max-w-xl text-sm leading-relaxed">
          Puisque vos musiques sont lourdes, nous vous recommandons d'utiliser le logiciel <b>FileZilla</b> sur votre PC pour envoyer massivement vos sons sur le serveur de votre ami.
          <br/><br/>
          Une fois l'envoi FileZilla terminé, cliquez sur le bouton ci-dessous : l'application va scanner le serveur et ajouter tous les nouveaux morceaux à votre bibliothèque DJ Brain !
        </p>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={scanFtp}
          disabled={status === 'scanning'}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg transition-all",
            status === 'scanning' ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
          )}
        >
          {status === 'scanning' ? <Loader2 className="animate-spin" size={24} /> : <RefreshCcw size={24} />}
          {status === 'scanning' ? 'Scan du serveur en cours...' : 'Scanner le Serveur FTP'}
        </button>

        {status === 'success' && result && (
          <div className="mt-8 p-6 rounded-2xl border border-green-900/50 bg-green-500/10 w-full max-w-md text-center">
            <CheckCircle2 className="mx-auto mb-3 text-green-400" size={32} />
            <h3 className="text-xl font-bold text-green-400 mb-1">Scan Terminé !</h3>
            <p className="text-zinc-300">
              {result.count === 0 
                ? "Aucun nouveau son détecté. Tout est déjà à jour !" 
                : `${result.count} nouveaux sons ont été ajoutés à la bibliothèque.`}
            </p>
            {result.count > 0 && (
              <button 
                onClick={() => router.push('/')}
                className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
               >
                Aller Taguer mes sons
              </button>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-8 p-6 rounded-2xl border border-red-900/50 bg-red-500/10 w-full max-w-md text-center">
            <XCircle className="mx-auto mb-3 text-red-500" size={32} />
            <h3 className="text-lg font-bold text-red-400 mb-1">Erreur</h3>
            <p className="text-zinc-300 text-sm">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
