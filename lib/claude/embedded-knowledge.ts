/**
 * Embedded Knowledge Base for Business Valuation
 *
 * This module contains curated data for:
 * - Industry/sector valuation multiples
 * - Risk assessment frameworks
 * - Tax form extraction guides
 * - Financial statement field mappings
 * - Common SDE add-backs
 */

// =============================================================================
// SECTOR MULTIPLES
// =============================================================================

export interface SectorMultiple {
  sector: string;
  sdeMultipleLow: number;
  sdeMultipleHigh: number;
  sdeMultipleMedian: number;
  revenueMultipleLow: number;
  revenueMultipleHigh: number;
  revenueMultipleMedian: number;
  typicalMargins: {
    gross: { low: number; high: number };
    operating: { low: number; high: number };
  };
  keyConsiderations: string[];
}

export const SECTOR_MULTIPLES: SectorMultiple[] = [
  {
    sector: 'Professional Services',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 0.85,
    typicalMargins: {
      gross: { low: 0.50, high: 0.75 },
      operating: { low: 0.15, high: 0.35 },
    },
    keyConsiderations: [
      'Client concentration risk',
      'Key employee dependency',
      'Recurring revenue percentage',
      'Professional certifications/licenses',
    ],
  },
  {
    sector: 'Healthcare Services',
    sdeMultipleLow: 2.5,
    sdeMultipleHigh: 5.0,
    sdeMultipleMedian: 3.5,
    revenueMultipleLow: 0.6,
    revenueMultipleHigh: 2.0,
    revenueMultipleMedian: 1.1,
    typicalMargins: {
      gross: { low: 0.40, high: 0.65 },
      operating: { low: 0.10, high: 0.30 },
    },
    keyConsiderations: [
      'Regulatory compliance',
      'Insurance reimbursement rates',
      'Provider licensing',
      'Patient concentration',
      'HIPAA compliance',
    ],
  },
  {
    sector: 'Technology/Software',
    sdeMultipleLow: 3.0,
    sdeMultipleHigh: 6.0,
    sdeMultipleMedian: 4.0,
    revenueMultipleLow: 1.0,
    revenueMultipleHigh: 4.0,
    revenueMultipleMedian: 2.0,
    typicalMargins: {
      gross: { low: 0.60, high: 0.85 },
      operating: { low: 0.15, high: 0.40 },
    },
    keyConsiderations: [
      'Recurring revenue (SaaS/subscription)',
      'Customer churn rate',
      'Technology stack age',
      'IP ownership',
      'Scalability',
    ],
  },
  {
    sector: 'Manufacturing',
    sdeMultipleLow: 2.5,
    sdeMultipleHigh: 5.0,
    sdeMultipleMedian: 3.2,
    revenueMultipleLow: 0.4,
    revenueMultipleHigh: 1.2,
    revenueMultipleMedian: 0.7,
    typicalMargins: {
      gross: { low: 0.25, high: 0.45 },
      operating: { low: 0.08, high: 0.20 },
    },
    keyConsiderations: [
      'Equipment age and condition',
      'Supply chain dependencies',
      'Customer concentration',
      'Proprietary processes',
      'Inventory management',
    ],
  },
  {
    sector: 'Construction',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.5,
    sdeMultipleMedian: 2.3,
    revenueMultipleLow: 0.2,
    revenueMultipleHigh: 0.6,
    revenueMultipleMedian: 0.35,
    typicalMargins: {
      gross: { low: 0.20, high: 0.40 },
      operating: { low: 0.05, high: 0.15 },
    },
    keyConsiderations: [
      'Backlog quality',
      'Bonding capacity',
      'License requirements',
      'Equipment ownership vs leasing',
      'Subcontractor relationships',
    ],
  },
  {
    sector: 'Retail',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.0,
    revenueMultipleLow: 0.2,
    revenueMultipleHigh: 0.6,
    revenueMultipleMedian: 0.35,
    typicalMargins: {
      gross: { low: 0.30, high: 0.55 },
      operating: { low: 0.05, high: 0.15 },
    },
    keyConsiderations: [
      'Location/lease terms',
      'Inventory turnover',
      'E-commerce presence',
      'Brand recognition',
      'Seasonality',
    ],
  },
  {
    sector: 'Restaurants/Food Service',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.0,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.6,
    revenueMultipleMedian: 0.4,
    typicalMargins: {
      gross: { low: 0.60, high: 0.75 },
      operating: { low: 0.05, high: 0.15 },
    },
    keyConsiderations: [
      'Location quality',
      'Lease terms',
      'Franchise vs independent',
      'Kitchen equipment condition',
      'Health inspection history',
    ],
  },
  {
    sector: 'Wholesale Distribution',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.2,
    revenueMultipleHigh: 0.5,
    revenueMultipleMedian: 0.3,
    typicalMargins: {
      gross: { low: 0.15, high: 0.30 },
      operating: { low: 0.05, high: 0.12 },
    },
    keyConsiderations: [
      'Supplier relationships',
      'Customer concentration',
      'Warehouse/logistics',
      'Territory exclusivity',
      'Inventory management',
    ],
  },
  {
    sector: 'Transportation/Logistics',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.7,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.8,
    revenueMultipleMedian: 0.5,
    typicalMargins: {
      gross: { low: 0.20, high: 0.40 },
      operating: { low: 0.08, high: 0.18 },
    },
    keyConsiderations: [
      'Fleet age and condition',
      'Driver retention',
      'Operating authority',
      'Insurance costs',
      'Fuel hedging',
    ],
  },
  {
    sector: 'Home Services',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.5,
    revenueMultipleLow: 0.4,
    revenueMultipleHigh: 1.0,
    revenueMultipleMedian: 0.6,
    typicalMargins: {
      gross: { low: 0.40, high: 0.60 },
      operating: { low: 0.10, high: 0.25 },
    },
    keyConsiderations: [
      'Service agreement base',
      'Technician retention',
      'Territory coverage',
      'Seasonality',
      'Equipment inventory',
    ],
  },
  {
    sector: 'Auto Services',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.2,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.7,
    revenueMultipleMedian: 0.45,
    typicalMargins: {
      gross: { low: 0.40, high: 0.55 },
      operating: { low: 0.10, high: 0.20 },
    },
    keyConsiderations: [
      'Location/visibility',
      'Equipment condition',
      'Certifications (ASE)',
      'Franchise affiliation',
      'Environmental compliance',
    ],
  },
  {
    sector: 'E-commerce',
    sdeMultipleLow: 2.5,
    sdeMultipleHigh: 4.5,
    sdeMultipleMedian: 3.2,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 0.8,
    typicalMargins: {
      gross: { low: 0.35, high: 0.65 },
      operating: { low: 0.10, high: 0.25 },
    },
    keyConsiderations: [
      'Traffic sources',
      'Customer acquisition cost',
      'Platform dependency (Amazon, Shopify)',
      'Brand ownership',
      'Fulfillment model',
    ],
  },
  {
    sector: 'Education/Training',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 0.85,
    typicalMargins: {
      gross: { low: 0.50, high: 0.70 },
      operating: { low: 0.15, high: 0.30 },
    },
    keyConsiderations: [
      'Accreditation status',
      'Instructor dependency',
      'Curriculum ownership',
      'Online vs in-person',
      'Enrollment trends',
    ],
  },
  {
    sector: 'Real Estate Services',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.0,
    revenueMultipleLow: 0.4,
    revenueMultipleHigh: 1.0,
    revenueMultipleMedian: 0.6,
    typicalMargins: {
      gross: { low: 0.45, high: 0.65 },
      operating: { low: 0.15, high: 0.30 },
    },
    keyConsiderations: [
      'Agent retention',
      'Market concentration',
      'Brand recognition',
      'Technology platform',
      'Property management contracts',
    ],
  },
  {
    sector: 'Insurance Agency',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 3.5,
    sdeMultipleMedian: 2.5,
    revenueMultipleLow: 1.0,
    revenueMultipleHigh: 2.5,
    revenueMultipleMedian: 1.5,
    typicalMargins: {
      gross: { low: 0.70, high: 0.90 },
      operating: { low: 0.20, high: 0.40 },
    },
    keyConsiderations: [
      'Book of business composition',
      'Carrier relationships',
      'Retention rates',
      'Commission structures',
      'Producer dependency',
    ],
  },
  {
    sector: 'Staffing/Recruiting',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.8,
    revenueMultipleMedian: 0.5,
    typicalMargins: {
      gross: { low: 0.20, high: 0.40 },
      operating: { low: 0.08, high: 0.18 },
    },
    keyConsiderations: [
      'Client concentration',
      'Placement type (temp vs perm)',
      'Industry specialization',
      'Recruiter retention',
      'Database quality',
    ],
  },
];

