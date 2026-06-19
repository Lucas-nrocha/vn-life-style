import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import { Address } from '../types';
import { userApi, orderApi, checkoutApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { fetchAddressByCep } from '../utils/cep';

const addressSchema = z.object({
  label: z.string().default('Casa'),
  street: z.string().min(2, 'Rua obrigatória'),
  number: z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro obrigatório'),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
});

type AddressFormData = z.infer<typeof addressSchema>;

export function Checkout() {
  const navigate = useNavigate();
  const { cart, refresh } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  const [loadingCep, setLoadingCep] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    if (cep.replace(/\D/g, '').length !== 8) return;
    setLoadingCep(true);
    try {
      const addr = await fetchAddressByCep(cep);
      setValue('street', addr.street, { shouldValidate: true });
      setValue('neighborhood', addr.neighborhood, { shouldValidate: true });
      setValue('city', addr.city, { shouldValidate: true });
      setValue('state', addr.state, { shouldValidate: true });
      setValue('zipCode', addr.zipCode, { shouldValidate: true });
      toast.success('Endereço preenchido pelo CEP');
    } catch (err: any) {
      toast.error(err.message || 'CEP não encontrado');
    } finally {
      setLoadingCep(false);
    }
  };

  useEffect(() => {
    if (cart.items.length === 0 && !loadingAddresses) {
      navigate('/carrinho');
      return;
    }

    userApi
      .getAddresses()
      .then(({ data }) => {
        setAddresses(data);
        const def = data.find((a: Address) => a.isDefault);
        if (def) setSelectedAddress(def.id);
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [cart.items.length, navigate, loadingAddresses]);

  const handleAddAddress = async (data: AddressFormData) => {
    try {
      const { data: newAddr } = await userApi.createAddress(data);
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddress(newAddr.id);
      setShowAddressForm(false);
      reset();
      toast.success('Endereço adicionado');
    } catch {
      toast.error('Erro ao salvar endereço');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoadingCoupon(true);
    try {
      const { data } = await orderApi.validateCoupon(couponCode);
      setAppliedCoupon({ code: couponCode, discount: data.discount });
      toast.success(`Cupom aplicado! Desconto de R$ ${data.discount.toFixed(2).replace('.', ',')}`);
    } catch (err: any) {
      setAppliedCoupon(null);
      toast.error(err.response?.data?.error || 'Cupom inválido');
    } finally {
      setLoadingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Selecione um endereço de entrega');
      return;
    }

    setLoading(true);
    try {
      const { data: orderData } = await orderApi.create({
        addressId: selectedAddress,
        couponCode: couponCode || undefined,
      });

      const { data: paymentData } = await checkoutApi.createPayment(orderData.order.id);

      await refresh();

      if (import.meta.env.DEV) {
        window.location.href = paymentData.sandboxInitPoint;
      } else {
        window.location.href = paymentData.initPoint;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar pedido');
      setLoading(false);
    }
  };

  const shippingCost = cart.subtotal >= 299 ? 0 : 15;
  const discount = appliedCoupon?.discount ?? 0;
  const total = cart.subtotal + shippingCost - discount;

  return (
    <main className="container-app py-8">
      <h1 className="section-title mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <MapPin size={18} />
                Endereço de Entrega
              </h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="btn-ghost text-sm flex items-center gap-1"
              >
                <Plus size={14} />
                Novo endereço
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleSubmit(handleAddAddress)} className="mb-6 p-4 bg-surface-2 rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 flex gap-3 items-end">
                    <div className="flex-1">
                      <Input
                        label="CEP"
                        {...register('zipCode')}
                        error={errors.zipCode?.message}
                        placeholder="00000-000"
                        onBlur={handleCepBlur}
                      />
                    </div>
                    {loadingCep && (
                      <p className="text-xs text-text-muted pb-2.5">Buscando...</p>
                    )}
                  </div>
                  <Input label="Rua" {...register('street')} error={errors.street?.message} />
                  <Input label="Número" {...register('number')} error={errors.number?.message} />
                  <Input label="Complemento" {...register('complement')} />
                  <Input label="Bairro" {...register('neighborhood')} error={errors.neighborhood?.message} />
                  <Input label="Cidade" {...register('city')} error={errors.city?.message} />
                  <Input label="Estado (sigla)" {...register('state')} error={errors.state?.message} placeholder="SP" maxLength={2} />
                  <Input label="Rótulo" {...register('label')} placeholder="Casa, Trabalho..." />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setShowAddressForm(false)}>Cancelar</Button>
                  <Button type="submit">Salvar Endereço</Button>
                </div>
              </form>
            )}

            {loadingAddresses ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <p className="text-text-muted text-sm">Adicione um endereço de entrega acima</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedAddress === addr.id
                        ? 'border-accent bg-surface-2'
                        : 'border-border hover:border-border-light'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="accent-white mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-text-primary text-sm">{addr.label}</p>
                      <p className="text-text-secondary text-xs mt-0.5">
                        {addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ''} — {addr.neighborhood}, {addr.city}/{addr.state}
                      </p>
                      <p className="text-text-muted text-xs">{addr.zipCode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-text-primary mb-4">Cupom de Desconto</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setAppliedCoupon(null);
                }}
                placeholder="VNBEMVINDO"
                className="input-field flex-1"
              />
              <Button variant="outline" onClick={handleApplyCoupon} loading={loadingCoupon}>
                Aplicar
              </Button>
            </div>
            {appliedCoupon && (
              <p className="text-success text-sm mt-2">
                Cupom <strong>{appliedCoupon.code}</strong> aplicado — desconto de R$ {appliedCoupon.discount.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-semibold text-text-primary mb-4">Resumo</h2>

            <div className="space-y-2 mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-text-secondary truncate pr-2">
                    {item.product.name} ({item.variant.size}) × {item.quantity}
                  </span>
                  <span className="text-text-primary flex-shrink-0">
                    R$ {(Number(item.product.price) * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span>R$ {cart.subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Frete</span>
                <span className={shippingCost === 0 ? 'text-success' : ''}>
                  {shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Desconto ({appliedCoupon?.code})</span>
                  <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              loading={loading}
              size="lg"
              className="w-full"
            >
              Pagar com Mercado Pago
            </Button>

            <p className="text-xs text-text-muted text-center mt-3">
              Você será redirecionado para o ambiente seguro do Mercado Pago
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
