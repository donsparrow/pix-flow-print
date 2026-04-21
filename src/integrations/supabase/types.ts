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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          imagem_url: string | null
          nome: string
          ordem: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome: string
          ordem?: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          ordem?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      comprovantes: {
        Row: {
          arquivo_url: string
          created_at: string
          id: string
          observacao: string | null
          pedido_id: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprovantes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          descricao: string | null
          publica: boolean
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          descricao?: string | null
          publica?: boolean
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          descricao?: string | null
          publica?: boolean
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      depoimentos: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          created_at: string
          id: string
          nome: string
          nota: number
          ordem: number
          texto: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome: string
          nota: number
          ordem?: number
          texto: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          nome?: string
          nota?: number
          ordem?: number
          texto?: string
          updated_at?: string
        }
        Relationships: []
      }
      itens_pedido: {
        Row: {
          created_at: string
          id: string
          pedido_id: string
          preco_unitario: number
          produto_id: string | null
          produto_imagem: string | null
          produto_nome: string
          quantidade: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          pedido_id: string
          preco_unitario: number
          produto_id?: string | null
          produto_imagem?: string | null
          produto_nome: string
          quantidade: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string | null
          produto_imagem?: string | null
          produto_nome?: string
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_bairro: string | null
          cliente_cep: string | null
          cliente_cidade: string | null
          cliente_complemento: string | null
          cliente_email: string | null
          cliente_endereco: string | null
          cliente_estado: string | null
          cliente_nome: string
          cliente_numero: string | null
          cliente_telefone: string
          codigo: string
          created_at: string
          id: string
          metodo_frete: Database["public"]["Enums"]["shipping_method"]
          observacoes: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          valor_frete: number
          valor_produtos: number
          valor_total: number
        }
        Insert: {
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_complemento?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_estado?: string | null
          cliente_nome: string
          cliente_numero?: string | null
          cliente_telefone: string
          codigo: string
          created_at?: string
          id?: string
          metodo_frete: Database["public"]["Enums"]["shipping_method"]
          observacoes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          valor_frete?: number
          valor_produtos?: number
          valor_total?: number
        }
        Update: {
          cliente_bairro?: string | null
          cliente_cep?: string | null
          cliente_cidade?: string | null
          cliente_complemento?: string | null
          cliente_email?: string | null
          cliente_endereco?: string | null
          cliente_estado?: string | null
          cliente_nome?: string
          cliente_numero?: string | null
          cliente_telefone?: string
          codigo?: string
          created_at?: string
          id?: string
          metodo_frete?: Database["public"]["Enums"]["shipping_method"]
          observacoes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          valor_frete?: number
          valor_produtos?: number
          valor_total?: number
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          descricao: string | null
          destaque: boolean
          dimensoes: string | null
          estoque: number
          id: string
          imagem_url: string | null
          imagens_extras: Json | null
          nome: string
          peso_g: number | null
          preco: number
          slug: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          dimensoes?: string | null
          estoque?: number
          id?: string
          imagem_url?: string | null
          imagens_extras?: Json | null
          nome: string
          peso_g?: number | null
          preco: number
          slug: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          descricao?: string | null
          destaque?: boolean
          dimensoes?: string | null
          estoque?: number
          id?: string
          imagem_url?: string | null
          imagens_extras?: Json | null
          nome?: string
          peso_g?: number | null
          preco?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_pedido: {
        Args: {
          _cliente: Json
          _itens: Json
          _metodo_frete: Database["public"]["Enums"]["shipping_method"]
          _observacoes?: string
          _valor_frete: number
        }
        Returns: {
          codigo: string
          pedido_id: string
        }[]
      }
      gerar_codigo_pedido: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "analise_pagamento"
        | "pago"
        | "em_producao"
        | "em_entrega"
        | "entregue"
        | "cancelado"
      shipping_method: "grande_vitoria" | "demais_regioes" | "retirada"
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
    Enums: {
      app_role: ["admin", "user"],
      order_status: [
        "analise_pagamento",
        "pago",
        "em_producao",
        "em_entrega",
        "entregue",
        "cancelado",
      ],
      shipping_method: ["grande_vitoria", "demais_regioes", "retirada"],
    },
  },
} as const
