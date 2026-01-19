/**
 * Knowledge Router for Dynamic Knowledge Injection
 *
 * This module provides embedded valuation knowledge that gets injected into
 * Claude prompts dynamically based on the industry and context. All data is
 * embedded directly since we deploy to Vercel and can't access external files.
 *
 * Data sources:
 * - BizBuySell 2025 Insight Report
 * - Industry transaction databases
 * - Professional valuation standards
 */

import {
  KnowledgeRequests,
  InjectedKnowledge,
  ValuationMultiples,
  IndustryBenchmarks,
  PassNumber,
} from './types';

// ============================================================================
// SECTOR MULTIPLES (BizBuySell 2025 Data)
// ============================================================================

export interface SectorMultipleData {
  sector: string;
  sde_multiple: number;
  revenue_multiple: number;
  median_asking_price: number;
  median_revenue: number;
  median_cash_flow: number;
  transaction_count?: number;
}

const SECTOR_MULTIPLES: Record<string, SectorMultipleData> = {
  automotive_and_boat: {
    sector: 'Automotive & Boat',
    sde_multiple: 3.09,
    revenue_multiple: 0.70,
    median_asking_price: 500000,
    median_revenue: 850000,
    median_cash_flow: 165000,
  },
  beauty_and_personal_care: {
    sector: 'Beauty & Personal Care',
    sde_multiple: 2.10,
    revenue_multiple: 0.53,
    median_asking_price: 145000,
    median_revenue: 275000,
    median_cash_flow: 70000,
  },
  building_and_construction: {
    sector: 'Building & Construction',
    sde_multiple: 2.62,
    revenue_multiple: 0.58,
    median_asking_price: 750500,
    median_revenue: 1500000,
    median_cash_flow: 290000,
  },
  communication_and_media: {
    sector: 'Communication & Media',
    sde_multiple: 2.50,
    revenue_multiple: 0.92,
    median_asking_price: 365000,
    median_revenue: 400000,
    median_cash_flow: 150000,
  },
  education_and_children: {
    sector: 'Education & Children',
    sde_multiple: 2.88,
    revenue_multiple: 0.84,
    median_asking_price: 350000,
    median_revenue: 420000,
    median_cash_flow: 125000,
  },
  entertainment_and_recreation: {
    sector: 'Entertainment & Recreation',
    sde_multiple: 2.81,
    revenue_multiple: 0.91,
    median_asking_price: 375000,
    median_revenue: 425000,
    median_cash_flow: 135000,
  },
  financial_services: {
    sector: 'Financial Services',
    sde_multiple: 2.43,
    revenue_multiple: 1.19,
    median_asking_price: 450000,
    median_revenue: 380000,
    median_cash_flow: 185000,
  },
  food_and_restaurants: {
    sector: 'Food & Restaurants',
    sde_multiple: 2.24,
    revenue_multiple: 0.42,
    median_asking_price: 200000,
    median_revenue: 550000,
    median_cash_flow: 90000,
  },
  healthcare_and_fitness: {
    sector: 'Healthcare & Fitness',
    sde_multiple: 2.74,
    revenue_multiple: 0.76,
    median_asking_price: 441162,
    median_revenue: 600000,
    median_cash_flow: 165000,
  },
  manufacturing: {
    sector: 'Manufacturing',
    sde_multiple: 3.03,
    revenue_multiple: 0.73,
    median_asking_price: 726914,
    median_revenue: 1200000,
    median_cash_flow: 245000,
  },
  online_and_technology: {
    sector: 'Online & Technology',
    sde_multiple: 3.33,
    revenue_multiple: 1.09,
    median_asking_price: 850000,
    median_revenue: 800000,
    median_cash_flow: 260000,
  },
  pet_services: {
    sector: 'Pet Services',
    sde_multiple: 2.55,
    revenue_multiple: 0.73,
    median_asking_price: 226000,
    median_revenue: 310000,
    median_cash_flow: 90000,
  },
  retail: {
    sector: 'Retail',
    sde_multiple: 2.61,
    revenue_multiple: 0.54,
    median_asking_price: 286000,
    median_revenue: 550000,
    median_cash_flow: 110000,
  },
  service_businesses: {
    sector: 'Service Businesses',
    sde_multiple: 2.59,
    revenue_multiple: 0.82,
    median_asking_price: 350000,
    median_revenue: 450000,
    median_cash_flow: 140000,
  },
  transportation_and_storage: {
    sector: 'Transportation & Storage',
    sde_multiple: 1.97,
    revenue_multiple: 0.63,
    median_asking_price: 150000,
    median_revenue: 350000,
    median_cash_flow: 80000,
  },
  wholesale_and_distribution: {
    sector: 'Wholesale & Distribution',
    sde_multiple: 2.91,
    revenue_multiple: 0.55,
    median_asking_price: 604000,
    median_revenue: 1400000,
    median_cash_flow: 215000,
  },
};

// ============================================================================
// DETAILED INDUSTRY MULTIPLES
// ============================================================================

export interface IndustryMultipleData {
  industry: string;
  industry_key: string;
  sector: string;
  sde_multiple: number;
  sde_multiple_range: { low: number; high: number };
  revenue_multiple: number;
  revenue_multiple_range: { low: number; high: number };
  ebitda_multiple?: number;
  median_asking_price: number;
  rules_of_thumb: string[];
  valuation_notes: string[];
  typical_deal_structure: string;
  key_value_drivers: string[];
  red_flags: string[];
  industry_benchmarks: {
    gross_margin?: string;
    operating_margin?: string;
    revenue_per_employee?: string;
    other?: Record<string, string>;
  };
}

