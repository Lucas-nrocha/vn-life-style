import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authApi } from '../services/api';
import { toast } from 'sonner';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'Deve conter ao menos um número')
      .regex(/[^a-zA-Z0-9]/, 'Deve conter ao menos um caractere especial'),
    confirm: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Token inválido');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Token inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Link inválido</h1>
          <p className="text-text-muted text-sm">Este link de redefinição é inválido ou expirou.</p>
          <Link to="/esqueci-senha" className="btn-primary text-sm">Solicitar novo link</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest mb-2">VN LIFE STYLE</h1>
          <p className="text-text-muted">Criar nova senha</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nova senha"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              placeholder="••••••••"
              {...register('confirm')}
              error={errors.confirm?.message}
            />
            <p className="text-xs text-text-muted">
              A senha deve ter ao menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.
            </p>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Redefinir senha
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
