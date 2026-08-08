
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}
