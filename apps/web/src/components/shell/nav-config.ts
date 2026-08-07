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
  /** Swapped in for `icon` while this row is the active route — falls back to `icon` when omitted. */
  activeIcon?: NavIcon;
  /** Only the three routes the brief (§5) requires to actually navigate. */
  href?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The kit's full sidebar, off `design/screens/2 Dashboard.png`. Every item is
 * rendered at full fidelity; only `href` items are real routes — the rest are
 * inert per brief §5 (present so the shell reads as the whole product, not
 * wired up because there is no screen behind them).
 */
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

/** Flat lookup so the topbar can title itself off the active route. */
export const NAV_TITLES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items)
    .filter((item): item is NavItem & { href: string } => Boolean(item.href))
    .map((item) => [item.href, item.label]),
);
