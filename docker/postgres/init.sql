-- Runs once when the volume is created. Extensions are also created by migrations
-- (drizzle/custom), so Neon and local stay identical; this only prepares the test database.
CREATE DATABASE app_test;
\connect app
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
\connect app_test
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
