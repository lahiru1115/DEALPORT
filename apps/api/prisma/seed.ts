/**
 * DEALPORT seed — idempotent.
 *
 * Safe to run repeatedly: users/categories/tags/products are upserted by their
 * unique keys, and the read-only Order/OrderItem tables are rebuilt from scratch
 * so the dashboard's trailing-14-day window always lands relative to "now".
 *
 * Product `totalOrders` is a denormalised lifetime counter (it backs the Best
 * Selling "TOTAL ORDER" column). The Order rows below cover only the last 14
 * days, which is what the dashboard aggregates — the two are deliberately
 * independent, not a mismatch.
 */
import { PrismaClient, ProductStatus, StockStatus, OrderStatus, PaymentMethod } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Deterministic PRNG so re-seeding produces identical data. */
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260805);

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const round2 = (n: number) => Math.round(n * 100) / 100;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Deterministic placeholder imagery — replaced by real Cloudinary uploads on create. */
const imageFor = (slug: string) => `https://picsum.photos/seed/${slug}/600/600`;

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

const CATEGORIES = [
  'Electronic',
  'Fashion',
  'Home',
  'Accessories',
  'Sports & Outdoors',
  'Toys & Games',
  'Health & Fitness',
  'Books',
] as const;

const TAGS = [
  'Smartphone',
  'Laptop',
  'Audio',
  'Casual',
  'Formal',
  'Outdoor',
  'Fitness',
  'Kitchen',
  'Gift',
  'New Arrival',
  'Sale',
  'Premium',
] as const;

// ---------------------------------------------------------------------------
// Catalogue
//
// The first four are the products the Dashboard mock shows in Top Products and
// Best selling product. They carry the highest `totalOrders` on purpose, so the
// real API ordering (totalOrders desc) reproduces the design.
// ---------------------------------------------------------------------------

type SeedProduct = {
  name: string;
  sku: string;
  category: (typeof CATEGORIES)[number];
  price: number;
  discountedPrice?: number;
  totalOrders: number;
  stockStatus: StockStatus;
  status: ProductStatus;
  featured?: boolean;
  tags: string[];
  description: string;
  colors?: string[];
};

