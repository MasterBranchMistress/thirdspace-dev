export type PasswordStrength = "Weak" | "Okay" | "Strong";

export function getPasswordStrength(password: string) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  const score = [hasMinLength, hasUppercase, hasNumber].filter(Boolean).length;

  if (score === 3) return "Strong";
  if (score === 2) return "Okay";
  return "Weak";
}
