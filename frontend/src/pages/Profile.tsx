import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User } from '../types';
import { userApi } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter maiúscula')
    .regex(/[0-9]/, 'Deve conter número')
    .regex(/[^a-zA-Z0-9]/, 'Deve conter caractere especial'),
}).refine(() => true);

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    userApi.getProfile().then(({ data }) => {
      setUser(data);
      profileForm.reset({ name: data.name, phone: data.phone || '' });
    });
  }, []);

  const onSaveProfile = async (data: ProfileForm) => {
    setLoadingProfile(true);
    try {
      const { data: updated } = await userApi.updateProfile(data);
      setUser(updated);
      toast.success('Perfil atualizado');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setLoadingPassword(true);
    try {
      await userApi.updateProfile(data);
      toast.success('Senha alterada com sucesso');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <main className="container-app py-8 max-w-2xl">
      <h1 className="section-title mb-8">Meu Perfil</h1>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-text-primary mb-6">Dados Pessoais</h2>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <Input label="Email" value={user?.email || ''} disabled className="opacity-60" />
          <Input
            label="Nome"
            {...profileForm.register('name')}
            error={profileForm.formState.errors.name?.message}
          />
          <Input
            label="Telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            {...profileForm.register('phone')}
          />
          <Button type="submit" loading={loadingProfile}>
            Salvar Alterações
          </Button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-text-primary mb-6">Alterar Senha</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
          <Input
            label="Senha Atual"
            type="password"
            {...passwordForm.register('currentPassword')}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            label="Nova Senha"
            type="password"
            {...passwordForm.register('newPassword')}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Button type="submit" loading={loadingPassword} variant="outline">
            Alterar Senha
          </Button>
        </form>
      </div>
    </main>
  );
}
