-- Function to atomically adjust the available seats for a trip.
-- This completely prevents Race Conditions (overselling).

CREATE OR REPLACE FUNCTION update_trip_seats(
  p_trip_id UUID,
  p_delta INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_seats INT;
BEGIN
  -- First, lock the specific row for update so no other transaction can modify it simultaneously.
  SELECT seats_available INTO current_seats 
  FROM trips 
  WHERE id = p_trip_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Ensure we don't go below 0 seats
  IF current_seats + p_delta < 0 THEN
    RETURN FALSE; -- Not enough seats
  END IF;

  -- Perform the atomic update
  UPDATE trips
  SET seats_available = seats_available + p_delta
  WHERE id = p_trip_id;

  RETURN TRUE;
END;
$$;