// =============================================================================
// DETAILED INDUSTRY MULTIPLES (NAICS-based)
// =============================================================================

export interface IndustryMultiple {
  naicsCode: string;
  industryName: string;
  sdeMultipleLow: number;
  sdeMultipleHigh: number;
  sdeMultipleMedian: number;
  revenueMultipleLow: number;
  revenueMultipleHigh: number;
  revenueMultipleMedian: number;
  notes: string;
}

export const DETAILED_INDUSTRY_MULTIPLES: IndustryMultiple[] = [
  // Professional Services
  {
    naicsCode: '541110',
    industryName: 'Law Firms',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.5,
    sdeMultipleMedian: 2.3,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 0.9,
    notes: 'Higher multiples for recurring client base and specialized practice areas',
  },
  {
    naicsCode: '541211',
    industryName: 'CPA Firms',
    sdeMultipleLow: 1.0,
    sdeMultipleHigh: 1.5,
    sdeMultipleMedian: 1.2,
    revenueMultipleLow: 0.8,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 1.1,
    notes: 'Often valued on revenue multiple; tax season concentration matters',
  },
  {
    naicsCode: '541330',
    industryName: 'Engineering Services',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.4,
    revenueMultipleHigh: 1.0,
    revenueMultipleMedian: 0.6,
    notes: 'Backlog quality and government contract exposure important',
  },
  {
    naicsCode: '541512',
    industryName: 'IT Services/Consulting',
    sdeMultipleLow: 2.5,
    sdeMultipleHigh: 5.0,
    sdeMultipleMedian: 3.5,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 0.9,
    notes: 'Managed services contracts command premium multiples',
  },

  // Healthcare
  {
    naicsCode: '621111',
    industryName: 'Medical Practices (Primary Care)',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.2,
    revenueMultipleMedian: 0.75,
    notes: 'Payer mix and EMR systems affect value',
  },
  {
    naicsCode: '621210',
    industryName: 'Dental Practices',
    sdeMultipleLow: 2.5,
    sdeMultipleHigh: 4.5,
    sdeMultipleMedian: 3.2,
    revenueMultipleLow: 0.6,
    revenueMultipleHigh: 1.0,
    revenueMultipleMedian: 0.75,
    notes: 'Equipment age and hygiene production important factors',
  },
  {
    naicsCode: '621310',
    industryName: 'Chiropractic Practices',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.0,
    revenueMultipleLow: 0.4,
    revenueMultipleHigh: 0.8,
    revenueMultipleMedian: 0.55,
    notes: 'Personal injury vs wellness patient mix matters',
  },
  {
    naicsCode: '621340',
    industryName: 'Physical Therapy',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.0,
    revenueMultipleMedian: 0.7,
    notes: 'Referral source diversity and payer contracts key factors',
  },
  {
    naicsCode: '621610',
    industryName: 'Home Health Care',
    sdeMultipleLow: 3.0,
    sdeMultipleHigh: 6.0,
    sdeMultipleMedian: 4.0,
    revenueMultipleLow: 0.8,
    revenueMultipleHigh: 2.0,
    revenueMultipleMedian: 1.2,
    notes: 'Medicare certification and state licenses are critical',
  },
  {
    naicsCode: '623110',
    industryName: 'Nursing Homes',
    sdeMultipleLow: 4.0,
    sdeMultipleHigh: 8.0,
    sdeMultipleMedian: 5.5,
    revenueMultipleLow: 0.8,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 1.0,
    notes: 'Occupancy rates and Medicaid percentage drive value',
  },

  // Manufacturing
  {
    naicsCode: '332710',
    industryName: 'Machine Shops',
    sdeMultipleLow: 2.5,
    sdeMultipleHigh: 4.5,
    sdeMultipleMedian: 3.2,
    revenueMultipleLow: 0.4,
    revenueMultipleHigh: 0.9,
    revenueMultipleMedian: 0.6,
    notes: 'CNC equipment and aerospace certifications add value',
  },
  {
    naicsCode: '333249',
    industryName: 'Industrial Equipment Manufacturing',
    sdeMultipleLow: 3.0,
    sdeMultipleHigh: 5.0,
    sdeMultipleMedian: 3.8,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.0,
    revenueMultipleMedian: 0.7,
    notes: 'Proprietary products and recurring parts revenue valued highly',
  },
  {
    naicsCode: '311',
    industryName: 'Food Manufacturing',
    sdeMultipleLow: 3.0,
    sdeMultipleHigh: 6.0,
    sdeMultipleMedian: 4.0,
    revenueMultipleLow: 0.5,
    revenueMultipleHigh: 1.5,
    revenueMultipleMedian: 0.9,
    notes: 'Brand strength and retail distribution key factors',
  },

  // Construction
  {
    naicsCode: '236220',
    industryName: 'Commercial Construction',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.0,
    revenueMultipleLow: 0.15,
    revenueMultipleHigh: 0.4,
    revenueMultipleMedian: 0.25,
    notes: 'Backlog and bonding capacity are critical',
  },
  {
    naicsCode: '238220',
    industryName: 'Plumbing/HVAC Contractors',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.8,
    revenueMultipleMedian: 0.5,
    notes: 'Service agreement base significantly increases value',
  },
  {
    naicsCode: '238210',
    industryName: 'Electrical Contractors',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.5,
    revenueMultipleLow: 0.25,
    revenueMultipleHigh: 0.6,
    revenueMultipleMedian: 0.4,
    notes: 'Industrial/commercial mix and service division matter',
  },

  // Retail
  {
    naicsCode: '445110',
    industryName: 'Grocery Stores',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.0,
    revenueMultipleLow: 0.15,
    revenueMultipleHigh: 0.35,
    revenueMultipleMedian: 0.22,
    notes: 'Location, lease terms, and inventory turnover key factors',
  },
  {
    naicsCode: '453998',
    industryName: 'Pet Stores',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 3.5,
    sdeMultipleMedian: 2.5,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.6,
    revenueMultipleMedian: 0.4,
    notes: 'Services (grooming, training) increase margins and value',
  },

  // Food Service
  {
    naicsCode: '722511',
    industryName: 'Full-Service Restaurants',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 3.0,
    sdeMultipleMedian: 2.0,
    revenueMultipleLow: 0.25,
    revenueMultipleHigh: 0.5,
    revenueMultipleMedian: 0.35,
    notes: 'Liquor license and real estate ownership add value',
  },
  {
    naicsCode: '722513',
    industryName: 'Quick Service Restaurants',
    sdeMultipleLow: 1.5,
    sdeMultipleHigh: 2.5,
    sdeMultipleMedian: 1.8,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.5,
    revenueMultipleMedian: 0.38,
    notes: 'Franchise vs independent significantly impacts value',
  },

  // Transportation
  {
    naicsCode: '484110',
    industryName: 'General Freight Trucking (Local)',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 3.5,
    sdeMultipleMedian: 2.5,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.6,
    revenueMultipleMedian: 0.4,
    notes: 'Fleet age and driver retention important',
  },
  {
    naicsCode: '484121',
    industryName: 'General Freight Trucking (Long-Distance)',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 4.0,
    sdeMultipleMedian: 2.8,
    revenueMultipleLow: 0.3,
    revenueMultipleHigh: 0.7,
    revenueMultipleMedian: 0.45,
    notes: 'Operating authority, lanes, and customer contracts key',
  },

  // Software/Technology
  {
    naicsCode: '511210',
    industryName: 'Software Publishers',
    sdeMultipleLow: 3.0,
    sdeMultipleHigh: 8.0,
    sdeMultipleMedian: 4.5,
    revenueMultipleLow: 1.5,
    revenueMultipleHigh: 5.0,
    revenueMultipleMedian: 2.5,
    notes: 'SaaS recurring revenue commands highest multiples',
  },
  {
    naicsCode: '518210',
    industryName: 'Data Processing/Hosting',
    sdeMultipleLow: 3.0,
    sdeMultipleHigh: 6.0,
    sdeMultipleMedian: 4.0,
    revenueMultipleLow: 1.0,
    revenueMultipleHigh: 3.0,
    revenueMultipleMedian: 1.8,
    notes: 'Contract length and customer churn are key metrics',
  },

  // Insurance
  {
    naicsCode: '524210',
    industryName: 'Insurance Agencies',
    sdeMultipleLow: 2.0,
    sdeMultipleHigh: 3.5,
    sdeMultipleMedian: 2.5,
    revenueMultipleLow: 1.0,
    revenueMultipleHigh: 2.5,
    revenueMultipleMedian: 1.5,
    notes: 'Book composition (P&C vs benefits) affects multiples',
  },
];

