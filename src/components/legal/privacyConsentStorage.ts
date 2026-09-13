import { PRIVACY_NOTICE_LAST_UPDATED } from './PrivacyNoticeContent';

const STORAGE_PREFIX = 'cargovigil_privacy_consent_';

/**
 * hasAcceptedPrivacyNotice / recordPrivacyNoticeAcceptance viven en su
 * propio módulo (no en PrivacyConsentModal.tsx) porque hoy son puramente del
 * lado del cliente: el backend (domain/auth.User) no tiene todavía un campo
 * tipo `privacy_accepted_at` que persista esto en el servidor. localStorage
 * es suficiente para dejar de mostrar el gate en ESTE navegador, pero no
 * sirve como evidencia legal de consentimiento si un usuario cambia de
 * dispositivo o borra su storage — para eso hace falta un endpoint pequeño
 * en el backend (POST /auth/privacy-consent o un campo en /auth/me) que
 * grabe la fecha de aceptación por usuario. Se deja marcado aquí a propósito
 * para no presentar esto como "resuelto" del todo.
 */
export function hasAcceptedPrivacyNotice(userId: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + userId) === PRIVACY_NOTICE_LAST_UPDATED;
  } catch {
    // Almacenamiento bloqueado (modo privado, política del navegador): no
    // bloqueamos el acceso por esto, pero tampoco recordamos la aceptación.
    return false;
  }
}

export function recordPrivacyNoticeAcceptance(userId: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, PRIVACY_NOTICE_LAST_UPDATED);
  } catch {
    // Ignorado a propósito — ver comentario de arriba.
  }
}
