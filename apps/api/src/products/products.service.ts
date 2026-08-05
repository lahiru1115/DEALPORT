import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, StockStatus } from '@prisma/client';
import { paginate } from '../common/dto/paginated-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_INCLUDE = {
  category: true,
  tags: true,
  images: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.ProductInclude;

const WIDGET_SELECT = {
  id: true,
  name: true,
  sku: true,
  price: true,
  totalOrders: true,
  stockStatus: true,
  images: { orderBy: { position: 'asc' as const }, take: 1 },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const { search, categoryId, status, stockStatus, featured, page, limit, sortBy, sortOrder } = query;

    const where: Prisma.ProductWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(stockStatus && { stockStatus }),
      ...(featured !== undefined && { featured }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(data.map(formatProductMoney), total, page, limit);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException(`Product with id '${id}' not found`);
    }

    return formatProductMoney(product);
  }

  async create(dto: CreateProductDto) {
    this.assertPriceAndSaleWindow(dto);
    if (!dto.unlimitedStock && dto.stockQuantity === undefined) {
      throw new BadRequestException('stockQuantity is required unless unlimitedStock is true');
    }

    const slug = await this.generateUniqueSlug(dto.name);
    const sku = await this.generateUniqueSku();

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        sku,
        description: dto.description,
        price: dto.price,
        discountedPrice: dto.discountedPrice,
        taxIncluded: dto.taxIncluded ?? true,
        currency: dto.currency ?? 'USD',
        saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : undefined,
        saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : undefined,
        stockQuantity: dto.stockQuantity,
        unlimitedStock: dto.unlimitedStock ?? false,
        stockStatus: dto.stockStatus ?? StockStatus.IN_STOCK,
        status: dto.status ?? ProductStatus.DRAFT,
        featured: dto.featured ?? false,
        colors: dto.colors ?? [],
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
        tags: dto.tagIds?.length ? { connect: dto.tagIds.map((id) => ({ id })) } : undefined,
        images: dto.images?.length ? { create: this.toImageRows(dto.images) } : undefined,
      },
      include: PRODUCT_INCLUDE,
    });
    return formatProductMoney(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    this.assertPriceAndSaleWindow(dto);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        discountedPrice: dto.discountedPrice,
        taxIncluded: dto.taxIncluded,
        currency: dto.currency,
        saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : undefined,
        saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : undefined,
        stockQuantity: dto.stockQuantity,
        unlimitedStock: dto.unlimitedStock,
        stockStatus: dto.stockStatus,
        status: dto.status,
        featured: dto.featured,
        colors: dto.colors,
        category: dto.categoryId !== undefined ? { connect: { id: dto.categoryId } } : undefined,
        tags: dto.tagIds ? { set: dto.tagIds.map((id) => ({ id })) } : undefined,
        images: dto.images
          ? { deleteMany: {}, create: this.toImageRows(dto.images) }
          : undefined,
      },
      include: PRODUCT_INCLUDE,
    });
    return formatProductMoney(product);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
  }

  async topProducts(limit: number) {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      orderBy: { totalOrders: 'desc' },
      take: limit,
      select: WIDGET_SELECT,
    });
    return products.map(formatWidgetMoney);
  }

  async bestSelling(limit: number) {
    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.PUBLISHED },
      orderBy: { totalOrders: 'desc' },
      take: limit,
      select: WIDGET_SELECT,
    });
    return products.map(formatWidgetMoney);
  }

  private toImageRows(images: NonNullable<CreateProductDto['images']>) {
    return images.map((image, index) => ({
      url: image.url,
      publicId: image.publicId,
      isPrimary: image.isPrimary ?? index === 0,
      position: index,
    }));
  }

  /** Cross-field rules the doc marks "service asserts" rather than a decorator (plans/02-API.md §3). */
  private assertPriceAndSaleWindow(
    dto: Partial<Pick<CreateProductDto, 'price' | 'discountedPrice' | 'saleStartsAt' | 'saleEndsAt'>>,
  ) {
    if (dto.discountedPrice !== undefined && dto.price !== undefined && dto.discountedPrice >= dto.price) {
      throw new BadRequestException('discountedPrice must be less than price');
    }
    if (dto.saleStartsAt && dto.saleEndsAt && new Date(dto.saleEndsAt) <= new Date(dto.saleStartsAt)) {
      throw new BadRequestException('saleEndsAt must be after saleStartsAt');
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let suffix = 1;
    // eslint-disable-next-line no-await-in-loop -- sequential by design: each check depends on the previous suffix
    while (await this.prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${++suffix}`;
    }
    return slug;
  }

  private async generateUniqueSku(): Promise<string> {
    let sku: string;
    let existing: { id: string } | null;
    do {
      sku = `FXZ-${Math.floor(1000 + Math.random() * 9000)}`;
      // eslint-disable-next-line no-await-in-loop -- retry-until-unique by design, collisions are rare
      existing = await this.prisma.product.findUnique({ where: { sku }, select: { id: true } });
    } while (existing);
    return sku;
  }
}

/**
 * Prisma's Decimal#toString() strips trailing zeros ("999" instead of "999.00") —
 * money fields are formatted to a fixed 2dp string to match plans/02-API.md's contract.
 */
function formatProductMoney<T extends { price: Prisma.Decimal; discountedPrice: Prisma.Decimal | null }>(
  product: T,
): Omit<T, 'price' | 'discountedPrice'> & { price: string; discountedPrice: string | null } {
  return {
    ...product,
    price: product.price.toFixed(2),
    discountedPrice: product.discountedPrice?.toFixed(2) ?? null,
  };
}

function formatWidgetMoney<T extends { price: Prisma.Decimal }>(product: T): Omit<T, 'price'> & { price: string } {
  return { ...product, price: product.price.toFixed(2) };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