// =============================================================================
// RISK ASSESSMENT FRAMEWORK
// =============================================================================

export interface RiskFactor {
  name: string;
  weight: number;
  scoringCriteria: {
    low: { score: number; description: string };
    medium: { score: number; description: string };
    high: { score: number; description: string };
  };
  impactOnMultiple: string;
}

export const RISK_ASSESSMENT_FRAMEWORK: RiskFactor[] = [
  {
    name: 'Customer Concentration',
    weight: 0.15,
    scoringCriteria: {
      low: { score: 1, description: 'Top customer <10% of revenue, top 5 <30%' },
      medium: { score: 2, description: 'Top customer 10-25% of revenue' },
      high: { score: 3, description: 'Top customer >25% of revenue or single customer dependency' },
    },
    impactOnMultiple: 'High concentration can reduce multiple by 0.5-1.5x',
  },
  {
    name: 'Owner Dependency',
    weight: 0.15,
    scoringCriteria: {
      low: { score: 1, description: 'Owner works <20 hrs/week, strong management team' },
      medium: { score: 2, description: 'Owner works 40 hrs/week, some management depth' },
      high: { score: 3, description: 'Owner works >50 hrs/week, critical to operations' },
    },
    impactOnMultiple: 'High owner dependency can reduce multiple by 0.5-1.0x',
  },
  {
    name: 'Revenue Stability/Recurring',
    weight: 0.12,
    scoringCriteria: {
      low: { score: 1, description: '>60% recurring/contract revenue, stable YoY' },
      medium: { score: 2, description: '30-60% recurring, moderate fluctuation' },
      high: { score: 3, description: '<30% recurring, highly variable revenue' },
    },
    impactOnMultiple: 'Strong recurring revenue can increase multiple by 0.5-1.5x',
  },
  {
    name: 'Growth Trajectory',
    weight: 0.10,
    scoringCriteria: {
      low: { score: 1, description: 'Consistent 10%+ annual growth, clear growth path' },
      medium: { score: 2, description: 'Stable revenue, 0-10% growth' },
      high: { score: 3, description: 'Declining revenue or high volatility' },
    },
    impactOnMultiple: 'Strong growth can increase multiple by 0.5-1.0x',
  },
  {
    name: 'Industry Risk',
    weight: 0.10,
    scoringCriteria: {
      low: { score: 1, description: 'Growing industry, low disruption risk' },
      medium: { score: 2, description: 'Stable industry, moderate competitive pressure' },
      high: { score: 3, description: 'Declining industry or high disruption risk' },
    },
    impactOnMultiple: 'Industry risk can impact multiple by 0.3-0.8x',
  },
  {
    name: 'Competition/Market Position',
    weight: 0.08,
    scoringCriteria: {
      low: { score: 1, description: 'Strong market position, unique value proposition' },
      medium: { score: 2, description: 'Competitive market, differentiated offering' },
      high: { score: 3, description: 'Highly competitive, commodity offering' },
    },
    impactOnMultiple: 'Strong position can increase multiple by 0.3-0.5x',
  },
  {
    name: 'Financial Documentation',
    weight: 0.08,
    scoringCriteria: {
      low: { score: 1, description: 'Audited financials, clean books, good systems' },
      medium: { score: 2, description: 'Reviewed financials, reasonable documentation' },
      high: { score: 3, description: 'Tax returns only, poor record keeping' },
    },
    impactOnMultiple: 'Poor documentation can reduce multiple by 0.2-0.5x',
  },
  {
    name: 'Employee Risk',
    weight: 0.08,
    scoringCriteria: {
      low: { score: 1, description: 'Low turnover, documented processes, depth' },
      medium: { score: 2, description: 'Normal turnover, key employees identified' },
      high: { score: 3, description: 'High turnover or key employee concentration' },
    },
    impactOnMultiple: 'Employee risk can impact multiple by 0.2-0.5x',
  },
  {
    name: 'Asset Condition',
    weight: 0.07,
    scoringCriteria: {
      low: { score: 1, description: 'Modern equipment, well-maintained, adequate capacity' },
      medium: { score: 2, description: 'Functional equipment, some deferred maintenance' },
      high: { score: 3, description: 'Aging equipment, significant CapEx needed' },
    },
    impactOnMultiple: 'Asset issues can reduce value through CapEx adjustments',
  },
  {
    name: 'Legal/Regulatory Risk',
    weight: 0.07,
    scoringCriteria: {
      low: { score: 1, description: 'Full compliance, no pending issues' },
      medium: { score: 2, description: 'Minor compliance items, manageable exposure' },
      high: { score: 3, description: 'Significant compliance issues or litigation' },
    },
    impactOnMultiple: 'Legal issues can reduce multiple by 0.3-1.0x or more',
  },
];

