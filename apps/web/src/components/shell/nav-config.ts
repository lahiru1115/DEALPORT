import type { ComponentType, SVGProps } from "react";

import {
  CardOutlineIcon,
  CartOutlineIcon,
  CirclePlusOutlineIcon,
  CircleSquareOutlineIcon,
  GearOutlineIcon,
  HomeFilledIcon,
  HomeOutlineIcon,
  ImageOutlineIcon,
  CirclePlusFilledIcon,
  ProductListFilledIcon,
  ProductListOutlineIcon,
  ReviewsOutlineIcon,
  StarOutlineIcon,
  TicketCouponOutlineIcon,
  UserProfileCircleIcon,
  UsersOutlineIcon,
} from "@/components/icons/generated";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  label: string;
  icon: NavIcon;
  activeIcon?: NavIcon;
  href?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main menu",
    items: [
      {
        label: "Dashboard",
        icon: HomeOutlineIcon,
        activeIcon: HomeFilledIcon,
        href: "/dashboard",
      },
      { label: "Order Management", icon: CartOutlineIcon },
      { label: "Customers", icon: UsersOutlineIcon },
      { label: "Coupon Code", icon: TicketCouponOutlineIcon },
      { label: "Categories", icon: CircleSquareOutlineIcon },
      { label: "Transaction", icon: CardOutlineIcon },
      { label: "Brand", icon: StarOutlineIcon },
    ],
  },
  {
    label: "Product",
    items: [
      {
        label: "Add Products",
        icon: CirclePlusOutlineIcon,
        activeIcon: CirclePlusFilledIcon,
        href: "/products/new",
      },
      { label: "Product Media", icon: ImageOutlineIcon },
      {
        label: "Product List",
        icon: ProductListOutlineIcon,
        activeIcon: ProductListFilledIcon,
        href: "/products",
      },
      { label: "Product Reviews", icon: ReviewsOutlineIcon },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Admin role", icon: UserProfileCircleIcon },
      { label: "Control Authority", icon: GearOutlineIcon },
    ],
  },
];

export const NAV_TITLES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items)
    .filter((item): item is NavItem & { href: string } => Boolean(item.href))
    .map((item) => [item.href, item.label]),
);
