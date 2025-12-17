export const applyDiscounts = ({ product, discounts, user, cartQty = 1 }) => {
  let price = product.finalPrice; 
  const now = new Date();

  for (const d of discounts) {
    if (!d.isActive) continue;
    if (d.fromDate && d.fromDate > now) continue;
    if (d.expire && d.expire < now) continue;

    // ===== Scope 
    if (
      d.appliesTo === "PRODUCTS" &&
      !d.products.some((id) => id.equals(product._id))
    )
      continue;

    if (
      d.appliesTo === "CATEGORIES" &&
      !d.categories.some((id) => id.equals(product.category))
    )
      continue;

    // ===== Types 
    if (["FLASH", "PERCENTAGE"].includes(d.type)) {
      price -= price * (d.percentage / 100);
    }

    if (d.type === "BOGO" && cartQty >= d.buyQty) {
      const freeItems = Math.floor(cartQty / d.buyQty) * d.getQty;
      price = (price * (cartQty - freeItems)) / cartQty;
    }

    if (d.type === "FIRST_ORDER" && user?.orderCount === 0) {
      price -= price * (d.percentage / 100);
    }

    if (d.type === "BULK" && cartQty >= 5) {
      price -= price * (d.percentage / 100);
    }
  }

  return Math.max(price, 0);
};
