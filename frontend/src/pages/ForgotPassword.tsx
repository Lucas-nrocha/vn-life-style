import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authApi } from '../services/api';
import { toast } from 'sonner';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest mb-2">VN LIFE STYLE</h1>
          <p className="text-text-muted">Recuperação de senha</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <span className="text-green-400 text-xl">✓</span>
              </div>
              <h2 className="font-semibold text-text-primary">Email enviado!</h2>
              <p className="text-text-muted text-sm">
                Se esse email estiver cadastrado, você receberá as instruções de redefinição em breve.
              </p>
              <Link to="/login" className="btn-secondary text-sm inline-flex items-center gap-2">
                <ArrowLeft size={14} />
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-text-muted text-sm mb-5">
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Enviar link de recuperação
                </Button>
              </form>
              <div className="mt-5 text-center">
                <Link to="/login" className="text-text-muted text-sm hover:text-text-primary transition-colors inline-flex items-center gap-1">
                  <ArrowLeft size={14} />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
