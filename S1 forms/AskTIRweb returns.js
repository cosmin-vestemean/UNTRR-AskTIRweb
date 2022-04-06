function ON_ITELINES_SNCODE()
{
	ceSerieCarnet = ITELINES.SNCODE;
	if (ITELINES.SNCODE!=ceSerieCarnet.toUpperCase())
		ITELINES.SNCODE = ceSerieCarnet.toUpperCase();
}

function ON_ITELINES_MTRL()
{
	ITELINES.QTY1 = 1;
}

function ON_AFTERPOST()
{
	if (SALDOC.findoc<0)
		v1=X.NewId;
	else
		v1=SALDOC.findoc;

	sDs1 = 'select * from snlines where findoc='+v1;
	Ds1 = X.GETSQLDATASET(sDs1,'');
	numOfTirCards = Ds1.RECORDCOUNT;
	for(i=1;i<=numOfTirCards;i++)
	{	
		Ds1.RECNO=i;
		pSN = Ds1.CODE;
		sSQL = 'update ccctircard set cccreturnat=1 where cccserial='+X.EVAL('QuoteStr("'+pSN+'")')+' and isnull(cccexportatr,0)=0';
		X.RUNSQL(sSQL,null);	             
	}	 
}

function ON_DELETE()
{
	v1=SALDOC.findoc;
	sDs1 = 'select * from snlines where findoc='+v1;
	Ds1 = X.GETSQLDATASET(sDs1,'');
	numOfTirCards = Ds1.RECORDCOUNT;
	for(i=1;i<=numOfTirCards;i++)
	{	
		Ds1.RECNO=i;
		pSN = Ds1.CODE;
		sSQL = 'update ccctircard set cccreturnat=0 where cccserial='+X.EVAL('QuoteStr("'+pSN+'")');
		X.RUNSQL(sSQL,null);	             
	}	 
}