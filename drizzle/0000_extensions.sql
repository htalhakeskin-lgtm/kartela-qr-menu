-- Extensions every environment needs (04-veri §7): trigram search (P2 arama), GiST exclusion constraints.
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
