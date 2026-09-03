export type Role = "user" | "admin";

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  // Selvvalgt avatar-farve (en af de 8 faste farver) - null hvis brugeren
  // ikke selv har valgt en, og bare får den automatisk udregnede farve.
  avatar_color: string | null;
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

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  image_caption: string | null;
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
