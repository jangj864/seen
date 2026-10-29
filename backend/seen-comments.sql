create table if not exists public.seen_comments (
 id uuid primary key default gen_random_uuid(),
 article_id text not null check (article_id in ('table','ladybird','yang','minari')),
 visitor_id uuid not null,
 author text not null check (char_length(btrim(author)) between 1 and 32),
 body text not null check (char_length(btrim(body)) between 2 and 800 and body !~* '(https?://|www\\.)'),
 created_at timestamptz not null default now()
);
alter table public.seen_comments enable row level security;
create index if not exists seen_comments_article_created on public.seen_comments(article_id,created_at desc);
create index if not exists seen_comments_visitor_created on public.seen_comments(visitor_id,created_at desc);
grant select,insert on public.seen_comments to anon,authenticated;
create policy "seen_public_read" on public.seen_comments for select to anon,authenticated using (true);
create policy "seen_public_comment" on public.seen_comments for insert to anon,authenticated with check (created_at between now()-interval '10 seconds' and now()+interval '10 seconds');
create function public.seen_comment_rate_limit() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.seen_comments where visitor_id=new.visitor_id and created_at>now()-interval '30 seconds') then raise exception 'Please wait 30 seconds before posting again.' using errcode='P0001'; end if;
 new.created_at=now(); return new;
end;$$;
revoke execute on function public.seen_comment_rate_limit() from public,anon,authenticated;
create trigger seen_comment_rate_limit before insert on public.seen_comments for each row execute function public.seen_comment_rate_limit();
