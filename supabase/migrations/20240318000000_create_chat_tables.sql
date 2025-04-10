-- Create messages table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    chat_id text not null,
    text text not null,
    sender_id text not null,
    receiver_id text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index for chat_id to improve query performance
create index if not exists idx_messages_chat_id on public.messages(chat_id);

-- Create chat_sessions table
create table if not exists public.chat_sessions (
    id uuid default gen_random_uuid() primary key,
    user_id text not null,
    other_user_id text not null,
    duration_seconds integer not null,
    ended_at timestamp with time zone not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
        auth.uid()::text = sender_id
        or auth.uid()::text = receiver_id
    );

-- Create policies for chat_sessions table
create policy "Users can insert their own chat sessions"
    on public.chat_sessions
    for insert
    with check (auth.uid()::text = user_id);

create policy "Users can view chat sessions they're involved in"
    on public.chat_sessions
    for select
    using (
        auth.uid()::text = user_id
        or auth.uid()::text = other_user_id
    );

-- Enable realtime for messages table
alter publication supabase_realtime add table messages; 