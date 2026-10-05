import { PASSWORD_MAX_BYTES, PASSWORD_MIN_LENGTH } from "../constants";

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/** Bytes the string occupies in UTF-8 (what bcrypt, and so the server, counts). */
const utf8Length = (value: string): number => {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
  }
  return bytes;
};

/** The server's rule for a new password: 8+ characters, at most 72 bytes. */
export const validatePassword = (password: string): boolean => {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    utf8Length(password) <= PASSWORD_MAX_BYTES
  );
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const getEmailError = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  if (!validateEmail(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const getPasswordError = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!validatePassword(password)) {
    return 'Password is too long';
  }
  return null;
};

/** Signing in only needs a password to be present; the server judges it. */
export const getLoginPasswordError = (password: string): string | null => {
  return password ? null : 'Password is required';
};

export const getNameError = (name: string): string | null => {
  if (!name) {
    return 'Name is required';
  }
  if (!validateName(name)) {
    return 'Name must be at least 2 characters';
  }
  return null;
};

