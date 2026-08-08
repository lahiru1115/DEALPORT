import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      productCount: tag._count.products,
    }));
  }
}
