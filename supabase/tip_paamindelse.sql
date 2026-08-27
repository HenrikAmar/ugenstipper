-- Tilføjer en kolonne på "rounds", der holder styr på om vi allerede har
-- sendt "husk at tippe"-mailen for den runde - så vi ikke sender den flere
-- gange. Sikkert at køre flere gange (ændrer ikke noget, hvis den allerede
-- findes).
alter table public.rounds
  add column if not exists reminder_sent_at timestamptz;
