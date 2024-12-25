export const keyboardMapper = (text: string) => {
  const options: Record<string, string> = {
    '📁 Kategoriyalar': 'Category',
    '📍 Joylashuvlar': 'Address',
    '🛒 Savat': 'Bucket',
    '🚚 Buyurtmalar': 'Order',
    '📁 Kategoriya': 'AdminCategory',
    // '📍 Joylashuv': 'AdminAddress',
    '🛍️ Mahsulot': 'AdminProduct',
  }

  return options[text]
}
