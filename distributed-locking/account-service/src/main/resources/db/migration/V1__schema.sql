create table accounts (
    id varchar(64) primary key,
    balance numeric(19,2) not null,
    version bigint not null default 0,
    status varchar(32) not null,
    last_applied_fence bigint not null default 0,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint chk_accounts_balance_non_negative check (balance >= 0)
);
