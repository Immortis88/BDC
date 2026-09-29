-- Camp deletion is a reversible archive. The row and all related records stay
-- in the database, while deleted camps disappear from active camp listings.
ALTER TABLE camps ADD COLUMN deleted_at DATETIME(6) NULL DEFAULT NULL AFTER updated_at;
ALTER TABLE camps DROP INDEX uq_camp_year;
