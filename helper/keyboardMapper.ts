export const keyboardMapper = (text: string) => {
  const options: Record<string, string> = {
    '🛍 Market': 'Market',
    '📍 Joylashuvlar': 'Address',
    '🛒 Savat': 'Bucket',
    '🚚 Buyurtmalar': 'Order',
    '📁 Kategoriya': 'AdminCategory',
    // '📍 Joylashuv': 'AdminAddress',
    '🛍️ Mahsulot': 'AdminProduct',
  }

  return options[text]
}