const PRODUCTS: SeedProduct[] = [
  {
    name: 'Assorted Cross Bag',
    sku: 'FXZ-4570',
    category: 'Accessories',
    price: 80.0,
    totalOrders: 506,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    featured: true,
    tags: ['Casual', 'Premium', 'Gift'],
    description:
      'A structured leather cross-body bag with an adjustable strap and three interior compartments. Finished with brushed-brass hardware.',
    colors: ['#8B5E3C', '#2E2E2E'],
  },
  {
    name: 'T-shirt',
    sku: 'FXZ-4569',
    category: 'Fashion',
    price: 35.4,
    totalOrders: 266,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    featured: true,
    tags: ['Casual', 'New Arrival'],
    description:
      'Heavyweight 240gsm combed cotton tee with a ribbed collar and double-stitched hem. Pre-shrunk, holds its shape after washing.',
    colors: ['#2E2E2E', '#FFFFFF', '#C1E6BA'],
  },
  {
    name: 'Apple iPhone 13',
    sku: 'FXZ-4567',
    category: 'Electronic',
    price: 999.0,
    discountedPrice: 900.89,
    totalOrders: 104,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    featured: true,
    tags: ['Smartphone', 'Premium'],
    description:
      'A15 Bionic chip, dual 12MP camera system with Photographic Styles, and a Super Retina XDR display. Ceramic Shield front, IP68 water resistant.',
    colors: ['#EAF8E7', '#2E2E2E', '#4A6CF7'],
  },
  {
    name: 'Nike Air Jordan',
    sku: 'FXZ-4568',
    category: 'Fashion',
    price: 72.4,
    totalOrders: 56,
    stockStatus: StockStatus.OUT_OF_STOCK,
    status: ProductStatus.PUBLISHED,
    featured: true,
    tags: ['Casual', 'Outdoor', 'Premium'],
    description:
      'Retro high-top silhouette with encapsulated Air cushioning, full-grain leather upper and a rubber cupsole for court-ready traction.',
    colors: ['#2E2E2E', '#D93025', '#FFFFFF'],
  },
  {
    name: 'Smart Fitness Tracker',
    sku: 'FXZ-4571',
    category: 'Health & Fitness',
    price: 39.99,
    totalOrders: 55,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Fitness', 'New Arrival'],
    description:
      'Continuous heart-rate and SpO2 monitoring, 14-day battery, and 20 workout modes. 5ATM water resistant with a 1.4" AMOLED display.',
    colors: ['#2E2E2E', '#4A6CF7'],
  },
  {
    name: 'Leather Wallet',
    sku: 'FXZ-4572',
    category: 'Accessories',
    price: 19.99,
    totalOrders: 54,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Formal', 'Gift'],
    description:
      'Full-grain vegetable-tanned leather bifold with six card slots, a hidden note pocket and RFID-blocking lining.',
    colors: ['#8B5E3C', '#2E2E2E'],
  },
  {
    name: 'Electric Hair Trimmer',
    sku: 'FXZ-4573',
    category: 'Health & Fitness',
    price: 34.99,
    totalOrders: 52,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Gift'],
    description:
      'Self-sharpening titanium blades with eight guide combs, 120-minute cordless runtime and USB-C fast charging.',
    colors: ['#2E2E2E', '#C0C0C0'],
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    sku: 'FXZ-4574',
    category: 'Electronic',
    price: 349.99,
    discountedPrice: 299.99,
    totalOrders: 51,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Audio', 'Premium'],
    description:
      'Industry-leading adaptive noise cancellation with eight microphones, 30-hour battery and multipoint Bluetooth pairing.',
    colors: ['#2E2E2E', '#EAEAEA'],
  },
  {
    name: 'Samsung Galaxy S23',
    sku: 'FXZ-4575',
    category: 'Electronic',
    price: 899.0,
    discountedPrice: 849.0,
    totalOrders: 49,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Smartphone', 'Premium'],
    description:
      'Snapdragon 8 Gen 2 for Galaxy, 50MP triple camera with Nightography, and a 120Hz Dynamic AMOLED 2X display.',
    colors: ['#2E2E2E', '#C1E6BA', '#4A6CF7'],
  },
  {
    name: 'Atomic Habits',
    sku: 'FXZ-4576',
    category: 'Books',
    price: 16.99,
    totalOrders: 47,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Gift', 'New Arrival'],
    description:
      'James Clear on building good habits and breaking bad ones through small, compounding changes. Paperback, 320 pages.',
  },
  {
    name: 'Stainless Steel Water Bottle',
    sku: 'FXZ-4577',
    category: 'Sports & Outdoors',
    price: 18.99,
    totalOrders: 45,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Outdoor', 'Fitness'],
    description:
      'Double-walled vacuum insulation keeps drinks cold 24 hours or hot 12. 750ml, powder-coated finish, leak-proof cap.',
    colors: ['#2E2E2E', '#C1E6BA', '#D93025'],
  },
  {
    name: 'Memory Foam Pillow',
    sku: 'FXZ-4578',
    category: 'Home',
    price: 39.0,
    totalOrders: 43,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Premium'],
    description:
      'Contoured gel-infused memory foam with a bamboo-blend removable cover. Machine washable, CertiPUR-US certified.',
    colors: ['#FFFFFF', '#EAEAEA'],
  },
  {
    name: 'Denim Jacket',
    sku: 'FXZ-4579',
    category: 'Fashion',
    price: 89.5,
    discountedPrice: 69.5,
    totalOrders: 41,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Casual', 'Sale'],
    description:
      'Classic trucker cut in 12oz rigid selvedge denim with copper rivets, chest flap pockets and a stonewashed finish.',
    colors: ['#4A6CF7', '#2E2E2E'],
  },
  {
    name: 'Yoga Mat Pro',
    sku: 'FXZ-4580',
    category: 'Health & Fitness',
    price: 45.0,
    totalOrders: 38,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Fitness'],
    description:
      '6mm closed-cell TPE mat with an alignment grid, non-slip texture on both faces and a carry strap. Latex free.',
    colors: ['#C1E6BA', '#2E2E2E'],
  },
  {
    name: 'iPad Pro 11-inch',
    sku: 'FXZ-4581',
    category: 'Electronic',
    price: 799.0,
    totalOrders: 36,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Premium', 'Laptop'],
    description:
      'M2 chip with a Liquid Retina display, ProMotion up to 120Hz, and support for Apple Pencil hover. Wi-Fi 6E.',
    colors: ['#C0C0C0', '#2E2E2E'],
  },
  {
    name: 'Running Shorts',
    sku: 'FXZ-4582',
    category: 'Sports & Outdoors',
    price: 24.99,
    totalOrders: 34,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Fitness', 'Outdoor'],
    description:
      'Lightweight ripstop shell with a brief liner, 5" inseam, zip valuables pocket and reflective hits at the hem.',
    colors: ['#2E2E2E', '#4A6CF7', '#C1E6BA'],
  },
  {
    name: 'The Pragmatic Programmer',
    sku: 'FXZ-4583',
    category: 'Books',
    price: 39.99,
    totalOrders: 31,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Premium', 'Gift'],
    description:
      'Hunt and Thomas on pragmatic software craft, 20th anniversary edition. Hardcover, 352 pages.',
  },
  {
    name: 'MacBook Air M2',
    sku: 'FXZ-4584',
    category: 'Electronic',
    price: 1199.0,
    totalOrders: 28,
    stockStatus: StockStatus.LOW_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Laptop', 'Premium'],
    description:
      'M2 chip with an 8-core CPU and 10-core GPU, 13.6" Liquid Retina display, MagSafe charging and up to 18 hours battery.',
    colors: ['#2E2E2E', '#C0C0C0'],
  },
  {
    name: 'RC Drone Explorer',
    sku: 'FXZ-4585',
    category: 'Toys & Games',
    price: 149.99,
    discountedPrice: 129.99,
    totalOrders: 26,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Outdoor', 'Gift', 'Sale'],
    description:
      '4K gimbal camera with GPS return-to-home, 28-minute flight time and a 2km control range. Folds to pocket size.',
    colors: ['#2E2E2E', '#C0C0C0'],
  },
  {
    name: 'Wooden Puzzle Set',
    sku: 'FXZ-4586',
    category: 'Toys & Games',
    price: 22.5,
    totalOrders: 23,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Gift'],
    description:
      'Three-tier FSC-certified beechwood puzzle set with non-toxic water-based dyes. Suitable for ages 3 and up.',
    colors: ['#8B5E3C', '#C1E6BA'],
  },
  {
    name: 'Ceramic Dinner Set',
    sku: 'FXZ-4587',
    category: 'Home',
    price: 129.0,
    discountedPrice: 109.0,
    totalOrders: 19,
    stockStatus: StockStatus.LOW_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Kitchen', 'Premium', 'Sale'],
    description:
      'Sixteen-piece stoneware service for four with a reactive glaze. Dishwasher and microwave safe, chip-resistant rim.',
    colors: ['#FFFFFF', '#EAF8E7'],
  },
  {
    name: 'Espresso Machine',
    sku: 'FXZ-4588',
    category: 'Home',
    price: 299.0,
    totalOrders: 16,
    stockStatus: StockStatus.OUT_OF_STOCK,
    status: ProductStatus.PUBLISHED,
    tags: ['Kitchen', 'Premium'],
    description:
      '15-bar Italian pump with a thermoblock heater, professional steam wand and a 1.8L removable reservoir.',
    colors: ['#C0C0C0', '#2E2E2E'],
  },
  {
    name: 'Aviator Sunglasses',
    sku: 'FXZ-4589',
    category: 'Accessories',
    price: 59.0,
    totalOrders: 12,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.DRAFT,
    tags: ['Casual', 'New Arrival'],
    description:
      'Polarised CR-39 lenses in a lightweight metal frame with adjustable silicone nose pads. 100% UV400 protection.',
    colors: ['#C0C0C0', '#2E2E2E'],
  },
  {
    name: 'Trail Running Shoes',
    sku: 'FXZ-4590',
    category: 'Sports & Outdoors',
    price: 119.0,
    discountedPrice: 99.0,
    totalOrders: 8,
    stockStatus: StockStatus.LOW_STOCK,
    status: ProductStatus.DRAFT,
    tags: ['Outdoor', 'Fitness', 'Sale'],
    description:
      'Aggressive 5mm lugs on a sticky rubber outsole, rock plate underfoot and a quick-dry engineered mesh upper.',
    colors: ['#C1E6BA', '#2E2E2E', '#D93025'],
  },
  {
    name: 'Winter Wool Scarf',
    sku: 'FXZ-4591',
    category: 'Fashion',
    price: 27.5,
    totalOrders: 0,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.DRAFT,
    tags: ['Casual', 'Gift'],
    description:
      'Brushed lambswool scarf woven in a herringbone twill, 180 × 30cm with hand-knotted fringe.',
    colors: ['#8B5E3C', '#2E2E2E', '#EAEAEA'],
  },
  {
    name: 'Bluetooth Speaker Mini',
    sku: 'FXZ-4592',
    category: 'Electronic',
    price: 59.99,
    totalOrders: 0,
    stockStatus: StockStatus.IN_STOCK,
    status: ProductStatus.DRAFT,
    tags: ['Audio', 'New Arrival'],
    description:
      'Pocket-sized 10W driver with passive radiator, IPX7 waterproofing, 12-hour playtime and stereo pairing.',
    colors: ['#2E2E2E', '#D93025', '#4A6CF7'],
  },
];

