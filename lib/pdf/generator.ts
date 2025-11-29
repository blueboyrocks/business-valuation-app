import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface ReportData {
  valuation_amount?: number;
  valuation_range_low?: number;
  valuation_range_high?: number;
  valuation_method?: string;
  valuation_date?: string;
  standard_of_value?: string;
  confidence_level?: string;
  premise_of_value?: string;
  
  asset_approach_value?: number;
  income_approach_value?: number;
  market_approach_value?: number;
  asset_approach_weight?: number;
  income_approach_weight?: number;
  market_approach_weight?: number;
  
  industry_name?: string;
  industry_naics_code?: string;
  revenue_multiple_used?: number;
  ebitda_multiple_used?: number;
  sde_multiple_used?: number;
  annual_revenue?: number;
  normalized_ebitda?: number;
  normalized_sde?: number;
  
  executive_summary?: string;
  key_findings?: string[];
  company_profile?: string;
  financial_analysis?: string;
  industry_analysis?: string;
  
  asset_approach_analysis?: string;
  income_approach_analysis?: string;
  market_approach_analysis?: string;
  valuation_reconciliation?: string;
  discounts_and_premiums?: string;
  
  risk_assessment?: string;
  critical_risk_factors?: string[];
  strategic_insights?: string;
  value_enhancement_recommendations?: string[];
  
  assumptions_and_limiting_conditions?: string;
  data_sources?: string;
  methodology_compliance?: string;
  
  [key: string]: any;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;
  
  // Colors
  private colors = {
    primary: [30, 64, 175] as [number, number, number],
    primaryLight: [59, 130, 246] as [number, number, number],
    secondary: [51, 65, 85] as [number, number, number],
    text: [30, 41, 59] as [number, number, number],
    textLight: [100, 116, 139] as [number, number, number],
    background: [248, 250, 252] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };
  
  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter',
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 54; // 0.75 inch
    this.currentY = this.margin;
    this.lineHeight = 14;
  }
  
  private formatCurrency(amount: number | null | undefined): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  private formatPercent(value: number | null | undefined): string {
    if (!value) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  }
  
  private checkPageBreak(neededSpace: number = 100) {
    if (this.currentY + neededSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addPageNumber();
    }
  }
  
  private addPageNumber() {
    const pageCount = this.doc.getNumberOfPages();
    this.doc.setFontSize(9);
    this.doc.setTextColor(...this.colors.textLight);
    this.doc.text(
      `Page ${pageCount}`,
      this.pageWidth / 2,
      this.pageHeight - 30,
      { align: 'center' }
    );
  }
  
  private addCoverPage(companyName: string, reportData: ReportData, generatedDate: string) {
    // Gradient background (simulated with rectangles)
    this.doc.setFillColor(...this.colors.primary);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Title
    this.doc.setTextColor(...this.colors.white);
    this.doc.setFontSize(42);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Business Valuation Report', this.pageWidth / 2, 180, { align: 'center' });
    
    // Company name
    this.doc.setFontSize(28);
    this.doc.text(companyName, this.pageWidth / 2, 240, { align: 'center' });
    
    // Value box
    const boxWidth = 320;
    const boxHeight = 140;
    const boxX = (this.pageWidth - boxWidth) / 2;
    const boxY = 300;
    
    this.doc.setFillColor(255, 255, 255, 0.15);
    this.doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 8, 8, 'F');
    
    this.doc.setFontSize(12);
    this.doc.text('ESTIMATED VALUE', this.pageWidth / 2, boxY + 30, { align: 'center' });
    
    this.doc.setFontSize(36);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      this.formatCurrency(reportData.valuation_amount),
      this.pageWidth / 2,
      boxY + 70,
      { align: 'center' }
    );
    
    if (reportData.valuation_range_low && reportData.valuation_range_high) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Range: ${this.formatCurrency(reportData.valuation_range_low)} - ${this.formatCurrency(reportData.valuation_range_high)}`,
        this.pageWidth / 2,
        boxY + 100,
        { align: 'center' }
      );
    }
    
    // Date
    this.doc.setFontSize(11);
    this.doc.text(`Generated on ${generatedDate}`, this.pageWidth / 2, 480, { align: 'center' });
    
    // Footer
    this.doc.setFontSize(9);
    this.doc.text('CONFIDENTIAL BUSINESS VALUATION ANALYSIS', this.pageWidth / 2, this.pageHeight - 60, { align: 'center' });
  }
  
  private addSectionTitle(title: string) {
    this.checkPageBreak(60);
    
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.colors.primary);
    this.doc.text(title, this.margin, this.currentY);
    
    // Underline
    this.currentY += 5;
    this.doc.setDrawColor(...this.colors.primaryLight);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 20;
  }
  
  private addSubsectionTitle(title: string) {
    this.checkPageBreak(40);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.text(title, this.margin, this.currentY);
    
    this.currentY += 16;
  }
  
  private addParagraph(text: string) {
    if (!text) return;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.colors.text);
    
    const maxWidth = this.pageWidth - 2 * this.margin;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      this.checkPageBreak(this.lineHeight);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    }
    
    this.currentY += 8;
  }
  
  private addList(items: string[]) {
    if (!items || items.length === 0) return;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...this.colors.text);
    
    const maxWidth = this.pageWidth - 2 * this.margin - 20;
    
    items.forEach((item, index) => {
      const lines = this.doc.splitTextToSize(item, maxWidth);
      this.checkPageBreak(this.lineHeight * lines.length + 4);
      
      // Bullet point
      this.doc.circle(this.margin + 5, this.currentY - 3, 2, 'F');
      
      // Text
      lines.forEach((line: string, lineIndex: number) => {
        this.doc.text(line, this.margin + 15, this.currentY);
        this.currentY += this.lineHeight;
      });
      
      this.currentY += 4;
    });
    
    this.currentY += 8;
  }
  
  private addHighlightBox(data: { label: string; value: string }[]) {
    const boxHeight = data.length * 30 + 20;
    this.checkPageBreak(boxHeight + 20);
    
    // Background
    this.doc.setFillColor(...this.colors.background);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 4, 4, 'F');
    
    // Border
    this.doc.setDrawColor(...this.colors.primaryLight);
    this.doc.setLineWidth(1);
    this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, boxHeight, 4, 4, 'S');
    
    let yOffset = this.currentY + 20;
    
    data.forEach((item, index) => {
      // Label
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.primary);
      this.doc.text(item.label.toUpperCase(), this.margin + 15, yOffset);
      
      // Value
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(item.value, this.pageWidth - this.margin - 15, yOffset, { align: 'right' });
      
      yOffset += 30;
    });
    
    this.currentY += boxHeight + 20;
  }
  
  private addValuationTable(reportData: ReportData) {
    if (!reportData.asset_approach_value || !reportData.income_approach_value || !reportData.market_approach_value) {
      return;
    }
    
    this.checkPageBreak(150);
    
    const tableData = [
      [
        'Asset Approach',
        this.formatCurrency(reportData.asset_approach_value),
        this.formatPercent(reportData.asset_approach_weight),
        this.formatCurrency(reportData.asset_approach_value * (reportData.asset_approach_weight || 0))
      ],
      [
        'Income Approach',
        this.formatCurrency(reportData.income_approach_value),
        this.formatPercent(reportData.income_approach_weight),
        this.formatCurrency(reportData.income_approach_value * (reportData.income_approach_weight || 0))
      ],
      [
        'Market Approach',
        this.formatCurrency(reportData.market_approach_value),
        this.formatPercent(reportData.market_approach_weight),
        this.formatCurrency(reportData.market_approach_value * (reportData.market_approach_weight || 0))
      ],
    ];
    
    this.doc.autoTable({
      startY: this.currentY,
      head: [['Approach', 'Value', 'Weight', 'Weighted Value']],
      body: tableData,
      foot: [['Final Valuation (Weighted Average)', '', '', this.formatCurrency(reportData.valuation_amount)]],
      theme: 'grid',
      headStyles: {
        fillColor: this.colors.background,
        textColor: this.colors.text,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: this.colors.text,
      },
      footStyles: {
        fillColor: [219, 234, 254],
        textColor: this.colors.primary,
        fontStyle: 'bold',
        fontSize: 11,
      },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = this.doc.lastAutoTable.finalY + 20;
  }
  
  private addInfoGrid(items: { label: string; value: string; subtext?: string }[]) {
    if (items.length === 0) return;
    
    const boxWidth = (this.pageWidth - 2 * this.margin - 20) / 3;
    const boxHeight = 60;
    let xOffset = this.margin;
    
    this.checkPageBreak(boxHeight + 20);
    
    items.forEach((item, index) => {
      if (index > 0 && index % 3 === 0) {
        this.currentY += boxHeight + 10;
        xOffset = this.margin;
        this.checkPageBreak(boxHeight + 20);
      }
      
      // Box background
      this.doc.setFillColor(...this.colors.background);
      this.doc.roundedRect(xOffset, this.currentY, boxWidth - 5, boxHeight, 4, 4, 'F');
      
      // Label
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.textLight);
      this.doc.text(item.label.toUpperCase(), xOffset + 10, this.currentY + 15);
      
      // Value
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...this.colors.text);
      this.doc.text(item.value, xOffset + 10, this.currentY + 35);
      
      // Subtext
      if (item.subtext) {
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(...this.colors.textLight);
        this.doc.text(item.subtext, xOffset + 10, this.currentY + 50);
      }
      
      xOffset += boxWidth + 5;
    });
    
    this.currentY += boxHeight + 20;
  }
  
  public generate(companyName: string, reportData: ReportData, generatedDate: string): jsPDF {
    // Cover Page
    this.addCoverPage(companyName, reportData, generatedDate);
    
    // Start content pages
    this.doc.addPage();
    this.currentY = this.margin;
    this.addPageNumber();
    
    // Executive Summary
    this.addSectionTitle('Executive Summary');
    
    this.addHighlightBox([
      { label: 'Concluded Value', value: this.formatCurrency(reportData.valuation_amount) },
      { label: 'Value Range', value: `${this.formatCurrency(reportData.valuation_range_low)} - ${this.formatCurrency(reportData.valuation_range_high)}` },
      { label: 'Valuation Date', value: reportData.valuation_date || generatedDate },
      { label: 'Standard of Value', value: reportData.standard_of_value || 'Fair Market Value' },
    ]);
    
    if (reportData.executive_summary) {
      this.addParagraph(reportData.executive_summary);
    }
    
    if (reportData.key_findings && reportData.key_findings.length > 0) {
      this.addSubsectionTitle('Key Findings');
      this.addList(reportData.key_findings);
    }
    
    // Valuation Summary
    this.doc.addPage();
    this.currentY = this.margin;
    this.addPageNumber();
    
    this.addSectionTitle('Valuation Summary');
    
    this.addSubsectionTitle('Valuation Methodology');
    this.addParagraph(
      reportData.valuation_method ||
      'This valuation was conducted using a weighted average of three standard valuation approaches: Asset Approach, Income Approach, and Market Approach.'
    );
    
    this.addSubsectionTitle('Valuation Approaches Breakdown');
    this.addValuationTable(reportData);
    
    // Industry & Multiples
    const infoItems = [];
    if (reportData.industry_name) {
      infoItems.push({
        label: 'Industry',
        value: reportData.industry_name,
        subtext: reportData.industry_naics_code ? `NAICS: ${reportData.industry_naics_code}` : undefined,
      });
    }
    if (reportData.revenue_multiple_used) {
      infoItems.push({
        label: 'Revenue Multiple',
        value: `${reportData.revenue_multiple_used.toFixed(2)}x`,
        subtext: reportData.annual_revenue ? this.formatCurrency(reportData.annual_revenue) : undefined,
      });
    }
    if (reportData.ebitda_multiple_used) {
      infoItems.push({
        label: 'EBITDA Multiple',
        value: `${reportData.ebitda_multiple_used.toFixed(2)}x`,
        subtext: reportData.normalized_ebitda ? this.formatCurrency(reportData.normalized_ebitda) : undefined,
      });
    }
    
    if (infoItems.length > 0) {
      this.addSubsectionTitle('Industry Classification & Multiples');
      this.addInfoGrid(infoItems);
    }
    
    // Company Profile
    if (reportData.company_profile) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addPageNumber();
      this.addSectionTitle('Company Profile');
      this.addParagraph(reportData.company_profile);
    }
    
    // Financial Analysis
    if (reportData.financial_analysis) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addPageNumber();
      this.addSectionTitle('Financial Analysis');
      this.addParagraph(reportData.financial_analysis);
      
      if (reportData.industry_analysis) {
        this.addSubsectionTitle('Industry Analysis');
        this.addParagraph(reportData.industry_analysis);
      }
    }
    
    // Valuation Analysis
    this.doc.addPage();
    this.currentY = this.margin;
    this.addPageNumber();
    this.addSectionTitle('Valuation Analysis');
    
    if (reportData.asset_approach_analysis) {
      this.addSubsectionTitle('Asset Approach');
      this.addParagraph(`Indicated Value: ${this.formatCurrency(reportData.asset_approach_value)}`);
      this.addParagraph(reportData.asset_approach_analysis);
    }
    
    if (reportData.income_approach_analysis) {
      this.addSubsectionTitle('Income Approach');
      this.addParagraph(`Indicated Value: ${this.formatCurrency(reportData.income_approach_value)}`);
      this.addParagraph(reportData.income_approach_analysis);
    }
    
    if (reportData.market_approach_analysis) {
      this.addSubsectionTitle('Market Approach');
      this.addParagraph(`Indicated Value: ${this.formatCurrency(reportData.market_approach_value)}`);
      this.addParagraph(reportData.market_approach_analysis);
    }
    
    if (reportData.valuation_reconciliation) {
      this.addSubsectionTitle('Valuation Reconciliation');
      this.addParagraph(reportData.valuation_reconciliation);
    }
    
    if (reportData.discounts_and_premiums) {
      this.addSubsectionTitle('Discounts and Premiums');
      this.addParagraph(reportData.discounts_and_premiums);
    }
    
    // Risk Assessment
    if (reportData.risk_assessment) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addPageNumber();
      this.addSectionTitle('Risk Assessment');
      this.addParagraph(reportData.risk_assessment);
      
      if (reportData.critical_risk_factors && reportData.critical_risk_factors.length > 0) {
        this.addSubsectionTitle('Critical Risk Factors');
        this.addList(reportData.critical_risk_factors);
      }
    }
    
    // Strategic Insights
    if (reportData.strategic_insights) {
      this.doc.addPage();
      this.currentY = this.margin;
      this.addPageNumber();
      this.addSectionTitle('Strategic Insights & Recommendations');
      this.addParagraph(reportData.strategic_insights);
      
      if (reportData.value_enhancement_recommendations && reportData.value_enhancement_recommendations.length > 0) {
        this.addSubsectionTitle('Value Enhancement Recommendations');
        this.addList(reportData.value_enhancement_recommendations);
      }
    }
    
    // Appendices
    this.doc.addPage();
    this.currentY = this.margin;
    this.addPageNumber();
    this.addSectionTitle('Appendices');
    
    if (reportData.assumptions_and_limiting_conditions) {
      this.addSubsectionTitle('Assumptions and Limiting Conditions');
      this.doc.setFontSize(9);
      this.addParagraph(reportData.assumptions_and_limiting_conditions);
      this.doc.setFontSize(10);
    }
    
    if (reportData.data_sources) {
      this.addSubsectionTitle('Data Sources');
      this.doc.setFontSize(9);
      this.addParagraph(reportData.data_sources);
      this.doc.setFontSize(10);
    }
    
    if (reportData.methodology_compliance) {
      this.addSubsectionTitle('Methodology Compliance');
      this.doc.setFontSize(9);
      this.addParagraph(reportData.methodology_compliance);
      this.doc.setFontSize(10);
    }
    
    return this.doc;
  }
}
