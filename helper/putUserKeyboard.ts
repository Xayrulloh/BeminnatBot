import { ADMIN_MAIN_KEYBOARD, MAIN_KEYBOARD } from '#utils/constants'

export const UserKeyboard = (userId: number) => {
  return userId === 1151533771 ? ADMIN_MAIN_KEYBOARD : MAIN_KEYBOARD
}