const CUSTOMER_NAMES = [
  'John Doe',
  'Sarah Chen',
  'Miguel Alvarez',
  'Priya Nair',
  'Tom Becker',
  'Aisha Rahman',
  'Lucas Moreau',
  'Emma Nilsson',
  'Kofi Mensah',
  'Yuki Tanaka',
  'Olivia Brooks',
  'Daniel Okafor',
  'Hannah Weiss',
  'Rajesh Kumar',
  'Sofia Rossi',
  'Liam O’Connor',
] as const;

// ---------------------------------------------------------------------------

async function seedUser() {
  const passwordHash = await bcrypt.hash('Admin@123', 10); // gitleaks:allow — intentionally public seed/demo credential, per brief §9
  const user = await prisma.user.upsert({
    where: { email: 'admin@dealport.com' },
    update: { name: 'Dealport Admin', passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@dealport.com',
      name: 'Dealport Admin',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://i.pravatar.cc/128?img=12',
    },
  });
  console.log(`  user       admin@dealport.com / Admin@123`); // gitleaks:allow — intentionally public seed/demo credential, per brief §9
  return user;
}

async function seedCategories() {
  const map = new Map<string, string>();
  for (const name of CATEGORIES) {
    const slug = slugify(name);
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, imageUrl: imageFor(`category-${slug}`) },
      create: { name, slug, imageUrl: imageFor(`category-${slug}`) },
    });
    map.set(name, category.id);
  }
  console.log(`  categories ${map.size}`);
  return map;
}

