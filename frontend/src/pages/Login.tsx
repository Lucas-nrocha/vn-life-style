import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Bem-vindo de volta!');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest mb-2">VN LIFE STYLE</h1>
          <p className="text-text-muted">Entre na sua conta</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-text-muted text-sm">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-text-primary hover:underline font-medium">
                Cadastre-se
              </Link>
            </p>
            <p className="text-text-muted text-sm">
              <Link to="/esqueci-senha" className="text-text-secondary hover:text-text-primary transition-colors">
                Esqueceu a senha?
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-surface border border-border rounded-lg">
          <p className="text-xs text-text-muted text-center font-medium mb-2">Credenciais de teste</p>
          <div className="space-y-1">
            <p className="text-xs text-text-muted text-center">Admin: <span className="text-text-secondary">admin@vnlifestyle.com</span> / Admin@123456</p>
            <p className="text-xs text-text-muted text-center">Cliente: <span className="text-text-secondary">cliente@example.com</span> / Cliente@123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
