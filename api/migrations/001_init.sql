-- 001_init.sql
-- Schema for JobTrack. Runs inside a transaction (see migrate.ts).

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE application_status AS ENUM (
    'wishlist', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'withdrawn'
);

CREATE TABLE applications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company     TEXT NOT NULL,
    role_title  TEXT NOT NULL,
    status      application_status NOT NULL DEFAULT 'applied',
    source      TEXT,
    job_url     TEXT,
    location    TEXT,
    notes       TEXT,
    applied_at  DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX applications_user_id_idx ON applications (user_id);
CREATE INDEX applications_user_status_idx ON applications (user_id, status);

CREATE TABLE application_events (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    type           TEXT NOT NULL CHECK (type IN ('note', 'status_change', 'interview', 'follow_up')),
    content        TEXT NOT NULL,
    happened_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX application_events_app_idx ON application_events (application_id, happened_at DESC);