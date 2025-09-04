const { z } = require('zod');

// NAICS code validation (6-digit format)
const naicsCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'NAICS code must be exactly 6 digits');

// Past performance entry schema
const pastPerformanceSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  client: z
    .string()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name must not exceed 100 characters')
    .trim(),
  value: z
    .number()
    .nonnegative('Contract value must be non-negative')
    .max(999999999999, 'Contract value seems unrealistic')
    .optional(),
  year: z
    .number()
    .int('Year must be an integer')
    .min(1990, 'Year must be 1990 or later')
    .max(new Date().getFullYear(), 'Year cannot be in the future'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .trim()
    .optional(),
  url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal(''))
});

// Certification schema
const certificationSchema = z.object({
  name: z
    .string()
    .min(2, 'Certification name must be at least 2 characters')
    .max(100, 'Certification name must not exceed 100 characters')
    .trim(),
  type: z.enum([
    'SBA_8a',
    'WOSB',
    'EDWOSB',
    'HUBZone',
    'SDVOSB',
    'MBE',
    'WBE',
    'DBE',
    'ISO_9001',
    'ISO_27001',
    'CMMI',
    'Other'
  ]),
  issuingBody: z
    .string()
    .min(2, 'Issuing body must be at least 2 characters')
    .max(100, 'Issuing body must not exceed 100 characters')
    .trim()
    .optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  certificationNumber: z
    .string()
    .max(50, 'Certification number must not exceed 50 characters')
    .optional()
});

// Company capability/service schema
const capabilitySchema = z.object({
  category: z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
  keywords: z
    .array(z.string().trim())
    .min(1, 'At least one keyword is required')
    .max(20, 'Maximum 20 keywords allowed')
    .optional()
});

// Main company profile schema
const companyProfileSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters')
    .trim(),
  
  dba: z
    .string()
    .max(100, 'DBA name must not exceed 100 characters')
    .trim()
    .optional(),
  
  summary: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(600, 'Summary must not exceed 600 characters')
    .trim(),
  
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must not exceed 5000 characters')
    .trim()
    .optional(),
  
  // Business Details
  naics: z
    .array(naicsCodeSchema)
    .min(1, 'At least one NAICS code is required')
    .max(10, 'Maximum 10 NAICS codes allowed'),
  
  uei: z
    .string()
    .regex(/^[A-Z0-9]{12}$/, 'UEI must be 12 alphanumeric characters')
    .optional(),
  
  cageCode: z
    .string()
    .regex(/^[A-Z0-9]{5}$/, 'CAGE code must be 5 alphanumeric characters')
    .optional(),
  
  // Size and Classification
  employeeCount: z
    .number()
    .int('Employee count must be an integer')
    .nonnegative('Employee count must be non-negative')
    .max(500000, 'Employee count seems unrealistic')
    .optional(),
  
  annualRevenue: z
    .number()
    .nonnegative('Annual revenue must be non-negative')
    .max(999999999999, 'Annual revenue seems unrealistic')
    .optional(),
  
  businessType: z.enum([
    'small_business',
    'large_business',
    'non_profit',
    'educational_institution',
    'government_entity',
    'other'
  ]).optional(),
  
  // Certifications and Past Performance
  certifications: z
    .array(certificationSchema)
    .max(50, 'Maximum 50 certifications allowed')
    .default([]),
  
  pastPerformance: z
    .array(pastPerformanceSchema)
    .max(100, 'Maximum 100 past performance entries allowed')
    .default([]),
  
  // Capabilities
  capabilities: z
    .array(capabilitySchema)
    .max(50, 'Maximum 50 capabilities allowed')
    .optional(),
  
  // Contact Information
  website: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  
  linkedIn: z
    .string()
    .url('Must be a valid LinkedIn URL')
    .regex(/linkedin\.com/, 'Must be a LinkedIn URL')
    .optional()
    .or(z.literal('')),
  
  // Address
  address: z.object({
    street1: z.string().max(100).trim().optional(),
    street2: z.string().max(100).trim().optional(),
    city: z.string().max(50).trim().optional(),
    state: z.string().length(2, 'State must be 2-letter code').optional(),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').optional(),
    country: z.string().length(2, 'Country must be 2-letter ISO code').default('US')
  }).optional(),
  
  // Geographic Service Areas
  serviceAreas: z
    .array(z.string())
    .max(50, 'Maximum 50 service areas allowed')
    .optional(),
  
  // Keywords for matching
  keywords: z
    .array(z.string().trim())
    .max(100, 'Maximum 100 keywords allowed')
    .optional()
});

// Update profile schema (partial updates allowed)
const updateCompanyProfileSchema = companyProfileSchema.partial().refine(
  data => Object.keys(data).length > 0, 
  {
    message: 'At least one field must be provided for update'
  }
);

// Search/filter schema for querying profiles
const profileSearchSchema = z.object({
  naics: z.array(naicsCodeSchema).optional(),
  certifications: z.array(z.string()).optional(),
  minEmployees: z.number().nonnegative().optional(),
  maxEmployees: z.number().nonnegative().optional(),
  minRevenue: z.number().nonnegative().optional(),
  maxRevenue: z.number().nonnegative().optional(),
  businessType: z.enum([
    'small_business',
    'large_business',
    'non_profit',
    'educational_institution',
    'government_entity',
    'other'
  ]).optional(),
  keywords: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

module.exports = {
  companyProfileSchema,
  updateCompanyProfileSchema,
  profileSearchSchema,
  // Export sub-schemas for reuse
  pastPerformanceSchema,
  certificationSchema,
  capabilitySchema,
  naicsCodeSchema
};