// =============================================================================
// TAX FORM EXTRACTION GUIDE
// =============================================================================

export interface TaxFormField {
  line: string;
  label: string;
  mappedTo: string;
  notes?: string;
}

export interface TaxFormGuide {
  formType: string;
  formName: string;
  description: string;
  fields: TaxFormField[];
}

export const TAX_FORM_EXTRACTION_GUIDE: TaxFormGuide[] = [
  {
    formType: '1120-S',
    formName: 'S Corporation Income Tax Return',
    description: 'For S corporations - profits pass through to shareholders',
    fields: [
      { line: 'Line 1a', label: 'Gross receipts or sales', mappedTo: 'revenue.grossReceipts' },
      { line: 'Line 1b', label: 'Returns and allowances', mappedTo: 'revenue.returnsAllowances' },
      { line: 'Line 1c', label: 'Net receipts', mappedTo: 'revenue.netReceipts' },
      { line: 'Line 2', label: 'Cost of goods sold', mappedTo: 'expenses.cogs' },
      { line: 'Line 3', label: 'Gross profit', mappedTo: 'income.grossProfit' },
      { line: 'Line 4', label: 'Net gain (loss) Form 4797', mappedTo: 'income.assetSaleGain' },
      { line: 'Line 5', label: 'Other income (loss)', mappedTo: 'income.otherIncome' },
      { line: 'Line 6', label: 'Total income (loss)', mappedTo: 'income.totalIncome' },
      { line: 'Line 7', label: 'Compensation of officers', mappedTo: 'expenses.officerCompensation', notes: 'Key for SDE calculation' },
      { line: 'Line 8', label: 'Salaries and wages', mappedTo: 'expenses.salariesWages' },
      { line: 'Line 9', label: 'Repairs and maintenance', mappedTo: 'expenses.repairs' },
      { line: 'Line 10', label: 'Bad debts', mappedTo: 'expenses.badDebts' },
      { line: 'Line 11', label: 'Rents', mappedTo: 'expenses.rents' },
      { line: 'Line 12', label: 'Taxes and licenses', mappedTo: 'expenses.taxesLicenses' },
      { line: 'Line 13', label: 'Interest', mappedTo: 'expenses.interest', notes: 'Add back for debt-free value' },
      { line: 'Line 14', label: 'Depreciation', mappedTo: 'expenses.depreciation', notes: 'Add back for SDE' },
      { line: 'Line 15', label: 'Depletion', mappedTo: 'expenses.depletion' },
      { line: 'Line 16', label: 'Advertising', mappedTo: 'expenses.advertising' },
      { line: 'Line 17', label: 'Pension/profit-sharing', mappedTo: 'expenses.retirement' },
      { line: 'Line 18', label: 'Employee benefit programs', mappedTo: 'expenses.employeeBenefits' },
      { line: 'Line 19', label: 'Other deductions', mappedTo: 'expenses.otherDeductions', notes: 'Review attached schedule for add-backs' },
      { line: 'Line 20', label: 'Total deductions', mappedTo: 'expenses.totalDeductions' },
      { line: 'Line 21', label: 'Ordinary business income (loss)', mappedTo: 'income.ordinaryIncome', notes: 'Starting point for SDE' },
      { line: 'Schedule K, Line 1', label: 'Ordinary business income', mappedTo: 'kSchedule.ordinaryIncome' },
      { line: 'Schedule K, Line 4', label: 'Net rental real estate income', mappedTo: 'kSchedule.rentalIncome' },
      { line: 'Schedule K, Line 5', label: 'Other net rental income', mappedTo: 'kSchedule.otherRentalIncome' },
      { line: 'Schedule K, Line 6', label: 'Interest income', mappedTo: 'kSchedule.interestIncome' },
      { line: 'Schedule K, Line 7', label: 'Dividends', mappedTo: 'kSchedule.dividends' },
      { line: 'Schedule K, Line 16a', label: 'Distributions cash/property', mappedTo: 'distributions.total', notes: 'Shows owner cash flow' },
    ],
  },
  {
    formType: '1120',
    formName: 'C Corporation Income Tax Return',
    description: 'For C corporations - entity-level taxation',
    fields: [
      { line: 'Line 1a', label: 'Gross receipts or sales', mappedTo: 'revenue.grossReceipts' },
      { line: 'Line 1b', label: 'Returns and allowances', mappedTo: 'revenue.returnsAllowances' },
      { line: 'Line 1c', label: 'Net sales', mappedTo: 'revenue.netSales' },
      { line: 'Line 2', label: 'Cost of goods sold', mappedTo: 'expenses.cogs' },
      { line: 'Line 3', label: 'Gross profit', mappedTo: 'income.grossProfit' },
      { line: 'Line 4', label: 'Dividends', mappedTo: 'income.dividendIncome' },
      { line: 'Line 5', label: 'Interest', mappedTo: 'income.interestIncome' },
      { line: 'Line 6', label: 'Gross rents', mappedTo: 'income.rentIncome' },
      { line: 'Line 7', label: 'Gross royalties', mappedTo: 'income.royaltyIncome' },
      { line: 'Line 8', label: 'Capital gain net income', mappedTo: 'income.capitalGain' },
      { line: 'Line 9', label: 'Net gain (loss) Form 4797', mappedTo: 'income.assetSaleGain' },
      { line: 'Line 10', label: 'Other income', mappedTo: 'income.otherIncome' },
      { line: 'Line 11', label: 'Total income', mappedTo: 'income.totalIncome' },
      { line: 'Line 12', label: 'Compensation of officers', mappedTo: 'expenses.officerCompensation' },
      { line: 'Line 13', label: 'Salaries and wages', mappedTo: 'expenses.salariesWages' },
      { line: 'Line 14', label: 'Repairs and maintenance', mappedTo: 'expenses.repairs' },
      { line: 'Line 15', label: 'Bad debts', mappedTo: 'expenses.badDebts' },
      { line: 'Line 16', label: 'Rents', mappedTo: 'expenses.rents' },
      { line: 'Line 17', label: 'Taxes and licenses', mappedTo: 'expenses.taxesLicenses' },
      { line: 'Line 18', label: 'Interest', mappedTo: 'expenses.interest' },
      { line: 'Line 19', label: 'Charitable contributions', mappedTo: 'expenses.charitable' },
      { line: 'Line 20', label: 'Depreciation', mappedTo: 'expenses.depreciation' },
      { line: 'Line 21', label: 'Depletion', mappedTo: 'expenses.depletion' },
      { line: 'Line 22', label: 'Advertising', mappedTo: 'expenses.advertising' },
      { line: 'Line 23', label: 'Pension/profit-sharing', mappedTo: 'expenses.retirement' },
      { line: 'Line 24', label: 'Employee benefit programs', mappedTo: 'expenses.employeeBenefits' },
      { line: 'Line 26', label: 'Other deductions', mappedTo: 'expenses.otherDeductions' },
      { line: 'Line 27', label: 'Total deductions', mappedTo: 'expenses.totalDeductions' },
      { line: 'Line 28', label: 'Taxable income before NOL', mappedTo: 'income.taxableIncome' },
      { line: 'Line 30', label: 'Taxable income', mappedTo: 'income.taxableIncomeAfterNOL' },
      { line: 'Schedule L', label: 'Balance Sheet', mappedTo: 'balanceSheet', notes: 'Full asset/liability detail' },
    ],
  },
  {
    formType: '1065',
    formName: 'Partnership Return',
    description: 'For partnerships and multi-member LLCs',
    fields: [
      { line: 'Line 1a', label: 'Gross receipts or sales', mappedTo: 'revenue.grossReceipts' },
      { line: 'Line 1b', label: 'Returns and allowances', mappedTo: 'revenue.returnsAllowances' },
      { line: 'Line 1c', label: 'Net receipts', mappedTo: 'revenue.netReceipts' },
      { line: 'Line 2', label: 'Cost of goods sold', mappedTo: 'expenses.cogs' },
      { line: 'Line 3', label: 'Gross profit', mappedTo: 'income.grossProfit' },
      { line: 'Line 4', label: 'Ordinary income from partnerships', mappedTo: 'income.partnershipIncome' },
      { line: 'Line 5', label: 'Net farm profit', mappedTo: 'income.farmProfit' },
      { line: 'Line 6', label: 'Net gain (loss) Form 4797', mappedTo: 'income.assetSaleGain' },
      { line: 'Line 7', label: 'Other income (loss)', mappedTo: 'income.otherIncome' },
      { line: 'Line 8', label: 'Total income (loss)', mappedTo: 'income.totalIncome' },
      { line: 'Line 9', label: 'Salaries/wages (non-partner)', mappedTo: 'expenses.salariesWages' },
      { line: 'Line 10', label: 'Guaranteed payments to partners', mappedTo: 'expenses.guaranteedPayments', notes: 'Key for owner compensation' },
      { line: 'Line 11', label: 'Repairs and maintenance', mappedTo: 'expenses.repairs' },
      { line: 'Line 12', label: 'Bad debts', mappedTo: 'expenses.badDebts' },
      { line: 'Line 13', label: 'Rents', mappedTo: 'expenses.rents' },
      { line: 'Line 14', label: 'Taxes and licenses', mappedTo: 'expenses.taxesLicenses' },
      { line: 'Line 15', label: 'Interest', mappedTo: 'expenses.interest' },
      { line: 'Line 16a', label: 'Depreciation', mappedTo: 'expenses.depreciation' },
      { line: 'Line 17', label: 'Depletion', mappedTo: 'expenses.depletion' },
      { line: 'Line 18', label: 'Retirement plans', mappedTo: 'expenses.retirement' },
      { line: 'Line 19', label: 'Employee benefit programs', mappedTo: 'expenses.employeeBenefits' },
      { line: 'Line 20', label: 'Other deductions', mappedTo: 'expenses.otherDeductions' },
      { line: 'Line 21', label: 'Total deductions', mappedTo: 'expenses.totalDeductions' },
      { line: 'Line 22', label: 'Ordinary business income (loss)', mappedTo: 'income.ordinaryIncome' },
      { line: 'Schedule K, Line 1', label: 'Ordinary business income', mappedTo: 'kSchedule.ordinaryIncome' },
      { line: 'Schedule K, Line 4', label: 'Guaranteed payments', mappedTo: 'kSchedule.guaranteedPayments' },
      { line: 'Schedule K, Line 19a', label: 'Distributions', mappedTo: 'distributions.total' },
    ],
  },
  {
    formType: 'Schedule C',
    formName: 'Profit or Loss from Business (Sole Proprietorship)',
    description: 'For sole proprietors filing with Form 1040',
    fields: [
      { line: 'Line 1', label: 'Gross receipts or sales', mappedTo: 'revenue.grossReceipts' },
      { line: 'Line 2', label: 'Returns and allowances', mappedTo: 'revenue.returnsAllowances' },
      { line: 'Line 3', label: 'Net receipts', mappedTo: 'revenue.netReceipts' },
      { line: 'Line 4', label: 'Cost of goods sold', mappedTo: 'expenses.cogs' },
      { line: 'Line 5', label: 'Gross profit', mappedTo: 'income.grossProfit' },
      { line: 'Line 6', label: 'Other income', mappedTo: 'income.otherIncome' },
      { line: 'Line 7', label: 'Gross income', mappedTo: 'income.grossIncome' },
      { line: 'Line 8', label: 'Advertising', mappedTo: 'expenses.advertising' },
      { line: 'Line 9', label: 'Car and truck expenses', mappedTo: 'expenses.vehicleExpenses' },
      { line: 'Line 10', label: 'Commissions and fees', mappedTo: 'expenses.commissions' },
      { line: 'Line 11', label: 'Contract labor', mappedTo: 'expenses.contractLabor' },
      { line: 'Line 12', label: 'Depletion', mappedTo: 'expenses.depletion' },
      { line: 'Line 13', label: 'Depreciation', mappedTo: 'expenses.depreciation' },
      { line: 'Line 14', label: 'Employee benefit programs', mappedTo: 'expenses.employeeBenefits' },
      { line: 'Line 15', label: 'Insurance (other than health)', mappedTo: 'expenses.insurance' },
      { line: 'Line 16a', label: 'Interest mortgage', mappedTo: 'expenses.interestMortgage' },
      { line: 'Line 16b', label: 'Interest other', mappedTo: 'expenses.interestOther' },
      { line: 'Line 17', label: 'Legal and professional', mappedTo: 'expenses.legalProfessional' },
      { line: 'Line 18', label: 'Office expense', mappedTo: 'expenses.officeExpense' },
      { line: 'Line 19', label: 'Pension and profit-sharing', mappedTo: 'expenses.retirement' },
      { line: 'Line 20a', label: 'Rent - vehicles/equipment', mappedTo: 'expenses.rentEquipment' },
      { line: 'Line 20b', label: 'Rent - other business property', mappedTo: 'expenses.rentProperty' },
      { line: 'Line 21', label: 'Repairs and maintenance', mappedTo: 'expenses.repairs' },
      { line: 'Line 22', label: 'Supplies', mappedTo: 'expenses.supplies' },
      { line: 'Line 23', label: 'Taxes and licenses', mappedTo: 'expenses.taxesLicenses' },
      { line: 'Line 24a', label: 'Travel', mappedTo: 'expenses.travel' },
      { line: 'Line 24b', label: 'Meals (deductible amount)', mappedTo: 'expenses.meals' },
      { line: 'Line 25', label: 'Utilities', mappedTo: 'expenses.utilities' },
      { line: 'Line 26', label: 'Wages', mappedTo: 'expenses.wages' },
      { line: 'Line 27a', label: 'Other expenses', mappedTo: 'expenses.otherExpenses' },
      { line: 'Line 28', label: 'Total expenses', mappedTo: 'expenses.totalExpenses' },
      { line: 'Line 29', label: 'Tentative profit', mappedTo: 'income.tentativeProfit' },
      { line: 'Line 30', label: 'Home office deduction', mappedTo: 'expenses.homeOffice' },
      { line: 'Line 31', label: 'Net profit or loss', mappedTo: 'income.netProfit', notes: 'Starting point for SDE' },
    ],
  },
];

