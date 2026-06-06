import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { API } from "@/lib/config";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleVerify = async () => {
    setStatus('loading');
    try {
      const res = await fetch(`${API}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus('success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black flex items-center justify-center px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="w-full max-w-md text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">MBE</p>

        {status === 'idle' && (
          <>
            <h1 className="text-3xl font-semibold text-white">Подтвердите email</h1>
            <p className="text-sm text-white/60">Нажмите кнопку чтобы завершить регистрацию.</p>
            <button
              onClick={handleVerify}
              className="w-full rounded-xl border border-white/40 bg-transparent px-6 py-3.5 text-base font-medium text-white transition-all hover:border-white hover:bg-white hover:text-black"
            >
              Подтвердить email
            </button>
          </>
        )}

        {status === 'loading' && (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
            <h1 className="text-2xl font-semibold text-white">Email подтверждён!</h1>
            <p className="text-sm text-white/60">Перенаправляем на страницу входа...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h1 className="text-2xl font-semibold text-white">Ссылка недействительна</h1>
            <p className="text-sm text-white/60">Попробуйте зарегистрироваться заново.</p>
          </>
        )}
      </div>
    </main>
  );
}