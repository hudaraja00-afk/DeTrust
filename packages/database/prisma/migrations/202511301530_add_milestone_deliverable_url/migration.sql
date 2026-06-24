-- Add deliverableUrl column to Milestone for storing secure deliverable links
DO $$
BEGIN
  IF to_regclass('public."Milestone"') IS NULL THEN
    RAISE NOTICE 'Table "Milestone" does not exist. Skipping deliverableUrl addition.';
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Milestone'
      AND column_name = 'deliverableUrl'
  ) THEN
    ALTER TABLE "Milestone"
      ADD COLUMN "deliverableUrl" TEXT;
  ELSE
    RAISE NOTICE 'Column "deliverableUrl" already exists on "Milestone". Skipping.';
  END IF;
END $$;
