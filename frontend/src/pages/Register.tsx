import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve conter ao menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Deve conter ao menos um caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Conta criada com sucesso! Bem-vindo!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-widest mb-2">VN LIFE STYLE</h1>
          <p className="text-text-muted">Crie sua conta</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              {...register('name')}
              error={errors.name?.message}
            />
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
              placeholder="Mínimo 8 caracteres"
              {...register('password')}
              error={errors.password?.message}
            />
            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="Repita a senha"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <ul className="text-xs text-text-muted space-y-1 bg-surface-2 rounded p-3">
              <li>• Mínimo 8 caracteres</li>
              <li>• Ao menos uma letra maiúscula</li>
              <li>• Ao menos um número</li>
              <li>• Ao menos um caractere especial (!@#$...)</li>
            </ul>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Criar Conta
            </Button>
          </form>

          <p className="mt-6 text-text-muted text-sm text-center">
            Já tem conta?{' '}
            <Link to="/login" className="text-text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
