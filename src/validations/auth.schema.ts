export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupInput {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  businessType: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export function validateLoginInput(input: LoginInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.email = "Valid email address is required";
  }
  if (!input.password || input.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  return errors;
}

export function validateSignupInput(input: SignupInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.businessName?.trim()) errors.businessName = "Business name is required";
  if (!input.ownerName?.trim()) errors.ownerName = "Owner / Contact name is required";
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.email = "Valid email is required";
  if (!input.phone?.trim()) errors.phone = "Phone number is required";
  if (!input.password || input.password.length < 8) errors.password = "Password must be at least 8 characters";
  if (input.password !== input.confirmPassword) errors.confirmPassword = "Passwords do not match";
  return errors;
}
