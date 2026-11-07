-- Separate ten-question records; legacy five-question scores and API are retained.
-- Public arcade records. Scores are derived from ten submitted answers on the server.
create table public.seen_quiz_scores_v2 (
 id uuid primary key,
 nickname text not null check (char_length(nickname) between 2 and 20 and nickname=btrim(nickname) and nickname !~ '[[:cntrl:]<>]'),
 quiz_mode text not null check (quiz_mode in ('all','eyes','films')),
 answers smallint[] not null check (array_ndims(answers)=1 and array_lower(answers,1)=1 and array_length(answers,1)=10 and array_position(answers,null) is null and answers <@ array[0,1,2,3]::smallint[]),
 score smallint generated always as (
  case quiz_mode
   when 'all' then (answers[1]=1)::int+(answers[2]=3)::int+(answers[3]=0)::int+(answers[4]=2)::int+(answers[5]=0)::int+(answers[6]=3)::int+(answers[7]=1)::int+(answers[8]=2)::int+(answers[9]=0)::int+(answers[10]=3)::int
   when 'eyes' then (answers[1]=1)::int+(answers[2]=2)::int+(answers[3]=1)::int+(answers[4]=2)::int+(answers[5]=3)::int+(answers[6]=1)::int+(answers[7]=0)::int+(answers[8]=3)::int+(answers[9]=2)::int+(answers[10]=1)::int
   when 'films' then (answers[1]=0)::int+(answers[2]=1)::int+(answers[3]=2)::int+(answers[4]=1)::int+(answers[5]=3)::int+(answers[6]=0)::int+(answers[7]=2)::int+(answers[8]=3)::int+(answers[9]=1)::int+(answers[10]=0)::int
  end
 ) stored not null check(score between 0 and 10),
 created_at timestamptz not null default now()
);
alter table public.seen_quiz_scores_v2 enable row level security;
create index seen_quiz_scores_v2_best on public.seen_quiz_scores_v2(quiz_mode,lower(nickname),score desc,created_at,id);
revoke all on public.seen_quiz_scores_v2 from anon,authenticated;
grant insert(id,nickname,quiz_mode,answers) on public.seen_quiz_scores_v2 to anon,authenticated;
grant select(id,nickname,quiz_mode,score,created_at) on public.seen_quiz_scores_v2 to anon,authenticated;
create policy seen_quiz_public_read on public.seen_quiz_scores_v2 for select to anon,authenticated using(true);
create policy seen_quiz_complete_run on public.seen_quiz_scores_v2 for insert to anon,authenticated with check(true);

create function public.seen_quiz_leaderboard_v2(p_mode text,p_run_id uuid default null)
returns jsonb language sql stable security invoker set search_path='' as $$
 with best as (
  select distinct on (lower(s.nickname)) s.id,s.nickname,s.score,s.created_at,lower(s.nickname) as player
  from public.seen_quiz_scores_v2 s where s.quiz_mode=p_mode
  order by lower(s.nickname),s.score desc,s.created_at,s.id
 ), ranked as (
  select b.*,row_number() over(order by score desc,created_at,id) as rank from best b
 ), current_player as (
  select lower(nickname) as player from public.seen_quiz_scores_v2 where id=p_run_id and quiz_mode=p_mode
 )
 select jsonb_build_object(
  'entries',coalesce((select jsonb_agg(jsonb_build_object('rank',r.rank,'nickname',r.nickname,'score',r.score,'total',10,'is_current',coalesce(r.player=(select player from current_player),false)) order by r.rank) from (select * from ranked order by rank limit 10) r),'[]'::jsonb),
  'current',(select jsonb_build_object('rank',r.rank,'nickname',r.nickname,'score',r.score,'total',10) from ranked r where r.player=(select player from current_player)),
  'total_players',(select count(*) from best)
 )
$$;
revoke all on function public.seen_quiz_leaderboard_v2(text,uuid) from public,anon,authenticated;
grant execute on function public.seen_quiz_leaderboard_v2(text,uuid) to anon,authenticated;