const INDUSTRY_MULTIPLES: Record<string, IndustryMultipleData> = {
  // ========== AUTOMOTIVE ==========
  auto_repair: {
    industry: 'Auto Repair / Mechanic Shop',
    industry_key: 'auto_repair',
    sector: 'automotive_and_boat',
    sde_multiple: 2.83,
    sde_multiple_range: { low: 2.0, high: 3.5 },
    revenue_multiple: 0.64,
    revenue_multiple_range: { low: 0.4, high: 0.85 },
    median_asking_price: 414000,
    rules_of_thumb: [
      '40-50% of annual sales plus inventory',
      '2.5-3.5x SDE for well-established shops',
      'Equipment typically included in price',
      'Real estate usually separate',
    ],
    valuation_notes: [
      'ASE certifications add value',
      'Dealer relationships/certifications premium',
      'Fleet accounts provide recurring revenue',
      'Location and visibility critical',
    ],
    typical_deal_structure: '60-70% cash at close, seller note for balance, 2-4 week training',
    key_value_drivers: [
      'Certified technicians',
      'Modern diagnostic equipment',
      'Strong online reviews',
      'Fleet/commercial accounts',
      'Recurring maintenance customers',
    ],
    red_flags: [
      'Environmental issues',
      'Aging equipment',
      'Key man dependence on single technician',
      'Declining car count',
    ],
    industry_benchmarks: {
      gross_margin: '50-60%',
      operating_margin: '15-25%',
      revenue_per_employee: '$150,000-$200,000',
      other: {
        'Labor rate': '$80-$150/hour',
        'Parts markup': '40-60%',
        'Tech productivity': '85%+ billed hours',
      },
    },
  },

  car_wash: {
    industry: 'Car Wash',
    industry_key: 'car_wash',
    sector: 'automotive_and_boat',
    sde_multiple: 4.99,
    sde_multiple_range: { low: 3.5, high: 6.0 },
    revenue_multiple: 2.01,
    revenue_multiple_range: { low: 1.5, high: 2.5 },
    median_asking_price: 800000,
    rules_of_thumb: [
      '4-6x SDE for express tunnel washes',
      '3-4x SDE for full-service washes',
      'Premium for unlimited wash programs',
      'Real estate often included or adds significant value',
    ],
    valuation_notes: [
      'Membership/unlimited programs highly valued',
      'Water reclaim systems reduce costs',
      'Express exterior trending over full-service',
      'Location demographics critical',
    ],
    typical_deal_structure: '70-80% cash, often includes real estate, minimal training needed',
    key_value_drivers: [
      'Monthly membership base',
      'Traffic count and visibility',
      'Modern equipment',
      'Water reclaim system',
      'Additional profit centers (detail, oil change)',
    ],
    red_flags: [
      'Aging tunnel equipment',
      'Water/environmental issues',
      'New competition nearby',
      'Declining membership',
    ],
    industry_benchmarks: {
      gross_margin: '75-85%',
      operating_margin: '25-40%',
      other: {
        'Revenue per car': '$8-$15 express, $15-$30 full service',
        'Cars per day': '300-800 for busy express',
        'Membership conversion': '10-20% of customers',
      },
    },
  },

  // ========== CONSTRUCTION/TRADES ==========
  hvac: {
    industry: 'HVAC Contractor',
    industry_key: 'hvac',
    sector: 'building_and_construction',
    sde_multiple: 2.79,
    sde_multiple_range: { low: 2.0, high: 3.5 },
    revenue_multiple: 0.59,
    revenue_multiple_range: { low: 0.4, high: 0.8 },
    ebitda_multiple: 4.0,
    median_asking_price: 750000,
    rules_of_thumb: [
      '40-60% of annual sales',
      '2-3.5x SDE depending on service agreement base',
      'Premium for maintenance contract portfolio',
      'Equipment and vehicles typically included',
    ],
    valuation_notes: [
      'Service agreements provide recurring revenue premium',
      'Licensed technicians are critical assets',
      'Commercial vs residential mix matters',
      'Brand/manufacturer relationships add value',
    ],
    typical_deal_structure: '50-70% cash, earnout common for larger deals, 30-90 day training',
    key_value_drivers: [
      'Maintenance agreement base',
      'Certified/licensed technicians',
      'Commercial accounts',
      'Multiple manufacturer certifications',
      'Modern fleet and equipment',
    ],
    red_flags: [
      'Heavy owner involvement in sales',
      'No service agreement base',
      'Aging technician workforce',
      'Contractor license issues',
    ],
    industry_benchmarks: {
      gross_margin: '35-50%',
      operating_margin: '8-15%',
      revenue_per_employee: '$150,000-$250,000',
      other: {
        'Service agreement retention': '85%+',
        'Service vs install mix': '60/40 ideal',
        'Technician utilization': '75-85%',
      },
    },
  },

  plumbing: {
    industry: 'Plumbing Contractor',
    industry_key: 'plumbing',
    sector: 'building_and_construction',
    sde_multiple: 2.51,
    sde_multiple_range: { low: 1.8, high: 3.2 },
    revenue_multiple: 0.67,
    revenue_multiple_range: { low: 0.45, high: 0.85 },
    median_asking_price: 649500,
    rules_of_thumb: [
      '45-55% of annual sales',
      '2-3x SDE typical',
      'Premium for drain cleaning/service focus',
      'Value in trained, licensed plumbers',
    ],
    valuation_notes: [
      'Service/repair more valuable than new construction',
      'Licensed journeyman plumbers critical',
      'Drain cleaning adds recurring revenue',
      'Commercial contracts add stability',
    ],
    typical_deal_structure: '60-70% cash, seller note common, 30-60 day training',
    key_value_drivers: [
      'Licensed plumber employees',
      'Service/repair focus vs construction',
      'Commercial maintenance contracts',
      'Brand recognition',
      'Modern equipment (cameras, jetting)',
    ],
    red_flags: [
      'Dependent on new construction',
      'License held only by owner',
      'No repeat customer base',
      'Warranty/callback issues',
    ],
    industry_benchmarks: {
      gross_margin: '40-55%',
      operating_margin: '10-18%',
      revenue_per_employee: '$140,000-$200,000',
    },
  },

  electrical: {
    industry: 'Electrical Contractor',
    industry_key: 'electrical',
    sector: 'building_and_construction',
    sde_multiple: 2.72,
    sde_multiple_range: { low: 2.0, high: 3.5 },
    revenue_multiple: 0.61,
    revenue_multiple_range: { low: 0.4, high: 0.8 },
    median_asking_price: 1000000,
    rules_of_thumb: [
      'Similar to HVAC: 40-60% of annual sales',
      '2-3.5x SDE',
      'Premium for commercial/industrial work',
      'Solar/EV charging expertise adds value',
    ],
    valuation_notes: [
      'Commercial work more valuable than residential',
      'Government/institutional contracts add stability',
      'Solar and EV infrastructure growing',
      'Licensed electricians are scarce',
    ],
    typical_deal_structure: '50-70% cash, earnout for larger deals, extended training common',
    key_value_drivers: [
      'Licensed journeyman electricians',
      'Commercial/industrial focus',
      'Government contracts',
      'Specialty certifications (solar, data, industrial)',
      'Safety record',
    ],
    red_flags: [
      'New construction dependency',
      'Single large customer',
      'License issues',
      'Safety violations',
    ],
    industry_benchmarks: {
      gross_margin: '30-45%',
      operating_margin: '8-15%',
      revenue_per_employee: '$150,000-$225,000',
    },
  },

  landscaping: {
    industry: 'Landscaping / Lawn Care',
    industry_key: 'landscaping',
    sector: 'building_and_construction',
    sde_multiple: 2.46,
    sde_multiple_range: { low: 1.8, high: 3.2 },
    revenue_multiple: 0.70,
    revenue_multiple_range: { low: 0.5, high: 0.9 },
    median_asking_price: 425000,
    rules_of_thumb: [
      'Equipment value plus 1-2x annual net',
      '2-3x SDE for maintenance-focused companies',
      'Premium for commercial contract base',
      'Seasonal cash flow considerations',
    ],
    valuation_notes: [
      'Recurring maintenance contracts highly valued',
      'Commercial contracts more valuable than residential',
      'Equipment age and condition matter',
      'Crew stability important',
    ],
    typical_deal_structure: '60-70% cash, equipment condition critical, spring/summer close preferred',
    key_value_drivers: [
      'Commercial maintenance contracts',
      'Contract renewal rate',
      'Newer equipment fleet',
      'Experienced crew retention',
      'Snow removal (in applicable markets)',
    ],
    red_flags: [
      'High employee turnover',
      'Aging equipment',
      'Residential-only focus',
      'Owner does most work',
    ],
    industry_benchmarks: {
      gross_margin: '45-55%',
      operating_margin: '10-20%',
      revenue_per_employee: '$50,000-$80,000',
      other: {
        'Contract retention': '85%+',
        'Revenue mix': '70%+ maintenance ideal',
      },
    },
  },

  // ========== FOOD & RESTAURANTS ==========
  restaurant_full_service: {
    industry: 'Restaurant - Full Service',
    industry_key: 'restaurant_full_service',
    sector: 'food_and_restaurants',
    sde_multiple: 2.15,
    sde_multiple_range: { low: 1.5, high: 2.8 },
    revenue_multiple: 0.39,
    revenue_multiple_range: { low: 0.25, high: 0.55 },
    median_asking_price: 220000,
    rules_of_thumb: [
      '30-40% of annual sales plus inventory',
      '2-3x SDE for profitable restaurants',
      'Equipment and FF&E typically included',
      'Lease terms critical to value',
    ],
    valuation_notes: [
      'Lease terms can make or break deal',
      'Liquor license adds significant value',
      'Brand/concept transferability matters',
      'Location and demographics critical',
    ],
    typical_deal_structure: '50-70% cash, inventory at close, 2-4 week training, lease assignment required',
    key_value_drivers: [
      'Profitable with documented SDE',
      'Favorable long-term lease',
      'Liquor license (where applicable)',
      'Strong online reviews',
      'Transferable brand/concept',
    ],
    red_flags: [
      'Short remaining lease',
      'Declining sales trend',
      'Poor online reviews',
      'High food/labor costs',
      'Owner-chef dependent',
    ],
    industry_benchmarks: {
      gross_margin: '60-70% (food cost 28-35%)',
      operating_margin: '5-15%',
      other: {
        'Food cost': '28-35%',
        'Labor cost': '25-35%',
        'Occupancy cost': '6-10%',
        'Prime cost': '60-65%',
      },
    },
  },

  restaurant_fast_food: {
    industry: 'Restaurant - Fast Food / QSR',
    industry_key: 'restaurant_fast_food',
    sector: 'food_and_restaurants',
    sde_multiple: 2.25,
    sde_multiple_range: { low: 1.5, high: 3.0 },
    revenue_multiple: 0.40,
    revenue_multiple_range: { low: 0.25, high: 0.55 },
    median_asking_price: 275000,
    rules_of_thumb: [
      '35-45% of annual sales',
      'Franchise vs independent significant difference',
      'Franchises: often higher multiples due to brand',
      'Drive-thru capability adds premium',
    ],
    valuation_notes: [
      'Franchise agreements require approval',
      'Drive-thru adds 20-30% to value',
      'Location and traffic patterns critical',
      'Labor efficiency metrics important',
    ],
    typical_deal_structure: 'Franchise approval required, 60-80% cash, franchisor training',
    key_value_drivers: [
      'Drive-thru capability',
      'Strong brand (if franchise)',
      'High-traffic location',
      'Efficient labor model',
      'Modern equipment/POS',
    ],
    red_flags: [
      'Franchise compliance issues',
      'Declining same-store sales',
      'Deferred maintenance',
      'Poor health inspections',
    ],
    industry_benchmarks: {
      gross_margin: '65-75%',
      operating_margin: '8-18%',
      other: {
        'Food cost': '25-32%',
        'Labor cost': '22-30%',
        'Average ticket': '$8-$15',
      },
    },
  },

  bar_tavern: {
    industry: 'Bar / Tavern / Nightclub',
    industry_key: 'bar_tavern',
    sector: 'food_and_restaurants',
    sde_multiple: 2.73,
    sde_multiple_range: { low: 2.0, high: 3.5 },
    revenue_multiple: 0.51,
    revenue_multiple_range: { low: 0.35, high: 0.70 },
    median_asking_price: 299500,
    rules_of_thumb: [
      '40-50% of annual sales',
      '2.5-3.5x SDE',
      'Liquor license value varies significantly by state/locality',
      'Premium for entertainment venue capabilities',
    ],
    valuation_notes: [
      'Liquor license can be 20-40% of value in some markets',
      'Entertainment (live music, sports) adds value',
      'Neighborhood bar vs nightclub different valuations',
      'Pour cost control critical',
    ],
    typical_deal_structure: '60-70% cash, liquor license transfer critical, 2-4 week training',
    key_value_drivers: [
      'Liquor license type and transferability',
      'Entertainment capabilities',
      'Strong regular customer base',
      'Multiple revenue streams (food, gaming, events)',
      'Favorable lease terms',
    ],
    red_flags: [
      'Liquor license violations',
      'Noise/neighbor complaints',
      'Cash-heavy with poor records',
      'Short lease remaining',
    ],
    industry_benchmarks: {
      gross_margin: '70-80%',
      operating_margin: '15-25%',
      other: {
        'Pour cost': '18-24%',
        'Food cost (if applicable)': '28-35%',
        'Labor cost': '20-30%',
      },
    },
  },

  coffee_shop: {
    industry: 'Coffee Shop / Cafe',
    industry_key: 'coffee_shop',
    sector: 'food_and_restaurants',
    sde_multiple: 2.21,
    sde_multiple_range: { low: 1.5, high: 3.0 },
    revenue_multiple: 0.46,
    revenue_multiple_range: { low: 0.30, high: 0.65 },
    median_asking_price: 150000,
    rules_of_thumb: [
      '35-50% of annual sales',
      'Drive-thru adds significant premium (30-50%)',
      'Location is paramount',
      'Food program adds value but complexity',
    ],
    valuation_notes: [
      'Drive-thru coffee shops command premium',
      'Morning traffic patterns critical',
      'Parking and accessibility important',
      'Specialty/third-wave coffee trending',
    ],
    typical_deal_structure: '60-70% cash, equipment included, 2-3 week training',
    key_value_drivers: [
      'Drive-thru capability',
      'High morning traffic location',
      'Strong brand/loyal customer base',
      'Quality equipment (espresso machine condition)',
      'Food program profitability',
    ],
    red_flags: [
      'Competition from major chains',
      'Poor parking/access',
      'Declining morning traffic',
      'High rent relative to sales',
    ],
    industry_benchmarks: {
      gross_margin: '65-80%',
      operating_margin: '10-20%',
      other: {
        'Coffee cost': '15-22%',
        'Average ticket': '$5-$10',
        'Transactions per day': '200-400',
      },
    },
  },

  bakery: {
    industry: 'Bakery',
    industry_key: 'bakery',
    sector: 'food_and_restaurants',
    sde_multiple: 2.40,
    sde_multiple_range: { low: 1.8, high: 3.0 },
    revenue_multiple: 0.50,
    revenue_multiple_range: { low: 0.35, high: 0.70 },
    median_asking_price: 205482,
    rules_of_thumb: [
      '40-55% of annual sales',
      'Wholesale accounts add significant value',
      'Production capacity important',
      'Equipment and recipes included',
    ],
    valuation_notes: [
      'Wholesale/restaurant accounts provide stability',
      'Special occasion (wedding cakes) higher margin',
      'Early morning hours challenge staffing',
      'Recipe transferability important',
    ],
    typical_deal_structure: '60-70% cash, recipes and training included, 30-60 day training',
    key_value_drivers: [
      'Wholesale account base',
      'Wedding/special occasion reputation',
      'Production capacity',
      'Skilled bakers on staff',
      'Proprietary recipes',
    ],
    red_flags: [
      'Owner is sole baker',
      'No wholesale accounts',
      'Aging equipment',
      'Health department issues',
    ],
    industry_benchmarks: {
      gross_margin: '50-65%',
      operating_margin: '8-15%',
      other: {
        'Food cost': '30-40%',
        'Labor cost': '25-35%',
      },
    },
  },

  // ========== HEALTHCARE ==========
  dental_practice: {
    industry: 'Dental Practice',
    industry_key: 'dental_practice',
    sector: 'healthcare_and_fitness',
    sde_multiple: 2.77,
    sde_multiple_range: { low: 2.0, high: 3.5 },
    revenue_multiple: 0.77,
    revenue_multiple_range: { low: 0.60, high: 0.95 },
    ebitda_multiple: 5.0,
    median_asking_price: 350000,
    rules_of_thumb: [
      '65-85% of annual revenues',
      '2.5-3.5x SDE for general practice',
      'Specialty practices (ortho, perio) command premium',
      'Active patient count critical metric',
    ],
    valuation_notes: [
      'Patient retention through transition critical',
      'Associate dentist in place adds value',
      'Hygiene production important metric',
      'Insurance vs fee-for-service mix matters',
    ],
    typical_deal_structure: '60-80% cash, earnout based on patient retention, 6-12 month transition',
    key_value_drivers: [
      'Active patient base (seen within 18 months)',
      'Hygiene program production',
      'Associate dentist(s) staying',
      'Modern equipment and technology',
      'Fee-for-service percentage',
    ],
    red_flags: [
      'Declining active patients',
      'Outdated equipment',
      'No associate dentist',
      'Heavy PPO dependence',
      'Short lease remaining',
    ],
    industry_benchmarks: {
      gross_margin: '60-70%',
      operating_margin: '25-40%',
      other: {
        'Collections rate': '98%+',
        'Hygiene production': '33% of total',
        'Overhead': '55-65%',
        'New patients/month': '25-50',
      },
    },
  },

  medical_practice: {
    industry: 'Medical Practice (Primary Care)',
    industry_key: 'medical_practice',
    sector: 'healthcare_and_fitness',
    sde_multiple: 2.40,
    sde_multiple_range: { low: 1.8, high: 3.2 },
    revenue_multiple: 0.77,
    revenue_multiple_range: { low: 0.50, high: 1.00 },
    median_asking_price: 489000,
    rules_of_thumb: [
      '50-80% of annual revenues',
      'Specialty matters significantly',
      'Medicare/Medicaid percentage affects value',
      'EMR system and compliance critical',
    ],
    valuation_notes: [
      'Specialty practices valued differently (derm, cardio higher)',
      'Payer mix critical to profitability',
      'Stark/Anti-kickback compliance essential',
      'Credentialing transfer takes time',
    ],
    typical_deal_structure: '50-70% cash, earnout common, extended transition (6-12 months)',
    key_value_drivers: [
      'Active patient panel',
      'Payer mix (commercial vs government)',
      'Ancillary services (lab, imaging)',
      'EMR system in place',
      'Multiple providers',
    ],
    red_flags: [
      'Single physician practice',
      'High Medicare/Medicaid percentage',
      'Compliance issues',
      'Outdated systems',
      'Declining reimbursements',
    ],
    industry_benchmarks: {
      gross_margin: '55-70%',
      operating_margin: '20-35%',
      other: {
        'Collections rate': '95%+',
        'Patients per day': '20-30 per provider',
        'Revenue per provider': '$400K-$800K',
      },
    },
  },

  veterinary: {
    industry: 'Veterinary Practice',
    industry_key: 'veterinary',
    sector: 'healthcare_and_fitness',
    sde_multiple: 3.50,
    sde_multiple_range: { low: 2.8, high: 4.5 },
    revenue_multiple: 0.90,
    revenue_multiple_range: { low: 0.70, high: 1.20 },
    ebitda_multiple: 6.0,
    median_asking_price: 600000,
    rules_of_thumb: [
      '70-100% of annual revenues',
      '3-4.5x SDE - one of highest in healthcare',
      'Corporate consolidators actively acquiring',
      'Premium for multi-DVM practices',
    ],
    valuation_notes: [
      'Corporate buyers (Mars, NVA) paying premium',
      'Multiple DVMs reduce risk significantly',
      'Specialty services add value',
      'Pet industry growth driving valuations',
    ],
    typical_deal_structure: '70-90% cash (corporate buyers), earnout for retention, 1-2 year employment agreement',
    key_value_drivers: [
      'Multiple veterinarians',
      'Active client base',
      'Modern facility and equipment',
      'Specialty services (surgery, dental)',
      'Strong support staff',
    ],
    red_flags: [
      'Single DVM practice',
      'Declining active clients',
      'Outdated facility',
      'Staff turnover',
      'Below-market pricing',
    ],
    industry_benchmarks: {
      gross_margin: '70-80%',
      operating_margin: '15-25%',
      other: {
        'Revenue per DVM': '$500K-$800K',
        'Transactions per year': '8,000-15,000',
        'Average transaction': '$150-$250',
      },
    },
  },

  fitness_gym: {
    industry: 'Fitness Center / Gym',
    industry_key: 'fitness_gym',
    sector: 'healthcare_and_fitness',
    sde_multiple: 2.54,
    sde_multiple_range: { low: 1.8, high: 3.5 },
    revenue_multiple: 0.70,
    revenue_multiple_range: { low: 0.50, high: 1.00 },
    median_asking_price: 207000,
    rules_of_thumb: [
      '2-3.5x SDE',
      'Membership base and retention rate critical',
      'Personal training revenue adds value',
      'Equipment age and condition important',
    ],
    valuation_notes: [
      'Monthly recurring membership revenue valued',
      'Boutique fitness (CrossFit, yoga) may command premium',
      'Equipment replacement cost consideration',
      'Lease terms critical for gym space',
    ],
    typical_deal_structure: '60-70% cash, equipment inspection critical, membership transition plan',
    key_value_drivers: [
      'Strong membership retention',
      'Personal training revenue',
      'Modern equipment',
      'Favorable lease',
      'Multiple revenue streams',
    ],
    red_flags: [
      'Declining membership',
      'Equipment past useful life',
      'High attrition rate',
      'Competition from budget gyms',
    ],
    industry_benchmarks: {
      gross_margin: '70-85%',
      operating_margin: '15-25%',
      other: {
        'Revenue per member': '$40-$150/month',
        'Attrition rate': '30-50% annually',
        'Personal training': '15-25% of revenue',
      },
    },
  },

  // ========== PROFESSIONAL SERVICES ==========
  accounting_cpa: {
    industry: 'Accounting / CPA Firm',
    industry_key: 'accounting_cpa',
    sector: 'financial_services',
    sde_multiple: 2.23,
    sde_multiple_range: { low: 1.5, high: 3.0 },
    revenue_multiple: 1.07,
    revenue_multiple_range: { low: 0.80, high: 1.40 },
    median_asking_price: 424000,
    rules_of_thumb: [
      '100-125% of annual revenues',
      '1-1.5x gross revenues most common',
      'Premium for tax-heavy practices (recurring)',
      'Client retention through transition critical',
    ],
    valuation_notes: [
      'Tax practices more valuable than audit/compilation',
      'Client concentration risk important',
      'Staff retention affects transition',
      'Technology adoption matters',
    ],
    typical_deal_structure: '30-50% down, balance over 2-3 years tied to retention, earnout common',
    key_value_drivers: [
      'Recurring tax clients',
      'Staff retention',
      'Client quality (business vs individual)',
      'Modern technology',
      'Diversified service mix',
    ],
    red_flags: [
      'Client concentration',
      'Owner does all work',
      'Outdated technology',
      'Aging client base',
      'Heavy write-offs',
    ],
    industry_benchmarks: {
      gross_margin: '80-90%',
      operating_margin: '25-40%',
      other: {
        'Revenue per professional': '$150K-$300K',
        'Billing realization': '85%+',
        'Client retention': '90%+',
      },
    },
  },

  insurance_agency: {
    industry: 'Insurance Agency',
    industry_key: 'insurance_agency',
    sector: 'financial_services',
    sde_multiple: 2.86,
    sde_multiple_range: { low: 2.0, high: 4.0 },
    revenue_multiple: 1.52,
    revenue_multiple_range: { low: 1.20, high: 2.50 },
    median_asking_price: 497500,
    rules_of_thumb: [
      '1.5-2.5x annual commissions',
      'P&C agencies: 1.5-2.5x',
      'Life/health agencies: 1-2x',
      'Commercial lines premium over personal',
    ],
    valuation_notes: [
      'Book of business is the value',
      'Carrier relationships critical',
      'Retention rate during transition key',
      'Commercial lines more valuable',
    ],
    typical_deal_structure: '40-60% down, balance tied to retention over 1-2 years, carrier approval required',
    key_value_drivers: [
      'Commercial lines percentage',
      'Carrier diversity',
      'Staff producers',
      'High retention rate',
      'Recurring revenue model',
    ],
    red_flags: [
      'Single carrier dependence',
      'Owner is only producer',
      'Declining book',
      'Personal lines heavy',
      'Carrier contract issues',
    ],
    industry_benchmarks: {
      gross_margin: '75-90%',
      operating_margin: '20-35%',
      other: {
        'Retention rate': '88-95%',
        'Revenue per employee': '$150K-$250K',
        'Commercial/personal mix': '60/40 ideal',
      },
    },
  },

  staffing_agency: {
    industry: 'Staffing / Employment Agency',
    industry_key: 'staffing_agency',
    sector: 'service_businesses',
    sde_multiple: 2.74,
    sde_multiple_range: { low: 2.0, high: 3.5 },
    revenue_multiple: 0.65,
    revenue_multiple_range: { low: 0.40, high: 0.90 },
    median_asking_price: 670000,
    rules_of_thumb: [
      '2-3.5x SDE',
      '40-70% of annual gross profit',
      'Temp staffing vs perm placement different values',
      'Industry specialization adds premium',
    ],
    valuation_notes: [
      'Gross profit (not revenue) is key metric',
      'Client concentration risk',
      'Industry specialization valuable',
      'Back-office systems important',
    ],
    typical_deal_structure: '50-70% cash, earnout common, client relationship transition critical',
    key_value_drivers: [
      'Client diversification',
      'Industry specialization',
      'Gross profit margins',
      'Strong recruiter team',
      'Modern ATS/CRM systems',
    ],
    red_flags: [
      'Client concentration',
      'Declining gross profit',
      'High recruiter turnover',
      'No ATS system',
    ],
    industry_benchmarks: {
      gross_margin: '18-35%',
      operating_margin: '5-15%',
      other: {
        'Bill rate markup': '25-50%',
        'Recruiters per $1M GP': '2-3',
        'Temp vs perm revenue': 'Varies widely',
      },
    },
  },

  // ========== RETAIL ==========
  convenience_store: {
    industry: 'Convenience Store',
    industry_key: 'convenience_store',
    sector: 'retail',
    sde_multiple: 2.39,
    sde_multiple_range: { low: 1.8, high: 3.0 },
    revenue_multiple: 0.40,
    revenue_multiple_range: { low: 0.25, high: 0.55 },
    median_asking_price: 210000,
    rules_of_thumb: [
      '15-25% of annual inside sales plus inventory',
      'Gas station component valued separately',
      '2-3x SDE for profitable stores',
      'Location and traffic critical',
    ],
    valuation_notes: [
      'Inside sales vs gas sales different margins',
      'Lottery and tobacco commissions important',
      'Beer/wine license adds value',
      'Brand (7-Eleven, Circle K) vs independent',
    ],
    typical_deal_structure: '70-80% cash, inventory at cost, fuel supplier requirements',
    key_value_drivers: [
      'Traffic count and location',
      'Inside sales per day',
      'Beer/wine/lottery licenses',
      'Brand recognition',
      'Clean environmental history',
    ],
    red_flags: [
      'Declining inside sales',
      'Gas tank/environmental issues',
      'Unfavorable supplier contracts',
      'High crime area',
    ],
    industry_benchmarks: {
      gross_margin: '25-35% (inside), 5-8% (fuel)',
      operating_margin: '3-8%',
      other: {
        'Inside sales per day': '$1,500-$4,000',
        'Gas gallons per month': '50,000-150,000',
        'Lottery/tobacco commission': '5-8%',
      },
    },
  },

  liquor_store: {
    industry: 'Liquor Store',
    industry_key: 'liquor_store',
    sector: 'retail',
    sde_multiple: 3.34,
    sde_multiple_range: { low: 2.5, high: 4.0 },
    revenue_multiple: 0.50,
    revenue_multiple_range: { low: 0.35, high: 0.70 },
    median_asking_price: 427500,
    rules_of_thumb: [
      '25-35% of annual sales plus inventory',
      'License value varies dramatically by state/locality',
      '3-4x SDE',
      'Premium for high-traffic locations',
    ],
    valuation_notes: [
      'License value can be 30-50% of total in some states',
      'Inventory typically $50K-$200K additional',
      'State laws affect transferability',
      'Location and parking critical',
    ],
    typical_deal_structure: '60-70% cash, license transfer critical, inventory at cost',
    key_value_drivers: [
      'License value and transferability',
      'Location and traffic',
      'Inventory quality',
      'Product mix (wine, craft beer premiums)',
      'Regular customer base',
    ],
    red_flags: [
      'License compliance issues',
      'Declining sales',
      'Poor inventory management',
      'High shrinkage',
    ],
    industry_benchmarks: {
      gross_margin: '22-30%',
      operating_margin: '8-15%',
      other: {
        'Inventory turns': '8-12x per year',
        'Sales per square foot': '$400-$800',
      },
    },
  },

  // ========== SERVICE BUSINESSES ==========
  dry_cleaner: {
    industry: 'Dry Cleaner',
    industry_key: 'dry_cleaner',
    sector: 'service_businesses',
    sde_multiple: 2.10,
    sde_multiple_range: { low: 1.5, high: 2.8 },
    revenue_multiple: 0.76,
    revenue_multiple_range: { low: 0.50, high: 1.00 },
    median_asking_price: 250000,
    rules_of_thumb: [
      '50-75% of annual sales for plant stores',
      'Drop stores: 40-60% of annual sales',
      'Equipment age and condition critical',
      '2-3x SDE',
    ],
    valuation_notes: [
      'Plant vs drop-off store significant difference',
      'Equipment replacement cost consideration',
      'Environmental compliance important',
      'Route/pickup services add value',
    ],
    typical_deal_structure: '60-70% cash, equipment inspection critical, 2-4 week training',
    key_value_drivers: [
      'Plant (cleaning on-site) vs drop store',
      'Equipment condition and age',
      'Route/delivery business',
      'Commercial accounts',
      'Environmental compliance',
    ],
    red_flags: [
      'Outdated equipment',
      'Environmental issues',
      'No commercial accounts',
      'Declining piece count',
    ],
    industry_benchmarks: {
      gross_margin: '45-55%',
      operating_margin: '10-18%',
      other: {
        'Pieces per week': '2,000-5,000 for viable plant',
        'Revenue per employee': '$50K-$80K',
      },
    },
  },

  laundromat: {
    industry: 'Laundromat / Coin Laundry',
    industry_key: 'laundromat',
    sector: 'service_businesses',
    sde_multiple: 3.65,
    sde_multiple_range: { low: 3.0, high: 4.5 },
    revenue_multiple: 1.33,
    revenue_multiple_range: { low: 1.00, high: 1.75 },
    median_asking_price: 250000,
    rules_of_thumb: [
      '4-6x monthly net income',
      '100-150% of annual revenues',
      'Semi-absentee operation premium',
      'Equipment age critical factor',
    ],
    valuation_notes: [
      'Utility costs significant factor',
      'Equipment age and condition paramount',
      'Location demographics critical',
      'Card/app payment systems add value',
    ],
    typical_deal_structure: '70-80% cash, equipment inspection required, minimal training',
    key_value_drivers: [
      'Modern equipment (under 7 years)',
      'Card/app payment systems',
      'Wash-dry-fold service',
      'Strong demographics',
      'Favorable utility rates',
    ],
    red_flags: [
      'Aging equipment (10+ years)',
      'High utility costs',
      'Poor demographics',
      'New competition',
    ],
    industry_benchmarks: {
      gross_margin: '75-85%',
      operating_margin: '25-40%',
      other: {
        'Turns per day': '4-8 per machine',
        'Revenue per square foot': '$25-$50/month',
        'Utility percentage': '15-25%',
      },
    },
  },

  pest_control: {
    industry: 'Pest Control',
    industry_key: 'pest_control',
    sector: 'service_businesses',
    sde_multiple: 2.40,
    sde_multiple_range: { low: 1.8, high: 3.2 },
    revenue_multiple: 0.99,
    revenue_multiple_range: { low: 0.70, high: 1.30 },
    median_asking_price: 249000,
    rules_of_thumb: [
      'Recurring revenue highly valued: 1-1.3x annual recurring',
      '2-3x SDE',
      'Premium for commercial accounts',
      'License transferability important',
    ],
    valuation_notes: [
      'Recurring service agreements are key value driver',
      'Commercial contracts more valuable',
      'Seasonality in some markets',
      'Consolidation in industry',
    ],
    typical_deal_structure: '50-70% cash, earnout tied to retention, license transfer required',
    key_value_drivers: [
      'Recurring revenue percentage',
      'Commercial accounts',
      'Route density',
      'Technician retention',
      'Licenses and certifications',
    ],
    red_flags: [
      'Low recurring revenue',
      'License issues',
      'High customer churn',
      'Key man (owner) routes',
    ],
    industry_benchmarks: {
      gross_margin: '50-65%',
      operating_margin: '15-25%',
      other: {
        'Recurring revenue': '70%+ ideal',
        'Customer retention': '85%+',
        'Revenue per technician': '$150K-$250K',
      },
    },
  },

  cleaning_business: {
    industry: 'Commercial Cleaning / Janitorial',
    industry_key: 'cleaning_business',
    sector: 'service_businesses',
    sde_multiple: 2.19,
    sde_multiple_range: { low: 1.5, high: 3.0 },
    revenue_multiple: 0.70,
    revenue_multiple_range: { low: 0.45, high: 0.95 },
    median_asking_price: 260000,
    rules_of_thumb: [
      '40-70% of annual sales',
      'Commercial contracts: 50-70%',
      'Residential: 40-60%',
      'Contract base value',
    ],
    valuation_notes: [
      'Commercial contracts more valuable than residential',
      'Contract terms and renewal rates important',
      'Employee vs subcontractor model matters',
      'Specialized cleaning (medical, industrial) premium',
    ],
    typical_deal_structure: '50-70% cash, contract assignment critical, earnout common',
    key_value_drivers: [
      'Commercial contract base',
      'Contract length and renewal rates',
      'Specialization (medical, industrial)',
      'Employee team retention',
      'Systems and processes',
    ],
    red_flags: [
      'High customer concentration',
      'Residential-only focus',
      'Owner does cleaning',
      'High employee turnover',
    ],
    industry_benchmarks: {
      gross_margin: '40-55%',
      operating_margin: '10-20%',
      other: {
        'Revenue per cleaner': '$35K-$50K',
        'Contract retention': '85%+',
      },
    },
  },

  // ========== CHILDCARE ==========
  daycare: {
    industry: 'Daycare / Childcare Center',
    industry_key: 'daycare',
    sector: 'education_and_children',
    sde_multiple: 3.27,
    sde_multiple_range: { low: 2.5, high: 4.0 },
    revenue_multiple: 0.86,
    revenue_multiple_range: { low: 0.65, high: 1.10 },
    median_asking_price: 395000,
    rules_of_thumb: [
      '65-90% of annual revenues',
      '3-4x SDE for licensed, established centers',
      'Licensed capacity utilization critical',
      'Waiting list adds premium',
    ],
    valuation_notes: [
      'License capacity and utilization key metrics',
      'Waiting list indicates demand',
      'Staff qualifications and retention important',
      'Regulatory compliance critical',
    ],
    typical_deal_structure: '60-70% cash, license transfer required, extended transition (60-90 days)',
    key_value_drivers: [
      'Licensed capacity',
      'Current enrollment',
      'Waiting list',
      'Staff retention',
      'Facility condition',
      'Regulatory compliance',
    ],
    red_flags: [
      'Below capacity enrollment',
      'Staff turnover',
      'Regulatory violations',
      'Facility issues',
    ],
    industry_benchmarks: {
      gross_margin: '65-80%',
      operating_margin: '10-20%',
      other: {
        'Revenue per child': '$800-$2,000/month',
        'Staff to child ratio': 'Per state requirements',
        'Enrollment vs capacity': '85%+ ideal',
      },
    },
  },

  // ========== MANUFACTURING ==========
  machine_shop: {
    industry: 'Machine Shop',
    industry_key: 'machine_shop',
    sector: 'manufacturing',
    sde_multiple: 3.47,
    sde_multiple_range: { low: 2.5, high: 4.5 },
    revenue_multiple: 0.89,
    revenue_multiple_range: { low: 0.60, high: 1.20 },
    ebitda_multiple: 4.5,
    median_asking_price: 850000,
    rules_of_thumb: [
      '60-90% of annual sales plus equipment value',
      '3-4.5x SDE',
      'CNC equipment and capabilities add premium',
      'Certifications (AS9100, ISO) add value',
    ],
    valuation_notes: [
      'Equipment age and capability critical',
      'Aerospace/defense certifications premium',
      'Skilled machinists hard to find',
      'Customer diversification important',
    ],
    typical_deal_structure: '50-70% cash, equipment inventory important, extended training (60-90 days)',
    key_value_drivers: [
      'CNC equipment (age, capability)',
      'Industry certifications',
      'Skilled workforce',
      'Customer diversification',
      'Specialty capabilities',
    ],
    red_flags: [
      'Customer concentration',
      'Aging manual equipment',
      'No certifications',
      'Key man (master machinist)',
    ],
    industry_benchmarks: {
      gross_margin: '35-50%',
      operating_margin: '10-20%',
      other: {
        'Revenue per employee': '$100K-$200K',
        'Machine utilization': '70%+',
        'Scrap rate': '<3%',
      },
    },
  },

  printing: {
    industry: 'Commercial Printing',
    industry_key: 'printing',
    sector: 'manufacturing',
    sde_multiple: 2.57,
    sde_multiple_range: { low: 1.8, high: 3.2 },
    revenue_multiple: 0.60,
    revenue_multiple_range: { low: 0.40, high: 0.80 },
    median_asking_price: 400000,
    rules_of_thumb: [
      '40-60% of annual sales plus equipment',
      '2-3x SDE',
      'Digital capabilities increasingly important',
      'Equipment value significant factor',
    ],
    valuation_notes: [
      'Digital vs offset capabilities matter',
      'Industry declining but niches profitable',
      'Diversified services (signage, fulfillment) add value',
      'Customer concentration risk',
    ],
    typical_deal_structure: '60-70% cash, equipment inspection critical, 30-60 day training',
    key_value_drivers: [
      'Modern digital equipment',
      'Diversified services',
      'Customer base quality',
      'Web-to-print capabilities',
      'Specialty printing niches',
    ],
    red_flags: [
      'Offset-only capabilities',
      'Declining revenues',
      'Customer concentration',
      'Aging equipment',
    ],
    industry_benchmarks: {
      gross_margin: '35-50%',
      operating_margin: '5-15%',
      other: {
        'Revenue per employee': '$80K-$150K',
        'Digital vs offset': 'Digital growing',
      },
    },
  },
};

