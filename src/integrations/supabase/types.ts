export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      impressoras: {
        Row: {
          cinematica: string
          consumo_watts: number
          created_at: string
          custo_aquisicao: number
          custo_manutencao_mensal: number
          horas_uso_mensal: number
          id: string
          is_precadastrada: boolean
          max_filamentos: number
          nome: string
          user_id: string | null
          vida_util_horas: number
        }
        Insert: {
          cinematica?: string
          consumo_watts?: number
          created_at?: string
          custo_aquisicao?: number
          custo_manutencao_mensal?: number
          horas_uso_mensal?: number
          id?: string
          is_precadastrada?: boolean
          max_filamentos?: number
          nome: string
          user_id?: string | null
          vida_util_horas?: number
        }
        Update: {
          cinematica?: string
          consumo_watts?: number
          created_at?: string
          custo_aquisicao?: number
          custo_manutencao_mensal?: number
          horas_uso_mensal?: number
          id?: string
          is_precadastrada?: boolean
          max_filamentos?: number
          nome?: string
          user_id?: string | null
          vida_util_horas?: number
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          categoria_ia: string | null
          cidade: string | null
          created_at: string
          custo_depreciacao: number
          custo_embalagem: number
          custo_energia: number
          custo_manutencao: number
          custo_mao_de_obra: number
          custo_total: number
          distribuidora: string | null
          estado: string | null
          filamentos: Json
          horas_mao_de_obra: number | null
          id: string
          impressora_id: string | null
          impressora_nome: string
          lucro_liquido: number
          margem_lucro: number
          margem_maxima_ia: number | null
          margem_minima_ia: number | null
          margem_sugerida_ia: number | null
          modo_mao_de_obra: string
          nome_peca: string
          percentual_impostos: number
          percentual_mao_de_obra: number | null
          preco_minimo: number
          preco_sugerido: number
          tarifa_energia: number
          tempo_horas: number
          tempo_minutos: number
          tipo_embalagem: string
          user_id: string
          valor_hora_mao_de_obra: number | null
        }
        Insert: {
          categoria_ia?: string | null
          cidade?: string | null
          created_at?: string
          custo_depreciacao?: number
          custo_embalagem?: number
          custo_energia?: number
          custo_manutencao?: number
          custo_mao_de_obra?: number
          custo_total?: number
          distribuidora?: string | null
          estado?: string | null
          filamentos?: Json
          horas_mao_de_obra?: number | null
          id?: string
          impressora_id?: string | null
          impressora_nome?: string
          lucro_liquido?: number
          margem_lucro?: number
          margem_maxima_ia?: number | null
          margem_minima_ia?: number | null
          margem_sugerida_ia?: number | null
          modo_mao_de_obra?: string
          nome_peca: string
          percentual_impostos?: number
          percentual_mao_de_obra?: number | null
          preco_minimo?: number
          preco_sugerido?: number
          tarifa_energia?: number
          tempo_horas?: number
          tempo_minutos?: number
          tipo_embalagem?: string
          user_id: string
          valor_hora_mao_de_obra?: number | null
        }
        Update: {
          categoria_ia?: string | null
          cidade?: string | null
          created_at?: string
          custo_depreciacao?: number
          custo_embalagem?: number
          custo_energia?: number
          custo_manutencao?: number
          custo_mao_de_obra?: number
          custo_total?: number
          distribuidora?: string | null
          estado?: string | null
          filamentos?: Json
          horas_mao_de_obra?: number | null
          id?: string
          impressora_id?: string | null
          impressora_nome?: string
          lucro_liquido?: number
          margem_lucro?: number
          margem_maxima_ia?: number | null
          margem_minima_ia?: number | null
          margem_sugerida_ia?: number | null
          modo_mao_de_obra?: string
          nome_peca?: string
          percentual_impostos?: number
          percentual_mao_de_obra?: number | null
          preco_minimo?: number
          preco_sugerido?: number
          tarifa_energia?: number
          tempo_horas?: number
          tempo_minutos?: number
          tipo_embalagem?: string
          user_id?: string
          valor_hora_mao_de_obra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_impressora_id_fkey"
            columns: ["impressora_id"]
            isOneToOne: false
            referencedRelation: "impressoras"
            referencedColumns: ["id"]
          },
        ]
      }
      printers: {
        Row: {
          acquisition_cost: number
          created_at: string
          id: string
          is_preset: boolean
          kinematics: string
          lifespan: number
          maintenance_cost_monthly: number
          max_filaments: number
          monthly_usage_hours: number
          name: string
          power_consumption: number
          user_id: string
        }
        Insert: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          is_preset?: boolean
          kinematics: string
          lifespan?: number
          maintenance_cost_monthly?: number
          max_filaments?: number
          monthly_usage_hours?: number
          name: string
          power_consumption?: number
          user_id: string
        }
        Update: {
          acquisition_cost?: number
          created_at?: string
          id?: string
          is_preset?: boolean
          kinematics?: string
          lifespan?: number
          maintenance_cost_monthly?: number
          max_filaments?: number
          monthly_usage_hours?: number
          name?: string
          power_consumption?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          greenn_assinatura_id: string | null
          id: string
          nome: string
          plano: string
          plano_expiracao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          greenn_assinatura_id?: string | null
          id?: string
          nome?: string
          plano?: string
          plano_expiracao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          greenn_assinatura_id?: string | null
          id?: string
          nome?: string
          plano?: string
          plano_expiracao?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          city: string | null
          created_at: string
          depreciation_cost: number
          distributor: string | null
          energy_cost: number
          filaments: Json
          id: string
          labor_cost: number
          labor_hours: number
          labor_percentage: number
          labor_rate: number
          maintenance_cost: number
          minimum_price: number
          packaging_cost: number
          packaging_type: string
          piece_name: string
          print_time_hours: number
          print_time_minutes: number
          printer_id: string
          printer_name: string
          profit_margin: number
          state: string | null
          suggested_price: number
          tariff: number
          tax_rate: number
          total_cost: number
          total_filament_cost: number
          total_weight: number
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          depreciation_cost?: number
          distributor?: string | null
          energy_cost?: number
          filaments?: Json
          id?: string
          labor_cost?: number
          labor_hours?: number
          labor_percentage?: number
          labor_rate?: number
          maintenance_cost?: number
          minimum_price?: number
          packaging_cost?: number
          packaging_type?: string
          piece_name: string
          print_time_hours?: number
          print_time_minutes?: number
          printer_id: string
          printer_name: string
          profit_margin?: number
          state?: string | null
          suggested_price?: number
          tariff?: number
          tax_rate?: number
          total_cost?: number
          total_filament_cost?: number
          total_weight?: number
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          depreciation_cost?: number
          distributor?: string | null
          energy_cost?: number
          filaments?: Json
          id?: string
          labor_cost?: number
          labor_hours?: number
          labor_percentage?: number
          labor_rate?: number
          maintenance_cost?: number
          minimum_price?: number
          packaging_cost?: number
          packaging_type?: string
          piece_name?: string
          print_time_hours?: number
          print_time_minutes?: number
          printer_id?: string
          printer_name?: string
          profit_margin?: number
          state?: string | null
          suggested_price?: number
          tariff?: number
          tax_rate?: number
          total_cost?: number
          total_filament_cost?: number
          total_weight?: number
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          default_city: string | null
          default_margin: number
          default_printer_id: string | null
          default_state: string | null
          default_tariff: number
          default_tax_rate: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_city?: string | null
          default_margin?: number
          default_printer_id?: string | null
          default_state?: string | null
          default_tariff?: number
          default_tax_rate?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_city?: string | null
          default_margin?: number
          default_printer_id?: string | null
          default_state?: string | null
          default_tariff?: number
          default_tax_rate?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
