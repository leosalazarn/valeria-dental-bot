-- Run this in Supabase SQL Editor before deploying
create table if not exists patients (
                                        phone               text primary key,
                                        name                text,
                                        full_name           text,
                                        email               text,
                                        consultation_reason text,
                                        status              text default 'NEW',
                                        aesthetic_goal      text,
                                        source              text default 'ORGANIC',
                                        trigger_message     text,
                                        data_complete       boolean default false,
                                        last_intent         text default 'OTHER',
                                        notes               text default '',
                                        first_contact       timestamptz default now(),
    last_interaction    timestamptz default now()
    );

-- Index for fast lookups
create index if not exists patients_status_idx on patients(status);
create index if not exists patients_source_idx on patients(source);