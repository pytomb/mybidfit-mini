const { z } = require('zod');

// Opportunity type enum
const opportunityTypeEnum = z.enum([
  'RFP',
  'RFQ',
  'RFI',
  'Sources_Sought',
  'Pre_Solicitation',
  'Special_Notice',
  'Contract_Award',
  'Sole_Source',
  'Other'
]);

// Set-aside type enum
const setAsideEnum = z.enum([
  'Total_Small_Business',
  'SBA_8a',
  'WOSB',
  'EDWOSB',
  'HUBZone',
  'SDVOSB',
  'Partial_Small_Business',
  'None',
  'Other'
]);

// Contract type enum
const contractTypeEnum = z.enum([
  'Fixed_Price',
  'Cost_Reimbursement',
  'Time_and_Materials',
  'Labor_Hour',
  'IDIQ',
  'BPA',
  'Purchase_Order',
  'Other'
]);

// Opportunity status enum
const opportunityStatusEnum = z.enum([
  'active',
  'upcoming',
  'closed',
  'awarded',
  'cancelled',
  'draft'
]);

// Contact information schema
const contactSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  title: z.string().max(100).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  phone: z.string().regex(/^\+?[\d\s-().]+$/).optional(),
  fax: z.string().regex(/^\+?[\d\s-().]+$/).optional()
});

// Attachment schema
const attachmentSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  url: z.string().url(),
  size: z.number().positive().optional(),
  uploadedAt: z.string().datetime().optional()
});

// Main opportunity schema
const opportunitySchema = z.object({
  // Basic Information
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(500, 'Title must not exceed 500 characters')
    .trim(),
  
  solicitationNumber: z
    .string()
    .min(1, 'Solicitation number is required')
    .max(100, 'Solicitation number must not exceed 100 characters')
    .trim(),
  
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(10000, 'Description must not exceed 10000 characters')
    .trim(),
  
  type: opportunityTypeEnum,
  
  status: opportunityStatusEnum.default('active'),
  
  // Agency Information
  agency: z.object({
    name: z.string().min(2).max(200).trim(),
    department: z.string().max(200).trim().optional(),
    office: z.string().max(200).trim().optional(),
    location: z.object({
      city: z.string().max(100).trim().optional(),
      state: z.string().length(2).optional(),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
      country: z.string().length(2).default('US')
    }).optional()
  }),
  
  // Classification
  naics: z
    .array(z.string().regex(/^\d{6}$/))
    .min(1, 'At least one NAICS code is required')
    .max(10, 'Maximum 10 NAICS codes allowed'),
  
  psc: z
    .string()
    .regex(/^[A-Z0-9]{4}$/, 'PSC must be 4 alphanumeric characters')
    .optional(),
  
  // Contract Details
  contractType: contractTypeEnum.optional(),
  
  setAside: setAsideEnum.optional(),
  
  placeOfPerformance: z.object({
    city: z.string().max(100).trim().optional(),
    state: z.string().length(2).optional(),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
    country: z.string().length(2).default('US'),
    remote: z.boolean().default(false)
  }).optional(),
  
  // Value and Dates
  estimatedValue: z
    .number()
    .nonnegative('Estimated value must be non-negative')
    .max(999999999999, 'Estimated value seems unrealistic')
    .optional(),
  
  valueMin: z
    .number()
    .nonnegative('Minimum value must be non-negative')
    .optional(),
  
  valueMax: z
    .number()
    .nonnegative('Maximum value must be non-negative')
    .optional(),
  
  postedDate: z.string().datetime(),
  
  responseDeadline: z.string().datetime(),
  
  questionDeadline: z.string().datetime().optional(),
  
  expectedAwardDate: z.string().datetime().optional(),
  
  periodOfPerformance: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    durationMonths: z.number().positive().max(600).optional()
  }).optional(),
  
  // Requirements
  requirements: z.object({
    clearanceRequired: z.boolean().default(false),
    clearanceLevel: z.enum(['None', 'Public_Trust', 'Secret', 'Top_Secret', 'TS_SCI']).optional(),
    experienceYears: z.number().nonnegative().max(50).optional(),
    pastPerformanceRequired: z.boolean().default(false),
    certificationRequirements: z.array(z.string()).max(20).optional()
  }).optional(),
  
  // Contact Information
  primaryContact: contactSchema.optional(),
  
  contractingOfficer: contactSchema.optional(),
  
  // Links and Attachments
  sourceUrl: z.string().url().optional(),
  
  attachments: z.array(attachmentSchema).max(50).default([]),
  
  // Additional Information
  synopsis: z
    .string()
    .max(2000, 'Synopsis must not exceed 2000 characters')
    .trim()
    .optional(),
  
  instructions: z
    .string()
    .max(5000, 'Instructions must not exceed 5000 characters')
    .trim()
    .optional(),
  
  evaluationCriteria: z.array(
    z.object({
      criterion: z.string().min(2).max(200).trim(),
      weight: z.number().min(0).max(100).optional(),
      description: z.string().max(1000).trim().optional()
    })
  ).max(20).optional(),
  
  // Metadata
  sourceSystem: z.string().max(50).optional(),
  externalId: z.string().max(100).optional(),
  lastUpdated: z.string().datetime().optional(),
  
  // Custom fields for flexibility
  customFields: z.record(z.any()).optional()
});

// Create opportunity schema (for new opportunities)
const createOpportunitySchema = opportunitySchema;

// Update opportunity schema (partial updates allowed)
const updateOpportunitySchema = opportunitySchema.partial().refine(
  data => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

// Search/filter schema for querying opportunities
const opportunitySearchSchema = z.object({
  keywords: z.string().optional(),
  naics: z.array(z.string().regex(/^\d{6}$/)).optional(),
  psc: z.string().regex(/^[A-Z0-9]{4}$/).optional(),
  agency: z.string().optional(),
  type: opportunityTypeEnum.optional(),
  status: opportunityStatusEnum.optional(),
  setAside: setAsideEnum.optional(),
  minValue: z.number().nonnegative().optional(),
  maxValue: z.number().nonnegative().optional(),
  postedAfter: z.string().datetime().optional(),
  postedBefore: z.string().datetime().optional(),
  deadlineAfter: z.string().datetime().optional(),
  deadlineBefore: z.string().datetime().optional(),
  state: z.string().length(2).optional(),
  remote: z.boolean().optional(),
  clearanceRequired: z.boolean().optional(),
  sortBy: z.enum(['postedDate', 'deadline', 'value', 'score']).default('deadline'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

// Opportunity scoring request schema
const scoringRequestSchema = z.object({
  opportunityId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
  companyProfile: z.any().optional(), // Would reference the profile schema
  includeRecommendations: z.boolean().default(true),
  includeJudgeDetails: z.boolean().default(true)
});

// Batch scoring request schema
const batchScoringRequestSchema = z.object({
  companyId: z.string().uuid(),
  opportunityIds: z
    .array(z.string().uuid())
    .min(1, 'At least one opportunity ID is required')
    .max(100, 'Maximum 100 opportunities can be scored at once'),
  includeRecommendations: z.boolean().default(false),
  includeJudgeDetails: z.boolean().default(false)
});

module.exports = {
  opportunitySchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  opportunitySearchSchema,
  scoringRequestSchema,
  batchScoringRequestSchema,
  // Export enums for reuse
  opportunityTypeEnum,
  setAsideEnum,
  contractTypeEnum,
  opportunityStatusEnum,
  // Export sub-schemas
  contactSchema,
  attachmentSchema
};