export const applyDiscounts = ({ product, discounts, user, cartQty = 1 }) => {
  let price = product.finalPrice;

  for (const d of discounts) {
    const now = new Date();
    if (!d.isActive) continue;
    if (d.fromDate && d.fromDate > now) continue;
    if (d.expire && d.expire < now) continue;

    // === Apply Scope
    if (d.appliesTo === "PRODUCTS" && !d.products.includes(product._id))
      continue;
    if (
      d.appliesTo === "CATEGORIES" &&
      !d.categories.includes(product.category)
    )
      continue;

    // === Discount Types
    if (d.type === "FLASH" || d.type === "PERCENTAGE") {
      price -= price * (d.percentage / 100);
    }

    if (d.type === "BOGO") {
      if (cartQty >= d.buyQty) {
        const freeItems = Math.floor(cartQty / d.buyQty) * d.getQty;
        price = (price * (cartQty - freeItems)) / cartQty;
      }
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
