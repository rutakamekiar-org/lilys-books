import { CartItem } from "@/components/molecules/CartProvider";
import { getPrice } from "@/lib/product-item.helper";
import { PromoCodeResponse, PromoCodeType } from "@/models/PromoCode";

function isItemApplicable(item: CartItem, promocode: PromoCodeResponse): boolean {
  const isGlobal = !promocode.applicableProductItemIds ||
    promocode.applicableProductItemIds.length === 0;
  return isGlobal || promocode.applicableProductItemIds!.includes(item.itemId);
}

/**
 * Returns a map of itemId -> number of units that actually receive the discount.
 * When remainingUsages is set, only the top N units by price (desc) are discounted.
 */
export function getDiscountedUnitsPerItem(
  items: CartItem[],
  promocode: PromoCodeResponse | null
): Map<string, number> {
  const map = new Map<string, number>();
  if (!promocode) return map;

  const applicableItems = items.filter(item => isItemApplicable(item, promocode));

  // No usage limit — all applicable units are discounted
  if (promocode.remainingUsages == null) {
    applicableItems.forEach(item => map.set(item.itemId, item.quantity));
    return map;
  }

  // Expand to individual units, sort by price desc, take first remainingUsages
  const units: { itemId: string; price: number }[] = [];
  for (const item of applicableItems) {
    const productItem = item.product.items.find(i => i.id === item.itemId);
    const price = productItem ? getPrice(productItem) ?? 0 : 0;
    for (let i = 0; i < item.quantity; i++) {
      units.push({ itemId: item.itemId, price });
    }
  }
  units.sort((a, b) => b.price - a.price);

  const selected = units.slice(0, promocode.remainingUsages);
  for (const unit of selected) {
    map.set(unit.itemId, (map.get(unit.itemId) ?? 0) + 1);
  }

  return map;
}

export function calculateItemDiscount(
  item: CartItem,
  promocode: PromoCodeResponse | null,
  discountedUnits?: number
): number {
  if (!promocode) return 0;
  if (!isItemApplicable(item, promocode)) return 0;

  const units = discountedUnits ?? item.quantity;
  if (units <= 0) return 0;

  const productItem = item.product.items.find(i => i.id === item.itemId);
  const price = productItem ? getPrice(productItem) ?? 0 : 0;
  const itemSubtotal = price * units;

  const isGlobal = !promocode.applicableProductItemIds ||
    promocode.applicableProductItemIds.length === 0;

  if (promocode.type === PromoCodeType.Percentage) {
    const perUnitDiscount = price - Math.round(price * (1 - promocode.value / 100));
    return perUnitDiscount * units;
  } else {
    // Fixed amount off
    if (isGlobal) {
      // Global fixed discount is applied to the whole cart total, not per-item
      return 0;
    } else {
      return Math.min(promocode.value * units, itemSubtotal);
    }
  }
}

export function calculateCartDiscount(items: CartItem[], promocode: PromoCodeResponse | null): number {
  if (!promocode || items.length === 0) return 0;

  const isGlobal = !promocode.applicableProductItemIds ||
    promocode.applicableProductItemIds.length === 0;

  if (promocode.type === PromoCodeType.Fixed && isGlobal) {
    // Global fixed: apply to full cart subtotal (remainingUsages doesn't change the lump-sum amount)
    const subtotal = items.reduce((sum, item) => {
      const productItem = item.product.items.find(i => i.id === item.itemId);
      const price = productItem ? getPrice(productItem) ?? 0 : 0;
      return sum + price * item.quantity;
    }, 0);
    return Math.min(promocode.value, subtotal);
  }

  const unitsMap = getDiscountedUnitsPerItem(items, promocode);
  return items.reduce((sum, item) => {
    const discountedUnits = unitsMap.get(item.itemId) ?? 0;
    return sum + calculateItemDiscount(item, promocode, discountedUnits);
  }, 0);
}