async function seedTags() {
  const map = new Map<string, string>();
  for (const name of TAGS) {
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    map.set(name, tag.id);
  }
  console.log(`  tags       ${map.size}`);
  return map;
}

async function seedProducts(
  categoryIds: Map<string, string>,
  tagIds: Map<string, string>,
  userId: string,
) {
  const ids: { id: string; price: number; status: ProductStatus }[] = [];

  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    const stockQuantity =
      p.stockStatus === StockStatus.OUT_OF_STOCK
        ? 0
        : p.stockStatus === StockStatus.LOW_STOCK
          ? between(2, 9)
          : between(40, 520);

    const images = [
      { url: imageFor(slug), publicId: null, position: 0, isPrimary: true },
      { url: imageFor(`${slug}-alt`), publicId: null, position: 1, isPrimary: false },
    ];

    const tagConnect = p.tags
      .map((t) => tagIds.get(t))
      .filter((id): id is string => Boolean(id))
      .map((id) => ({ id }));

    const common = {
      name: p.name,
      sku: p.sku,
      description: p.description,
      price: p.price,
      discountedPrice: p.discountedPrice ?? null,
      taxIncluded: true,
      currency: 'USD',
      stockQuantity,
      unlimitedStock: false,
      stockStatus: p.stockStatus,
      status: p.status,
      featured: p.featured ?? false,
      colors: p.colors ?? [],
      totalOrders: p.totalOrders,
      categoryId: categoryIds.get(p.category)!,
      createdById: userId,
    };

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        ...common,
        tags: { set: [], connect: tagConnect },
        images: { deleteMany: {}, create: images },
      },
      create: {
        ...common,
        slug,
        tags: { connect: tagConnect },
        images: { create: images },
      },
    });

    ids.push({ id: product.id, price: p.price, status: p.status });
  }

  const published = ids.filter((p) => p.status === ProductStatus.PUBLISHED).length;
  console.log(`  products   ${ids.length} (${published} published, ${ids.length - published} draft)`);
  return ids;
}

