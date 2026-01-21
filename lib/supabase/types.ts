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
          report_status: 'pending' | 'processing' | 'extracting' | 'extraction_complete' | 'extraction_partial' | 'extraction_failed' | 'valuating' | 'valuation_failed' | 'completed' | 'failed' | 'error' | 'cancelled' | 'pass_1_processing' | 'pass_1_complete' | 'pass_2_processing' | 'pass_2_complete' | 'pass_3_processing' | 'pass_3_complete' | 'pass_4_processing' | 'pass_4_complete' | 'pass_5_processing' | 'pass_5_complete' | 'pass_6_processing' | 'pass_6_complete'
          report_data: Json | null
          executive_summary: string | null
          valuation_amount: number | null
          valuation_method: string | null
          processing_started_at: string | null
          processing_completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
          // Additional columns from actual schema
          current_pass: number | null
          file_ids: string[] | null
          openai_thread_id: string | null
          openai_run_id: string | null
          completed_at: string | null
          tokens_used: number | null
          processing_cost: number | null
          processing_time_ms: number | null
          // Progress tracking columns
          processing_progress: number | null
          processing_message: string | null
          // PDF storage
          pdf_path: string | null
        }
        Insert: {
          id?: string
          user_id: string
          document_id?: string | null
          company_name: string
          report_status?: 'pending' | 'processing' | 'extracting' | 'extraction_complete' | 'extraction_partial' | 'extraction_failed' | 'valuating' | 'valuation_failed' | 'completed' | 'failed' | 'error' | 'cancelled' | 'pass_1_processing' | 'pass_1_complete' | 'pass_2_processing' | 'pass_2_complete' | 'pass_3_processing' | 'pass_3_complete' | 'pass_4_processing' | 'pass_4_complete' | 'pass_5_processing' | 'pass_5_complete' | 'pass_6_processing' | 'pass_6_complete'
          report_data?: Json | null
          executive_summary?: string | null
          valuation_amount?: number | null
          valuation_method?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
          current_pass?: number | null
          file_ids?: string[] | null
          openai_thread_id?: string | null
          openai_run_id?: string | null
          completed_at?: string | null
          tokens_used?: number | null
          processing_cost?: number | null
          processing_time_ms?: number | null
          processing_progress?: number | null
          processing_message?: string | null
          pdf_path?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          document_id?: string | null
          company_name?: string
          report_status?: 'pending' | 'processing' | 'extracting' | 'extraction_complete' | 'extraction_partial' | 'extraction_failed' | 'valuating' | 'valuation_failed' | 'completed' | 'failed' | 'error' | 'cancelled' | 'pass_1_processing' | 'pass_1_complete' | 'pass_2_processing' | 'pass_2_complete' | 'pass_3_processing' | 'pass_3_complete' | 'pass_4_processing' | 'pass_4_complete' | 'pass_5_processing' | 'pass_5_complete' | 'pass_6_processing' | 'pass_6_complete'
          report_data?: Json | null
          executive_summary?: string | null
          valuation_amount?: number | null
          valuation_method?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
          current_pass?: number | null
          file_ids?: string[] | null
          openai_thread_id?: string | null
          openai_run_id?: string | null
          completed_at?: string | null
          tokens_used?: number | null
          processing_cost?: number | null
          processing_time_ms?: number | null
          processing_progress?: number | null
          processing_message?: string | null
          pdf_path?: string | null
        }
      }
      document_extractions: {
        Row: {
          id: string
          document_id: string
          report_id: string
          extracted_data: Json | null
          extraction_status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          report_id: string
          extracted_data?: Json | null
          extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          report_id?: string
          extracted_data?: Json | null
          extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
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