// ============================================================================
// INDUSTRY KEYWORD MAPPING
// ============================================================================

const INDUSTRY_KEYWORDS: Record<string, string> = {
  // HVAC
  hvac: 'hvac',
  heating: 'hvac',
  cooling: 'hvac',
  'air conditioning': 'hvac',
  'furnace': 'hvac',
  'heat pump': 'hvac',

  // Plumbing
  plumbing: 'plumbing',
  plumber: 'plumbing',
  'drain cleaning': 'plumbing',
  'water heater': 'plumbing',

  // Electrical
  electrical: 'electrical',
  electrician: 'electrical',
  'electrical contractor': 'electrical',

  // Landscaping
  landscaping: 'landscaping',
  'lawn care': 'landscaping',
  'lawn maintenance': 'landscaping',
  'landscape maintenance': 'landscaping',
  'grounds maintenance': 'landscaping',

  // Restaurants
  restaurant: 'restaurant_full_service',
  'full service restaurant': 'restaurant_full_service',
  'casual dining': 'restaurant_full_service',
  'fine dining': 'restaurant_full_service',
  'fast food': 'restaurant_fast_food',
  qsr: 'restaurant_fast_food',
  'quick service': 'restaurant_fast_food',

  // Coffee/Bakery
  cafe: 'coffee_shop',
  coffee: 'coffee_shop',
  'coffee shop': 'coffee_shop',
  espresso: 'coffee_shop',
  bakery: 'bakery',
  'baked goods': 'bakery',

  // Bars
  bar: 'bar_tavern',
  tavern: 'bar_tavern',
  pub: 'bar_tavern',
  nightclub: 'bar_tavern',

  // Healthcare
  dental: 'dental_practice',
  dentist: 'dental_practice',
  'dental practice': 'dental_practice',
  medical: 'medical_practice',
  'medical practice': 'medical_practice',
  physician: 'medical_practice',
  'doctors office': 'medical_practice',
  veterinary: 'veterinary',
  vet: 'veterinary',
  'animal hospital': 'veterinary',
  'pet clinic': 'veterinary',
  gym: 'fitness_gym',
  fitness: 'fitness_gym',
  'health club': 'fitness_gym',
  crossfit: 'fitness_gym',
  yoga: 'fitness_gym',

  // Auto
  'auto repair': 'auto_repair',
  mechanic: 'auto_repair',
  'auto shop': 'auto_repair',
  'car repair': 'auto_repair',
  'car wash': 'car_wash',
  carwash: 'car_wash',
  'auto detailing': 'car_wash',

  // Childcare
  daycare: 'daycare',
  'day care': 'daycare',
  'child care': 'daycare',
  childcare: 'daycare',
  preschool: 'daycare',

  // Cleaning/Laundry
  'dry cleaning': 'dry_cleaner',
  'dry cleaner': 'dry_cleaner',
  laundromat: 'laundromat',
  'coin laundry': 'laundromat',
  laundry: 'laundromat',
  'commercial cleaning': 'cleaning_business',
  janitorial: 'cleaning_business',
  'cleaning service': 'cleaning_business',
  'office cleaning': 'cleaning_business',

  // Professional Services
  accounting: 'accounting_cpa',
  cpa: 'accounting_cpa',
  'tax preparation': 'accounting_cpa',
  bookkeeping: 'accounting_cpa',
  insurance: 'insurance_agency',
  'insurance agency': 'insurance_agency',
  'insurance broker': 'insurance_agency',
  staffing: 'staffing_agency',
  'employment agency': 'staffing_agency',
  'temp agency': 'staffing_agency',
  recruiting: 'staffing_agency',

  // Retail
  liquor: 'liquor_store',
  'liquor store': 'liquor_store',
  'package store': 'liquor_store',
  'wine shop': 'liquor_store',
  convenience: 'convenience_store',
  'convenience store': 'convenience_store',
  'c-store': 'convenience_store',
  'gas station': 'convenience_store',

  // Pest Control
  'pest control': 'pest_control',
  exterminator: 'pest_control',
  'termite control': 'pest_control',

  // Manufacturing
  'machine shop': 'machine_shop',
  machining: 'machine_shop',
  cnc: 'machine_shop',
  manufacturing: 'machine_shop',
  printing: 'printing',
  'print shop': 'printing',
  'commercial printing': 'printing',
};

