select
	(select branch
	from branch
	where CCCASKTIRID={asktirbranch}) branch,
	(select branch
	from branch
	where CCCASKTIRID={asktirbranch1}) branch1,
	(select series
	from series
	where fprms=3001 and sosource=1351 and branch = (select branch
		from branch
		where cccasktirid={asktirbranch})) series,
	(select trdr
	from trdr
	where code1 = '{asktirhauliercode}') trdr
