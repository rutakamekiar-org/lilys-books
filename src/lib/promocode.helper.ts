import { CartItem } from "@/components/molecules/CartProvider";
import { getPrice } from "@/lib/product-item.helper";
import { PromoCodeResponse, PromoCodeType } from "@/models/PromoCode";

export function calculateItemDiscount(item: CartItem, promocode: PromoCodeResponse | null): number {
  if (!promocode) return 0;

  const isGlobal = !promocode.applicableProductItemIds || 
    promocode.applicableProductItemIds.length === 0;

  const isApplicable = isGlobal || promocode.applicableProductItemIds!.includes(item.itemId);

  if (!isApplicable) return 0;

  const productItem = item.product.items.find(i => i.id === item.itemId);
  const price = productItem ? getPrice(productItem) : 0;
  const itemSubtotal = price * item.quantity;

  if (promocode.type === PromoCodeType.Percentage) {
    const perUnitDiscount = price - Math.round(price * (1 - promocode.value / 100));
    return perUnitDiscount * item.quantity;
  } else {
    // Fixed amount off
    if (isGlobal) {
      // Global fixed discount is typically applied to the whole cart total, 
      // it's not strictly "per item", so we return 0 for individual items
      // unless we want to distribute it.
      return 0;
    } else {
      // Item-specific fixed discount is applied for EACH unit of this item
      return Math.min(promocode.value * item.quantity, itemSubtotal);
    }
  }
}

export function calculateCartDiscount(items: CartItem[], promocode: PromoCodeResponse | null): number {
  if (!promocode || items.length === 0) return 0;

  const isGlobal = !promocode.applicableProductItemIds || 
    promocode.applicableProductItemIds.length === 0;

  if (promocode.type === PromoCodeType.Fixed && isGlobal) {
    // For global fixed discount, calculate based on cart subtotal
    const subtotal = items.reduce((sum, item) => {
      const productItem = item.product.items.find(i => i.id === item.itemId);
      const price = productItem ? getPrice(productItem) : 0;
      return sum + (price * item.quantity);
    }, 0);
    return Math.min(promocode.value, subtotal);
  }

  // For percentage or item-specific fixed, we can sum individual item discounts
  return items.reduce((sum, item) => sum + calculateItemDiscount(item, promocode), 0);
}
