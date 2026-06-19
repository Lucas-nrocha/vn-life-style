export interface CepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export async function fetchAddressByCep(cep: string): Promise<CepAddress> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) throw new Error('CEP deve ter 8 dígitos');

  const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
  if (!res.ok) throw new Error('Erro ao consultar CEP');

  const data = await res.json();
  if (data.erro) throw new Error('CEP não encontrado');

  return {
    street: data.logradouro || '',
    neighborhood: data.bairro || '',
    city: data.localidade || '',
    state: data.uf || '',
    zipCode: data.cep || '',
  };
}
