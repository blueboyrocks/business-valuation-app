export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          report_id: string | null
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          company_name: string | null
          upload_status: 'pending' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id?: string | null
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          company_name?: string | null
          upload_status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          company_name?: string | null
          upload_status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          document_id: string | null
          company_name: string
          report_status: 'pending' | 'processing' | 'extracting' | 'extraction_complete' | 'extraction_partial' | 'extraction_failed' | 'valuating' | 'valuation_failed' | 'completed' | 'failed' | 'error' | 'cancelled'
          report_data: Json | null
          executive_summary: string | null
          valuation_amount: number | null
          valuation_method: string | null
          processing_started_at: string | null
          processing_completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          document_id?: string | null
          company_name: string
          report_status?: 'pending' | 'processing' | 'extracting' | 'extraction_complete' | 'extraction_partial' | 'extraction_failed' | 'valuating' | 'valuation_failed' | 'completed' | 'failed' | 'error' | 'cancelled'
          report_data?: Json | null
          executive_summary?: string | null
          valuation_amount?: number | null
          valuation_method?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string | null
          company_name?: string
          report_status?: 'pending' | 'processing' | 'extracting' | 'extraction_complete' | 'extraction_partial' | 'extraction_failed' | 'valuating' | 'valuation_failed' | 'completed' | 'failed' | 'error' | 'cancelled'
          report_data?: Json | null
          executive_summary?: string | null
          valuation_amount?: number | null
          valuation_method?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          report_id: string | null
          amount: number
          currency: string
          payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded'
          payment_provider: string | null
          payment_provider_id: string | null
          payment_method: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id?: string | null
          amount: number
          currency?: string
          payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          payment_provider?: string | null
          payment_provider_id?: string | null
          payment_method?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string | null
          amount?: number
          currency?: string
          payment_status?: 'pending' | 'succeeded' | 'failed' | 'refunded'
          payment_provider?: string | null
          payment_provider_id?: string | null
          payment_method?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
