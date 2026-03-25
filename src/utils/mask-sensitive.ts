export const maskEmail = (email: string): string =>
  email.replace(/.(?=.*@)/g, '*');
