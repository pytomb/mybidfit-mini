const { z } = require('zod');

// Email validation with proper format
const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

// Password validation with security requirements
const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Phone validation (optional but must be valid format if provided)
const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s-().]+$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

// Registration schema
const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .trim(),
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters')
    .trim()
    .optional(),
  phone: phoneSchema
});

// Login schema
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Password reset request schema
const passwordResetRequestSchema = z.object({
  email: emailSchema
});

// Password reset schema
const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema
});

// Change password schema (for authenticated users)
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
});

// Profile update schema (for authenticated users)
const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .trim()
    .optional(),
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters')
    .trim()
    .optional(),
  phone: phoneSchema
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

module.exports = {
  signupSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
  // Export individual validators for reuse
  emailSchema,
  passwordSchema,
  phoneSchema
};