// ============================================================================
// NAICS CODE MAPPING
// ============================================================================

const NAICS_TO_INDUSTRY: Record<string, string> = {
  // Construction
  '236115': 'building_and_construction',
  '236116': 'building_and_construction',
  '236117': 'building_and_construction',
  '236118': 'building_and_construction',
  '236210': 'building_and_construction',
  '236220': 'building_and_construction',
  '238110': 'building_and_construction',
  '238120': 'building_and_construction',
  '238130': 'building_and_construction',
  '238140': 'building_and_construction',
  '238150': 'building_and_construction',
  '238160': 'building_and_construction',
  '238170': 'building_and_construction',
  '238190': 'building_and_construction',
  '238210': 'electrical',
  '238220': 'hvac',
  '238290': 'building_and_construction',
  '238310': 'building_and_construction',
  '238320': 'building_and_construction',
  '238330': 'building_and_construction',
  '238340': 'building_and_construction',
  '238350': 'building_and_construction',
  '238390': 'building_and_construction',
  '238910': 'building_and_construction',
  '238990': 'building_and_construction',

  // Manufacturing
  '332710': 'machine_shop',
  '332721': 'machine_shop',
  '332722': 'machine_shop',
  '333514': 'machine_shop',
  '323111': 'printing',
  '323113': 'printing',
  '323117': 'printing',
  '323120': 'printing',

  // Retail
  '445110': 'retail',
  '445120': 'convenience_store',
  '445210': 'retail',
  '445220': 'retail',
  '445230': 'retail',
  '445291': 'bakery',
  '445292': 'retail',
  '445299': 'retail',
  '445310': 'liquor_store',

  // Food Services
  '722310': 'food_and_restaurants',
  '722320': 'food_and_restaurants',
  '722330': 'food_and_restaurants',
  '722410': 'bar_tavern',
  '722511': 'restaurant_full_service',
  '722513': 'restaurant_fast_food',
  '722514': 'coffee_shop',
  '722515': 'food_and_restaurants',

  // Healthcare
  '621111': 'medical_practice',
  '621112': 'medical_practice',
  '621210': 'dental_practice',
  '621310': 'healthcare_and_fitness',
  '621320': 'healthcare_and_fitness',
  '621330': 'healthcare_and_fitness',
  '621340': 'healthcare_and_fitness',
  '621391': 'healthcare_and_fitness',
  '621399': 'healthcare_and_fitness',
  '621410': 'healthcare_and_fitness',
  '621420': 'healthcare_and_fitness',
  '621491': 'healthcare_and_fitness',
  '621492': 'healthcare_and_fitness',
  '621493': 'healthcare_and_fitness',
  '621498': 'healthcare_and_fitness',
  '621511': 'healthcare_and_fitness',
  '621512': 'healthcare_and_fitness',
  '621610': 'healthcare_and_fitness',
  '621910': 'healthcare_and_fitness',
  '621991': 'healthcare_and_fitness',
  '621999': 'healthcare_and_fitness',

  // Veterinary
  '541940': 'veterinary',

  // Finance/Insurance
  '524210': 'insurance_agency',
  '524291': 'insurance_agency',
  '524292': 'insurance_agency',
  '524298': 'insurance_agency',
  '541211': 'accounting_cpa',
  '541213': 'accounting_cpa',
  '541219': 'accounting_cpa',

  // Services
  '561311': 'staffing_agency',
  '561312': 'staffing_agency',
  '561320': 'staffing_agency',
  '561710': 'cleaning_business',
  '561720': 'cleaning_business',
  '561730': 'landscaping',
  '561740': 'pest_control',
  '561790': 'service_businesses',

  // Personal Services
  '812111': 'beauty_and_personal_care',
  '812112': 'beauty_and_personal_care',
  '812113': 'beauty_and_personal_care',
  '812191': 'beauty_and_personal_care',
  '812199': 'beauty_and_personal_care',
  '812310': 'laundromat',
  '812320': 'dry_cleaner',
  '812331': 'dry_cleaner',

  // Auto
  '811111': 'auto_repair',
  '811112': 'auto_repair',
  '811113': 'auto_repair',
  '811118': 'auto_repair',
  '811121': 'auto_repair',
  '811122': 'auto_repair',
  '811191': 'auto_repair',
  '811192': 'car_wash',
  '811198': 'auto_repair',

  // Childcare
  '624410': 'daycare',

  // Fitness
  '713940': 'fitness_gym',
  '713910': 'entertainment_and_recreation',
  '713920': 'entertainment_and_recreation',
  '713930': 'entertainment_and_recreation',
  '713950': 'entertainment_and_recreation',
  '713990': 'entertainment_and_recreation',

  // Pet Services
  '812910': 'pet_services',
};

