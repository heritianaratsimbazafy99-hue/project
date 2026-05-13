alter table public.candidate_profiles
  add column if not exists cv_parsed_at timestamptz,
  add column if not exists cv_parse_source text,
  add column if not exists cv_parse_summary text;

do $$
begin
  alter table public.candidate_profiles
    add constraint candidate_profiles_cv_parse_source_check
    check (cv_parse_source is null or cv_parse_source in ('openai', 'fallback'));
exception
  when duplicate_object then null;
end $$;
