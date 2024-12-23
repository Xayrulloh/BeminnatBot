import { ADMIN_MAIN_KEYBOARD, MAIN_KEYBOARD } from '#utils/constants'

export const UserKeyboard = (userId: number) => {
  return userId === 1151533772 ? ADMIN_MAIN_KEYBOARD : MAIN_KEYBOARD
}