// ============================================================================
// NAICS TO SECTOR MAPPING
// ============================================================================

const NAICS_PREFIX_TO_SECTOR: Record<string, string> = {
  '23': 'building_and_construction',
  '31': 'manufacturing',
  '32': 'manufacturing',
  '33': 'manufacturing',
  '42': 'wholesale_and_distribution',
  '44': 'retail',
  '45': 'retail',
  '48': 'transportation_and_storage',
  '49': 'transportation_and_storage',
  '51': 'communication_and_media',
  '52': 'financial_services',
  '53': 'financial_services',
  '54': 'service_businesses',
  '55': 'financial_services',
  '56': 'service_businesses',
  '61': 'education_and_children',
  '62': 'healthcare_and_fitness',
  '71': 'entertainment_and_recreation',
  '72': 'food_and_restaurants',
  '81': 'service_businesses',
};

// ============================================================================
// RISK SCORING CRITERIA
// ============================================================================

export interface RiskScoringFactor {
  name: string;
  weight: number;
  description: string;
  scores: Record<number, string>;
}

const RISK_SCORING: Record<string, RiskScoringFactor> = {
  size_risk: {
    name: 'Size Risk',
    weight: 0.15,
    description: 'Business size measured by revenue',
    scores: {
      1: '> $5 million revenue - Substantial scale, lower risk premium',
      2: '$2-5 million revenue - Solid mid-market business',
      3: '$1-2 million revenue - Typical small business',
      4: '$500K-1 million revenue - Limited scale, higher risk',
      5: '< $500K revenue - Micro-business, highest risk premium',
    },
  },
  customer_concentration: {
    name: 'Customer Concentration',
    weight: 0.15,
    description: 'Revenue dependence on largest customers',
    scores: {
      1: '< 5% from largest customer - Highly diversified, minimal risk',
      2: '5-10% from largest customer - Well diversified',
      3: '10-20% from largest customer - Moderate concentration',
      4: '20-35% from largest customer - Significant concentration risk',
      5: '> 35% from largest customer - Dangerous concentration, major risk',
    },
  },
  owner_dependence: {
    name: 'Owner Dependence',
    weight: 0.15,
    description: 'Business reliance on current owner',
    scores: {
      1: 'Fully absentee with strong management team in place',
      2: 'Semi-absentee, owner works 10-20 hrs/week strategic only',
      3: 'Owner manages but has capable key employees',
      4: 'Owner is primary producer or main salesperson',
      5: 'Owner IS the business - cannot function without owner',
    },
  },
  management_depth: {
    name: 'Management Depth',
    weight: 0.10,
    description: 'Strength of management team beyond owner',
    scores: {
      1: 'Experienced management team with documented succession plan',
      2: 'Strong #2 who could run business day-to-day',
      3: 'Capable managers in place for key operational roles',
      4: 'Limited management depth, owner handles most decisions',
      5: 'No management team, owner does everything personally',
    },
  },
  financial_record_quality: {
    name: 'Financial Record Quality',
    weight: 0.10,
    description: 'Quality and reliability of financial records',
    scores: {
      1: 'Audited financials, clean records, good internal controls',
      2: 'Reviewed financials, well-organized records',
      3: 'Compiled financials or CPA-prepared tax returns, adequate records',
      4: 'Tax returns only with some gaps or inconsistencies',
      5: 'Poor records, cash-heavy business, significant concerns',
    },
  },
  industry_outlook: {
    name: 'Industry Outlook',
    weight: 0.10,
    description: 'Future prospects for the industry',
    scores: {
      1: 'High growth industry, favorable macro trends',
      2: 'Moderate growth, stable positive outlook',
      3: 'Mature stable industry, neither growing nor declining',
      4: 'Declining industry or facing disruption',
      5: 'Severe decline, major disruption, existential threats',
    },
  },
  competitive_position: {
    name: 'Competitive Position',
    weight: 0.10,
    description: 'Company market position and differentiation',
    scores: {
      1: 'Market leader, strong brand recognition, significant moat',
      2: 'Strong competitor, clearly differentiated offering',
      3: 'Solid competitor with some differentiation',
      4: 'Weak position, commodity offering, price competition',
      5: 'Struggling, losing market share, no clear advantage',
    },
  },
  geographic_concentration: {
    name: 'Geographic Concentration',
    weight: 0.05,
    description: 'Geographic diversification of operations',
    scores: {
      1: 'National or international presence, well diversified',
      2: 'Multi-state or strong regional presence',
      3: 'Multiple locations within single metropolitan area',
      4: 'Single location in good/stable market',
      5: 'Single location in weak or declining market',
    },
  },
  supplier_dependence: {
    name: 'Supplier Dependence',
    weight: 0.05,
    description: 'Risk from supplier concentration',
    scores: {
      1: 'Multiple suppliers, no significant concentration',
      2: 'Primary supplier with readily available alternatives',
      3: 'Key supplier relationship with some alternatives',
      4: 'Dependent on 1-2 suppliers, limited alternatives',
      5: 'Single source supplier, no practical alternatives',
    },
  },
  regulatory_risk: {
    name: 'Regulatory Risk',
    weight: 0.05,
    description: 'Exposure to regulatory changes and compliance burden',
    scores: {
      1: 'Minimal regulation, standard business requirements only',
      2: 'Standard industry regulations, stable requirements',
      3: 'Moderate regulation, licensing required',
      4: 'Heavy regulation, significant compliance burden',
      5: 'Highly regulated, frequent changes, high compliance cost',
    },
  },
};

