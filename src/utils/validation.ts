export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
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
  if (!validatePassword(password)) {
    return 'Password must be at least 6 characters';
  }
  return null;
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

