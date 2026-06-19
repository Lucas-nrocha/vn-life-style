import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vnlifestyle.com' },
    update: {},
    create: {
      email: 'admin@vnlifestyle.com',
      name: 'Administrador VN',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  const customerPassword = await bcrypt.hash('Cliente@123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'cliente@example.com' },
    update: {},
    create: {
      email: 'cliente@example.com',
      name: 'João Silva',
      password: customerPassword,
      phone: '11999887766',
      role: 'CUSTOMER',
      addresses: {
        create: {
          label: 'Casa',
          street: 'Rua das Acácias',
          number: '42',
          complement: 'Apto 12',
          neighborhood: 'Jardim Paulista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01419-000',
          isDefault: true,
        },
      },
    },
  });
  console.log(`✅ Cliente criado: ${customer.email}`);

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'camisetas' },
      update: {},
      create: { name: 'Camisetas', slug: 'camisetas' },
    }),
    prisma.category.upsert({
      where: { slug: 'calcas' },
      update: {},
      create: { name: 'Calças', slug: 'calcas' },
    }),
    prisma.category.upsert({
      where: { slug: 'bermudas' },
      update: {},
      create: { name: 'Bermudas', slug: 'bermudas' },
    }),
    prisma.category.upsert({
      where: { slug: 'jaquetas' },
      update: {},
      create: { name: 'Jaquetas', slug: 'jaquetas' },
    }),
  ]);
  console.log(`✅ ${categories.length} categorias criadas`);

  const products = [
    {
      name: 'Camiseta Essencial Preta',
      slug: 'camiseta-essencial-preta',
      description: 'Camiseta básica de algodão premium, corte regular, ideal para o dia a dia. Tecido respirável e confortável.',
      price: 89.9,
      comparePrice: 129.9,
      sku: 'CAM-ESS-PTO',
      categorySlug: 'camisetas',
      featured: true,
      images: [
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
      ],
      variants: [
        { size: 'P', color: 'Preto', stock: 15 },
        { size: 'M', color: 'Preto', stock: 20 },
        { size: 'G', color: 'Preto', stock: 18 },
        { size: 'GG', color: 'Preto', stock: 10 },
      ],
    },
    {
      name: 'Camiseta Essencial Branca',
      slug: 'camiseta-essencial-branca',
      description: 'Camiseta básica de algodão premium, corte regular. Versátil e atemporal.',
      price: 89.9,
      sku: 'CAM-ESS-BCA',
      categorySlug: 'camisetas',
      featured: false,
      images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800'],
      variants: [
        { size: 'P', color: 'Branco', stock: 12 },
        { size: 'M', color: 'Branco', stock: 25 },
        { size: 'G', color: 'Branco', stock: 15 },
        { size: 'GG', color: 'Branco', stock: 8 },
      ],
    },
    {
      name: 'Camiseta Oversized Grafite',
      slug: 'camiseta-oversized-grafite',
      description: 'Camiseta com modelagem oversized, perfeita para looks casuais e streetwear. Tecido 100% algodão.',
      price: 119.9,
      comparePrice: 149.9,
      sku: 'CAM-OVR-GRF',
      categorySlug: 'camisetas',
      featured: true,
      images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'],
      variants: [
        { size: 'P', color: 'Grafite', stock: 10 },
        { size: 'M', color: 'Grafite', stock: 14 },
        { size: 'G', color: 'Grafite', stock: 12 },
        { size: 'GG', color: 'Grafite', stock: 6 },
      ],
    },
    {
      name: 'Calça Slim Chino Marinho',
      slug: 'calca-slim-chino-marinho',
      description: 'Calça chino slim fit em tecido de alta qualidade. Elegante e confortável, perfeita para diversas ocasiões.',
      price: 259.9,
      comparePrice: 329.9,
      sku: 'CAL-SLM-MAR',
      categorySlug: 'calcas',
      featured: true,
      images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800'],
      variants: [
        { size: '38', color: 'Azul Marinho', stock: 8 },
        { size: '40', color: 'Azul Marinho', stock: 10 },
        { size: '42', color: 'Azul Marinho', stock: 12 },
        { size: '44', color: 'Azul Marinho', stock: 7 },
      ],
    },
    {
      name: 'Calça Jogger Preta',
      slug: 'calca-jogger-preta',
      description: 'Calça jogger em moletom leve, elástico na cintura e punhos. Conforto máximo para o dia a dia.',
      price: 189.9,
      sku: 'CAL-JGR-PTO',
      categorySlug: 'calcas',
      featured: false,
      images: ['https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800'],
      variants: [
        { size: 'P', color: 'Preto', stock: 15 },
        { size: 'M', color: 'Preto', stock: 20 },
        { size: 'G', color: 'Preto', stock: 18 },
      ],
    },
    {
      name: 'Bermuda Cargo Caqui',
      slug: 'bermuda-cargo-caqui',
      description: 'Bermuda cargo estilosa com múltiplos bolsos. Material resistente e confortável, ideal para o verão.',
      price: 159.9,
      comparePrice: 199.9,
      sku: 'BER-CRG-CAQ',
      categorySlug: 'bermudas',
      featured: false,
      images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800'],
      variants: [
        { size: '38', color: 'Caqui', stock: 12 },
        { size: '40', color: 'Caqui', stock: 15 },
        { size: '42', color: 'Caqui', stock: 10 },
        { size: '44', color: 'Caqui', stock: 5 },
      ],
    },
    {
      name: 'Jaqueta Coach Preta',
      slug: 'jaqueta-coach-preta',
      description: 'Jaqueta coach em nylon com bolsos frontais. Leve, estilosa e funcional para diversas estações.',
      price: 349.9,
      comparePrice: 449.9,
      sku: 'JAQ-COA-PTO',
      categorySlug: 'jaquetas',
      featured: true,
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
      variants: [
        { size: 'P', color: 'Preto', stock: 6 },
        { size: 'M', color: 'Preto', stock: 8 },
        { size: 'G', color: 'Preto', stock: 7 },
        { size: 'GG', color: 'Preto', stock: 4 },
      ],
    },
  ];

  for (const productData of products) {
    const { categorySlug, images, variants, ...data } = productData;
    const category = categories.find((c) => c.slug === categorySlug)!;

    const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (existing) continue;

    await prisma.product.create({
      data: {
        ...data,
        categoryId: category.id,
        images: {
          create: images.map((url, i) => ({ url, position: i })),
        },
        variants: {
          create: variants.map((v, i) => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            sku: `${data.sku}-${v.size}-${i}`,
          })),
        },
      },
    });

    console.log(`✅ Produto criado: ${data.name}`);
  }

  await prisma.coupon.upsert({
    where: { code: 'VNBEMVINDO' },
    update: {},
    create: {
      code: 'VNBEMVINDO',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 100,
      maxUses: 100,
      active: true,
    },
  });
  console.log('✅ Cupom VNBEMVINDO criado (10% off acima de R$100)');

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Credenciais de teste:');
  console.log('   Admin: admin@vnlifestyle.com / Admin@123456');
  console.log('   Cliente: cliente@example.com / Cliente@123');
  console.log('   Cupom: VNBEMVINDO (10% off acima de R$100)');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