const RISK_MULTIPLE_ADJUSTMENTS: Record<string, { adjustment: string; category: string; numeric_low: number; numeric_high: number }> = {
  '1.0-1.5': {
    adjustment: '+0.5 to +1.0x multiple',
    category: 'Low Risk',
    numeric_low: 0.5,
    numeric_high: 1.0,
  },
  '1.5-2.0': {
    adjustment: '+0.25 to +0.5x multiple',
    category: 'Below Average Risk',
    numeric_low: 0.25,
    numeric_high: 0.5,
  },
  '2.0-2.5': {
    adjustment: 'No adjustment to base multiple',
    category: 'Average Risk',
    numeric_low: 0,
    numeric_high: 0,
  },
  '2.5-3.0': {
    adjustment: '-0.25 to -0.5x multiple',
    category: 'Above Average Risk',
    numeric_low: -0.5,
    numeric_high: -0.25,
  },
  '3.0-3.5': {
    adjustment: '-0.5 to -0.75x multiple',
    category: 'Elevated Risk',
    numeric_low: -0.75,
    numeric_high: -0.5,
  },
  '3.5-4.0': {
    adjustment: '-0.75 to -1.0x multiple',
    category: 'High Risk',
    numeric_low: -1.0,
    numeric_high: -0.75,
  },
  '4.0-5.0': {
    adjustment: '-1.0x or more',
    category: 'Very High Risk',
    numeric_low: -1.5,
    numeric_high: -1.0,
  },
};

// ============================================================================
// TAX FORM EXTRACTION GUIDANCE
// ============================================================================

export interface TaxFormGuide {
  form_type: string;
  name: string;
  entity_type: string;
  key_lines: Array<{
    line: string;
    description: string;
    valuation_use: string;
    add_back?: boolean;
  }>;
  balance_sheet_location: string;
  common_add_backs: string[];
  watch_items: string[];
}

const TAX_FORM_EXTRACTION: Record<string, TaxFormGuide> = {
  '1120-S': {
    form_type: '1120-S',
    name: 'U.S. Income Tax Return for an S Corporation',
    entity_type: 'S-Corporation',
    key_lines: [
      { line: 'Line 1a', description: 'Gross receipts or sales', valuation_use: 'Total revenue starting point' },
      { line: 'Line 1b', description: 'Returns and allowances', valuation_use: 'Deduct from gross receipts' },
      { line: 'Line 1c', description: 'Balance (Net revenue)', valuation_use: 'PRIMARY REVENUE FIGURE' },
      { line: 'Line 2', description: 'Cost of goods sold', valuation_use: 'COGS for gross profit calculation' },
      { line: 'Line 3', description: 'Gross profit', valuation_use: 'Revenue minus COGS' },
      { line: 'Line 7', description: 'Compensation of officers', valuation_use: 'ADD BACK FOR SDE - Owner salary', add_back: true },
      { line: 'Line 8', description: 'Salaries and wages', valuation_use: 'Employee wages (not officers)' },
      { line: 'Line 9', description: 'Repairs and maintenance', valuation_use: 'Review for one-time items' },
      { line: 'Line 10', description: 'Bad debts', valuation_use: 'May need adjustment if unusual' },
      { line: 'Line 11', description: 'Rents', valuation_use: 'Occupancy cost - verify market rate' },
      { line: 'Line 12', description: 'Taxes and licenses', valuation_use: 'Operating expense' },
      { line: 'Line 13', description: 'Interest', valuation_use: 'ADD BACK FOR EBITDA/SDE', add_back: true },
      { line: 'Line 14', description: 'Depreciation', valuation_use: 'ADD BACK - Non-cash expense', add_back: true },
      { line: 'Line 15', description: 'Depletion', valuation_use: 'ADD BACK if applicable', add_back: true },
      { line: 'Line 16', description: 'Advertising', valuation_use: 'Marketing expense' },
      { line: 'Line 17', description: 'Pension, profit-sharing', valuation_use: 'Review for owner benefit add-back' },
      { line: 'Line 18', description: 'Employee benefit programs', valuation_use: 'Review for owner benefit add-back' },
      { line: 'Line 19', description: 'Other deductions', valuation_use: 'REVIEW DETAIL - Schedule required' },
      { line: 'Line 21', description: 'Ordinary business income', valuation_use: 'STARTING POINT FOR SDE' },
      { line: 'Schedule K, Line 11', description: 'Section 179 deduction', valuation_use: 'ADD BACK - Accelerated depreciation', add_back: true },
      { line: 'Schedule K, Line 12a', description: 'Charitable contributions', valuation_use: 'May add back if discretionary', add_back: true },
    ],
    balance_sheet_location: 'Schedule L (Balance Sheets per Books)',
    common_add_backs: [
      'Officer compensation (Line 7)',
      'Depreciation (Line 14)',
      'Amortization (from other deductions)',
      'Interest expense (Line 13)',
      'Section 179 expense (Schedule K)',
      'Owner health insurance (often in Line 18)',
      'Owner retirement contributions (Line 17)',
      'Personal auto expenses (50% typical)',
      'Personal travel/meals (from Line 19 detail)',
      'Charitable contributions (Schedule K)',
      'One-time expenses (from Line 19 detail)',
    ],
    watch_items: [
      'Related party rent (Line 11) - verify market rate',
      'Officer life insurance (typically add back)',
      'Excessive owner perks in Other Deductions',
      'Large one-time legal or professional fees',
      'Non-recurring gain/loss items',
    ],
  },
  '1120': {
    form_type: '1120',
    name: 'U.S. Corporation Income Tax Return',
    entity_type: 'C-Corporation',
    key_lines: [
      { line: 'Line 1a', description: 'Gross receipts or sales', valuation_use: 'Total revenue starting point' },
      { line: 'Line 1c', description: 'Net revenue', valuation_use: 'PRIMARY REVENUE FIGURE' },
      { line: 'Line 2', description: 'Cost of goods sold', valuation_use: 'COGS for gross profit calculation' },
      { line: 'Line 3', description: 'Gross profit', valuation_use: 'Revenue minus COGS' },
      { line: 'Line 12', description: 'Compensation of officers', valuation_use: 'ADD BACK FOR SDE', add_back: true },
      { line: 'Line 13', description: 'Salaries and wages', valuation_use: 'Employee wages (not officers)' },
      { line: 'Line 18', description: 'Interest', valuation_use: 'ADD BACK FOR EBITDA', add_back: true },
      { line: 'Line 20', description: 'Depreciation', valuation_use: 'ADD BACK', add_back: true },
      { line: 'Line 26', description: 'Other deductions', valuation_use: 'REVIEW DETAIL' },
      { line: 'Line 28', description: 'Taxable income before NOL', valuation_use: 'Pre-tax income' },
      { line: 'Line 30', description: 'Taxable income', valuation_use: 'Net income starting point' },
      { line: 'Line 31', description: 'Total tax', valuation_use: 'ADD BACK FOR EBITDA (income taxes only)', add_back: true },
    ],
    balance_sheet_location: 'Schedule L (Balance Sheets per Books)',
    common_add_backs: [
      'Officer compensation (Line 12)',
      'Depreciation (Line 20)',
      'Amortization (from other deductions)',
      'Interest expense (Line 18)',
      'Income taxes (Line 31) - for EBITDA only',
      'Owner perks and personal expenses',
      'Non-recurring items',
    ],
    watch_items: [
      'C-Corp double taxation consideration',
      'Accumulated earnings tax exposure',
      'Related party transactions',
      'Reasonable compensation analysis important',
    ],
  },
  '1065': {
    form_type: '1065',
    name: 'U.S. Return of Partnership Income',
    entity_type: 'Partnership',
    key_lines: [
      { line: 'Line 1a', description: 'Gross receipts or sales', valuation_use: 'Total revenue starting point' },
      { line: 'Line 1c', description: 'Net revenue', valuation_use: 'PRIMARY REVENUE FIGURE' },
      { line: 'Line 2', description: 'Cost of goods sold', valuation_use: 'COGS' },
      { line: 'Line 3', description: 'Gross profit', valuation_use: 'Revenue minus COGS' },
      { line: 'Line 9', description: 'Salaries and wages', valuation_use: 'Employee wages (partners get guaranteed payments)' },
      { line: 'Line 10', description: 'Guaranteed payments to partners', valuation_use: 'OWNER COMPENSATION - ADD BACK FOR SDE', add_back: true },
      { line: 'Line 15', description: 'Interest', valuation_use: 'ADD BACK', add_back: true },
      { line: 'Line 16c', description: 'Depreciation', valuation_use: 'ADD BACK', add_back: true },
      { line: 'Line 20', description: 'Other deductions', valuation_use: 'REVIEW DETAIL' },
      { line: 'Line 22', description: 'Ordinary business income', valuation_use: 'STARTING POINT' },
      { line: 'Schedule K, Line 4a-4c', description: 'Guaranteed payments detail', valuation_use: 'Verify total owner compensation' },
      { line: 'Schedule K-1', description: 'Partner share of income', valuation_use: 'Per-partner allocation' },
    ],
    balance_sheet_location: 'Schedule L (Balance Sheets per Books)',
    common_add_backs: [
      'Guaranteed payments to partners (Line 10)',
      'Depreciation (Line 16c)',
      'Amortization',
      'Interest expense (Line 15)',
      'Partner health insurance',
      'Partner retirement contributions',
      'Personal expenses run through partnership',
    ],
    watch_items: [
      'Multiple partners - verify all guaranteed payments',
      'Partner capital accounts on Schedule L',
      'Related party transactions between partners',
      'Partnership agreement terms may affect value',
    ],
  },
  'Schedule C': {
    form_type: 'Schedule C',
    name: 'Profit or Loss from Business (Sole Proprietorship)',
    entity_type: 'Sole Proprietorship',
    key_lines: [
      { line: 'Line 1', description: 'Gross receipts or sales', valuation_use: 'Total revenue' },
      { line: 'Line 2', description: 'Returns and allowances', valuation_use: 'Deduct from gross' },
      { line: 'Line 3', description: 'Net receipts', valuation_use: 'PRIMARY REVENUE' },
      { line: 'Line 4', description: 'Cost of goods sold', valuation_use: 'COGS' },
      { line: 'Line 7', description: 'Gross income', valuation_use: 'Gross profit' },
      { line: 'Line 9', description: 'Car and truck expenses', valuation_use: 'Often 50% personal - ADD BACK PORTION', add_back: true },
      { line: 'Line 13', description: 'Depreciation', valuation_use: 'ADD BACK', add_back: true },
      { line: 'Line 16a', description: 'Interest (mortgage)', valuation_use: 'ADD BACK if business property', add_back: true },
      { line: 'Line 16b', description: 'Interest (other)', valuation_use: 'ADD BACK', add_back: true },
      { line: 'Line 24a', description: 'Travel', valuation_use: 'Review for personal portion' },
      { line: 'Line 24b', description: 'Meals', valuation_use: '50% typically personal - ADD BACK', add_back: true },
      { line: 'Line 27a', description: 'Other expenses', valuation_use: 'REVIEW DETAIL' },
      { line: 'Line 30', description: 'Business use of home', valuation_use: 'ADD BACK - Form 8829', add_back: true },
      { line: 'Line 31', description: 'Net profit', valuation_use: 'STARTING POINT FOR SDE' },
    ],
    balance_sheet_location: 'Not on Schedule C - request separate balance sheet if available',
    common_add_backs: [
      'Owner takes ALL profit as compensation (no salary line)',
      'Depreciation (Line 13)',
      'Interest expense (Lines 16a, 16b)',
      'Home office deduction (Line 30)',
      'Personal portion of vehicle (50% typical)',
      'Personal portion of meals (50%)',
      'Personal portion of travel',
      'Cell phone, internet (personal portion)',
      'Section 179 expense',
    ],
    watch_items: [
      'NO owner salary line - owner keeps all profit',
      'Self-employment tax paid by owner separately',
      'May have minimal records vs business entities',
      'Health insurance on Form 1040, not Schedule C',
      'Often cash-intensive businesses',
      'May lack formal balance sheet',
    ],
  },
};