// =============================================================================
// FINANCIAL STATEMENT EXTRACTION GUIDE
// =============================================================================

export interface FinancialStatementField {
  category: string;
  fieldName: string;
  mappedTo: string;
  notes?: string;
}

export interface FinancialStatementGuide {
  statementType: string;
  fields: FinancialStatementField[];
}

export const FINANCIAL_STATEMENT_EXTRACTION_GUIDE: FinancialStatementGuide[] = [
  {
    statementType: 'Income Statement / P&L',
    fields: [
      // Revenue Section
      { category: 'Revenue', fieldName: 'Gross Sales / Revenue', mappedTo: 'income.grossRevenue' },
      { category: 'Revenue', fieldName: 'Less: Returns & Allowances', mappedTo: 'income.returnsAllowances' },
      { category: 'Revenue', fieldName: 'Less: Discounts', mappedTo: 'income.discounts' },
      { category: 'Revenue', fieldName: 'Net Sales / Revenue', mappedTo: 'income.netRevenue' },
      { category: 'Revenue', fieldName: 'Other Operating Revenue', mappedTo: 'income.otherOperatingRevenue' },
      { category: 'Revenue', fieldName: 'Total Revenue', mappedTo: 'income.totalRevenue' },

      // Cost of Goods Sold
      { category: 'COGS', fieldName: 'Beginning Inventory', mappedTo: 'cogs.beginningInventory' },
      { category: 'COGS', fieldName: 'Purchases', mappedTo: 'cogs.purchases' },
      { category: 'COGS', fieldName: 'Direct Labor', mappedTo: 'cogs.directLabor' },
      { category: 'COGS', fieldName: 'Manufacturing Overhead', mappedTo: 'cogs.manufacturingOverhead' },
      { category: 'COGS', fieldName: 'Freight In', mappedTo: 'cogs.freightIn' },
      { category: 'COGS', fieldName: 'Less: Ending Inventory', mappedTo: 'cogs.endingInventory' },
      { category: 'COGS', fieldName: 'Cost of Goods Sold', mappedTo: 'cogs.total' },
      { category: 'COGS', fieldName: 'Gross Profit', mappedTo: 'income.grossProfit' },

      // Operating Expenses
      { category: 'OpEx', fieldName: 'Officer/Owner Compensation', mappedTo: 'opex.officerCompensation', notes: 'Key for SDE' },
      { category: 'OpEx', fieldName: 'Salaries & Wages', mappedTo: 'opex.salariesWages' },
      { category: 'OpEx', fieldName: 'Payroll Taxes', mappedTo: 'opex.payrollTaxes' },
      { category: 'OpEx', fieldName: 'Employee Benefits', mappedTo: 'opex.employeeBenefits' },
      { category: 'OpEx', fieldName: 'Rent / Lease Expense', mappedTo: 'opex.rentLease' },
      { category: 'OpEx', fieldName: 'Utilities', mappedTo: 'opex.utilities' },
      { category: 'OpEx', fieldName: 'Insurance', mappedTo: 'opex.insurance' },
      { category: 'OpEx', fieldName: 'Repairs & Maintenance', mappedTo: 'opex.repairsMaintenance' },
      { category: 'OpEx', fieldName: 'Depreciation', mappedTo: 'opex.depreciation', notes: 'Add back for SDE' },
      { category: 'OpEx', fieldName: 'Amortization', mappedTo: 'opex.amortization', notes: 'Add back for SDE' },
      { category: 'OpEx', fieldName: 'Advertising & Marketing', mappedTo: 'opex.advertisingMarketing' },
      { category: 'OpEx', fieldName: 'Professional Fees', mappedTo: 'opex.professionalFees' },
      { category: 'OpEx', fieldName: 'Office Expenses', mappedTo: 'opex.officeExpenses' },
      { category: 'OpEx', fieldName: 'Travel & Entertainment', mappedTo: 'opex.travelEntertainment', notes: 'Review for personal expenses' },
      { category: 'OpEx', fieldName: 'Vehicle Expenses', mappedTo: 'opex.vehicleExpenses', notes: 'Review for personal use' },
      { category: 'OpEx', fieldName: 'Bad Debt Expense', mappedTo: 'opex.badDebt' },
      { category: 'OpEx', fieldName: 'Other Operating Expenses', mappedTo: 'opex.otherOperating' },
      { category: 'OpEx', fieldName: 'Total Operating Expenses', mappedTo: 'opex.total' },

      // Operating Income
      { category: 'Operating', fieldName: 'Operating Income / EBIT', mappedTo: 'income.operatingIncome' },

      // Other Income/Expense
      { category: 'Other', fieldName: 'Interest Income', mappedTo: 'other.interestIncome' },
      { category: 'Other', fieldName: 'Interest Expense', mappedTo: 'other.interestExpense', notes: 'Add back for debt-free value' },
      { category: 'Other', fieldName: 'Gain/Loss on Asset Sales', mappedTo: 'other.assetGainLoss', notes: 'Typically normalized out' },
      { category: 'Other', fieldName: 'Other Income', mappedTo: 'other.otherIncome' },
      { category: 'Other', fieldName: 'Other Expense', mappedTo: 'other.otherExpense' },

      // Bottom Line
      { category: 'Net', fieldName: 'Income Before Taxes', mappedTo: 'income.incomeBeforeTaxes' },
      { category: 'Net', fieldName: 'Income Tax Expense', mappedTo: 'income.incomeTaxExpense' },
      { category: 'Net', fieldName: 'Net Income', mappedTo: 'income.netIncome' },
    ],
  },
  {
    statementType: 'Balance Sheet',
    fields: [
      // Current Assets
      { category: 'Current Assets', fieldName: 'Cash & Cash Equivalents', mappedTo: 'assets.cash' },
      { category: 'Current Assets', fieldName: 'Accounts Receivable', mappedTo: 'assets.accountsReceivable' },
      { category: 'Current Assets', fieldName: 'Less: Allowance for Doubtful Accounts', mappedTo: 'assets.allowanceDoubtful' },
      { category: 'Current Assets', fieldName: 'Inventory', mappedTo: 'assets.inventory' },
      { category: 'Current Assets', fieldName: 'Prepaid Expenses', mappedTo: 'assets.prepaidExpenses' },
      { category: 'Current Assets', fieldName: 'Other Current Assets', mappedTo: 'assets.otherCurrent' },
      { category: 'Current Assets', fieldName: 'Total Current Assets', mappedTo: 'assets.totalCurrent' },

      // Fixed Assets
      { category: 'Fixed Assets', fieldName: 'Land', mappedTo: 'assets.land' },
      { category: 'Fixed Assets', fieldName: 'Buildings', mappedTo: 'assets.buildings' },
      { category: 'Fixed Assets', fieldName: 'Machinery & Equipment', mappedTo: 'assets.machineryEquipment' },
      { category: 'Fixed Assets', fieldName: 'Furniture & Fixtures', mappedTo: 'assets.furnitureFixtures' },
      { category: 'Fixed Assets', fieldName: 'Vehicles', mappedTo: 'assets.vehicles' },
      { category: 'Fixed Assets', fieldName: 'Leasehold Improvements', mappedTo: 'assets.leaseholdImprovements' },
      { category: 'Fixed Assets', fieldName: 'Less: Accumulated Depreciation', mappedTo: 'assets.accumulatedDepreciation' },
      { category: 'Fixed Assets', fieldName: 'Net Fixed Assets', mappedTo: 'assets.netFixedAssets' },

      // Other Assets
      { category: 'Other Assets', fieldName: 'Goodwill', mappedTo: 'assets.goodwill' },
      { category: 'Other Assets', fieldName: 'Other Intangibles', mappedTo: 'assets.otherIntangibles' },
      { category: 'Other Assets', fieldName: 'Notes Receivable (Long-term)', mappedTo: 'assets.notesReceivableLT' },
      { category: 'Other Assets', fieldName: 'Investments', mappedTo: 'assets.investments' },
      { category: 'Other Assets', fieldName: 'Other Assets', mappedTo: 'assets.otherAssets' },
      { category: 'Other Assets', fieldName: 'Total Assets', mappedTo: 'assets.totalAssets' },

      // Current Liabilities
      { category: 'Current Liabilities', fieldName: 'Accounts Payable', mappedTo: 'liabilities.accountsPayable' },
      { category: 'Current Liabilities', fieldName: 'Accrued Expenses', mappedTo: 'liabilities.accruedExpenses' },
      { category: 'Current Liabilities', fieldName: 'Accrued Wages/Payroll', mappedTo: 'liabilities.accruedWages' },
      { category: 'Current Liabilities', fieldName: 'Current Portion of LT Debt', mappedTo: 'liabilities.currentPortionLTD' },
      { category: 'Current Liabilities', fieldName: 'Line of Credit', mappedTo: 'liabilities.lineOfCredit' },
      { category: 'Current Liabilities', fieldName: 'Notes Payable (Short-term)', mappedTo: 'liabilities.notesPayableST' },
      { category: 'Current Liabilities', fieldName: 'Deferred Revenue', mappedTo: 'liabilities.deferredRevenue' },
      { category: 'Current Liabilities', fieldName: 'Other Current Liabilities', mappedTo: 'liabilities.otherCurrent' },
      { category: 'Current Liabilities', fieldName: 'Total Current Liabilities', mappedTo: 'liabilities.totalCurrent' },

      // Long-term Liabilities
      { category: 'Long-term Liabilities', fieldName: 'Long-term Debt', mappedTo: 'liabilities.longTermDebt' },
      { category: 'Long-term Liabilities', fieldName: 'Notes Payable (Long-term)', mappedTo: 'liabilities.notesPayableLT' },
      { category: 'Long-term Liabilities', fieldName: 'Loans from Shareholders', mappedTo: 'liabilities.shareholderLoans', notes: 'Often adjusted in valuation' },
      { category: 'Long-term Liabilities', fieldName: 'Deferred Taxes', mappedTo: 'liabilities.deferredTaxes' },
      { category: 'Long-term Liabilities', fieldName: 'Other Long-term Liabilities', mappedTo: 'liabilities.otherLongTerm' },
      { category: 'Long-term Liabilities', fieldName: 'Total Liabilities', mappedTo: 'liabilities.totalLiabilities' },

      // Equity
      { category: 'Equity', fieldName: 'Common Stock', mappedTo: 'equity.commonStock' },
      { category: 'Equity', fieldName: 'Additional Paid-in Capital', mappedTo: 'equity.additionalPaidInCapital' },
      { category: 'Equity', fieldName: 'Retained Earnings', mappedTo: 'equity.retainedEarnings' },
      { category: 'Equity', fieldName: 'Treasury Stock', mappedTo: 'equity.treasuryStock' },
      { category: 'Equity', fieldName: 'Current Year Net Income', mappedTo: 'equity.currentYearNetIncome' },
      { category: 'Equity', fieldName: 'Distributions/Dividends', mappedTo: 'equity.distributions' },
      { category: 'Equity', fieldName: 'Total Equity', mappedTo: 'equity.totalEquity' },
      { category: 'Equity', fieldName: 'Total Liabilities & Equity', mappedTo: 'equity.totalLiabilitiesEquity' },
    ],
  },
];

