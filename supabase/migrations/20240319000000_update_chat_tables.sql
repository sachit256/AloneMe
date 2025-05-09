-- Drop old tables
drop table if exists public.messages;
drop table if exists public.chat_sessions;

-- Create messages table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    chat_id uuid not null,
    text text not null,
    sender_id text not null,
    read_by text[] default array[]::text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index for chat_id to improve query performance
create index if not exists idx_messages_chat_id on public.messages(chat_id);

-- Create chat_sessions table
create table if not exists public.chat_sessions (
    id uuid default gen_random_uuid() primary key,
    type text not null default 'direct',
    participants text[] not null,
    last_message text,
    last_message_time timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index for participants to improve query performance
create index if not exists idx_chat_sessions_participants on public.chat_sessions using gin (participants);

-- Enable Row Level Security (RLS)
alter table public.messages enable row level security;
alter table public.chat_sessions enable row level security;

-- Create policies for messages table
create policy "Users can insert their own messages"
    on public.messages
    for insert
    with check (auth.uid()::text = sender_id);

create policy "Users can view messages they're involved in"
    on public.messages
    for select
    using (
        exists (
            select 1 from chat_sessions
            where id = messages.chat_id
            and auth.uid()::text = any(participants)
        )
    );

create policy "Users can update messages they're involved in"
    on public.messages
    for update
    using (
        exists (
            select 1 from chat_sessions
            where id = messages.chat_id
            and auth.uid()::text = any(participants)
        )
    );

-- Create policies for chat_sessions table
create policy "Users can insert chat sessions they're part of"
    on public.chat_sessions
    for insert
    with check (auth.uid()::text = any(participants));

create policy "Users can view chat sessions they're involved in"
    on public.chat_sessions
    for select
    using (auth.uid()::text = any(participants));

create policy "Users can update chat sessions they're involved in"
    on public.chat_sessions
    for update
    using (auth.uid()::text = any(participants));

-- Enable realtime for both tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table chat_sessions; 