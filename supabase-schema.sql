create table players_identity (
  id uuid primary key,
  nickname varchar(32) unique not null,
  created_at timestamptz default now()
);

create table lineups (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players_identity(id) not null,
  nickname varchar(32) not null,
  pg_data jsonb, sg_data jsonb, sf_data jsonb, pf_data jsonb, c_data jsonb,
  score numeric(10,2) not null,
  avg_stats jsonb,
  created_at timestamptz default now(),
  is_active boolean default true
);
create index idx_lineups_active_score on lineups(is_active, score);
create index idx_lineups_player on lineups(player_id);

create table battles (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid references players_identity(id) not null,
  challenger_nickname varchar(32) not null,
  challenger_lineup_id uuid references lineups(id) not null,
  defender_lineup_id uuid references lineups(id) not null,
  defender_nickname varchar(32) not null,
  challenger_score numeric(10,2) not null,
  defender_score numeric(10,2) not null,
  challenger_stats jsonb,
  defender_stats jsonb,
  winner varchar(10) not null,
  score_diff numeric(10,2),
  created_at timestamptz default now()
);
create index idx_battles_challenger on battles(challenger_id);

create table player_stats (
  player_id uuid primary key references players_identity(id),
  nickname varchar(32) not null,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  total_battles integer default 0,
  best_score numeric(10,2) default 0,
  updated_at timestamptz default now()
);

alter table players_identity disable row level security;
alter table lineups disable row level security;
alter table battles disable row level security;
alter table player_stats disable row level security;
