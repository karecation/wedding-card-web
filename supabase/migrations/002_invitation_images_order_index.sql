alter table public.invitation_images
add column if not exists order_index integer default 0;
