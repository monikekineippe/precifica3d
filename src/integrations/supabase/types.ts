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
      cash_transactions: {
        Row: {
          amount: number
          auto_inventory_update: boolean | null
          category: string | null
          created_at: string
          description: string
          encomenda_id: string | null
          encomenda_pagamento_id: string | null
          id: string
          inventory_data: Json | null
          payment_method: string | null
          sale_id: string | null
          transaction_date: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_inventory_update?: boolean | null
          category?: string | null
          created_at?: string
          description: string
          encomenda_id?: string | null
          encomenda_pagamento_id?: string | null
          id?: string
          inventory_data?: Json | null
          payment_method?: string | null
          sale_id?: string | null
          transaction_date?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_inventory_update?: boolean | null
          category?: string | null
          created_at?: string
          description?: string
          encomenda_id?: string | null
          encomenda_pagamento_id?: string | null
          id?: string
          inventory_data?: Json | null
          payment_method?: string | null
          sale_id?: string | null
          transaction_date?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_encomenda_pagamento_id_fkey"
            columns: ["encomenda_pagamento_id"]
            isOneToOne: false
            referencedRelation: "encomenda_pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          preferred_channel: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          preferred_channel?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          preferred_channel?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      encomenda_pagamentos: {
        Row: {
          cash_transaction_id: string | null
          created_at: string
          data_pagamento: string
          encomenda_id: string
          forma_pagamento: string
          id: string
          observacao: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          cash_transaction_id?: string | null
          created_at?: string
          data_pagamento?: string
          encomenda_id: string
          forma_pagamento?: string
          id?: string
          observacao?: string | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          cash_transaction_id?: string | null
          created_at?: string
          data_pagamento?: string
          encomenda_id?: string
          forma_pagamento?: string
          id?: string
          observacao?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "encomenda_pagamentos_encomenda_id_fkey"
            columns: ["encomenda_id"]
            isOneToOne: false
            referencedRelation: "encomendas"
            referencedColumns: ["id"]
          },
        ]
      }
      encomendas: {
        Row: {
          cliente_nome: string
          codigo: string
          created_at: string
          data_encomenda: string
          data_entrega: string | null
          descricao: string | null
          estoque_deduzido: boolean
          id: string
          inventory_item_id: string | null
          observacoes: string | null
          produto: string
          quantidade: number
          sinal_recebido: boolean
          sinal_valor: number
          status: string
          updated_at: string
          user_id: string
          valor_total: number
          whatsapp: string | null
        }
        Insert: {
          cliente_nome: string
          codigo: string
          created_at?: string
          data_encomenda?: string
          data_entrega?: string | null
          descricao?: string | null
          estoque_deduzido?: boolean
          id?: string
          inventory_item_id?: string | null
          observacoes?: string | null
          produto: string
          quantidade?: number
          sinal_recebido?: boolean
          sinal_valor?: number
          status?: string
          updated_at?: string
          user_id: string
          valor_total?: number
          whatsapp?: string | null
        }
        Update: {
          cliente_nome?: string
          codigo?: string
          created_at?: string
          data_encomenda?: string
          data_entrega?: string | null
          descricao?: string | null
          estoque_deduzido?: boolean
          id?: string
          inventory_item_id?: string | null
          observacoes?: string | null
          produto?: string
          quantidade?: number
          sinal_recebido?: boolean
          sinal_valor?: number
          status?: string
          updated_at?: string
          user_id?: string
          valor_total?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      eventos_uso: {
        Row: {
          created_at: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
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
      inventory: {
        Row: {
          brand: string | null
          category: string
          color: string | null
          cost_per_unit: number
          created_at: string
          id: string
          last_purchase_date: string | null
          min_stock: number
          name: string
          quantity: number
          sale_price: number
          type: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string
          color?: string | null
          cost_per_unit?: number
          created_at?: string
          id?: string
          last_purchase_date?: string | null
          min_stock?: number
          name: string
          quantity?: number
          sale_price?: number
          type?: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          color?: string | null
          cost_per_unit?: number
          created_at?: string
          id?: string
          last_purchase_date?: string | null
          min_stock?: number
          name?: string
          quantity?: number
          sale_price?: number
          type?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          acessorios: Json | null
          categoria_ia: string | null
          cidade: string | null
          created_at: string
          custo_acessorios: number | null
          custo_depreciacao: number
          custo_embalagem: number
          custo_energia: number
          custo_manutencao: number
          custo_mao_de_obra: number
          custo_total: number
          distribuidora: string | null
          embalagem_custo: number | null
          embalagem_estoque_id: string | null
          embalagem_quantidade: number | null
          estado: string | null
          filamento_estoque_id: string | null
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
          quantidade_embalagem: number | null
          tarifa_energia: number
          tempo_horas: number
          tempo_minutos: number
          tipo_embalagem: string
          user_id: string
          valor_hora_mao_de_obra: number | null
        }
        Insert: {
          acessorios?: Json | null
          categoria_ia?: string | null
          cidade?: string | null
          created_at?: string
          custo_acessorios?: number | null
          custo_depreciacao?: number
          custo_embalagem?: number
          custo_energia?: number
          custo_manutencao?: number
          custo_mao_de_obra?: number
          custo_total?: number
          distribuidora?: string | null
          embalagem_custo?: number | null
          embalagem_estoque_id?: string | null
          embalagem_quantidade?: number | null
          estado?: string | null
          filamento_estoque_id?: string | null
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
          quantidade_embalagem?: number | null
          tarifa_energia?: number
          tempo_horas?: number
          tempo_minutos?: number
          tipo_embalagem?: string
          user_id: string
          valor_hora_mao_de_obra?: number | null
        }
        Update: {
          acessorios?: Json | null
          categoria_ia?: string | null
          cidade?: string | null
          created_at?: string
          custo_acessorios?: number | null
          custo_depreciacao?: number
          custo_embalagem?: number
          custo_energia?: number
          custo_manutencao?: number
          custo_mao_de_obra?: number
          custo_total?: number
          distribuidora?: string | null
          embalagem_custo?: number | null
          embalagem_estoque_id?: string | null
          embalagem_quantidade?: number | null
          estado?: string | null
          filamento_estoque_id?: string | null
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
          quantidade_embalagem?: number | null
          tarifa_energia?: number
          tempo_horas?: number
          tempo_minutos?: number
          tipo_embalagem?: string
          user_id?: string
          valor_hora_mao_de_obra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_embalagem_estoque_id_fkey"
            columns: ["embalagem_estoque_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
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
          instagram: string
          is_admin: boolean
          nome: string
          plano: string
          plano_expiracao: string | null
          primary_printer_id: string | null
          telefone: string
          ultimo_acesso: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          greenn_assinatura_id?: string | null
          id?: string
          instagram?: string
          is_admin?: boolean
          nome?: string
          plano?: string
          plano_expiracao?: string | null
          primary_printer_id?: string | null
          telefone?: string
          ultimo_acesso?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          greenn_assinatura_id?: string | null
          id?: string
          instagram?: string
          is_admin?: boolean
          nome?: string
          plano?: string
          plano_expiracao?: string | null
          primary_printer_id?: string | null
          telefone?: string
          ultimo_acesso?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_primary_printer_id_fkey"
            columns: ["primary_printer_id"]
            isOneToOne: false
            referencedRelation: "impressoras"
            referencedColumns: ["id"]
          },
        ]
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
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string | null
          discount_amount: number | null
          gross_value: number | null
          id: string
          inventory_item_id: string | null
          net_value: number | null
          notes: string | null
          orcamento_id: string | null
          origin_channel: string | null
          payment_fee_amount: number | null
          payment_fee_percent: number | null
          payment_method: string | null
          product_cost: number | null
          profit_amount: number | null
          profit_margin_percent: number | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          gross_value?: number | null
          id?: string
          inventory_item_id?: string | null
          net_value?: number | null
          notes?: string | null
          orcamento_id?: string | null
          origin_channel?: string | null
          payment_fee_amount?: number | null
          payment_fee_percent?: number | null
          payment_method?: string | null
          product_cost?: number | null
          profit_amount?: number | null
          profit_margin_percent?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          gross_value?: number | null
          id?: string
          inventory_item_id?: string | null
          net_value?: number | null
          notes?: string | null
          orcamento_id?: string | null
          origin_channel?: string | null
          payment_fee_amount?: number | null
          payment_fee_percent?: number | null
          payment_method?: string | null
          product_cost?: number | null
          profit_amount?: number | null
          profit_margin_percent?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          card_fee_percent: number
          created_at: string
          default_city: string | null
          default_margin: number
          default_printer_id: string | null
          default_state: string | null
          default_tariff: number
          default_tax_rate: number
          id: string
          max_installments: number
          monthly_revenue_goal: number | null
          pix_discount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_fee_percent?: number
          created_at?: string
          default_city?: string | null
          default_margin?: number
          default_printer_id?: string | null
          default_state?: string | null
          default_tariff?: number
          default_tax_rate?: number
          id?: string
          max_installments?: number
          monthly_revenue_goal?: number | null
          pix_discount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_fee_percent?: number
          created_at?: string
          default_city?: string | null
          default_margin?: number
          default_printer_id?: string | null
          default_state?: string | null
          default_tariff?: number
          default_tax_rate?: number
          id?: string
          max_installments?: number
          monthly_revenue_goal?: number | null
          pix_discount?: number
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