/**
 * Rebuilt every run so `placedAt` always spans the trailing 14 days — the
 * dashboard compares the last 7 against the 7 before to compute deltaPct.
 * Volume is weighted higher in the recent week so the deltas read positive.
 */
async function seedOrders(products: { id: string; price: number; status: ProductStatus }[]) {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  const sellable = products.filter((p) => p.status === ProductStatus.PUBLISHED);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let orderCount = 0;
  let itemCount = 0;
  let reference = 5000;

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const isRecentWeek = dayOffset < 7;
    const ordersToday = isRecentWeek ? between(15, 22) : between(9, 14);

    for (let i = 0; i < ordersToday; i++) {
      const placedAt = new Date(today);
      placedAt.setDate(placedAt.getDate() - dayOffset);
      placedAt.setHours(between(8, 20), between(0, 59), between(0, 59), 0);

      const items = Array.from({ length: between(1, 3) }, () => {
        const product = pick(sellable);
        return { productId: product.id, quantity: between(1, 3), unitPrice: product.price };
      });

      const amount = round2(
        items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
      );

      const roll = rand();
      const status =
        roll < 0.78 ? OrderStatus.PAID : roll < 0.93 ? OrderStatus.PENDING : OrderStatus.CANCELED;

      reference += between(1, 9);

      await prisma.order.create({
        data: {
          reference: `#${reference}`,
          customerRef: `#CUST${String(between(1, 240)).padStart(3, '0')}`,
          customerName: pick(CUSTOMER_NAMES),
          status,
          method: pick([
            PaymentMethod.CC,
            PaymentMethod.CC,
            PaymentMethod.PAYPAL,
            PaymentMethod.BANK_TRANSFER,
            PaymentMethod.COD,
          ]),
          amount,
          placedAt,
          items: { create: items },
        },
      });

      orderCount++;
      itemCount += items.length;
    }
  }

  console.log(`  orders     ${orderCount} over 14 days (${itemCount} line items)`);
}

async function main() {
  console.log('Seeding DEALPORT…');
  const user = await seedUser();
  const categoryIds = await seedCategories();
  const tagIds = await seedTags();
  const products = await seedProducts(categoryIds, tagIds, user.id);
  await seedOrders(products);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
