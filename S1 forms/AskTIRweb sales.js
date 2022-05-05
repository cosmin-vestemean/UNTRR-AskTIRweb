function ON_ITELINES_POST() {
	ITELINES.CCCVATTYPE = 18;
	pret1 = X.GETSQLDATASET('select pricew01 from mtrl where mtrl=' + ITELINES.MTRL, null);
	ITELINES.NUM01 = Math.round((ITELINES.QTY1 * pret1.pricew01 * SALDOC.LRATE) * 100) / 100;
	pret2 = X.GETSQLDATASET('select pricew02 from mtrl where mtrl=' + ITELINES.MTRL, null);
	ITELINES.NUM02 = Math.round((ITELINES.QTY1 * pret2.pricew02 * SALDOC.LRATE) * 100) / 100;
	pret3 = X.GETSQLDATASET('select pricew03 from mtrl where mtrl=' + ITELINES.MTRL, null);
	ITELINES.NUM03 = Math.round((ITELINES.QTY1 * pret3.pricew03 * SALDOC.LRATE) * 100) / 100;

	if (ITELINES.CCCSNSTART && ITELINES.QTY1 > 0) {

		var xx = SNLINES.RECORDCOUNT;
		for (i = 1; i <= xx; i++)
			SNLINES.DELETE;

		var cate = ITELINES.QTY1,
			num = ITELINES.CCCSNSTART,
			v2 = num.substring(2),
			v5 = parseInt(v2),
			num = 'XX' + v5;

		for (i = 1; i <= cate; i++) {

			var next = num.substring(2),
				v1 = parseInt(next),
				v3 = X.SQL('SELECT (' + next + ')%23 from COMPANY', null),
				v4 = 65 + (3 * v3 + 17) % 26,
				v4 = v4 + '',
				c1 = X.SQL('SELECT CHAR(' + v4 + ') from COMPANY', null)
			if (v3 < 12) {
				next1 = c1 + 'X';
			} else {
				next1 = 'X' + c1;
			}

			next = next1 + v1;
			num = next;

			SNLINES.APPEND;
			SNLINES.CODE = num;
			SNLINES.POST;

			ITELINES.CCCSNSTOP = num;

			v2 = num.substring(2);
			v5 = parseInt(v2) + 1;
			num = next1 + v5;

		}
	}
}

