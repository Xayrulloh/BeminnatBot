export const keyboardMapper = (text: string) => {
  const options: Record<string, string> = {
    '🔍 Qidirish': 'Search',
    "🌍 Joylashuvni o'zgartirish": 'Location',
    "🍽 Ro'za": 'Fasting',
    "🔔 Xabarnomani o'zgartirish": 'Notification',
    '📊 Statistika': 'Statistic',
    '📚 Manba': 'Source',
    '📜 Hadis': 'Hadith',
    "📖 Qur'on va Tafsiri": 'Quran',
    '📢 Taklif yoki Shikoyat': 'Feedback',
  }

  return options[text]
}
