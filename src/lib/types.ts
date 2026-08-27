export type Role = "user" | "admin";

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  created_at: string;
}

export type RoundKind = "liga" | "bonus";

export interface Round {
  id: string;
  season: string;
  number: number;
  kind: RoundKind;
  is_current: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  round_id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  result_home: number | null;
  result_away: number | null;
  created_at: string;
}

export interface Tip {
  id: string;
  user_id: string;
  match_id: string;
  tip_home: number;
  tip_away: number;
  points: number | null;
  created_at: string;
  updated_at: string;
}