if (SALDOC.TRDR != 0) {

	DsTrdcategory = X.GETSQLDATASET('select trdcategory from trdr where company = ' + X.SYS.COMPANY + ' and sodtype=13 and trdr = ' + SALDOC.TRDR, null);
	ceCategorieClient = DsTrdcategory.trdcategory;

	extrainfo = 'select * from trdextra where trdr=' + SALDOC.TRDR;
	ds1 = X.GETSQLDATASET(extrainfo, '');
	DsAsociatie = X.GETSQLDATASET('select cc.nume as asociatie,c.name as tara from trdr t left join cccasociatie cc on t.cccasociatie=cc.cccasociatie left join country c on cc.tara=c.country where t.trdr=' + SALDOC.TRDR, null);
	msgText = 'Asociatie:' + String.fromCharCode(9) + DsAsociatie.asociatie + String.fromCharCode(13) + String.fromCharCode(9) + 'Tara asociatie:' + String.fromCharCode(13) + String.fromCharCode(9) + DsAsociatie.tara + String.fromCharCode(13) + String.fromCharCode(10);

	msgText = msgText + 'Parc auto total:' + String.fromCharCode(9) + ds1.num04 + String.fromCharCode(13) + String.fromCharCode(10);
	msgText = msgText + 'Parc auto TIR:' + String.fromCharCode(9) + ds1.num05 + String.fromCharCode(13) + String.fromCharCode(10);
	msgText = msgText + 'Cota carnete:' + String.fromCharCode(9) + ds1.num03 + String.fromCharCode(13) + String.fromCharCode(10);

	cateUz = X.SQL('select count(distinct code) from snlines sn, findoc fn where  sn.findoc=fn.findoc and fn.trdr=' + SALDOC.TRDR + ' and fn.finstates=2 and isnull(fn.iscancel,0)=0', null);
	cateBack = X.SQL('select count(distinct sn.code) from snlines sn, findoc fn where  sn.findoc=fn.findoc and fn.trdr=' + SALDOC.TRDR + ' and ' +
		'(select top 1 fn1.finstates from snlines sn1, findoc fn1 where  sn1.findoc=fn1.findoc and sn1.code=sn.code and isnull(fn1.iscancel,0)=0 order by fn1.trndate desc, fn1.findoc desc) in (4,3,17,5,6,7,8,9,10,11,12,15,16,18) and isnull(fn.iscancel,0)=0', 0);

	inUz = cateUz - cateBack;
	maxim = ds1.num03 - inUz;
	msgText = msgText + 'Carnete in uz:' + String.fromCharCode(9) + inUz + String.fromCharCode(13) + String.fromCharCode(10);
	msgText = msgText + 'Se pot factura:' + String.fromCharCode(9) + maxim + String.fromCharCode(13) + String.fromCharCode(10);
	try {
		SALDOC.INT01 = maxim;
	} catch (e) {}

	//sDs1 ='select sn.code,fn.trndate from snlines sn, findoc fn where isnull(fn.iscancel,0)=0 and sn.findoc=fn.findoc and fn.trdr='+SALDOC.TRDR+' and fn.finstates=2 and sn.code not in (select sn2.code from snlines sn2, findoc fn2 where sn2.findoc=fn2.findoc and sn2.code=sn.code and fn2.finstates in (4,3,17,5,6,7,8,9,10,11,12) and isnull(fn2.iscancel,0)=0)';
	sDs1 = 'select distinct sn.code,(select top 1 fn3.trndate from findoc fn3, snlines sn3 where fn3.finstates=2 and sn3.findoc=fn3.findoc and sn3.code=sn.code and isnull(fn3.iscancel,0)=0 order by fn3.trndate) as trndate ' +
		' from snlines sn, findoc fn where isnull(fn.iscancel,0)=0 and sn.findoc=fn.findoc and fn.trdr=' + SALDOC.TRDR + ' and fn.finstates=2 and (select top 1 finstates from snlines sn2, findoc fn2 ' +
		' where sn2.findoc=fn2.findoc and sn2.code=sn.code and isnull(fn2.iscancel,0)=0 order by fn2.trndate desc, fn2.findoc desc) not in (4,3,17,5,6,7,8,9,10,11,12,15,16,18) ';
	Ds1 = X.GETSQLDATASET(sDs1, '');
	cate = Ds1.recordcount();

	cate_60 = 0;
	cate_120 = 0;

	toDate = new Date(SALDOC.TRNDATE);
	stDate = '';
	if ((toDate.getDate()) < 10)
		stDate = stDate + '0';
	stDate += toDate.getDate() + "/";
	if ((toDate.getMonth() + 1) < 10)
		stDate = stDate + '0';
	stDate += (toDate.getMonth() + 1) + "/";
	stDate += toDate.getFullYear();

	for (i = 1; i <= cate; i++) {
		Ds1.recno = i;
		fromDate = new Date(Ds1.trndate);
		sfDate = '';
		if (fromDate.getDate() < 10)
			sfDate = sfDate + '0';
		sfDate += fromDate.getDate() + "/";
		if ((fromDate.getMonth() + 1) < 10)
			sfDate = sfDate + '0';
		sfDate += (fromDate.getMonth() + 1) + "/";
		sfDate += fromDate.getFullYear();

		_totDays = X.EVAL('DaysBetween(StrToDate("' + stDate + '"),StrToDate("' + sfDate + '"))');
		//X.WARNING(_totDays);
		//X.WARNING('CompareDate(StrToDate("'+sfDate+'"),StrToDate("'+'31/12/2015'+'"))');

		_compDays = X.EVAL('CompareDate(StrToDate("' + sfDate + '"),StrToDate("' + '31/12/2015' + '"))');
		//X.WARNING(_compDays);

		if (_compDays <= 0) {
			if (_totDays > 120) {
				cate_120 += 1;
			}
			if (_totDays > 60 && _totDays <= 120) {
				cate_60 += 1;
			}
		} else {
			if (_totDays > 150) {
				cate_120 += 1;
			}
			if (_totDays > 120 && _totDays <= 150) {
				cate_60 += 1;
			}
		}
	}

	if (cate_120 != 0) {
		msgText = msgText + 'Carnete nereturnate 120/150 zile: ' + String.fromCharCode(9) + cate_120 + String.fromCharCode(13) + String.fromCharCode(10);

	}
	if (cate_60 != 0) {
		msgText = msgText + 'Carnete nereturnate 60/75 zile: ' + String.fromCharCode(9) + cate_60 + String.fromCharCode(13) + String.fromCharCode(10);
	}

	msgText = msgText + String.fromCharCode(13) + String.fromCharCode(10);

	cotizatieRON = X.SQL('select sum(cccfee-isnull(cccsumcol,0)) from cccsubs where cccfindoci = 123 and ccccustomer=' + SALDOC.TRDR, null);
	cotizatieEUR = X.SQL('select sum(cccfee-isnull(cccsumcol,0)) from cccsubs where cccfindoci = 47 and ccccustomer=' + SALDOC.TRDR, null);
	if (cotizatieRON > 0)
		msgText = msgText + 'Cotizatie datorata RON: ' + String.fromCharCode(9) + cotizatieRON + String.fromCharCode(13) + String.fromCharCode(10);

	if (cotizatieEUR > 0)
		msgText = msgText + 'Cotizatie datorata EUR: ' + String.fromCharCode(9) + cotizatieEUR + String.fromCharCode(13) + String.fromCharCode(10);

	msgText = msgText + String.fromCharCode(13) + String.fromCharCode(10);

	toDate = new Date(SALDOC.TRNDATE);
	stDate = '';
	stDate += toDate.getFullYear();
	if ((toDate.getMonth() + 1) < 10) {
		stDate += '0';
	}
	stDate += (toDate.getMonth() + 1);
	if (toDate.getDate() < 10) {
		stDate += '0';
	}
	stDate += toDate.getDate();

	cursUSD = X.GETSQLDATASET('select isnull(frate,0) as curs from rates where socurrency=155 and ratedate=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
	cursEUR = X.GETSQLDATASET('select isnull(frate,0) as curs from rates where socurrency=47 and ratedate=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
	cursDEM = X.GETSQLDATASET('select isnull(frate,0) as curs from rates where socurrency=156 and ratedate=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);

	if (cursUSD == 0)
		cursUSD = 1;

	if (cursDEM == 0)
		cursDEM = 1;

	if (cursEUR == 0)
		cursEUR = 1;

	GarantieNecesara = X.GETSQLDATASET('select isnull(num01,0) as garantie from trdextra where trdr=' + SALDOC.TRDR, null);

	GarantieScrisoriEUR = X.GETSQLDATASET('select isnull(sum(chequebal),0) as garantie from cheque where isnull(cccanulat,0)=0 and trdrpublisher=' + SALDOC.TRDR + ' and fprms=4000 and socurrency=47 and dateofs<=' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and finaldate>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
	GarantieScrisoriUSD = X.GETSQLDATASET('select isnull(sum(chequebal),0) as garantie from cheque where isnull(cccanulat,0)=0 and trdrpublisher=' + SALDOC.TRDR + ' and fprms=4000 and socurrency=155 and dateofs<=' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and finaldate>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);

	GarantieScrisori = parseInt(GarantieScrisoriUSD.garantie) + parseInt(Math.round(GarantieScrisoriEUR.garantie * cursEUR.curs / cursUSD.curs));

	GarantieNumerarEur = X.GETSQLDATASET('select isnull(sum(chequebal),0) as garantie from cheque where trdrpublisher=' + SALDOC.TRDR + ' and fprms=3000 and socurrency=47', null);
	GarantieNumerarUsd = X.GETSQLDATASET('select isnull(sum(chequebal),0) as garantie from cheque where trdrpublisher=' + SALDOC.TRDR + ' and fprms=3000 and socurrency=155', null);
	GarantieNumerarDem = X.GETSQLDATASET('select isnull(sum(chequebal),0) as garantie from cheque where trdrpublisher=' + SALDOC.TRDR + ' and fprms=3000 and socurrency=156', null);
	GarantieNumerarRon = X.GETSQLDATASET('select isnull(sum(chequebal),0) as garantie from cheque where trdrpublisher=' + SALDOC.TRDR + ' and fprms=3000 and socurrency=123', null);

	GarantieNumerar = parseInt(GarantieNumerarUsd.garantie) + parseInt(Math.round(GarantieNumerarEur.garantie * cursEUR.curs / cursUSD.curs)) + parseInt(Math.round(GarantieNumerarRon.garantie / cursUSD.curs)) + parseInt(Math.round(GarantieNumerarDem.garantie * cursDEM.curs / cursUSD.curs));

	GarantieFGN = X.GETSQLDATASET('select isnull(sum(chequebal),0) as garantie from cheque where isnull(cccanulat,0)=0 and trdrpublisher=' + SALDOC.TRDR + ' and fprms=2000 and dateofs<=' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and finaldate>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);

	GarantieAcoperita = parseInt(GarantieNumerar) + parseInt(GarantieScrisori);

	DataExpGarantie = X.GETSQLDATASET('select finaldate,isnull(series,0) as serie from cheque where fprms in (3000,4000) and trdrpublisher=' + SALDOC.TRDR + ' and dateofs<=' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and finaldate>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);

	toDate = new Date(DataExpGarantie.finaldate);
	expDate = '';
	if (toDate.getDate() < 10) {
		expDate += '0';
	}
	expDate += toDate.getDate() + '/';
	if ((toDate.getMonth() + 1) < 10) {
		expDate += '0';
	}
	expDate += (toDate.getMonth() + 1) + '/';
	expDate += toDate.getFullYear();

	if (DataExpGarantie.serie == 0) {
		if (ceCategorieClient == 1) {
			//X.EXCEPTION('Nu puteti factura. Garantie expirata.');
		}
		else {
			//X.WARNING('Nu puteti factura. Garantie expirata.');
		}
	} else {
		DocGarantie = X.GETSQLDATASET('select name from series where series=' + DataExpGarantie.serie + ' and sosource=8100', null);
	}
	AutorizatieV = X.GETSQLDATASET('select count(*) as autoriz from cccoldcode where ccccustomer=' + SALDOC.TRDR + ' and cccdatainc>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);

	if ((parseInt(GarantieAcoperita) + parseInt(GarantieFGN.garantie)) < parseInt(GarantieNecesara.garantie))

		if (ceCategorieClient == 1) {
			//X.EXCEPTION('Atentie: Nu puteti factura. Garantie neacoperita.');
		}
		else {
			//X.WARNING('Atentie: Nu puteti factura. Garantie neacoperita.');
		}

	msgText = msgText + 'Garantie necesara:' + String.fromCharCode(9) + String.fromCharCode(9) + GarantieNecesara.garantie + String.fromCharCode(13) + String.fromCharCode(10);
	msgText = msgText + 'Garantie acoperita FGN:' + String.fromCharCode(9) + String.fromCharCode(9) + GarantieFGN.garantie + String.fromCharCode(13) + String.fromCharCode(10);
	msgText = msgText + 'Garantie acoperita USD:' + String.fromCharCode(9) + String.fromCharCode(9) + GarantieAcoperita + String.fromCharCode(13) + String.fromCharCode(10);
	msgText = msgText + String.fromCharCode(13) + String.fromCharCode(10);
	if (ceCategorieClient == 1)
		msgText = msgText + DocGarantie.name + String.fromCharCode(13) + String.fromCharCode(10) + 'Data expirare:' + String.fromCharCode(9) + String.fromCharCode(9) + expDate + String.fromCharCode(13) + String.fromCharCode(10);
	if (AutorizatieV.autoriz > 0) {
		msgText = msgText + 'Autorizatie vamala:' + String.fromCharCode(9) + 'Da' + String.fromCharCode(13) + String.fromCharCode(10);
	} else {
		msgText = msgText + 'Autorizatie vamala' + String.fromCharCode(9) + 'Nu' + String.fromCharCode(13) + String.fromCharCode(10);
	}

	DsGarantieFGN = X.GETSQLDATASET('select * from cheque where isnull(cccanulat,0)=0 and trdrpublisher=' + SALDOC.TRDR + ' and fprms=2000 and dateofs<=' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and finaldate>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
	for (i = 1; i <= DsGarantieFGN.RECORDCOUNT; i++) {
		msgText = msgText + 'Termen FGN' + String.fromCharCode(13) + String.fromCharCode(10);
		DsGarantieFGN.RECNO = i;

		fDate = new Date(DsGarantieFGN.dateofs);
		fsDate = '';
		if (fDate.getDate() < 10) {
			fsDate += '0';
		}
		fsDate += fDate.getDate();
		fsDate += '/';
		if ((fDate.getMonth() + 1) < 10) {
			fsDate += '0';
		}
		fsDate += fDate.getMonth() + 1;
		fsDate += '/';
		fsDate += fDate.getFullYear();

		tDate = new Date(DsGarantieFGN.finaldate);
		tsDate = '';
		if (tDate.getDate() < 10) {
			tsDate += '0';
		}
		tsDate += tDate.getDate();
		tsDate += '/';
		if ((tDate.getMonth() + 1) < 10) {
			tsDate += '0';
		}
		tsDate += tDate.getMonth() + 1;
		tsDate += '/';
		tsDate += tDate.getFullYear();

		msgText = msgText + fsDate + ' - ' + tsDate + String.fromCharCode(13) + String.fromCharCode(10);

	}
	msgText = msgText + String.fromCharCode(13) + String.fromCharCode(10);
	DSGarantieScrisori = X.GETSQLDATASET('select * from cheque where cccanulat=0 and trdrpublisher=' + SALDOC.TRDR + ' and fprms=4000 and dateofs<=' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and finaldate>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
	if (DSGarantieScrisori.RECORDCOUNT > 0) {
		msgText = msgText + 'Termene scrisori active' + String.fromCharCode(13) + String.fromCharCode(10);
	}

	for (i = 1; i <= DSGarantieScrisori.RECORDCOUNT; i++) {

		DSGarantieScrisori.RECNO = i;

		fDate = new Date(DSGarantieScrisori.dateofs);
		fsDate = '';
		if (fDate.getDate() < 10) {
			fsDate += '0';
		}
		fsDate += fDate.getDate();
		fsDate += '/';
		if ((fDate.getMonth() + 1) < 10) {
			fsDate += '0';
		}
		fsDate += fDate.getMonth() + 1;
		fsDate += '/';
		fsDate += fDate.getFullYear();

		tDate = new Date(DSGarantieScrisori.finaldate);
		tsDate = '';
		if (tDate.getDate() < 10) {
			tsDate += '0';
		}
		tsDate += tDate.getDate();
		tsDate += '/';
		if ((tDate.getMonth() + 1) < 10) {
			tsDate += '0';
		}
		tsDate += tDate.getMonth() + 1;
		tsDate += '/';
		tsDate += tDate.getFullYear();

		msgText = msgText + fsDate + ' - ' + tsDate + String.fromCharCode(13) + String.fromCharCode(10);

	}

	try {
		SALDOC.REMARKS = msgText;
	} catch (e) {}
}