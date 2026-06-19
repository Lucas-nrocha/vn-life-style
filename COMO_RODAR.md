# VN Life Style — Como Rodar o Projeto

## Pré-requisitos
- Node.js 18+
- PostgreSQL 14+ rodando localmente (ou Render.com)
- npm ou pnpm

---

## 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Gerar o cliente Prisma
npm run db:generate

# Rodar as migrations
npm run db:migrate

# Popular o banco com dados de teste
npm run db:seed

# Rodar os testes
npm test

# Iniciar servidor em desenvolvimento
npm run dev
```

O servidor roda em `http://localhost:3001`

### Credenciais de teste (após o seed):
- **Admin**: admin@vnlifestyle.com / Admin@123456
- **Cliente**: cliente@example.com / Cliente@123
- **Cupom**: VNBEMVINDO (10% off acima de R$100)

---

## 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Copiar e configurar variáveis de ambiente
cp .env.example .env

# Iniciar em desenvolvimento
npm run dev
```

O frontend roda em `http://localhost:5173`

---

## Variáveis de Ambiente Importantes

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/vn_lifestyle
JWT_SECRET=sua-chave-secreta-aqui
JWT_REFRESH_SECRET=outra-chave-secreta-aqui
MP_ACCESS_TOKEN=TEST-seu-token-sandbox
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_MP_PUBLIC_KEY=TEST-sua-public-key
```

---

## Estrutura do Projeto

```
projeto vinicios/
├── backend/
│   ├── src/
│   │   ├── __tests__/     # Testes (Jest + Supertest)
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── middleware/    # Auth, admin, rate limiter, error handler
│   │   ├── routes/        # Endpoints da API
│   │   ├── services/      # Email, Mercado Pago
│   │   ├── lib/           # Prisma client
│   │   ├── utils/         # JWT, slugify
│   │   ├── app.ts         # Express app
│   │   └── index.ts       # Entry point
│   └── prisma/
│       ├── schema.prisma  # Modelo do banco
│       └── seed.ts        # Dados de exemplo
└── frontend/
    └── src/
        ├── components/    # Header, Footer, ProductCard, etc.
        ├── contexts/      # AuthContext, CartContext
        ├── pages/         # Home, Products, Cart, Checkout, Admin
        ├── services/      # API client (Axios)
        └── types/         # Tipos TypeScript
```

---

## API Endpoints

```
POST  /api/auth/register
POST  /api/auth/login
POST  /api/auth/refresh-token
POST  /api/auth/logout

GET   /api/products
GET   /api/products/:id
POST  /api/products          (admin)
PUT   /api/products/:id      (admin)
DELETE /api/products/:id     (admin)

GET   /api/cart
POST  /api/cart
PUT   /api/cart/:itemId
DELETE /api/cart/:itemId

POST  /api/orders
GET   /api/orders
GET   /api/orders/:id
PUT   /api/orders/:id/status  (admin)

POST  /api/checkout/create-payment
POST  /api/checkout/webhook
GET   /api/checkout/order-status/:orderId

GET   /api/user/profile
PUT   /api/user/profile
GET   /api/user/addresses
POST  /api/user/addresses
PUT   /api/user/addresses/:id
DELETE /api/user/addresses/:id

GET   /api/admin/dashboard    (admin)
GET   /api/admin/orders       (admin)
GET   /api/admin/products     (admin)
GET   /api/admin/users        (admin)
POST  /api/admin/categories   (admin)
PUT   /api/admin/orders/:id/tracking (admin)
```
