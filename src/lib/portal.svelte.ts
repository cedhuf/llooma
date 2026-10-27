/**
 * The desktop window the dialogs open inside, so they never cover the frame around
 * it. Null where there is none (the login, the boot screen, the phone interface)
 * and on the server, which leaves them on the page.
 */
export const dialogHost = $state<{ window: HTMLElement | null }>({ window: null });
