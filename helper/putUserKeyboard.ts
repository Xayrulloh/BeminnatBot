import { ADMIN_MAIN_KEYBOARD, ADMIN_USER_ID, MAIN_KEYBOARD } from '#utils/constants'

export const UserKeyboard = (userId: number) => {
  return userId === ADMIN_USER_ID ? ADMIN_MAIN_KEYBOARD : MAIN_KEYBOARD
}
