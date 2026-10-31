-- Assertions run in one rolled-back transaction; no QA entries become public.
begin;
insert into public.seen_quiz_scores(id,nickname,quiz_mode,answers,created_at)
select gen_random_uuid(),'__SEEN_QA_'||lpad(i::text,2,'0'),'all',
 case when i<=10 then array[1,0,2,3,0]::smallint[] else array[1,0,2,3,1]::smallint[] end,
 now()-make_interval(secs=>100-i) from generate_series(1,16) i;
insert into public.seen_quiz_scores(id,nickname,quiz_mode,answers) values
 ('20f24915-c128-4d47-ac0f-5a42d33e8506','__SEEN_QA_16','all',array[1,0,2,3,0]::smallint[]),
 (gen_random_uuid(),'__SEEN_QA_01','all',array[0,0,0,0,0]::smallint[]),
 (gen_random_uuid(),'__SEEN_QA_EYE','eyes',array[1,2,1,2,3]::smallint[]);
set local role anon;
do $$ declare board jsonb; rejected boolean=false;
begin
 board:=public.seen_quiz_leaderboard('all','20f24915-c128-4d47-ac0f-5a42d33e8506');
 assert jsonb_array_length(board->'entries')=10;
 assert (board->>'total_players')::int=16;
 assert (board->'current'->>'rank')::int=11;
 assert (board->'current'->>'score')::int=5;
 assert board->'entries'->0->>'nickname'='__SEEN_QA_01';
 assert (public.seen_quiz_leaderboard('eyes')->>'total_players')::int=1;
 insert into public.seen_quiz_scores(id,nickname,quiz_mode,answers)
 values('20f24915-c128-4d47-ac0f-5a42d33e8507','__SEEN_FILM','films',array[2,0,1,1,2]::smallint[]);
 assert (public.seen_quiz_leaderboard('films','20f24915-c128-4d47-ac0f-5a42d33e8507')->'current'->>'score')::int=5;
 begin
  insert into public.seen_quiz_scores(id,nickname,quiz_mode,answers,score)
  values(gen_random_uuid(),'__SEEN_BAD','all',array[0,0,0,0,0]::smallint[],5);
 exception when others then assert SQLSTATE in ('42501','428C9'); rejected=true; end;
 assert rejected; rejected=false;
 begin
  insert into public.seen_quiz_scores(id,nickname,quiz_mode,answers)
  values(gen_random_uuid(),'__SEEN_EMPTY','all',array[]::smallint[]);
 exception when not_null_violation or check_violation then rejected=true; end;
 assert rejected; rejected=false;
 begin perform answers from public.seen_quiz_scores limit 1;
 exception when insufficient_privilege then rejected=true; end;
 assert rejected;
end $$;
rollback;
select 'Ranking, best score, ties, modes, scoring and anonymous permissions passed; test data rolled back' as verification;