// =============================================================================
// COMMON SDE ADD-BACKS
// =============================================================================

export interface AddBackCategory {
  category: string;
  description: string;
  items: {
    name: string;
    typical: boolean;
    notes: string;
  }[];
}

export const COMMON_ADDBACKS: AddBackCategory[] = [
  {
    category: 'Owner Compensation Adjustments',
    description: 'Adjustments related to owner/officer compensation and benefits',
    items: [
      {
        name: 'Owner Salary Above Market',
        typical: true,
        notes: 'If owner takes $300K but market rate for role is $150K, add back $150K',
      },
      {
        name: 'Owner Salary Below Market',
        typical: true,
        notes: 'If owner takes $50K but market rate is $150K, subtract $100K (negative add-back)',
      },
      {
        name: 'Owner Health Insurance',
        typical: true,
        notes: 'Personal health insurance paid by business for owner/family',
      },
      {
        name: 'Owner Life Insurance',
        typical: true,
        notes: 'Key-man life insurance or personal life insurance premiums',
      },
      {
        name: 'Owner Retirement Contributions',
        typical: true,
        notes: '401(k) matching, SEP-IRA, or other retirement contributions for owner',
      },
      {
        name: 'Family Member Compensation',
        typical: false,
        notes: 'Compensation to family members not at market rate or not actually working',
      },
    ],
  },
  {
    category: 'Non-Cash Expenses',
    description: 'Accounting expenses that do not represent cash outflows',
    items: [
      {
        name: 'Depreciation',
        typical: true,
        notes: 'Always add back - replace with maintenance CapEx estimate if needed',
      },
      {
        name: 'Amortization',
        typical: true,
        notes: 'Amortization of intangibles, loan costs, etc.',
      },
      {
        name: 'Stock-Based Compensation',
        typical: false,
        notes: 'If company issues equity compensation',
      },
    ],
  },
  {
    category: 'Interest & Financing',
    description: 'Expenses related to the company\'s capital structure',
    items: [
      {
        name: 'Interest Expense',
        typical: true,
        notes: 'Add back all interest to show debt-free cash flow',
      },
      {
        name: 'Loan Fees/Costs',
        typical: true,
        notes: 'One-time loan origination fees, refinancing costs',
      },
    ],
  },
  {
    category: 'One-Time/Non-Recurring',
    description: 'Expenses not expected to continue under new ownership',
    items: [
      {
        name: 'Legal Settlements',
        typical: true,
        notes: 'Lawsuit settlements, legal fees for specific cases',
      },
      {
        name: 'Moving/Relocation Costs',
        typical: true,
        notes: 'Costs of moving facilities, relocation expenses',
      },
      {
        name: 'Natural Disaster Costs',
        typical: true,
        notes: 'Flood, fire, storm damage repairs not covered by insurance',
      },
      {
        name: 'Restructuring Costs',
        typical: true,
        notes: 'Severance, facility closure costs',
      },
      {
        name: 'COVID-Related Expenses',
        typical: true,
        notes: 'PPE, cleaning, temporary closure costs from pandemic',
      },
      {
        name: 'Asset Write-Downs',
        typical: true,
        notes: 'One-time impairment charges',
      },
    ],
  },
  {
    category: 'Personal/Discretionary',
    description: 'Owner personal expenses run through the business',
    items: [
      {
        name: 'Personal Vehicle Expenses',
        typical: true,
        notes: 'Personal portion of company-paid vehicle, fuel, insurance',
      },
      {
        name: 'Personal Travel',
        typical: true,
        notes: 'Vacations, personal trips coded as business travel',
      },
      {
        name: 'Personal Meals & Entertainment',
        typical: true,
        notes: 'Non-business meals, entertainment, club memberships',
      },
      {
        name: 'Personal Cell Phone',
        typical: false,
        notes: 'Often immaterial but can add back personal portion',
      },
      {
        name: 'Home Office (if excessive)',
        typical: false,
        notes: 'If home office deduction exceeds actual business use',
      },
      {
        name: 'Country Club/Social Memberships',
        typical: true,
        notes: 'Unless clearly business development',
      },
    ],
  },
  {
    category: 'Related Party Transactions',
    description: 'Transactions with related entities at non-market rates',
    items: [
      {
        name: 'Above-Market Rent to Owner',
        typical: true,
        notes: 'If owner charges company $10K/month for space worth $6K, add back $4K',
      },
      {
        name: 'Below-Market Rent from Owner',
        typical: true,
        notes: 'If owner charges $3K for space worth $6K, subtract $3K (negative add-back)',
      },
      {
        name: 'Management Fees to Related Entity',
        typical: true,
        notes: 'Fees paid to owner\'s holding company or other entities',
      },
      {
        name: 'Purchases from Related Parties',
        typical: false,
        notes: 'If buying from owner\'s other business at inflated prices',
      },
    ],
  },
  {
    category: 'Accounting Adjustments',
    description: 'Adjustments for accounting methods or timing',
    items: [
      {
        name: 'Change in Accounting Method',
        typical: false,
        notes: 'One-time adjustments from changing accounting methods',
      },
      {
        name: 'Prior Period Adjustments',
        typical: false,
        notes: 'Corrections of prior year errors',
      },
      {
        name: 'Reserve Changes',
        typical: false,
        notes: 'Changes in bad debt reserves, warranty reserves, etc.',
      },
    ],
  },
  {
    category: 'Charitable/Donations',
    description: 'Charitable contributions at owner\'s discretion',
    items: [
      {
        name: 'Charitable Contributions',
        typical: true,
        notes: 'Donations are discretionary and may not continue',
      },
      {
        name: 'Political Contributions',
        typical: true,
        notes: 'Personal political donations run through business',
      },
      {
        name: 'Sponsorships (non-marketing)',
        typical: false,
        notes: 'Youth sports, community events without clear marketing value',
      },
    ],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get sector multiples by sector name
 */
export function getSectorMultiples(sectorName: string): SectorMultiple | undefined {
  return SECTOR_MULTIPLES.find(
    (s) => s.sector.toLowerCase() === sectorName.toLowerCase()
  );
}

/**
 * Get industry multiples by NAICS code
 */
export function getIndustryMultiples(naicsCode: string): IndustryMultiple | undefined {
  return DETAILED_INDUSTRY_MULTIPLES.find((i) => i.naicsCode === naicsCode);
}

/**
 * Get tax form extraction guide by form type
 */
export function getTaxFormGuide(formType: string): TaxFormGuide | undefined {
  return TAX_FORM_EXTRACTION_GUIDE.find(
    (f) => f.formType.toLowerCase() === formType.toLowerCase()
  );
}

/**
 * Calculate weighted risk score
 */
export function calculateRiskScore(
  scores: Record<string, 'low' | 'medium' | 'high'>
): { totalScore: number; maxScore: number; riskLevel: string } {
  let totalScore = 0;
  let totalWeight = 0;

  for (const factor of RISK_ASSESSMENT_FRAMEWORK) {
    const scoreLevel = scores[factor.name];
    if (scoreLevel) {
      const score = factor.scoringCriteria[scoreLevel].score;
      totalScore += score * factor.weight;
      totalWeight += factor.weight;
    }
  }

  const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  const maxScore = 3; // Maximum possible score

  let riskLevel: string;
  if (normalizedScore <= 1.5) {
    riskLevel = 'Low Risk';
  } else if (normalizedScore <= 2.25) {
    riskLevel = 'Moderate Risk';
  } else {
    riskLevel = 'High Risk';
  }

  return {
    totalScore: normalizedScore,
    maxScore,
    riskLevel,
  };
}

/**
 * Get suggested multiple adjustment based on risk score
 */
export function getRiskMultipleAdjustment(riskScore: number): number {
  // Returns adjustment factor (e.g., -0.5 means reduce multiple by 0.5x)
  if (riskScore <= 1.3) return 0.25; // Premium for low risk
  if (riskScore <= 1.5) return 0;
  if (riskScore <= 1.8) return -0.25;
  if (riskScore <= 2.0) return -0.5;
  if (riskScore <= 2.3) return -0.75;
  if (riskScore <= 2.5) return -1.0;
  return -1.5; // High risk discount
}
