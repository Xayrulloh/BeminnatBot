export const keyboardMapper = (text: string) => {
  const options: Record<string, string> = {
    '🛍 Market': 'Market',
    '🛒 Savat': 'Bucket',
    '🚚 Buyurtmalar': 'Order',
    '📍 Joylashuv': 'AdminAddress',
    '🛍️ Mahsulot': 'AdminProduct',
    '🚚 Buyurtma': 'AdminOrder',
    '💲 Yetkazib berish narxi': 'AdminWaybill',
  }

  return options[text]
}
