DO $$
DECLARE
    specific_cursus_id INTEGER := 21; -- Replace with actual ID
BEGIN
	-- Insert the missing cursus_user entries
	INSERT INTO cursus_users (user_id, cursus_id, level, is_active)
	SELECT u.id, @specific_cursus_id, u.level, true
	FROM users u
	LEFT JOIN cursus_users cu ON u.id = cu.user_id AND cu.cursus_id = @specific_cursus_id
	WHERE cu.user_id IS null;
END $$;