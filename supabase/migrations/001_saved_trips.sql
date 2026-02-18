CREATE TABLE saved_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT,
  city TEXT NOT NULL,
  country TEXT,
  days_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE saved_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips" ON saved_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON saved_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON saved_trips FOR DELETE USING (auth.uid() = user_id);