// ============================================================================
// KNOWLEDGE ROUTER CLASS
// ============================================================================

export class KnowledgeRouter {
  /**
   * Get multiples for a specific industry
   */
  getIndustryMultiples(industryKeywords: string[], naicsCode?: string): IndustryMultipleData | null {
    // First try NAICS code lookup
    if (naicsCode) {
      const industryKey = NAICS_TO_INDUSTRY[naicsCode];
      if (industryKey && INDUSTRY_MULTIPLES[industryKey]) {
        return INDUSTRY_MULTIPLES[industryKey];
      }
    }

    // Then try keyword matching
    const matchedIndustry = this.matchIndustry(industryKeywords);
    if (matchedIndustry && INDUSTRY_MULTIPLES[matchedIndustry]) {
      return INDUSTRY_MULTIPLES[matchedIndustry];
    }

    return null;
  }

  /**
   * Get sector-level multiples when specific industry not found
   */
  getSectorMultiples(sectorOrNaics: string): SectorMultipleData | null {
    // Try direct sector lookup
    if (SECTOR_MULTIPLES[sectorOrNaics]) {
      return SECTOR_MULTIPLES[sectorOrNaics];
    }

    // Try NAICS to sector mapping
    if (sectorOrNaics.length >= 2) {
      const prefix = sectorOrNaics.substring(0, 2);
      const sector = NAICS_PREFIX_TO_SECTOR[prefix];
      if (sector && SECTOR_MULTIPLES[sector]) {
        return SECTOR_MULTIPLES[sector];
      }
    }

    // Try to find sector from NAICS to industry mapping
    const industryKey = NAICS_TO_INDUSTRY[sectorOrNaics];
    if (industryKey && INDUSTRY_MULTIPLES[industryKey]) {
      const sectorKey = INDUSTRY_MULTIPLES[industryKey].sector;
      if (SECTOR_MULTIPLES[sectorKey]) {
        return SECTOR_MULTIPLES[sectorKey];
      }
    }

    return null;
  }

  /**
   * Get risk scoring criteria
   */
  getRiskScoringCriteria(): typeof RISK_SCORING {
    return RISK_SCORING;
  }

  /**
   * Get risk adjustment table
   */
  getRiskAdjustments(): typeof RISK_MULTIPLE_ADJUSTMENTS {
    return RISK_MULTIPLE_ADJUSTMENTS;
  }

  /**
   * Get tax form extraction guide
   */
  getTaxFormGuide(formType: string): TaxFormGuide | null {
    // Normalize form type
    const normalized = formType.toUpperCase().replace(/\s+/g, ' ').trim();

    if (normalized.includes('1120-S') || normalized.includes('1120S')) {
      return TAX_FORM_EXTRACTION['1120-S'];
    }
    if (normalized.includes('1120') && !normalized.includes('S')) {
      return TAX_FORM_EXTRACTION['1120'];
    }
    if (normalized.includes('1065')) {
      return TAX_FORM_EXTRACTION['1065'];
    }
    if (normalized.includes('SCHEDULE C') || normalized.includes('SCHEDULEC')) {
      return TAX_FORM_EXTRACTION['Schedule C'];
    }

    return null;
  }

  /**
   * Main method: Build knowledge injection for a specific pass
   */
  buildKnowledgeInjection(
    requests: KnowledgeRequests,
    passNumber: PassNumber,
    context?: { industry?: string; naicsCode?: string; taxFormType?: string; keywords?: string[] }
  ): string {
    const sections: string[] = [];

    // Pass 1: Document extraction - provide tax form guidance
    if (passNumber === 1) {
      sections.push(this.buildTaxFormSection(context?.taxFormType));
    }

    // Pass 2: Industry analysis - provide industry data and benchmarks
    if (passNumber === 2) {
      sections.push(this.buildIndustrySection(context?.industry, context?.naicsCode, context?.keywords));
      sections.push(this.buildBenchmarksSection(context?.industry, context?.naicsCode, context?.keywords));
    }

    // Pass 3: Earnings normalization - provide tax form guidance and SDE methodology
    if (passNumber === 3) {
      sections.push(this.buildTaxFormSection(context?.taxFormType));
      sections.push(this.buildSDEMethodologySection());
    }

    // Pass 4: Risk assessment - provide risk scoring criteria
    if (passNumber === 4) {
      sections.push(this.buildRiskScoringSection());
    }

    // Pass 5: Valuation calculation - provide comprehensive multiples
    if (passNumber === 5) {
      sections.push(this.buildValuationMultiplesSection(context?.industry, context?.naicsCode, context?.keywords));
      sections.push(this.buildCapRateBuildupSection());
    }

    // Pass 6: Narrative generation - provide output requirements
    if (passNumber === 6) {
      sections.push(this.buildNarrativeRequirementsSection());
    }

    // Handle dynamic knowledge requests
    if (requests.industry_specific?.length) {
      sections.push(this.buildDynamicIndustrySection(requests.industry_specific));
    }
    if (requests.tax_form_specific?.length) {
      sections.push(this.buildDynamicTaxFormSection(requests.tax_form_specific));
    }
    if (requests.risk_factors?.length) {
      sections.push(this.buildDynamicRiskSection(requests.risk_factors));
    }
    if (requests.benchmarks_needed?.length) {
      sections.push(this.buildDynamicBenchmarksSection(requests.benchmarks_needed, context));
    }

    return sections.filter(s => s.length > 0).join('\n\n---\n\n');
  }

  /**
   * Match industry from keywords
   */
  matchIndustry(keywords: string[]): string | null {
    for (const keyword of keywords) {
      const normalized = keyword.toLowerCase().trim();

      // Direct match
      if (INDUSTRY_KEYWORDS[normalized]) {
        return INDUSTRY_KEYWORDS[normalized];
      }

      // Partial match
      for (const [key, value] of Object.entries(INDUSTRY_KEYWORDS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          return value;
        }
      }
    }
    return null;
  }

  /**
   * Get all available industries
   */
  getAllIndustries(): string[] {
    return Object.keys(INDUSTRY_MULTIPLES);
  }

  /**
   * Get all sectors
   */
  getAllSectors(): string[] {
    return Object.keys(SECTOR_MULTIPLES);
  }

  // ========== PRIVATE SECTION BUILDERS ==========

  private buildTaxFormSection(formType?: string): string {
    let section = '## TAX FORM EXTRACTION GUIDANCE\n\n';

    if (formType) {
      const guide = this.getTaxFormGuide(formType);
      if (guide) {
        section += `### ${guide.name} (${guide.form_type})\n\n`;
        section += `**Entity Type:** ${guide.entity_type}\n\n`;
        section += '**Key Lines for Extraction:**\n';
        for (const line of guide.key_lines) {
          const addBackNote = line.add_back ? ' ⭐ ADD BACK' : '';
          section += `- **${line.line}**: ${line.description} → ${line.valuation_use}${addBackNote}\n`;
        }
        section += `\n**Balance Sheet Location:** ${guide.balance_sheet_location}\n\n`;
        section += '**Common SDE Add-Backs:**\n';
        for (const addBack of guide.common_add_backs) {
          section += `- ${addBack}\n`;
        }
        section += '\n**Watch Items:**\n';
        for (const item of guide.watch_items) {
          section += `- ⚠️ ${item}\n`;
        }
        return section;
      }
    }

    // Provide all form guides if no specific form
    section += 'Review the documents to determine form type, then apply appropriate extraction rules:\n\n';
    for (const [key, guide] of Object.entries(TAX_FORM_EXTRACTION)) {
      section += `### ${guide.form_type} - ${guide.name}\n`;
      section += `Entity Type: ${guide.entity_type}\n`;
      section += `Key Add-Back Lines: ${guide.key_lines.filter(l => l.add_back).map(l => l.line).join(', ')}\n\n`;
    }

    return section;
  }

  private buildIndustrySection(industry?: string, naicsCode?: string, keywords?: string[]): string {
    let section = '## INDUSTRY ANALYSIS DATA\n\n';

    // Try to find specific industry data
    const industryData = this.getIndustryMultiples(keywords || [], naicsCode);

    if (industryData) {
      section += `### ${industryData.industry}\n\n`;
      section += '**Valuation Multiples:**\n';
      section += `- SDE Multiple: ${industryData.sde_multiple}x (Range: ${industryData.sde_multiple_range.low}x - ${industryData.sde_multiple_range.high}x)\n`;
      section += `- Revenue Multiple: ${industryData.revenue_multiple}x (Range: ${industryData.revenue_multiple_range.low}x - ${industryData.revenue_multiple_range.high}x)\n`;
      if (industryData.ebitda_multiple) {
        section += `- EBITDA Multiple: ${industryData.ebitda_multiple}x\n`;
      }
      section += `- Median Asking Price: $${industryData.median_asking_price.toLocaleString()}\n\n`;

      section += '**Rules of Thumb:**\n';
      for (const rule of industryData.rules_of_thumb) {
        section += `- ${rule}\n`;
      }

      section += '\n**Valuation Notes:**\n';
      for (const note of industryData.valuation_notes) {
        section += `- ${note}\n`;
      }

      section += `\n**Typical Deal Structure:** ${industryData.typical_deal_structure}\n\n`;

      section += '**Key Value Drivers:**\n';
      for (const driver of industryData.key_value_drivers) {
        section += `- ✓ ${driver}\n`;
      }

      section += '\n**Red Flags:**\n';
      for (const flag of industryData.red_flags) {
        section += `- ⚠️ ${flag}\n`;
      }

      return section;
    }

    // Fall back to sector data
    const sectorData = this.getSectorMultiples(naicsCode || industry || 'service_businesses');
    if (sectorData) {
      section += `### ${sectorData.sector} Sector\n\n`;
      section += '**Sector-Level Multiples:**\n';
      section += `- SDE Multiple: ${sectorData.sde_multiple}x\n`;
      section += `- Revenue Multiple: ${sectorData.revenue_multiple}x\n`;
      section += `- Median Asking Price: $${sectorData.median_asking_price.toLocaleString()}\n`;
      section += `- Median Revenue: $${sectorData.median_revenue.toLocaleString()}\n`;
      section += `- Median Cash Flow: $${sectorData.median_cash_flow.toLocaleString()}\n\n`;
      section += '*Note: These are sector-level averages. Adjust based on specific business characteristics.*\n';
    }

    return section;
  }

