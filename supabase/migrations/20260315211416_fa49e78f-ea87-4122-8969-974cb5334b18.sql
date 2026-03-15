
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  plano TEXT NOT NULL DEFAULT 'free' CHECK (plano IN ('free', 'pro')),
  plano_expiracao TIMESTAMP WITH TIME ZONE,
  greenn_assinatura_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role policy for webhook updates
CREATE POLICY "Service role can update any profile"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Printers table (user-specific)
CREATE TABLE public.printers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  kinematics TEXT NOT NULL CHECK (kinematics IN ('Cartesiana', 'Delta')),
  acquisition_cost NUMERIC NOT NULL DEFAULT 0,
  lifespan NUMERIC NOT NULL DEFAULT 0,
  power_consumption NUMERIC NOT NULL DEFAULT 0,
  maintenance_cost_monthly NUMERIC NOT NULL DEFAULT 0,
  monthly_usage_hours NUMERIC NOT NULL DEFAULT 0,
  max_filaments INTEGER NOT NULL DEFAULT 1,
  is_preset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.printers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own printers"
  ON public.printers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own printers"
  ON public.printers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own printers"
  ON public.printers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own printers"
  ON public.printers FOR DELETE USING (auth.uid() = user_id);

-- Quotes table (user-specific)
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  piece_name TEXT NOT NULL,
  printer_id TEXT NOT NULL,
  printer_name TEXT NOT NULL,
  print_time_hours NUMERIC NOT NULL DEFAULT 0,
  print_time_minutes NUMERIC NOT NULL DEFAULT 0,
  filaments JSONB NOT NULL DEFAULT '[]',
  total_weight NUMERIC NOT NULL DEFAULT 0,
  total_filament_cost NUMERIC NOT NULL DEFAULT 0,
  state TEXT,
  city TEXT,
  distributor TEXT,
  tariff NUMERIC NOT NULL DEFAULT 0.85,
  energy_cost NUMERIC NOT NULL DEFAULT 0,
  labor_rate NUMERIC NOT NULL DEFAULT 0,
  labor_hours NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  labor_percentage NUMERIC NOT NULL DEFAULT 0,
  maintenance_cost NUMERIC NOT NULL DEFAULT 0,
  depreciation_cost NUMERIC NOT NULL DEFAULT 0,
  packaging_type TEXT NOT NULL DEFAULT 'none',
  packaging_cost NUMERIC NOT NULL DEFAULT 0,
  profit_margin NUMERIC NOT NULL DEFAULT 50,
  tax_rate NUMERIC NOT NULL DEFAULT 6,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  suggested_price NUMERIC NOT NULL DEFAULT 0,
  minimum_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON public.quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own quotes"
  ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quotes"
  ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quotes"
  ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- Settings table (user-specific)
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_tariff NUMERIC NOT NULL DEFAULT 0.85,
  default_margin NUMERIC NOT NULL DEFAULT 50,
  default_tax_rate NUMERIC NOT NULL DEFAULT 6,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
