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

// =============================================================================
// CAPITALIZATION RATE DATA (For 12-Pass System)
// =============================================================================

export interface TreasuryRate {
  maturity: string;
  rate: number;
  asOfDate: string;
  source: string;
  notes?: string;
}

export interface EquityRiskPremiumData {
  rate: number;
  source: string;
  methodology: string;
  asOfDate: string;
  historicalRange: { low: number; high: number };
  notes: string;
}

export interface SizePremiumTier {
  decile: number;
  marketCapRange: { min: number; max: number; description: string };
  sizePremium: number;
  totalReturnBeta: number;
  source: string;
}

export interface IndustryRiskPremium {
  sector: string;
  naicsRange?: string;
  industryRiskPremium: number;
  betaUnlevered: number;
  notes: string;
}

export const CAPITALIZATION_RATE_DATA = {
  // Risk-Free Rates (Treasury Yields)
  // NOTE: These should be updated periodically or fetched from API
  riskFreeRates: {
    lastUpdated: '2025-01-15',
    source: 'U.S. Department of Treasury',
    rates: [
      {
        maturity: '10-Year Treasury',
        rate: 0.0425,
        asOfDate: '2025-01-15',
        source: 'Federal Reserve H.15',
        notes: 'Most commonly used for business valuation',
      },
      {
        maturity: '20-Year Treasury',
        rate: 0.0455,
        asOfDate: '2025-01-15',
        source: 'Federal Reserve H.15',
        notes: 'Often used for longer-duration investments',
      },
      {
        maturity: '30-Year Treasury',
        rate: 0.0465,
        asOfDate: '2025-01-15',
        source: 'Federal Reserve H.15',
        notes: 'May be appropriate for perpetual cash flows',
      },
    ] as TreasuryRate[],
  },

  // Equity Risk Premium Data
  equityRiskPremium: {
    // Duff & Phelps / Kroll (most commonly used)
    duffPhelps: {
      rate: 0.055,
      source: 'Duff & Phelps / Kroll Cost of Capital Navigator',
      methodology: 'Supply-side ERP (building block approach)',
      asOfDate: '2025-01-01',
      historicalRange: { low: 0.045, high: 0.070 },
      notes: 'Recommended ERP for normalized conditions; conditional ERP may differ',
    } as EquityRiskPremiumData,

    // Ibbotson/SBBI (historical)
    ibbotsonHistorical: {
      rate: 0.072,
      source: 'Ibbotson SBBI Valuation Yearbook',
      methodology: 'Historical arithmetic mean (1926-present)',
      asOfDate: '2024-12-31',
      historicalRange: { low: 0.065, high: 0.080 },
      notes: 'Long-horizon historical ERP; may be higher than forward-looking estimates',
    } as EquityRiskPremiumData,

    // Damodaran (widely cited academic)
    damodaran: {
      rate: 0.048,
      source: 'Aswath Damodaran, NYU Stern',
      methodology: 'Implied ERP from S&P 500 pricing',
      asOfDate: '2025-01-01',
      historicalRange: { low: 0.040, high: 0.065 },
      notes: 'Forward-looking implied premium; updated monthly',
    } as EquityRiskPremiumData,

    // Recommended for small business valuation
    recommended: {
      rate: 0.060,
      source: 'Weighted average of major sources',
      methodology: 'Blend of supply-side and historical approaches',
      asOfDate: '2025-01-01',
      historicalRange: { low: 0.050, high: 0.070 },
      notes: 'Recommended for private company valuation; adjust based on market conditions',
    } as EquityRiskPremiumData,
  },

  // Size Premium Data (Based on Duff & Phelps/Kroll)
  sizePremiums: [
    {
      decile: 1,
      marketCapRange: { min: 28000000000, max: Infinity, description: 'Mega Cap ($28B+)' },
      sizePremium: -0.0037,
      totalReturnBeta: 0.91,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 2,
      marketCapRange: { min: 11000000000, max: 28000000000, description: 'Large Cap ($11B-$28B)' },
      sizePremium: 0.0025,
      totalReturnBeta: 1.04,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 3,
      marketCapRange: { min: 5500000000, max: 11000000000, description: 'Mid Cap ($5.5B-$11B)' },
      sizePremium: 0.0061,
      totalReturnBeta: 1.10,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 4,
      marketCapRange: { min: 3000000000, max: 5500000000, description: 'Mid Cap ($3B-$5.5B)' },
      sizePremium: 0.0086,
      totalReturnBeta: 1.12,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 5,
      marketCapRange: { min: 1800000000, max: 3000000000, description: 'Mid Cap ($1.8B-$3B)' },
      sizePremium: 0.0129,
      totalReturnBeta: 1.16,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 6,
      marketCapRange: { min: 1000000000, max: 1800000000, description: 'Small Cap ($1B-$1.8B)' },
      sizePremium: 0.0165,
      totalReturnBeta: 1.17,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 7,
      marketCapRange: { min: 550000000, max: 1000000000, description: 'Small Cap ($550M-$1B)' },
      sizePremium: 0.0188,
      totalReturnBeta: 1.22,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 8,
      marketCapRange: { min: 280000000, max: 550000000, description: 'Micro Cap ($280M-$550M)' },
      sizePremium: 0.0237,
      totalReturnBeta: 1.30,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 9,
      marketCapRange: { min: 100000000, max: 280000000, description: 'Micro Cap ($100M-$280M)' },
      sizePremium: 0.0327,
      totalReturnBeta: 1.35,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
    {
      decile: 10,
      marketCapRange: { min: 0, max: 100000000, description: 'Nano Cap (<$100M)' },
      sizePremium: 0.0554,
      totalReturnBeta: 1.41,
      source: 'Kroll Cost of Capital Navigator 2024',
    },
  ] as SizePremiumTier[],

  // Small Business Size Premium (for companies too small for public market data)
  smallBusinessPremiums: {
    description: 'Additional size premiums for businesses below public market thresholds',
    source: 'Various empirical studies and practitioner experience',
    tiers: [
      {
        revenueRange: { min: 10000000, max: 50000000, description: '$10M-$50M Revenue' },
        additionalPremium: 0.02,
        totalSizePremium: 0.075, // 5.54% + 2% additional
        notes: 'Lower end of middle market',
      },
      {
        revenueRange: { min: 5000000, max: 10000000, description: '$5M-$10M Revenue' },
        additionalPremium: 0.04,
        totalSizePremium: 0.095,
        notes: 'Upper small business market',
      },
      {
        revenueRange: { min: 2000000, max: 5000000, description: '$2M-$5M Revenue' },
        additionalPremium: 0.06,
        totalSizePremium: 0.115,
        notes: 'Core small business market',
      },
      {
        revenueRange: { min: 1000000, max: 2000000, description: '$1M-$2M Revenue' },
        additionalPremium: 0.08,
        totalSizePremium: 0.135,
        notes: 'Small business',
      },
      {
        revenueRange: { min: 500000, max: 1000000, description: '$500K-$1M Revenue' },
        additionalPremium: 0.10,
        totalSizePremium: 0.155,
        notes: 'Very small business',
      },
      {
        revenueRange: { min: 0, max: 500000, description: '<$500K Revenue' },
        additionalPremium: 0.12,
        totalSizePremium: 0.175,
        notes: 'Micro business / lifestyle business',
      },
    ],
  },

  // Industry Risk Premiums
  industryRiskPremiums: [
    { sector: 'Professional Services', naicsRange: '541', industryRiskPremium: 0.00, betaUnlevered: 0.95, notes: 'Generally average risk' },
    { sector: 'Healthcare Services', naicsRange: '621-623', industryRiskPremium: -0.01, betaUnlevered: 0.85, notes: 'Defensive, less cyclical' },
    { sector: 'Technology/Software', naicsRange: '511-518', industryRiskPremium: 0.02, betaUnlevered: 1.15, notes: 'Higher growth, higher risk' },
    { sector: 'Manufacturing', naicsRange: '31-33', industryRiskPremium: 0.01, betaUnlevered: 1.05, notes: 'Capital intensive, cyclical' },
    { sector: 'Construction', naicsRange: '236-238', industryRiskPremium: 0.03, betaUnlevered: 1.20, notes: 'Highly cyclical' },
    { sector: 'Retail Trade', naicsRange: '44-45', industryRiskPremium: 0.02, betaUnlevered: 1.10, notes: 'Consumer discretionary exposure' },
    { sector: 'Restaurants/Food Service', naicsRange: '722', industryRiskPremium: 0.03, betaUnlevered: 1.25, notes: 'High failure rate, discretionary' },
    { sector: 'Wholesale Distribution', naicsRange: '42', industryRiskPremium: 0.01, betaUnlevered: 1.00, notes: 'Moderate cyclicality' },
    { sector: 'Transportation/Logistics', naicsRange: '48-49', industryRiskPremium: 0.02, betaUnlevered: 1.10, notes: 'Economic sensitivity' },
    { sector: 'Real Estate Services', naicsRange: '531', industryRiskPremium: 0.02, betaUnlevered: 1.15, notes: 'Interest rate sensitive' },
    { sector: 'Finance/Insurance', naicsRange: '52', industryRiskPremium: 0.01, betaUnlevered: 1.05, notes: 'Regulatory environment' },
    { sector: 'Education Services', naicsRange: '611', industryRiskPremium: -0.01, betaUnlevered: 0.80, notes: 'Relatively stable demand' },
    { sector: 'Agriculture', naicsRange: '11', industryRiskPremium: 0.03, betaUnlevered: 1.20, notes: 'Weather and commodity risk' },
    { sector: 'Mining/Oil & Gas', naicsRange: '21', industryRiskPremium: 0.05, betaUnlevered: 1.40, notes: 'High commodity exposure' },
    { sector: 'Utilities', naicsRange: '22', industryRiskPremium: -0.02, betaUnlevered: 0.65, notes: 'Regulated, stable cash flows' },
  ] as IndustryRiskPremium[],

  // Cap Rate Build-up Template
  buildupTemplate: {
    description: 'Standard capitalization rate build-up methodology',
    components: [
      { component: 'Risk-Free Rate', source: '20-Year Treasury Yield', typical_range: [0.035, 0.055] },
      { component: 'Equity Risk Premium', source: 'Duff & Phelps/Kroll', typical_range: [0.050, 0.070] },
      { component: 'Size Premium', source: 'Kroll Size Study', typical_range: [0.030, 0.120] },
      { component: 'Industry Risk Premium', source: 'Industry betas', typical_range: [-0.020, 0.050] },
      { component: 'Company-Specific Risk Premium', source: 'Analyst judgment', typical_range: [0.000, 0.100] },
    ],
    typicalTotalRange: { min: 0.15, max: 0.35, notes: 'Total cost of equity for small businesses typically 15-35%' },
    capitalizationRateNotes: 'Cap rate = Cost of equity - Long-term growth rate (typically 2-4%)',
  },
};

// =============================================================================
// DISCOUNT FOR LACK OF MARKETABILITY (DLOM) STUDIES
// =============================================================================

export interface DLOMStudy {
  studyName: string;
  studyType: 'restricted_stock' | 'pre_ipo' | 'other';
  timeperiod: string;
  sampleSize: number;
  medianDiscount: number;
  averageDiscount: number;
  range: { low: number; high: number };
  source: string;
  notes: string;
}

export interface DLOMFactor {
  factor: string;
  impact: 'increases_dlom' | 'decreases_dlom';
  description: string;
  adjustmentRange: { low: number; high: number };
}

export const DLOM_STUDIES = {
  // Restricted Stock Studies
  restrictedStockStudies: [
    {
      studyName: 'SEC Institutional Investor Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1966-1969',
      sampleSize: 398,
      medianDiscount: 0.259,
      averageDiscount: 0.259,
      range: { low: 0.12, high: 0.40 },
      source: 'SEC Institutional Investor Study (1971)',
      notes: 'Early foundational study; 2-year holding period',
    },
    {
      studyName: 'Gelman Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1968-1970',
      sampleSize: 89,
      medianDiscount: 0.33,
      averageDiscount: 0.33,
      range: { low: 0.15, high: 0.50 },
      source: 'Gelman (1972)',
      notes: 'Buy-side perspective from investment company',
    },
    {
      studyName: 'Trout Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1968-1972',
      sampleSize: 60,
      medianDiscount: 0.334,
      averageDiscount: 0.334,
      range: { low: 0.10, high: 0.55 },
      source: 'Trout (1977)',
      notes: 'Examined acquisitions of restricted stock',
    },
    {
      studyName: 'Moroney Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1969-1972',
      sampleSize: 146,
      medianDiscount: 0.35,
      averageDiscount: 0.357,
      range: { low: 0.03, high: 0.90 },
      source: 'Moroney (1973)',
      notes: 'Tax Court cases; wide variance',
    },
    {
      studyName: 'Maher Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1969-1973',
      sampleSize: 33,
      medianDiscount: 0.33,
      averageDiscount: 0.35,
      range: { low: 0.12, high: 0.55 },
      source: 'Maher (1976)',
      notes: 'Mutual fund transactions',
    },
    {
      studyName: 'Standard Research Consultants',
      studyType: 'restricted_stock' as const,
      timeperiod: '1978-1982',
      sampleSize: 28,
      medianDiscount: 0.45,
      averageDiscount: 0.45,
      range: { low: 0.20, high: 0.70 },
      source: 'Standard Research Consultants (1983)',
      notes: 'Period of higher interest rates',
    },
    {
      studyName: 'Willamette Management Associates',
      studyType: 'restricted_stock' as const,
      timeperiod: '1981-1984',
      sampleSize: 33,
      medianDiscount: 0.31,
      averageDiscount: 0.31,
      range: { low: 0.10, high: 0.60 },
      source: 'Willamette Management Associates (1984)',
      notes: 'Comprehensive study with financial metrics',
    },
    {
      studyName: 'Silber Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1981-1988',
      sampleSize: 69,
      medianDiscount: 0.34,
      averageDiscount: 0.338,
      range: { low: -0.13, high: 0.84 },
      source: 'Silber (1991)',
      notes: 'Regression analysis; identified revenue as key factor',
    },
    {
      studyName: 'FMV Opinions Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1979-1992',
      sampleSize: 100,
      medianDiscount: 0.23,
      averageDiscount: 0.23,
      range: { low: 0.05, high: 0.50 },
      source: 'FMV Opinions, Inc. (1993)',
      notes: 'Post-Rule 144A period',
    },
    {
      studyName: 'Management Planning Study',
      studyType: 'restricted_stock' as const,
      timeperiod: '1980-1996',
      sampleSize: 49,
      medianDiscount: 0.27,
      averageDiscount: 0.27,
      range: { low: 0.05, high: 0.58 },
      source: 'Management Planning, Inc. (1997)',
      notes: 'Long time period spanning multiple market conditions',
    },
    {
      studyName: 'Columbia Financial Advisors',
      studyType: 'restricted_stock' as const,
      timeperiod: '1996-1997',
      sampleSize: 23,
      medianDiscount: 0.21,
      averageDiscount: 0.21,
      range: { low: 0.05, high: 0.45 },
      source: 'Columbia Financial Advisors (1998)',
      notes: 'Post-Rule 144 shortening',
    },
    {
      studyName: 'Pluris Valuation Advisors (LiquiStat)',
      studyType: 'restricted_stock' as const,
      timeperiod: '2005-2023',
      sampleSize: 1200,
      medianDiscount: 0.16,
      averageDiscount: 0.18,
      range: { low: 0.02, high: 0.45 },
      source: 'Pluris LiquiStat Database (ongoing)',
      notes: 'Most current; reflects 6-month holding period under current Rule 144',
    },
  ] as DLOMStudy[],

  // Pre-IPO Studies
  preIPOStudies: [
    {
      studyName: 'Emory Pre-IPO Studies',
      studyType: 'pre_ipo' as const,
      timeperiod: '1980-2000',
      sampleSize: 543,
      medianDiscount: 0.46,
      averageDiscount: 0.46,
      range: { low: 0.25, high: 0.65 },
      source: 'John Emory, Emory & Co. (multiple studies)',
      notes: 'Compared private transaction prices to subsequent IPO prices',
    },
    {
      studyName: 'Valuation Advisors Study',
      studyType: 'pre_ipo' as const,
      timeperiod: '1999-2007',
      sampleSize: 2800,
      medianDiscount: 0.50,
      averageDiscount: 0.52,
      range: { low: 0.20, high: 0.80 },
      source: 'Valuation Advisors, LLC',
      notes: 'Large database; includes dot-com era',
    },
    {
      studyName: 'Willamette Management Pre-IPO',
      studyType: 'pre_ipo' as const,
      timeperiod: '1975-1997',
      sampleSize: 612,
      medianDiscount: 0.43,
      averageDiscount: 0.45,
      range: { low: 0.20, high: 0.70 },
      source: 'Willamette Management Associates',
      notes: 'Long historical period',
    },
  ] as DLOMStudy[],

  // Summary Statistics
  summary: {
    restrictedStockStudiesMedian: 0.28,
    restrictedStockStudiesRange: { low: 0.15, high: 0.40 },
    preIPOStudiesMedian: 0.46,
    preIPOStudiesRange: { low: 0.25, high: 0.65 },
    currentMarketConditionsAdjustment: 'Under current Rule 144 (6-month holding period), recent studies suggest discounts of 10-25% are common',
    notes: 'Pre-IPO studies generally show higher discounts due to longer time to liquidity and higher company-specific risk',
  },

  // Factors Affecting DLOM
  factorsAffectingDLOM: [
    {
      factor: 'Revenue/Size',
      impact: 'decreases_dlom' as const,
      description: 'Larger companies typically have lower DLOM due to more potential buyers',
      adjustmentRange: { low: -0.05, high: -0.15 },
    },
    {
      factor: 'Profitability',
      impact: 'decreases_dlom' as const,
      description: 'Profitable companies are more marketable',
      adjustmentRange: { low: -0.02, high: -0.08 },
    },
    {
      factor: 'Dividend/Distribution Policy',
      impact: 'decreases_dlom' as const,
      description: 'Regular distributions reduce need for liquidity',
      adjustmentRange: { low: -0.02, high: -0.10 },
    },
    {
      factor: 'Volatility of Earnings',
      impact: 'increases_dlom' as const,
      description: 'Higher earnings volatility increases marketability risk',
      adjustmentRange: { low: 0.02, high: 0.10 },
    },
    {
      factor: 'Expected Holding Period',
      impact: 'increases_dlom' as const,
      description: 'Longer expected holding period increases discount',
      adjustmentRange: { low: 0.05, high: 0.15 },
    },
    {
      factor: 'Put Rights/Redemption Features',
      impact: 'decreases_dlom' as const,
      description: 'Contractual liquidity options reduce DLOM',
      adjustmentRange: { low: -0.05, high: -0.20 },
    },
    {
      factor: 'Restrictions on Transfer',
      impact: 'increases_dlom' as const,
      description: 'Transfer restrictions beyond securities law increase DLOM',
      adjustmentRange: { low: 0.02, high: 0.10 },
    },
    {
      factor: 'Industry Type',
      impact: 'increases_dlom' as const,
      description: 'Niche industries with fewer potential buyers may have higher DLOM',
      adjustmentRange: { low: 0.00, high: 0.08 },
    },
    {
      factor: 'IPO Potential',
      impact: 'decreases_dlom' as const,
      description: 'Companies with realistic IPO potential have lower DLOM',
      adjustmentRange: { low: -0.05, high: -0.15 },
    },
    {
      factor: 'Buy-Sell Agreement',
      impact: 'decreases_dlom' as const,
      description: 'Clear exit mechanism reduces DLOM',
      adjustmentRange: { low: -0.02, high: -0.10 },
    },
  ] as DLOMFactor[],

  // DLOM Quantitative Models
  quantitativeModels: {
    description: 'Several quantitative models exist for estimating DLOM',
    models: [
      {
        name: 'Chaffe Put Option Model',
        methodology: 'European put option on stock with zero exercise price',
        inputs: ['Stock price volatility', 'Restriction period', 'Risk-free rate'],
        typicalRange: { low: 0.15, high: 0.35 },
        notes: 'Simple to apply; may overstate discount',
      },
      {
        name: 'Longstaff Lookback Put Model',
        methodology: 'Lookback put option capturing maximum opportunity cost',
        inputs: ['Stock price volatility', 'Restriction period', 'Risk-free rate'],
        typicalRange: { low: 0.20, high: 0.45 },
        notes: 'Represents upper bound of DLOM',
      },
      {
        name: 'Finnerty Average-Price Put Model',
        methodology: 'Asian put option based on average price',
        inputs: ['Stock price volatility', 'Restriction period', 'Risk-free rate'],
        typicalRange: { low: 0.10, high: 0.30 },
        notes: 'More moderate estimates than lookback',
      },
      {
        name: 'QMDM (Quantitative Marketability Discount Model)',
        methodology: 'Present value model based on expected holding period and interim cash flows',
        inputs: ['Expected holding period', 'Expected growth rate', 'Dividend yield', 'Required rate of return'],
        typicalRange: { low: 0.10, high: 0.45 },
        notes: 'Mercer\'s model; widely used in practice',
      },
    ],
  },

  // Recommended DLOM Ranges by Company Characteristics
  recommendedRanges: {
    description: 'Suggested DLOM ranges based on company characteristics',
    ranges: [
      {
        category: 'Large, Profitable, Low Risk',
        characteristics: ['Revenue > $20M', 'Consistent profitability', 'Strong management', 'Low owner dependence'],
        suggestedRange: { low: 0.10, high: 0.20 },
        midpoint: 0.15,
      },
      {
        category: 'Medium, Stable',
        characteristics: ['Revenue $5M-$20M', 'Profitable', 'Some owner dependence', 'Established business'],
        suggestedRange: { low: 0.15, high: 0.25 },
        midpoint: 0.20,
      },
      {
        category: 'Small, Moderate Risk',
        characteristics: ['Revenue $1M-$5M', 'Profitable', 'Owner dependent', 'Limited buyer pool'],
        suggestedRange: { low: 0.20, high: 0.30 },
        midpoint: 0.25,
      },
      {
        category: 'Very Small, Higher Risk',
        characteristics: ['Revenue < $1M', 'Variable profitability', 'High owner dependence', 'Few potential buyers'],
        suggestedRange: { low: 0.25, high: 0.35 },
        midpoint: 0.30,
      },
      {
        category: 'Start-up/High Risk',
        characteristics: ['Pre-revenue or minimal revenue', 'Not yet profitable', 'High uncertainty', 'Very limited market'],
        suggestedRange: { low: 0.30, high: 0.45 },
        midpoint: 0.35,
      },
    ],
  },
};

// =============================================================================
// VALUATION STANDARDS & LIMITING CONDITIONS
// =============================================================================

export interface LimitingCondition {
  category: string;
  condition: string;
  required: boolean;
}

export interface ProfessionalStandard {
  organization: string;
  standardName: string;
  description: string;
  relevance: string;
  source: string;
}

export const VALUATION_STANDARDS = {
  // Professional Standards References
  professionalStandards: [
    {
      organization: 'Internal Revenue Service (IRS)',
      standardName: 'Revenue Ruling 59-60',
      description: 'Foundational guidance for valuing closely-held business interests',
      relevance: 'Establishes factors to consider in valuation; required consideration for gift/estate tax',
      source: 'Rev. Rul. 59-60, 1959-1 C.B. 237',
    },
    {
      organization: 'IRS',
      standardName: 'Revenue Ruling 68-609',
      description: 'Formula approach using capitalization of earnings',
      relevance: 'Provides capitalization rate ranges; often used as reasonableness check',
      source: 'Rev. Rul. 68-609, 1968-2 C.B. 327',
    },
    {
      organization: 'The Appraisal Foundation',
      standardName: 'Uniform Standards of Professional Appraisal Practice (USPAP)',
      description: 'Generally accepted appraisal standards in the United States',
      relevance: 'Required for many federally-related transactions; establishes ethical and performance standards',
      source: 'The Appraisal Foundation, updated annually',
    },
    {
      organization: 'American Institute of CPAs (AICPA)',
      standardName: 'Statement on Standards for Valuation Services No. 1 (SSVS No. 1)',
      description: 'Professional standards for CPAs performing valuation engagements',
      relevance: 'Required for CPAs; establishes development and reporting standards',
      source: 'AICPA VS Section 100',
    },
    {
      organization: 'American Society of Appraisers (ASA)',
      standardName: 'ASA Business Valuation Standards',
      description: 'Standards for credentialed business appraisers',
      relevance: 'Best practices for ASA members; widely respected in industry',
      source: 'ASA Business Valuation Committee',
    },
    {
      organization: 'National Association of Certified Valuators and Analysts (NACVA)',
      standardName: 'Professional Standards',
      description: 'Standards for NACVA credential holders',
      relevance: 'Required for CVA credential; practice standards and ethics',
      source: 'NACVA Professional Standards',
    },
    {
      organization: 'International Valuation Standards Council (IVSC)',
      standardName: 'International Valuation Standards (IVS)',
      description: 'Global valuation standards',
      relevance: 'Increasingly relevant for international transactions; IFRS related',
      source: 'IVSC International Valuation Standards',
    },
    {
      organization: 'Financial Accounting Standards Board (FASB)',
      standardName: 'ASC 820 (Fair Value Measurement)',
      description: 'Accounting standards for fair value measurement',
      relevance: 'Required for financial reporting; defines fair value hierarchy',
      source: 'FASB ASC 820',
    },
  ] as ProfessionalStandard[],

  // Revenue Ruling 59-60 Factors
  revenueRuling5960Factors: {
    description: 'Eight factors to consider per Rev. Rul. 59-60',
    factors: [
      {
        number: 1,
        factor: 'Nature of the business and history of the enterprise from its inception',
        considerations: ['Company history', 'Business model evolution', 'Ownership changes', 'Major milestones'],
      },
      {
        number: 2,
        factor: 'The economic outlook in general and the condition and outlook of the specific industry',
        considerations: ['Macroeconomic conditions', 'Industry trends', 'Competitive dynamics', 'Regulatory environment'],
      },
      {
        number: 3,
        factor: 'The book value of the stock and the financial condition of the business',
        considerations: ['Balance sheet strength', 'Asset quality', 'Liability structure', 'Working capital adequacy'],
      },
      {
        number: 4,
        factor: 'The earning capacity of the company',
        considerations: ['Historical earnings', 'Earnings trends', 'Earnings quality', 'Normalized earnings'],
      },
      {
        number: 5,
        factor: 'The dividend-paying capacity',
        considerations: ['Historical dividends', 'Dividend policy', 'Cash flow available for dividends', 'Reinvestment needs'],
      },
      {
        number: 6,
        factor: 'Whether or not the enterprise has goodwill or other intangible value',
        considerations: ['Customer relationships', 'Brand value', 'Workforce', 'Proprietary technology', 'Location'],
      },
      {
        number: 7,
        factor: 'Sales of the stock and the size of the block of stock to be valued',
        considerations: ['Prior transactions', 'Marketability', 'Control vs minority', 'Block size impact'],
      },
      {
        number: 8,
        factor: 'The market price of stocks of corporations engaged in the same or a similar line of business',
        considerations: ['Comparable public companies', 'Transaction multiples', 'Industry benchmarks'],
      },
    ],
  },

  // Standard Assumptions
  standardAssumptions: [
    {
      category: 'General',
      assumption: 'The valuation is based on the facts and circumstances existing as of the valuation date.',
      required: true,
    },
    {
      category: 'General',
      assumption: 'The company will continue to operate as a going concern.',
      required: true,
    },
    {
      category: 'General',
      assumption: 'The ownership interest being valued includes all rights and restrictions attached to such interest.',
      required: true,
    },
    {
      category: 'Financial Data',
      assumption: 'The financial statements and tax returns provided are accurate and complete.',
      required: true,
    },
    {
      category: 'Financial Data',
      assumption: 'Financial projections, if used, represent management\'s best estimates based on currently known information.',
      required: false,
    },
    {
      category: 'Industry Data',
      assumption: 'Industry and market data from third-party sources is reliable and accurate.',
      required: true,
    },
    {
      category: 'Legal',
      assumption: 'There are no hidden or undisclosed liabilities or contingencies that would materially affect value.',
      required: true,
    },
    {
      category: 'Legal',
      assumption: 'The company is in compliance with all applicable laws and regulations.',
      required: true,
    },
    {
      category: 'Tax',
      assumption: 'This valuation does not constitute tax advice; users should consult their own tax advisors.',
      required: true,
    },
    {
      category: 'Environmental',
      assumption: 'No environmental liabilities or conditions exist that would materially affect value unless specifically noted.',
      required: false,
    },
  ],

  // Limiting Conditions
  limitingConditions: [
    {
      category: 'Scope',
      condition: 'This valuation is intended solely for the purpose stated in the report.',
      required: true,
    },
    {
      category: 'Scope',
      condition: 'The valuation conclusion is valid only as of the stated valuation date.',
      required: true,
    },
    {
      category: 'Scope',
      condition: 'No investigation of legal title to assets has been made, and the owner\'s claims to property are assumed to be valid.',
      required: true,
    },
    {
      category: 'Information',
      condition: 'The analyst has relied upon information provided by management and/or owners without independent verification.',
      required: true,
    },
    {
      category: 'Information',
      condition: 'The analyst is not required to update this report for events occurring after the valuation date.',
      required: true,
    },
    {
      category: 'Liability',
      condition: 'This report is not intended for use in connection with any securities offering.',
      required: true,
    },
    {
      category: 'Liability',
      condition: 'The analyst assumes no responsibility for matters of a legal nature.',
      required: true,
    },
    {
      category: 'Liability',
      condition: 'The conclusions represent the analyst\'s opinion and are not guarantees of value.',
      required: true,
    },
    {
      category: 'Distribution',
      condition: 'This report may not be distributed to third parties without the analyst\'s prior written consent.',
      required: false,
    },
    {
      category: 'Distribution',
      condition: 'Any partial reproduction of this report may lead to erroneous conclusions.',
      required: true,
    },
    {
      category: 'Independence',
      condition: 'The analyst has no present or prospective interest in the subject company.',
      required: true,
    },
    {
      category: 'Independence',
      condition: 'The analyst\'s compensation is not contingent upon the value conclusion.',
      required: true,
    },
  ] as LimitingCondition[],

  // Definitions of Value
  definitionsOfValue: {
    fairMarketValue: {
      definition: 'The price at which property would change hands between a willing buyer and a willing seller, neither being under any compulsion to buy or sell and both having reasonable knowledge of relevant facts.',
      source: 'Rev. Rul. 59-60; IRS regulations',
      commonUses: ['Estate and gift tax', 'Buy-sell agreements', 'ESOP transactions', 'Charitable contributions'],
      assumptions: ['Hypothetical buyers and sellers', 'Cash or cash equivalent', 'Exposure to open market'],
    },
    fairValue: {
      definition: 'The price that would be received to sell an asset or paid to transfer a liability in an orderly transaction between market participants at the measurement date.',
      source: 'FASB ASC 820',
      commonUses: ['Financial reporting', 'Purchase price allocation', 'Impairment testing', 'IFRS reporting'],
      assumptions: ['Exit price concept', 'Principal or most advantageous market', 'Orderly transaction'],
    },
    investmentValue: {
      definition: 'The value to a particular investor based on individual investment requirements and expectations.',
      source: 'ASA Business Valuation Standards',
      commonUses: ['Strategic acquisitions', 'Investment analysis', 'Synergy quantification'],
      assumptions: ['Specific buyer identified', 'May include synergies', 'Not hypothetical'],
    },
    intrinsicValue: {
      definition: 'The value that an investor considers to be the true value based on an evaluation of available facts.',
      source: 'Various',
      commonUses: ['Investment analysis', 'Fundamental analysis', 'Investor decision-making'],
      assumptions: ['Based on fundamentals', 'May differ from market price', 'Subjective elements'],
    },
    liquidationValue: {
      definition: 'The net amount that would be realized if the business is terminated and the assets sold piecemeal.',
      source: 'Various appraisal standards',
      commonUses: ['Distressed situations', 'Floor value', 'Collateral value'],
      assumptions: ['Business will cease operations', 'Assets sold individually', 'May be orderly or forced'],
    },
  },

  // Premises of Value
  premisesOfValue: {
    goingConcern: {
      definition: 'Value assuming the business will continue operating in its current form.',
      assumptions: ['Continued operations', 'Assets in productive use', 'Existing workforce and relationships'],
      applicability: 'Most common premise for operating businesses',
    },
    liquidation: {
      definition: 'Value assuming the business will be shut down and assets sold.',
      types: ['Orderly liquidation (reasonable time to find buyers)', 'Forced liquidation (immediate sale)'],
      applicability: 'Distressed situations or as floor value',
    },
    assemblage: {
      definition: 'Value of assets being assembled but not yet operational.',
      assumptions: ['Business not yet fully functional', 'Value of bringing assets together'],
      applicability: 'Start-up or development stage companies',
    },
  },
};

// =============================================================================
// EXPANDED ADD-BACKS WITH DETAILED GUIDANCE
// =============================================================================

export interface DetailedAddBack {
  category: string;
  subcategory: string;
  itemName: string;
  description: string;
  typicalPercentageOfRevenue?: { min: number; max: number };
  typicalAbsoluteAmount?: { min: number; max: number };
  addBackType: 'full' | 'partial' | 'case_by_case';
  documentationRequired: string[];
  redFlags: string[];
  adjustmentGuidance: string;
  taxFormLine?: string;
  financialStatementLine?: string;
}

export const COMMON_ADDBACKS_DETAILED: DetailedAddBack[] = [
  // Owner Compensation
  {
    category: 'Owner Compensation',
    subcategory: 'Base Salary',
    itemName: 'Owner/Officer Salary Above Market',
    description: 'Difference between owner compensation and market rate for equivalent role',
    typicalPercentageOfRevenue: { min: 0.05, max: 0.20 },
    addBackType: 'partial',
    documentationRequired: [
      'Salary.com or PayScale market data',
      'Industry compensation surveys',
      'Job description documentation',
      'Hours worked by owner',
    ],
    redFlags: [
      'Owner salary significantly above industry norms without documented justification',
      'Multiple family members on payroll with similar titles',
      'Salary increased dramatically in years being valued',
      'W-2 shows different amount than books',
    ],
    adjustmentGuidance: 'Research market compensation for CEO/President of similar-sized company in same industry. Deduct market rate from actual compensation to calculate add-back. Consider hours worked and actual responsibilities.',
    taxFormLine: '1120-S Line 7 / 1120 Line 12',
    financialStatementLine: 'Officer/Owner Compensation',
  },
  {
    category: 'Owner Compensation',
    subcategory: 'Base Salary',
    itemName: 'Owner Salary Below Market (Deduction)',
    description: 'Owner takes less than market rate, requiring negative adjustment',
    addBackType: 'partial',
    documentationRequired: [
      'Salary.com or PayScale market data',
      'Explanation for below-market salary',
      'Distributions or other compensation review',
    ],
    redFlags: [
      'Owner taking minimal salary but large distributions (S-corp reasonable comp issues)',
      'Below-market salary combined with poor profitability',
      'Business may not sustain market-rate compensation',
    ],
    adjustmentGuidance: 'This is a NEGATIVE add-back (deduction). Calculate market rate minus actual compensation. New owner would need to pay market rate, reducing SDE.',
    taxFormLine: '1120-S Line 7 / 1120 Line 12',
    financialStatementLine: 'Officer/Owner Compensation',
  },
  {
    category: 'Owner Compensation',
    subcategory: 'Benefits',
    itemName: 'Owner Health Insurance',
    description: 'Health, dental, vision insurance premiums paid for owner and family',
    typicalAbsoluteAmount: { min: 12000, max: 36000 },
    addBackType: 'full',
    documentationRequired: [
      'Insurance premium invoices',
      'Coverage documentation showing who is covered',
      'Benefit plan documents',
    ],
    redFlags: [
      'Premium amounts significantly above market for coverage type',
      'Coverage for non-family members coded as owner benefit',
    ],
    adjustmentGuidance: 'Add back 100% of premiums paid for owner and owner\'s family members. Employee health insurance should NOT be added back.',
    taxFormLine: 'Schedule K-1 or W-2 Box 14',
    financialStatementLine: 'Employee Benefits / Insurance',
  },
  {
    category: 'Owner Compensation',
    subcategory: 'Benefits',
    itemName: 'Owner Life/Disability Insurance',
    description: 'Life or disability insurance premiums for owner benefit',
    typicalAbsoluteAmount: { min: 2000, max: 20000 },
    addBackType: 'full',
    documentationRequired: [
      'Insurance policy declarations',
      'Premium payment records',
      'Beneficiary information',
    ],
    redFlags: [
      'Very large premiums suggesting cash value accumulation',
      'Business-owned policy with owner as sole beneficiary',
    ],
    adjustmentGuidance: 'Add back premiums for personal life insurance or key-man insurance that benefits owner/family. Company-owned policies naming the business as beneficiary may not be add-backs.',
    taxFormLine: 'Various depending on policy type',
    financialStatementLine: 'Insurance Expense',
  },
  {
    category: 'Owner Compensation',
    subcategory: 'Benefits',
    itemName: 'Owner Retirement Contributions',
    description: 'Retirement plan contributions above what would continue for replacement owner',
    typicalAbsoluteAmount: { min: 10000, max: 69000 },
    addBackType: 'partial',
    documentationRequired: [
      '401(k) or pension plan documents',
      'Annual contribution records',
      'Percentage of salary contributed',
    ],
    redFlags: [
      'Contributions at maximum legal limits for owner only',
      'Defined benefit plan with owner as primary beneficiary',
      'No contributions for other employees',
    ],
    adjustmentGuidance: 'Add back owner-specific contributions. If company matches for all employees, only add back excess owner portion. Consider if new owner would maintain similar plan.',
    taxFormLine: '1120-S Line 17 / 1120 Line 23',
    financialStatementLine: 'Pension/Retirement Expense',
  },
  {
    category: 'Owner Compensation',
    subcategory: 'Family Employment',
    itemName: 'Family Member Compensation Above Market',
    description: 'Compensation to family members exceeding fair market value for services',
    addBackType: 'partial',
    documentationRequired: [
      'Job descriptions for family members',
      'Time records or work documentation',
      'Market compensation data for roles',
    ],
    redFlags: [
      'Family members with titles but no clear responsibilities',
      'Children on payroll while in school full-time',
      'Spouse salary without documented role',
      'Multiple family members with similar titles',
    ],
    adjustmentGuidance: 'Document actual work performed by family members. Compare to market rate for those duties. Add back only the excess above market rate. Zero add-back if family member performs real work at market rate.',
    taxFormLine: '1120-S Line 8 / 1120 Line 13',
    financialStatementLine: 'Salaries & Wages',
  },

  // Non-Cash Expenses
  {
    category: 'Non-Cash Expenses',
    subcategory: 'Depreciation',
    itemName: 'Book Depreciation',
    description: 'Depreciation expense per financial statements',
    typicalPercentageOfRevenue: { min: 0.01, max: 0.10 },
    addBackType: 'full',
    documentationRequired: [
      'Depreciation schedule',
      'Fixed asset listing',
      'Useful life assumptions',
    ],
    redFlags: [
      'Depreciation much higher than capital expenditures (aging assets)',
      'Accelerated depreciation masking true asset consumption',
      'Assets fully depreciated but still in use',
    ],
    adjustmentGuidance: 'Always add back 100% of depreciation. May need to substitute normalized CapEx if significant reinvestment needed. Compare depreciation to actual CapEx over time.',
    taxFormLine: '1120-S Line 14 / 1120 Line 20',
    financialStatementLine: 'Depreciation Expense',
  },
  {
    category: 'Non-Cash Expenses',
    subcategory: 'Amortization',
    itemName: 'Intangible Amortization',
    description: 'Amortization of goodwill, patents, customer lists, etc.',
    typicalPercentageOfRevenue: { min: 0.00, max: 0.05 },
    addBackType: 'full',
    documentationRequired: [
      'Amortization schedule',
      'Intangible asset documentation',
      'Original acquisition costs',
    ],
    redFlags: [
      'Large amortization from recent acquisition (may indicate overpayment)',
      'Goodwill from related-party transaction',
    ],
    adjustmentGuidance: 'Add back 100% of amortization. This is a non-cash expense related to historical acquisitions and doesn\'t affect ongoing cash flow.',
    taxFormLine: 'Form 4562 / Various',
    financialStatementLine: 'Amortization Expense',
  },

  // Interest & Financing
  {
    category: 'Interest & Financing',
    subcategory: 'Debt Interest',
    itemName: 'Interest Expense',
    description: 'Interest paid on business debt',
    typicalPercentageOfRevenue: { min: 0.005, max: 0.05 },
    addBackType: 'full',
    documentationRequired: [
      'Loan agreements',
      'Interest payment records',
      'Debt schedules',
    ],
    redFlags: [
      'Interest rates significantly above market',
      'Related-party loans with unusual terms',
      'Interest capitalized rather than expensed',
    ],
    adjustmentGuidance: 'Add back 100% of interest expense to show debt-free cash flow. Buyer will have their own capital structure. Note: if buyer assumes debt, they may need to service it.',
    taxFormLine: '1120-S Line 13 / 1120 Line 18',
    financialStatementLine: 'Interest Expense',
  },
  {
    category: 'Interest & Financing',
    subcategory: 'Financing Costs',
    itemName: 'Loan Origination Fees',
    description: 'One-time costs to obtain financing',
    addBackType: 'full',
    documentationRequired: [
      'Loan closing documents',
      'Fee breakdowns',
    ],
    redFlags: [
      'Recurring loan fees (may indicate refinancing issues)',
      'Very high fee percentages',
    ],
    adjustmentGuidance: 'Add back one-time loan fees as non-recurring expense. May be amortized on books over loan life.',
    financialStatementLine: 'Interest Expense / Other Expense',
  },

  // One-Time/Non-Recurring
  {
    category: 'One-Time/Non-Recurring',
    subcategory: 'Legal',
    itemName: 'Lawsuit Settlement',
    description: 'One-time legal settlement payment',
    addBackType: 'full',
    documentationRequired: [
      'Settlement agreement',
      'Court documents',
      'Attorney invoices',
    ],
    redFlags: [
      'Recurring legal settlements (systemic issue)',
      'Settlement related to ongoing business practices',
      'Similar pending litigation',
    ],
    adjustmentGuidance: 'Add back if truly one-time and unrelated to ongoing operations. If litigation stems from business model (e.g., patent infringement), may not be add-back. Investigate root cause.',
    financialStatementLine: 'Legal Expense / Other Expense',
  },
  {
    category: 'One-Time/Non-Recurring',
    subcategory: 'Legal',
    itemName: 'Legal Fees (Non-Recurring)',
    description: 'Legal fees for specific case or transaction',
    typicalAbsoluteAmount: { min: 5000, max: 100000 },
    addBackType: 'case_by_case',
    documentationRequired: [
      'Legal invoices with matter descriptions',
      'Explanation of legal matters',
    ],
    redFlags: [
      'Consistent high legal fees year over year',
      'Legal fees related to regulatory compliance issues',
    ],
    adjustmentGuidance: 'Add back legal fees for one-time matters (e.g., estate planning, specific lawsuit). Routine legal fees (contracts, collections) are operating expenses and should NOT be added back.',
    financialStatementLine: 'Professional Fees / Legal',
  },
  {
    category: 'One-Time/Non-Recurring',
    subcategory: 'Asset Transactions',
    itemName: 'Gain/Loss on Asset Sale',
    description: 'Non-operating gain or loss from selling fixed assets',
    addBackType: 'full',
    documentationRequired: [
      'Asset sale documentation',
      'Original cost and accumulated depreciation',
      'Sale proceeds',
    ],
    redFlags: [
      'Recurring gains (may be intentional income smoothing)',
      'Sale to related party at non-market terms',
    ],
    adjustmentGuidance: 'Add back gains and losses from non-operating asset sales. These don\'t reflect ongoing earning capacity. Exception: if asset sales are part of business model (e.g., equipment dealer).',
    taxFormLine: 'Form 4797',
    financialStatementLine: 'Gain/Loss on Sale of Assets',
  },
  {
    category: 'One-Time/Non-Recurring',
    subcategory: 'Restructuring',
    itemName: 'Severance Payments',
    description: 'One-time severance related to layoffs or restructuring',
    addBackType: 'full',
    documentationRequired: [
      'Severance agreements',
      'Restructuring plan documentation',
      'Payment records',
    ],
    redFlags: [
      'Recurring severance suggests retention issues',
      'Severance to family members or related parties',
    ],
    adjustmentGuidance: 'Add back if related to specific restructuring event. Routine severance (normal turnover) should NOT be added back. Document reason for layoffs.',
    financialStatementLine: 'Salaries & Wages / Other Expense',
  },
  {
    category: 'One-Time/Non-Recurring',
    subcategory: 'Unusual Events',
    itemName: 'Natural Disaster Costs',
    description: 'Uninsured costs from flood, fire, storm, etc.',
    addBackType: 'full',
    documentationRequired: [
      'Insurance claim documentation',
      'Repair/replacement invoices',
      'Photos or incident reports',
    ],
    redFlags: [
      'Recurring "natural disaster" claims',
      'Lack of insurance for covered events',
    ],
    adjustmentGuidance: 'Add back costs not covered by insurance. May need to deduct any insurance recovery. Verify event was truly extraordinary for the location.',
    financialStatementLine: 'Repairs / Other Expense',
  },

  // Personal/Discretionary
  {
    category: 'Personal/Discretionary',
    subcategory: 'Vehicle',
    itemName: 'Personal Vehicle Expenses',
    description: 'Personal use portion of company vehicle costs',
    typicalAbsoluteAmount: { min: 5000, max: 25000 },
    addBackType: 'partial',
    documentationRequired: [
      'Mileage logs (or lack thereof)',
      'Vehicle expense detail',
      'Fuel receipts',
      'Insurance and maintenance records',
    ],
    redFlags: [
      'Luxury vehicles with no business purpose',
      'Multiple vehicles for single-owner business',
      'No mileage logs maintained',
    ],
    adjustmentGuidance: 'Estimate personal use percentage (often 30-50% for owner vehicles). Add back personal portion of depreciation, insurance, fuel, maintenance. IRS allows standard mileage rate alternatively.',
    taxFormLine: 'Form 4562 / Schedule C Line 9',
    financialStatementLine: 'Vehicle Expense / Depreciation',
  },
  {
    category: 'Personal/Discretionary',
    subcategory: 'Travel & Entertainment',
    itemName: 'Personal Travel',
    description: 'Travel costs that are personal rather than business',
    typicalPercentageOfRevenue: { min: 0.005, max: 0.03 },
    addBackType: 'partial',
    documentationRequired: [
      'Travel expense reports',
      'Business purpose documentation',
      'Attendee lists',
    ],
    redFlags: [
      'Travel to vacation destinations',
      'Family members included on trips',
      'No documented business purpose',
      'First-class travel with modest business',
    ],
    adjustmentGuidance: 'Review travel destinations and purposes. Add back clearly personal trips. For mixed trips, allocate between business and personal. Industry norms vary significantly.',
    taxFormLine: 'Schedule C Line 24a',
    financialStatementLine: 'Travel Expense',
  },
  {
    category: 'Personal/Discretionary',
    subcategory: 'Travel & Entertainment',
    itemName: 'Personal Meals & Entertainment',
    description: 'Meals and entertainment without clear business purpose',
    typicalPercentageOfRevenue: { min: 0.005, max: 0.02 },
    addBackType: 'partial',
    documentationRequired: [
      'Receipt details with attendees and business purpose',
      'Credit card statements',
    ],
    redFlags: [
      'High entertainment with no sales function',
      'Regular expensive dinners without clients',
      'Family members frequently included',
    ],
    adjustmentGuidance: 'Add back meals/entertainment lacking business purpose. Note: 50% of business meals is already non-deductible for tax, so may see lower amounts. Personal portion is add-back.',
    taxFormLine: 'Schedule C Line 24b',
    financialStatementLine: 'Meals & Entertainment',
  },
  {
    category: 'Personal/Discretionary',
    subcategory: 'Memberships & Dues',
    itemName: 'Country Club/Social Memberships',
    description: 'Club memberships primarily for personal use',
    typicalAbsoluteAmount: { min: 5000, max: 50000 },
    addBackType: 'case_by_case',
    documentationRequired: [
      'Membership agreements',
      'Usage logs if available',
      'Business entertainment records at club',
    ],
    redFlags: [
      'No documented business use',
      'Multiple club memberships',
      'Family memberships included',
    ],
    adjustmentGuidance: 'Golf and country clubs are not deductible since 2018 tax law change, but may still appear on books. Add back if primarily personal. Some legitimate business development may occur.',
    financialStatementLine: 'Dues & Subscriptions / Entertainment',
  },

  // Related Party Transactions
  {
    category: 'Related Party',
    subcategory: 'Rent',
    itemName: 'Above-Market Rent to Related Party',
    description: 'Rent paid to owner or related entity exceeding market rate',
    typicalPercentageOfRevenue: { min: 0.02, max: 0.08 },
    addBackType: 'partial',
    documentationRequired: [
      'Lease agreement',
      'Comparable rent data for area',
      'Property ownership documentation',
    ],
    redFlags: [
      'Rent increased dramatically before sale',
      'Triple-net lease with tenant paying everything',
      'No formal lease agreement',
    ],
    adjustmentGuidance: 'Research market rent for comparable space in same area. Add back difference between actual rent and market rent. Document with broker opinions or comparable listings.',
    taxFormLine: '1120-S Line 11 / Schedule C Line 20b',
    financialStatementLine: 'Rent Expense',
  },
  {
    category: 'Related Party',
    subcategory: 'Rent',
    itemName: 'Below-Market Rent from Related Party (Deduction)',
    description: 'Rent paid to owner below market rate, requiring negative adjustment',
    addBackType: 'partial',
    documentationRequired: [
      'Lease agreement',
      'Market rent comparables',
      'Property appraisal if available',
    ],
    redFlags: [
      'Zero or nominal rent charged',
      'Owner may charge market rent after sale',
    ],
    adjustmentGuidance: 'This is a NEGATIVE add-back. New owner would likely pay market rent. Deduct the difference between market rent and actual rent paid. Critical factor in real-estate-dependent businesses.',
    financialStatementLine: 'Rent Expense',
  },
  {
    category: 'Related Party',
    subcategory: 'Management Fees',
    itemName: 'Management Fees to Related Entity',
    description: 'Fees paid to owner\'s holding company or management entity',
    addBackType: 'full',
    documentationRequired: [
      'Management agreement',
      'Services actually provided',
      'Comparable management fee data',
    ],
    redFlags: [
      'Large fees with no documented services',
      'Fees paid to offshore entities',
      'Fees increased significantly before sale',
    ],
    adjustmentGuidance: 'Add back if fees are essentially additional owner compensation. If genuine services provided, add back only the above-market portion. Document what services are actually received.',
    financialStatementLine: 'Management Fees / Professional Fees',
  },

  // Charitable/Discretionary
  {
    category: 'Charitable/Discretionary',
    subcategory: 'Donations',
    itemName: 'Charitable Contributions',
    description: 'Donations to charitable organizations',
    typicalPercentageOfRevenue: { min: 0.001, max: 0.02 },
    addBackType: 'full',
    documentationRequired: [
      'Donation receipts',
      'List of recipient organizations',
    ],
    redFlags: [
      'Donations to organizations controlled by owner',
      'Very large donations relative to income',
    ],
    adjustmentGuidance: 'Add back 100% of charitable contributions as these are discretionary and may not continue under new ownership. Some buyers may choose to continue; this is their prerogative.',
    taxFormLine: '1120 Line 19 / Schedule A',
    financialStatementLine: 'Charitable Contributions',
  },
];

// =============================================================================
// WORKING CAPITAL BENCHMARKS
// =============================================================================

export interface WorkingCapitalBenchmark {
  industry: string;
  naicsRange?: string;
  workingCapitalAsPercentOfRevenue: { min: number; max: number; typical: number };
  currentRatioTypical: { min: number; max: number };
  daysSalesOutstanding: { min: number; max: number; typical: number };
  daysInventoryOutstanding: { min: number; max: number; typical: number };
  daysPayableOutstanding: { min: number; max: number; typical: number };
  seasonalityFactor: 'low' | 'moderate' | 'high';
  notes: string;
}

export const WORKING_CAPITAL_BENCHMARKS: WorkingCapitalBenchmark[] = [
  {
    industry: 'Professional Services',
    naicsRange: '541',
    workingCapitalAsPercentOfRevenue: { min: 0.05, max: 0.15, typical: 0.10 },
    currentRatioTypical: { min: 1.2, max: 2.5 },
    daysSalesOutstanding: { min: 30, max: 75, typical: 45 },
    daysInventoryOutstanding: { min: 0, max: 5, typical: 0 },
    daysPayableOutstanding: { min: 15, max: 45, typical: 30 },
    seasonalityFactor: 'low',
    notes: 'Minimal inventory; A/R is primary working capital component',
  },
  {
    industry: 'Healthcare Services',
    naicsRange: '621-623',
    workingCapitalAsPercentOfRevenue: { min: 0.08, max: 0.18, typical: 0.12 },
    currentRatioTypical: { min: 1.0, max: 2.0 },
    daysSalesOutstanding: { min: 35, max: 90, typical: 55 },
    daysInventoryOutstanding: { min: 5, max: 30, typical: 15 },
    daysPayableOutstanding: { min: 20, max: 50, typical: 35 },
    seasonalityFactor: 'low',
    notes: 'Insurance reimbursement delays extend DSO; supplies inventory varies',
  },
  {
    industry: 'Technology/Software',
    naicsRange: '511-518',
    workingCapitalAsPercentOfRevenue: { min: 0.03, max: 0.12, typical: 0.08 },
    currentRatioTypical: { min: 1.5, max: 4.0 },
    daysSalesOutstanding: { min: 30, max: 60, typical: 40 },
    daysInventoryOutstanding: { min: 0, max: 10, typical: 0 },
    daysPayableOutstanding: { min: 20, max: 45, typical: 30 },
    seasonalityFactor: 'low',
    notes: 'SaaS models have deferred revenue (liability); low inventory needs',
  },
  {
    industry: 'Manufacturing',
    naicsRange: '31-33',
    workingCapitalAsPercentOfRevenue: { min: 0.15, max: 0.30, typical: 0.22 },
    currentRatioTypical: { min: 1.2, max: 2.5 },
    daysSalesOutstanding: { min: 30, max: 60, typical: 42 },
    daysInventoryOutstanding: { min: 45, max: 120, typical: 75 },
    daysPayableOutstanding: { min: 30, max: 60, typical: 40 },
    seasonalityFactor: 'moderate',
    notes: 'Significant inventory investment; raw materials, WIP, finished goods',
  },
  {
    industry: 'Construction',
    naicsRange: '236-238',
    workingCapitalAsPercentOfRevenue: { min: 0.10, max: 0.25, typical: 0.15 },
    currentRatioTypical: { min: 1.1, max: 2.0 },
    daysSalesOutstanding: { min: 45, max: 90, typical: 60 },
    daysInventoryOutstanding: { min: 5, max: 30, typical: 15 },
    daysPayableOutstanding: { min: 30, max: 60, typical: 45 },
    seasonalityFactor: 'high',
    notes: 'Progress billings and retainage affect A/R; seasonal in many regions',
  },
  {
    industry: 'Retail Trade',
    naicsRange: '44-45',
    workingCapitalAsPercentOfRevenue: { min: 0.12, max: 0.25, typical: 0.18 },
    currentRatioTypical: { min: 1.3, max: 2.5 },
    daysSalesOutstanding: { min: 3, max: 15, typical: 5 },
    daysInventoryOutstanding: { min: 30, max: 90, typical: 60 },
    daysPayableOutstanding: { min: 20, max: 45, typical: 32 },
    seasonalityFactor: 'high',
    notes: 'Inventory-intensive; low A/R (cash sales); holiday seasonality',
  },
  {
    industry: 'Restaurants/Food Service',
    naicsRange: '722',
    workingCapitalAsPercentOfRevenue: { min: -0.02, max: 0.08, typical: 0.03 },
    currentRatioTypical: { min: 0.5, max: 1.5 },
    daysSalesOutstanding: { min: 0, max: 5, typical: 2 },
    daysInventoryOutstanding: { min: 5, max: 15, typical: 8 },
    daysPayableOutstanding: { min: 10, max: 30, typical: 18 },
    seasonalityFactor: 'moderate',
    notes: 'Cash business; low A/R; perishable inventory turns quickly; may operate with negative WC',
  },
  {
    industry: 'Wholesale Distribution',
    naicsRange: '42',
    workingCapitalAsPercentOfRevenue: { min: 0.12, max: 0.25, typical: 0.18 },
    currentRatioTypical: { min: 1.2, max: 2.2 },
    daysSalesOutstanding: { min: 25, max: 50, typical: 38 },
    daysInventoryOutstanding: { min: 25, max: 60, typical: 40 },
    daysPayableOutstanding: { min: 20, max: 45, typical: 32 },
    seasonalityFactor: 'moderate',
    notes: 'Balance between inventory investment and credit terms from suppliers',
  },
  {
    industry: 'Transportation/Logistics',
    naicsRange: '48-49',
    workingCapitalAsPercentOfRevenue: { min: 0.05, max: 0.15, typical: 0.10 },
    currentRatioTypical: { min: 1.0, max: 2.0 },
    daysSalesOutstanding: { min: 30, max: 60, typical: 42 },
    daysInventoryOutstanding: { min: 0, max: 10, typical: 3 },
    daysPayableOutstanding: { min: 15, max: 40, typical: 28 },
    seasonalityFactor: 'moderate',
    notes: 'Service business; fuel inventory minimal; A/R primary component',
  },
  {
    industry: 'Home Services (HVAC, Plumbing)',
    naicsRange: '238220',
    workingCapitalAsPercentOfRevenue: { min: 0.08, max: 0.18, typical: 0.12 },
    currentRatioTypical: { min: 1.2, max: 2.5 },
    daysSalesOutstanding: { min: 25, max: 55, typical: 35 },
    daysInventoryOutstanding: { min: 20, max: 50, typical: 30 },
    daysPayableOutstanding: { min: 15, max: 40, typical: 25 },
    seasonalityFactor: 'high',
    notes: 'Parts inventory; service agreements may provide cash upfront; seasonal demand',
  },
  {
    industry: 'Auto Services',
    naicsRange: '811',
    workingCapitalAsPercentOfRevenue: { min: 0.08, max: 0.18, typical: 0.12 },
    currentRatioTypical: { min: 1.0, max: 2.0 },
    daysSalesOutstanding: { min: 5, max: 25, typical: 12 },
    daysInventoryOutstanding: { min: 25, max: 60, typical: 40 },
    daysPayableOutstanding: { min: 15, max: 40, typical: 25 },
    seasonalityFactor: 'low',
    notes: 'Parts inventory significant; mix of cash and fleet/warranty receivables',
  },
  {
    industry: 'E-commerce',
    naicsRange: '454110',
    workingCapitalAsPercentOfRevenue: { min: 0.08, max: 0.20, typical: 0.14 },
    currentRatioTypical: { min: 1.2, max: 3.0 },
    daysSalesOutstanding: { min: 0, max: 10, typical: 3 },
    daysInventoryOutstanding: { min: 20, max: 75, typical: 45 },
    daysPayableOutstanding: { min: 20, max: 50, typical: 35 },
    seasonalityFactor: 'high',
    notes: 'Minimal A/R (prepaid); inventory depends on fulfillment model; holiday spike',
  },
  {
    industry: 'Insurance Agency',
    naicsRange: '524210',
    workingCapitalAsPercentOfRevenue: { min: 0.02, max: 0.10, typical: 0.05 },
    currentRatioTypical: { min: 1.5, max: 4.0 },
    daysSalesOutstanding: { min: 20, max: 50, typical: 30 },
    daysInventoryOutstanding: { min: 0, max: 0, typical: 0 },
    daysPayableOutstanding: { min: 15, max: 35, typical: 22 },
    seasonalityFactor: 'low',
    notes: 'No inventory; commissions receivable from carriers; generally cash-rich',
  },
  {
    industry: 'Staffing/Recruiting',
    naicsRange: '561320',
    workingCapitalAsPercentOfRevenue: { min: 0.10, max: 0.20, typical: 0.15 },
    currentRatioTypical: { min: 1.2, max: 2.2 },
    daysSalesOutstanding: { min: 40, max: 75, typical: 55 },
    daysInventoryOutstanding: { min: 0, max: 0, typical: 0 },
    daysPayableOutstanding: { min: 10, max: 25, typical: 15 },
    seasonalityFactor: 'low',
    notes: 'No inventory; pay employees weekly but bill monthly; cash conversion gap',
  },
  {
    industry: 'Agriculture',
    naicsRange: '11',
    workingCapitalAsPercentOfRevenue: { min: 0.15, max: 0.35, typical: 0.25 },
    currentRatioTypical: { min: 1.0, max: 2.5 },
    daysSalesOutstanding: { min: 20, max: 60, typical: 35 },
    daysInventoryOutstanding: { min: 60, max: 180, typical: 120 },
    daysPayableOutstanding: { min: 20, max: 50, typical: 35 },
    seasonalityFactor: 'high',
    notes: 'Highly seasonal; inventory cycles with growing season; operating loans common',
  },
];

// Additional Working Capital Helper Data
export const WORKING_CAPITAL_ADJUSTMENTS = {
  seasonalAdjustmentFactors: {
    description: 'Typical seasonal variations in working capital',
    factors: [
      { season: 'Q1 (Jan-Mar)', retail: 0.7, construction: 0.6, hvac: 0.8, agriculture: 1.3 },
      { season: 'Q2 (Apr-Jun)', retail: 0.9, construction: 1.1, hvac: 1.0, agriculture: 1.1 },
      { season: 'Q3 (Jul-Sep)', retail: 1.1, construction: 1.2, hvac: 1.3, agriculture: 0.8 },
      { season: 'Q4 (Oct-Dec)', retail: 1.3, construction: 1.1, hvac: 0.9, agriculture: 0.8 },
    ],
  },

  normalizedWorkingCapitalGuidance: {
    description: 'How to normalize working capital for valuation',
    steps: [
      '1. Calculate average working capital over 3-5 years to smooth seasonality',
      '2. Identify and adjust for non-operating items (excess cash, related party notes)',
      '3. Compare to industry benchmarks as percentage of revenue',
      '4. Adjust for any known changes in business (growth investments, wind-down of AR)',
      '5. Document any items that would not transfer with the business',
    ],
    excessWorkingCapitalTreatment: 'Excess working capital above normalized level is typically added to value',
    deficitWorkingCapitalTreatment: 'Working capital deficit below normalized level may be deducted from value or addressed in deal structure',
  },

  cashConversionCycleInterpretation: {
    description: 'Cash Conversion Cycle = DSO + DIO - DPO',
    interpretation: [
      { range: 'Negative', meaning: 'Business generates cash before paying suppliers - very favorable', examples: ['Subscription businesses', 'Cash retailers'] },
      { range: '0-30 days', meaning: 'Healthy cash cycle; manageable working capital needs', examples: ['Most service businesses', 'Well-managed distributors'] },
      { range: '30-60 days', meaning: 'Moderate cash cycle; typical for many industries', examples: ['Manufacturing', 'B2B services'] },
      { range: '60-90 days', meaning: 'Extended cash cycle; higher working capital requirements', examples: ['Custom manufacturing', 'Construction'] },
      { range: '>90 days', meaning: 'Long cash cycle; significant financing needs', examples: ['Heavy equipment manufacturing', 'Government contractors'] },
    ],
  },
};

// =============================================================================
// ADDITIONAL HELPER FUNCTIONS (12-Pass System)
// =============================================================================

/**
 * Get size premium based on company revenue
 */
export function getSizePremium(annualRevenue: number): number {
  const tiers = CAPITALIZATION_RATE_DATA.smallBusinessPremiums.tiers;
  for (const tier of tiers) {
    if (annualRevenue >= tier.revenueRange.min && annualRevenue < tier.revenueRange.max) {
      return tier.totalSizePremium;
    }
  }
  return tiers[tiers.length - 1].totalSizePremium; // Default to smallest tier
}

/**
 * Get industry risk premium by sector
 */
export function getIndustryRiskPremium(sector: string): number {
  const industry = CAPITALIZATION_RATE_DATA.industryRiskPremiums.find(
    i => i.sector.toLowerCase() === sector.toLowerCase()
  );
  return industry?.industryRiskPremium ?? 0;
}

/**
 * Calculate suggested DLOM based on company characteristics
 */
export function getSuggestedDLOM(revenue: number, isProfitable: boolean, ownerDependent: boolean): { low: number; high: number; midpoint: number } {
  const ranges = DLOM_STUDIES.recommendedRanges.ranges;

  let category: typeof ranges[0];

  if (revenue > 20000000 && isProfitable && !ownerDependent) {
    category = ranges[0]; // Large, Profitable, Low Risk
  } else if (revenue > 5000000 && isProfitable) {
    category = ranges[1]; // Medium, Stable
  } else if (revenue > 1000000) {
    category = ranges[2]; // Small, Moderate Risk
  } else if (revenue > 500000) {
    category = ranges[3]; // Very Small, Higher Risk
  } else {
    category = ranges[4]; // Start-up/High Risk
  }

  return {
    low: category.suggestedRange.low,
    high: category.suggestedRange.high,
    midpoint: category.midpoint,
  };
}

/**
 * Get working capital benchmark by industry
 */
export function getWorkingCapitalBenchmark(industry: string): WorkingCapitalBenchmark | undefined {
  return WORKING_CAPITAL_BENCHMARKS.find(
    b => b.industry.toLowerCase() === industry.toLowerCase()
  );
}

/**
 * Calculate normalized working capital as percentage of revenue
 */
export function calculateNormalizedWorkingCapital(
  revenue: number,
  industry: string
): { low: number; high: number; typical: number } {
  const benchmark = getWorkingCapitalBenchmark(industry);
  if (!benchmark) {
    // Default to general benchmark
    return {
      low: revenue * 0.10,
      high: revenue * 0.20,
      typical: revenue * 0.15,
    };
  }

  return {
    low: revenue * benchmark.workingCapitalAsPercentOfRevenue.min,
    high: revenue * benchmark.workingCapitalAsPercentOfRevenue.max,
    typical: revenue * benchmark.workingCapitalAsPercentOfRevenue.typical,
  };
}
