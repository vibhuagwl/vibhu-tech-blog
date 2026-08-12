create table if not exists processed_payments (
    payment_id varchar(100) primary key,
    processed_at timestamp not null
);

create table if not exists dlq_events (
    payment_id varchar(100) primary key,
    reason varchar(500) not null,
    created_at timestamp not null
);