  private buildBenchmarksSection(industry?: string, naicsCode?: string, keywords?: string[]): string {
    let section = '## INDUSTRY BENCHMARKS\n\n';

    const industryData = this.getIndustryMultiples(keywords || [], naicsCode);

    if (industryData?.industry_benchmarks) {
      const benchmarks = industryData.industry_benchmarks;
      section += `### ${industryData.industry} Benchmarks\n\n`;

      if (benchmarks.gross_margin) section += `- **Gross Margin:** ${benchmarks.gross_margin}\n`;
      if (benchmarks.operating_margin) section += `- **Operating Margin:** ${benchmarks.operating_margin}\n`;
      if (benchmarks.revenue_per_employee) section += `- **Revenue per Employee:** ${benchmarks.revenue_per_employee}\n`;

      if (benchmarks.other) {
        section += '\n**Additional Metrics:**\n';
        for (const [metric, value] of Object.entries(benchmarks.other)) {
          section += `- ${metric}: ${value}\n`;
        }
      }
    } else {
      section += 'General small business benchmarks:\n';
      section += '- Gross Margin: 40-60% (varies significantly by industry)\n';
      section += '- Operating Margin: 10-20%\n';
      section += '- SDE Margin: 15-25%\n';
      section += '- Owner compensation: $75,000-$150,000 market rate\n';
    }

    return section;
  }

  private buildSDEMethodologySection(): string {
    return `## SDE CALCULATION METHODOLOGY

### Seller's Discretionary Earnings (SDE) Formula:

\`\`\`
SDE = Net Income (from tax return)
    + Owner's Salary/Guaranteed Payments
    + Owner's Payroll Taxes (7.65% of salary)
    + Owner's Health Insurance
    + Owner's Retirement Contributions
    + Depreciation
    + Amortization
    + Interest Expense
    + Section 179 Expense
    + Personal Auto Expenses (typically 50% of vehicle expenses)
    + Personal Travel/Meals (typically 50%)
    + Family Member Above-Market Salaries
    + Charitable Contributions (if discretionary)
    + Home Office Deduction
    + One-Time/Non-Recurring Expenses
    − Non-Recurring Income
    − Investment Income (if non-operating)
    − Gain on Sale of Assets
\`\`\`

### EBITDA Calculation Formula:

\`\`\`
EBITDA = Net Income
       + Interest Expense
       + Income Taxes (C-Corp only)
       + Depreciation
       + Amortization
       + Owner Compensation Adjustment (if above market)
       + Other Normalizing Adjustments
\`\`\`

### Important Notes:
- SDE is preferred for owner-operated businesses under $5M
- EBITDA is used for larger businesses or those with management in place
- Always document source (line number) for each adjustment
- Verify add-backs don't double-count items
- Weight recent years more heavily (e.g., 50% current, 30% prior, 20% two years ago)`;
  }

  private buildRiskScoringSection(): string {
    let section = '## RISK ASSESSMENT FRAMEWORK\n\n';
    section += '### Risk Factor Scoring (1 = Low Risk, 5 = High Risk)\n\n';

    for (const [key, factor] of Object.entries(RISK_SCORING)) {
      section += `#### ${factor.name} (Weight: ${(factor.weight * 100).toFixed(0)}%)\n`;
      for (const [score, description] of Object.entries(factor.scores)) {
        section += `- **Score ${score}:** ${description}\n`;
      }
      section += '\n';
    }

    section += '### Risk Score to Multiple Adjustment\n\n';
    section += '| Weighted Score | Category | Multiple Adjustment |\n';
    section += '|----------------|----------|--------------------|\n';
    for (const [range, data] of Object.entries(RISK_MULTIPLE_ADJUSTMENTS)) {
      section += `| ${range} | ${data.category} | ${data.adjustment} |\n`;
    }

    return section;
  }

  private buildValuationMultiplesSection(industry?: string, naicsCode?: string, keywords?: string[]): string {
    let section = '## VALUATION MULTIPLES REFERENCE\n\n';

    // Specific industry if available
    const industryData = this.getIndustryMultiples(keywords || [], naicsCode);
    if (industryData) {
      section += `### Primary Reference: ${industryData.industry}\n\n`;
      section += `- **SDE Multiple:** ${industryData.sde_multiple}x (Range: ${industryData.sde_multiple_range.low}x - ${industryData.sde_multiple_range.high}x)\n`;
      section += `- **Revenue Multiple:** ${industryData.revenue_multiple}x (Range: ${industryData.revenue_multiple_range.low}x - ${industryData.revenue_multiple_range.high}x)\n`;
      if (industryData.ebitda_multiple) {
        section += `- **EBITDA Multiple:** ${industryData.ebitda_multiple}x\n`;
      }
      section += '\n';
    }

    // All sectors reference
    section += '### Sector Multiples Reference (BizBuySell 2025)\n\n';
    section += '| Sector | SDE Multiple | Revenue Multiple | Median Price |\n';
    section += '|--------|-------------|------------------|-------------|\n';
    for (const [key, data] of Object.entries(SECTOR_MULTIPLES)) {
      section += `| ${data.sector} | ${data.sde_multiple}x | ${data.revenue_multiple}x | $${(data.median_asking_price / 1000).toFixed(0)}K |\n`;
    }

    return section;
  }

  private buildCapRateBuildupSection(): string {
    return `## CAPITALIZATION RATE BUILD-UP METHOD

### Components:

1. **Risk-Free Rate:** Current 20-year Treasury yield (~4.0-4.5%)

2. **Equity Risk Premium:** Historical premium for equity over risk-free (~5.0-6.0%)

3. **Size Premium:** Small company premium based on market cap equivalent
   - Micro-cap (<$50M): 6-8%
   - Small business (<$10M): 8-12%
   - Very small (<$1M): 12-15%

4. **Industry Risk Premium:** Based on industry volatility and outlook
   - Stable industries (healthcare, essential services): 1-3%
   - Moderate industries (restaurants, retail): 3-5%
   - Volatile industries (tech, construction): 5-8%

5. **Company-Specific Risk Premium:** Based on risk assessment
   - Low risk (score 1-2): 0-2%
   - Average risk (score 2.5-3): 3-5%
   - High risk (score 3.5-5): 6-10%

### Total Discount Rate = Sum of all components (typically 25-40% for small businesses)

### Capitalization Rate = Discount Rate - Long-term Growth Rate
- Long-term growth rate typically 2-4% (inflation + modest growth)
- Cap rate typically 22-38% for small businesses

### Multiple from Cap Rate:
Multiple = 1 / Capitalization Rate
- 25% cap rate = 4.0x multiple
- 30% cap rate = 3.3x multiple
- 35% cap rate = 2.9x multiple`;
  }

  private buildNarrativeRequirementsSection(): string {
    return `## NARRATIVE SECTION REQUIREMENTS

### Executive Summary (Target: 800 words)
- Company overview and valuation conclusion
- Key financial highlights
- Primary value drivers and risks
- Recommended deal structure

### Company Overview (Target: 500 words)
- Business description and history
- Products/services offered
- Customer base and market served
- Competitive positioning

### Financial Analysis (Target: 1000 words)
- Revenue trends and analysis
- Profitability analysis
- SDE calculation explanation
- Balance sheet highlights
- Working capital analysis

### Industry Analysis (Target: 600 words)
- Industry overview and trends
- Competitive landscape
- Growth outlook
- Regulatory considerations

### Risk Assessment (Target: 700 words)
- Each major risk factor with evidence
- Mitigation strategies
- Overall risk conclusion
- Impact on valuation multiple

### Asset Approach Narrative (Target: 500 words)
- Methodology explanation
- Asset adjustments rationale
- Applicability and weight

### Income Approach Narrative (Target: 500 words)
- Methodology (capitalization of earnings)
- Benefit stream selection rationale
- Multiple selection and adjustments
- Sanity checks

### Market Approach Narrative (Target: 500 words)
- Comparable transaction methodology
- Data sources and selection
- Adjustments applied
- Indicated value discussion

### Valuation Synthesis (Target: 600 words)
- Reconciliation of approaches
- Weighting rationale
- Final value conclusion
- Confidence level discussion

### Assumptions and Limiting Conditions (Target: 400 words)
- Standard valuation assumptions
- Data limitations
- Scope limitations
- Extraordinary assumptions if any

### Value Enhancement Recommendations (Target: 500 words)
- Specific actionable recommendations
- Expected impact on value
- Implementation priorities`;
  }

  private buildDynamicIndustrySection(requests: string[]): string {
    let section = '## ADDITIONAL INDUSTRY INFORMATION\n\n';

    for (const request of requests) {
      const matched = this.matchIndustry([request]);
      if (matched && INDUSTRY_MULTIPLES[matched]) {
        const data = INDUSTRY_MULTIPLES[matched];
        section += `### ${data.industry}\n`;
        section += `SDE Multiple: ${data.sde_multiple}x | Revenue Multiple: ${data.revenue_multiple}x\n`;
        section += `Rules: ${data.rules_of_thumb.join('; ')}\n\n`;
      }
    }

    return section;
  }

  private buildDynamicTaxFormSection(requests: string[]): string {
    let section = '## ADDITIONAL TAX FORM GUIDANCE\n\n';

    for (const request of requests) {
      const guide = this.getTaxFormGuide(request);
      if (guide) {
        section += `### ${guide.form_type}\n`;
        section += `Add-backs: ${guide.common_add_backs.slice(0, 5).join(', ')}\n\n`;
      }
    }

    return section;
  }

  private buildDynamicRiskSection(requests: string[]): string {
    let section = '## ADDITIONAL RISK GUIDANCE\n\n';

    for (const request of requests) {
      const lower = request.toLowerCase();
      for (const [key, factor] of Object.entries(RISK_SCORING)) {
        if (lower.includes(key.replace('_', ' ')) || factor.name.toLowerCase().includes(lower)) {
          section += `### ${factor.name}\n`;
          section += `Weight: ${(factor.weight * 100).toFixed(0)}%\n`;
          for (const [score, desc] of Object.entries(factor.scores)) {
            section += `- Score ${score}: ${desc}\n`;
          }
          section += '\n';
        }
      }
    }

    return section;
  }

  private buildDynamicBenchmarksSection(
    requests: string[],
    context?: { industry?: string; naicsCode?: string; keywords?: string[] }
  ): string {
    let section = '## ADDITIONAL BENCHMARKS\n\n';

    const industryData = this.getIndustryMultiples(context?.keywords || [], context?.naicsCode);
    if (industryData?.industry_benchmarks) {
      section += `### ${industryData.industry}\n`;
      const bm = industryData.industry_benchmarks;
      if (bm.gross_margin) section += `- Gross Margin: ${bm.gross_margin}\n`;
      if (bm.operating_margin) section += `- Operating Margin: ${bm.operating_margin}\n`;
      if (bm.revenue_per_employee) section += `- Revenue/Employee: ${bm.revenue_per_employee}\n`;
    }

    return section;
  }
}

// Export singleton instance
export const knowledgeRouter = new KnowledgeRouter();

// Export data for direct access if needed
export {
  SECTOR_MULTIPLES,
  INDUSTRY_MULTIPLES,
  INDUSTRY_KEYWORDS,
  NAICS_TO_INDUSTRY,
  RISK_SCORING,
  RISK_MULTIPLE_ADJUSTMENTS,
  TAX_FORM_EXTRACTION,
};
