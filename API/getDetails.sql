SELECT (
		SELECT seriesnum + 1
		FROM seriesnum
		WHERE fiscprd = year(getdate())
			AND series = 3110
		) seriesnum
	,(
		SELECT dateadd(dd, 70, '{asktirissuedate}')
		) date02
	,(
		SELECT branch
		FROM branch
		WHERE CCCASKTIRID = {asktirbranch}
		) branch
	,(
		SELECT series
		FROM series
		WHERE fprms = 3001
			AND sosource = 1351
			AND branch = (
				SELECT branch
				FROM branch
				WHERE cccasktirid = {asktirbranch}
				)
		) series
	,(
		SELECT trdr
		FROM trdr
		WHERE code1 = '{asktirhauliercode}'
		) trdr
