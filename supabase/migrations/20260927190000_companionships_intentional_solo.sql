-- Intentional solo flag for the admin Needs assignment queue.
-- A companionship with companion2 empty and intentional_solo = true is a
-- deliberate one-companion ministering assignment and leaves the queue.
-- Idempotent. Applied on church-scheduler (rwmcwyyhnlmncyelyyyn) as well.

ALTER TABLE public.companionships
  ADD COLUMN IF NOT EXISTS intentional_solo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.companionships.intentional_solo IS
  'When true, a companionship with no companion2 is an intentional solo and is omitted from the admin Needs assignment queue.';
