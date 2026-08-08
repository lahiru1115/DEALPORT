import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, ProductStatus, StockStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { ProductsService } from './products.service';

const decimal = (value: number) => new Prisma.Decimal(value);

function buildProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'prod_1',
    name: 'iPhone 15',
    slug: 'iphone-15',
    sku: 'FXZ-1234',
    description: null,
    price: decimal(999),
    discountedPrice: null,
    taxIncluded: true,
    currency: 'USD',
    saleStartsAt: null,
    saleEndsAt: null,
    stockQuantity: 10,
    unlimitedStock: false,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.DRAFT,
    featured: false,
    colors: [],
    totalOrders: 0,
    categoryId: null,
    createdById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    category: null,
    tags: [],
    images: [],
    ...overrides,
  };
}

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let uploads: { destroyImages: jest.Mock };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    uploads = { destroyImages: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploads },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('builds a case-insensitive OR search across name/sku/description', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({
        search: 'iphone',
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as never);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'iphone', mode: 'insensitive' } },
              { sku: { contains: 'iphone', mode: 'insensitive' } },
              { description: { contains: 'iphone', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('omits filters that were not provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as never);

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('applies status/category/stockStatus/featured filters when provided', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({
        status: ProductStatus.PUBLISHED,
        categoryId: 'cat_1',
        stockStatus: StockStatus.OUT_OF_STOCK,
        featured: true,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      } as never);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'PUBLISHED',
            categoryId: 'cat_1',
            stockStatus: 'OUT_OF_STOCK',
            featured: true,
          },
        }),
      );
    });

    it('paginates via skip/take and returns the envelope with formatted money', async () => {
      const product = buildProduct({ price: decimal(49.9) });
      prisma.$transaction.mockResolvedValue([[product], 25]);

      const result = await service.findAll({
        page: 3,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc',
      } as never);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10, orderBy: { price: 'asc' } }),
      );
      expect(result.meta).toEqual({ page: 3, limit: 10, total: 25, totalPages: 3 });
      expect(result.data[0].price).toBe('49.90');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('formats price/discountedPrice as fixed 2dp strings', async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({ price: decimal(999), discountedPrice: decimal(900.89) }),
      );

      const result = await service.findOne('prod_1');

      expect(result.price).toBe('999.00');
      expect(result.discountedPrice).toBe('900.89');
    });

    it('returns null discountedPrice untouched', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct({ discountedPrice: null }));

      const result = await service.findOne('prod_1');

      expect(result.discountedPrice).toBeNull();
    });
  });

  describe('create', () => {
    const validDto = { name: 'New Widget', price: 20, stockQuantity: 5 };

    it('rejects when discountedPrice is not less than price', async () => {
      await expect(service.create({ ...validDto, discountedPrice: 20 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('rejects when saleEndsAt is not after saleStartsAt', async () => {
      await expect(
        service.create({
          ...validDto,
          saleStartsAt: '2026-06-10T00:00:00.000Z',
          saleEndsAt: '2026-06-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('rejects when unlimitedStock is false and stockQuantity is missing', async () => {
      await expect(service.create({ name: 'New Widget', price: 20 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('allows a missing stockQuantity when unlimitedStock is true', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(
        buildProduct({ unlimitedStock: true, stockQuantity: null }),
      );

      await expect(
        service.create({ name: 'New Widget', price: 20, unlimitedStock: true }),
      ).resolves.toBeDefined();
    });

    it('retries slug generation on collision and appends a numeric suffix', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prisma.product.create.mockResolvedValue(buildProduct());

      await service.create(validDto);

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ slug: 'new-widget-2' }) }),
      );
    });

    it('generates an FXZ-#### sku', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(buildProduct());

      await service.create(validDto);

      const call = prisma.product.create.mock.calls[0][0];
      expect(call.data.sku).toMatch(/^FXZ-\d{4}$/);
    });

    it('defaults status to DRAFT and stockStatus to IN_STOCK', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(buildProduct());

      await service.create(validDto);

      const call = prisma.product.create.mock.calls[0][0];
      expect(call.data.status).toBe(ProductStatus.DRAFT);
      expect(call.data.stockStatus).toBe(StockStatus.IN_STOCK);
    });

    it('formats the created product money fields', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(buildProduct({ price: decimal(20) }));

      const result = await service.create(validDto);

      expect(result.price).toBe('20.00');
    });
  });

  describe('update', () => {
    it('throws NotFoundException before attempting the update when the id is missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { price: 10 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('re-validates the price/sale-window business rules on patch', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());

      await expect(
        service.update('prod_1', { price: 10, discountedPrice: 15 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('updates and formats the money fields', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());
      prisma.product.update.mockResolvedValue(buildProduct({ status: ProductStatus.PUBLISHED }));

      const result = await service.update('prod_1', { status: ProductStatus.PUBLISHED });

      expect(result.status).toBe(ProductStatus.PUBLISHED);
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prod_1' } }),
      );
    });

    it('destroys only the Cloudinary images that were dropped from the new image list', async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({
          images: [
            { publicId: 'kept', url: 'https://a', isPrimary: true, position: 0 },
            { publicId: 'removed', url: 'https://b', isPrimary: false, position: 1 },
          ],
        }),
      );
      prisma.product.update.mockResolvedValue(buildProduct());

      await service.update('prod_1', {
        images: [{ url: 'https://a', publicId: 'kept' }],
      });

      expect(uploads.destroyImages).toHaveBeenCalledWith(['removed']);
    });

    it('does not touch Cloudinary when images are left untouched', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());
      prisma.product.update.mockResolvedValue(buildProduct());

      await service.update('prod_1', { status: ProductStatus.PUBLISHED });

      expect(uploads.destroyImages).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException instead of deleting when the id is missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing product', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());
      prisma.product.delete.mockResolvedValue(undefined);

      await service.remove('prod_1');

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod_1' } });
    });

    it('destroys every image the deleted product had on Cloudinary', async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({
          images: [{ publicId: 'a', url: 'https://a', isPrimary: true, position: 0 }],
        }),
      );
      prisma.product.delete.mockResolvedValue(undefined);

      await service.remove('prod_1');

      expect(uploads.destroyImages).toHaveBeenCalledWith(['a']);
    });
  });

  describe('widgets', () => {
    it('topProducts queries PUBLISHED only, ordered by totalOrders desc', async () => {
      prisma.product.findMany.mockResolvedValue([buildProduct({ price: decimal(80) })]);

      const result = await service.topProducts(4);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ProductStatus.PUBLISHED },
          orderBy: { totalOrders: 'desc' },
          take: 4,
        }),
      );
      expect(result[0].price).toBe('80.00');
    });

    it('bestSelling queries PUBLISHED only, ordered by totalOrders desc', async () => {
      prisma.product.findMany.mockResolvedValue([buildProduct({ price: decimal(72.4) })]);

      const result = await service.bestSelling(4);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ProductStatus.PUBLISHED },
          orderBy: { totalOrders: 'desc' },
          take: 4,
        }),
      );
      expect(result[0].price).toBe('72.40');
    });
  });
});
