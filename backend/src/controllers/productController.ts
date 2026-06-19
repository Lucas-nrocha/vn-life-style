import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { slugify } from '../utils/slugify';
import { AuthRequest } from '../middleware/auth';

const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  sku: z.string().min(1),
  categoryId: z.string().uuid(),
  featured: z.boolean().optional(),
  variants: z
    .array(
      z.object({
        size: z.string().min(1),
        color: z.string().min(1),
        stock: z.number().int().min(0),
      })
    )
    .min(1),
  images: z.array(z.object({ url: z.string().url(), publicId: z.string().optional(), alt: z.string().optional() })).optional(),
});

const productInclude = {
  category: true,
  images: { orderBy: { position: 'asc' as const } },
  variants: true,
};

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      size,
      color,
      featured,
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { active: true };

    if (category) where.category = { slug: category };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }
    if (featured === 'true') where.featured = true;
    if (size || color) {
      where.variants = { some: {} };
      if (size) where.variants.some.size = size;
      if (color) where.variants.some.color = color;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productInclude,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id, active: true },
      include: productInclude,
    });

    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, description, price, comparePrice, sku, categoryId, featured, variants, images } = parsed.data;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(400).json({ error: 'Categoria não encontrada' });
      return;
    }

    const skuExists = await prisma.product.findUnique({ where: { sku } });
    if (skuExists) {
      res.status(400).json({ error: 'SKU já existe' });
      return;
    }

    const slug = slugify(name);

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price,
        comparePrice,
        sku,
        categoryId,
        featured: featured ?? false,
        variants: {
          create: variants.map((v, i) => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            sku: `${sku}-${v.size}-${v.color.slice(0, 3).toUpperCase()}-${i}`,
          })),
        },
        images: images
          ? { create: images.map((img, i) => ({ ...img, position: i })) }
          : undefined,
      },
      include: productInclude,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const updateSchema = createProductSchema.partial().extend({ active: z.boolean().optional() });
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { variants, images, name, ...rest } = parsed.data;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(name ? { name, slug: slugify(name) } : {}),
      },
      include: productInclude,
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
}

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().min(0),
});

export async function addVariant(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const parsed = variantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { size, color, stock } = parsed.data;
    const variantSku = `${product.sku}-${size}-${color.slice(0, 3).toUpperCase()}-${Date.now()}`;

    const variant = await prisma.productVariant.create({
      data: { productId: req.params.id, size, color, stock, sku: variantSku },
    });

    res.status(201).json(variant);
  } catch (err) {
    next(err);
  }
}

export async function updateVariant(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const variant = await prisma.productVariant.findFirst({
      where: { id: req.params.variantId, productId: req.params.id },
    });
    if (!variant) {
      res.status(404).json({ error: 'Variante não encontrada' });
      return;
    }

    const parsed = variantSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const updated = await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: parsed.data,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteVariant(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const variant = await prisma.productVariant.findFirst({
      where: { id: req.params.variantId, productId: req.params.id },
    });
    if (!variant) {
      res.status(404).json({ error: 'Variante não encontrada' });
      return;
    }

    const inOrder = await prisma.orderItem.findFirst({ where: { variantId: req.params.variantId } });
    if (inOrder) {
      res.status(400).json({ error: 'Variante está em pedidos existentes e não pode ser removida' });
      return;
    }

    await prisma.cartItem.deleteMany({ where: { variantId: req.params.variantId } });
    await prisma.productVariant.delete({ where: { id: req.params.variantId } });

    res.json({ message: 'Variante removida com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { active: false },
    });

    res.json({ message: 'Produto desativado com sucesso', product });
  } catch (err) {
    next(err);
  }
}
