//IRU/AskTirWS
var demoHost = 'http://wsdemo.asktirweb.org',
prodHost = 'http://www.asktirweb.org',
tirAccSrvD = demoHost + '/asktirweb-integration/services/TIRAccountingService-1',
tirAccSrvP = prodHost + '/services/TIRAccountingService-1',
com = prodHost + '/model/common-1',
acc = prodHost + '/model/accounting-1'
    car = prodHost + '/model/carnet-movement-1',
tir1 = 'http://www.iru.org/model/tir-actor-1',
tir2 = prodHost + '/model/tir-carnet-1',
//soap
w3Env = 'http://schemas.xmlsoap.org/soap/envelope/';

function generareSerii() {

    xx = SNLINES.RECORDCOUNT;
    for (i = 1; i <= xx; i++)
        SNLINES.DELETE;

    cate = ITELINES.QTY1;
    num = ITELINES.CCCSNSTART;
    v2 = num.substring(2);
    v5 = parseInt(v2);
    num = 'XX' + v5;

    for (i = 1; i <= cate; i++) {

        next = num.substring(2);
        v1 = parseInt(next);
        v3 = X.SQL('SELECT (' + next + ')%23 from COMPANY', null);
        v4 = 65 + (3 * v3 + 17) % 26;
        v4 = v4 + '';
        c1 = X.SQL('SELECT CHAR(' + v4 + ') from COMPANY', null);
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

function ON_ITELINES_CCCSNSTART() {
    ceSerieCarnet = ITELINES.CCCSNSTART;
    if (ITELINES.CCCSNSTART != ceSerieCarnet.toUpperCase())
        ITELINES.CCCSNSTART = ceSerieCarnet.toUpperCase();
    num = ITELINES.CCCSNSTART;
    serie = num.substring(2);
    if (serie.length != 8)
        X.EXCEPTION('Lungime serie carnet eronata!');
    v1 = parseInt(serie);
    v3 = X.SQL('SELECT (' + serie + ')%23 from COMPANY', null);
    v4 = 65 + (3 * v3 + 17) % 26;
    v4 = v4 + '';
    c1 = X.SQL('SELECT CHAR(' + v4 + ') from COMPANY', null);
    if (v3 < 12) {
        next1 = c1 + 'X';
    } else {
        next1 = 'X' + c1;
    }
    next = next1 + v1;
    if (next != ITELINES.CCCSNSTART)
        X.EXCEPTION('Serie carnet eronata!');
    ITELINES.SNCODE = ITELINES.CCCSNSTART;
    ITELINES.CCCSNSTOP = ITELINES.CCCSNSTART;
    ITELINES.QTY1 = 1;
    generareSerii();

    if (ITELINES.MTRL == 14333) {
        DsAng4 = X.GETSQLDATASET('select isnull(cccanexa4p2014,0) as bool01 from trdr where sodtype=13 and trdr=' + SALDOC.TRDR, null);
        if (DsAng4.bool01 == 0) {
            ITELINES.DELETE;
            X.EXCEPTION('Atentie: Nu puteti vinde carnete 4P Pilot membrilor care nu au anexa valabila pe 2014.');
        }
    }
    if (ITELINES.MTRL == 14481) {
        DsAng6 = X.GETSQLDATASET('select isnull(cccanexa6p2016,0) as bool01 from trdr where sodtype=13 and trdr=' + SALDOC.TRDR, null);
        if (DsAng6.bool01 == 0) {
            ITELINES.DELETE;
            X.EXCEPTION('Atentie: Nu puteti vinde carnete 6P Pilot membrilor care nu au anexa valabila pe 2016.');
        }
    }

}

var cate, num, v1, v2, v3, v4, next, next1, v5;

function ON_ITELINES_QTY1() {
    num = ITELINES.CCCSNSTART;
    next = num.substring(2);
    if ((ITELINES.QTY1 != 1) || (parseInt(next) > 0))
        generareSerii();

}

function ON_ITELINES_AFTERPOST() {
    if (MTRDOC.QTY > SALDOC.INT01) {
        X.EXCEPTION('Atentie: Nu puteti vinde mai multe carnete TIR decat maxim de facturat.');
    }
    ITELINES.CCCVATTYPE = 18;
}

function ON_ITELINES_POST() {
    ITELINES.CCCVATTYPE = 18;
    pret1 = X.GETSQLDATASET('select pricew01 from mtrl where mtrl=' + ITELINES.MTRL, null);
    ITELINES.NUM01 = Math.round((ITELINES.QTY1 * pret1.pricew01 * SALDOC.LRATE) * 100) / 100;
    pret2 = X.GETSQLDATASET('select pricew02 from mtrl where mtrl=' + ITELINES.MTRL, null);
    ITELINES.NUM02 = Math.round((ITELINES.QTY1 * pret2.pricew02 * SALDOC.LRATE) * 100) / 100;
    pret3 = X.GETSQLDATASET('select pricew03 from mtrl where mtrl=' + ITELINES.MTRL, null);
    ITELINES.NUM03 = Math.round((ITELINES.QTY1 * pret3.pricew03 * SALDOC.LRATE) * 100) / 100;
}

function ON_SALDOC_TRDR_VALIDATE() {
    DsManual = X.GETSQLDATASET('select isnull(cccmantit2016,0) as cccmantit2016, isnull(cccmantit2017,0) as cccmantit2017, isnull(trdcategory,0) as trdcategory from trdr where trdr=' + SALDOC.TRDR, null);
    if (DsManual.cccmantit2017 == 0) {
        if (DsManual.trdbusiness == 1)
            X.EXCEPTION('Trebuie semnat Manual Titular 2017.');
        else
            X.WARNING('Trebuie semnat Manual Titular 2017.');
    }

    DsIncasariNecuplate = X.GETSQLDATASET('select isnull(sum(opntamnt),0) as suma from finpayterms where paydemandmd=-1 and isnull(iscancel,0)=0 and isnull(opntamnt,0)>1 and trdr=' + SALDOC.TRDR, null);
    if (DsIncasariNecuplate.suma > 10) {
        X.WARNING('Atentie: Clientul selectat are incasari necuplate in valoare de ' + Math.round(DsIncasariNecuplate.suma * 100) / 100 + ' LEI.');
    }

    Ds = X.GETSQLDATASET('select isnull(cccproces,0) as proces, isnull(ccctermen,0) as termen, isnull(cccaprov,0) as aprov from trdr where trdr=' + SALDOC.TRDR, null);
    if ((Ds.proces == 0) && (Ds.termen == 0)) {
        VerificareCredit();
        VerificareLimita();
    }
}

function ON_SALDOC_TRDR() {

    if (SALDOC.TRDR != 0) {

        DsTrdcategory = X.GETSQLDATASET('select trdcategory from trdr where company = ' + X.SYS.COMPANY + ' and sodtype=13 and trdr = ' + SALDOC.TRDR, null);
        ceCategorieClient = DsTrdcategory.trdcategory;

        SALDOC.SERIES = 0;

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
        SALDOC.INT01 = maxim;

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
            if (ceCategorieClient == 1)
                X.EXCEPTION('Nu puteti factura. Garantie expirata.');
            else
                X.WARNING('Nu puteti factura. Garantie expirata.');
        } else {
            DocGarantie = X.GETSQLDATASET('select name from series where series=' + DataExpGarantie.serie + ' and sosource=8100', null);
        }
        AutorizatieV = X.GETSQLDATASET('select count(*) as autoriz from cccoldcode where ccccustomer=' + SALDOC.TRDR + ' and cccdatainc>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
        //X.WARNING(GarantieAcoperita);
        //X.WARNING(GarantieNumerar);
        //X.WARNING(GarantieScrisori);
        //X.WARNING(GarantieNecesara.garantie);

        if ((parseInt(GarantieAcoperita) + parseInt(GarantieFGN.garantie)) < parseInt(GarantieNecesara.garantie))

            if (ceCategorieClient == 1)
                X.EXCEPTION('Atentie: Nu puteti factura. Garantie neacoperita.');
            else
                X.WARNING('Atentie: Nu puteti factura. Garantie neacoperita.');

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

        SALDOC.REMARKS = msgText;

        wrong_count = 0;

        msgCF = '';

        areAutorizatie = X.SQL('select count(*) from cccoldcode where ccccustomer = ' + SALDOC.TRDR + ' and cccdatech<=' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and cccdatainc>=' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
        if (areAutorizatie == 0) {
            msgCF = msgCF + 'Clientul selectat nu are autorizatie vamala valabila.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        areDeclaratie = X.SQL('select cccad2 from trdr where trdr=' + SALDOC.TRDR, null);
        if (areDeclaratie == 0) {
            msgCF = msgCF + 'Clientul selectat nu are declaratia de autorizatie vamala.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        areParcTIR = X.SQL('select num05 from trdextra where trdr=' + SALDOC.TRDR, null);
        if (areParcTIR == 0) {
            msgCF = msgCF + 'Clientul selectat nu are parc auto TIR.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        areGarantieZ = X.SQL('select num01 from trdextra where trdr=' + SALDOC.TRDR, null);
        if (areGarantieZ == 0) {
            msgCF = msgCF + 'Clientul selectat are garantia ZERO.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        areGarantieB = X.SQL('select cccgb from trdr where trdr=' + SALDOC.TRDR, null);
        if (areGarantieB == 1) {
            msgCF = msgCF + 'Clientul are garantia blocata.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        eSuspendat = X.SQL('select cccsuspended from trdr where trdr=' + SALDOC.TRDR, null);
        if (eSuspendat == 1) {
            msgCF = msgCF + 'Clientul este suspendat.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        areCotaZ = X.SQL('select num03 from trdextra where trdr=' + SALDOC.TRDR, null);
        if (areCotaZ == 0) {
            msgCF = msgCF + 'Clientul selectat are cota carnete ZERO.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        if (cate >= areCotaZ) {
            msgCF = msgCF + 'Clientul selectat are in uz maximum de carnete posibil.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        if (cate_120 != 0) {
            msgCF = msgCF + 'Clientul selectat are in uz carnete mai vechi de 150/120 de zile.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        tolerat = X.SQL('select ccctype5 from company where company=1', null);

        //	if ((GarantieNecesara-GarantieAcoperita)>tolerat)
        //	{
        //		msgCF =msgCF+'Clientul nu are acoperita garantia.'+String.fromCharCode(13);
        //		wrong_count = 1;
        //	}


        areG = X.SQL('select isnull(cccga,0) from trdr where trdr=' + SALDOC.TRDR, null);
        if (areG == 0) {
            msgCF = msgCF + 'Clientul selectat nu are garantia acoperita.' + String.fromCharCode(13);
            wrong_count = 1;
        }

        cDate = new Date(SALDOC.trndate);
        scDate = '';
        if (cDate.getDate() < 10)
            scDate = scDate + '0';
        scDate += cDate.getDate() + "/";
        if ((cDate.getMonth() + 1) < 10)
            scDate = scDate + '0';
        scDate += (cDate.getMonth() + 1) + "/";
        scDate += cDate.getFullYear();

        FNDS = X.GETSQLDATASET('select * from findoc where sosource=1351 and fprms=3001 and trdr=' + SALDOC.TRDR, null);
        are = 0
            for (i = 1; i <= FNDS.RECORDCOUNT; i++) {
                FNDS.RECNO = i;

                fromDate = new Date(FNDS.trndate);
                sfDate = '';
                if (fromDate.getDate() < 10)
                    sfDate += '0';
                sfDate += fromDate.getDate() + "/";
                if ((fromDate.getMonth() + 1) < 10)
                    sfDate = '0';
                sfDate += (fromDate.getMonth() + 1) + "/";
                sfDate += fromDate.getFullYear();

                _totDays = X.EVAL('DaysBetween(StrToDate("' + scDate + '"),StrToDate("' + sfDate + '"))');
                if (_totDays > 8) {
                    ceFindoc = FNDS.findoc;
                    ceSuma = FNDS.sumtamnt;
                    ceIncasare = X.SQL('select sum(tamnt) from finpayterms where finpaytermss=(select finpayterms from finpayterms where findoc=' + ceFindoc + ')', null);
                    restDePlata = ceSuma - ceIncasare;
                    if (restDePlata > 0)
                        are = 1;
                }

            }

            if (are == 1) {
                msgIncasare = 'Clientul are facturi de carnete TIR neachitate in termen de 8 zile.' + String.fromCharCode(13);
                X.WARNING(msgIncasare);
            }

            if (wrong_count == 1) {
                if (ceCategorieClient == 1)
                    X.EXCEPTION('Atentie:' + String.fromCharCode(13) + String.fromCharCode(13) + msgCF + String.fromCharCode(13) + 'Nu puteti factura!');
                else
                    X.EXCEPTION('Atentie:' + String.fromCharCode(13) + String.fromCharCode(13) + msgCF + String.fromCharCode(13) + 'Nu puteti factura!');

            }

    }
    mySerie = X.SQL('select isnull(series,0) from series where fprms=3001 and sosource=1351 and branch=' + X.SYS.BRANCH, null);
    if (mySerie > 0)
        SALDOC.SERIES = mySerie;
    else
        X.WARNING('Nu exista serie definita pentru sucursala curenta!');
}

function ON_SALDOC_SOCURRENCY() {

    toDate = new Date(SALDOC.TRNDATE);
    stDateFin = '';
    stDateFin += toDate.getFullYear();
    if ((toDate.getMonth() + 1) < 10) {
        stDateFin += '0';
    }
    stDateFin += (toDate.getMonth() + 1);
    if ((toDate.getDate()) < 10) {
        stDateFin += '0';
    }
    stDateFin += toDate.getDate();
    stDateFin = String.fromCharCode(39) + stDateFin + String.fromCharCode(39);

    Ds = X.GETSQLDATASET('select count(*) as cate from rates where ratedate=' + stDateFin + ' and socurrency=' + SALDOC.SOCURRENCY, null);

    if (Ds.cate == 0) {
        X.EXCEPTION('Atentie: nu exista cursul introdus pentru valuta EUR.');
    }
}

//function ON_SALDOC_CCCTEST()
//{
//if (SALDOC.TRDR>0)
//{

//  mySerie = 'select series from series where fprms=3001 and sosource=1351 and branch='+ X.SYS.BRANCH;
//  DS =  X.GETSQLDATASET(mySerie,'');
// for (i=1;i<=DS.RECORDCOUNT;i++)
//{
//DS.RECNO = i;
//if ((DS.series%2 ==0)&&(SALDOC.CCCTEST==1))
//	SALDOC.SERIES = DS.series;
//if ((DS.series%2 ==1)&&(SALDOC.CCCTEST==0))
//	SALDOC.SERIES = DS.series;
//}

//}
//}

function ON_POST() {

    ITELINES.FIRST;
    while (!ITELINES.Eof()) {
        if (!ITELINES.NUM01) {
            X.EXCEPTION('Neconcordanta date. Salvare abandonata. Va rugam contactati suportul Soft1.');
        }
        if (!ITELINES.NUM02) {
            X.EXCEPTION('Neconcordanta date. Salvare abandonata. Va rugam contactati suportul Soft1.');
        }
        if (!ITELINES.NUM03) {
            X.EXCEPTION('Neconcordanta date. Salvare abandonata. Va rugam contactati suportul Soft1.');
        }
        ITELINES.NEXT;
    }

    extrainfo = 'select * from trdextra where trdr=' + SALDOC.TRDR;
    ds1 = X.GETSQLDATASET(extrainfo, '');

    cateUz = X.SQL('select count(*) from snlines sn, findoc fn where  sn.findoc=fn.findoc and fn.trdr=' + SALDOC.TRDR + ' and fn.finstates=2', null);
    cateBack = X.SQL('select count(*) from snlines sn, findoc fn where  sn.findoc=fn.findoc and fn.trdr=' + SALDOC.TRDR + ' and (fn.finstates=4 or fn.finstates=3 or fn.finstates=17)', null);
    inUz = cateUz - cateBack;
    maxim = ds1.num03 - inUz;

    SALDOC.INT01 = maxim;

    //	if (MTRDOC.QTY>SALDOC.INT01-)
    //	{
    //		X.EXCEPTION('Atentie: Nu puteti vinde mai multe carnete TIR decat maxim de facturat.');
    //	}

    date1 = new Date(SALDOC.TRNDATE);

    cePeriod = date1.getMonth() + 1;
    ceFiscPrd = date1.getFullYear();

    bDate = ceFiscPrd + '';
    if (cePeriod < 10)
        bDate = bDate + '0';
    bDate += cePeriod;
    bDate += '01';

    sdate1 = '';
    sdate1 = date1.getFullYear() + '';
    if ((date1.getMonth() + 1) < 10)
        sdate1 = sdate1 + '0';
    sdate1 += (date1.getMonth() + 1);
    if (date1.getDate() < 10)
        sdate1 = sdate1 + '0';
    sdate1 += date1.getDate();

    lcString = 'SELECT TOP 1 isnull(FRATE,0) AS CURS FROM RATES WHERE SOCURRENCYREF=123 AND SOCURRENCY=155 AND RATEDATE<=' + String.fromCharCode(39) + sdate1 + String.fromCharCode(39) + ' AND RATEDATE>=' + String.fromCharCode(39) + bDate + String.fromCharCode(39) + ' ORDER BY RATEDATE DESC'
        DsCurs = X.GETSQLDATASET(lcString, null);
    ceCurs = DsCurs.curs;
    if (ceCurs > 0)
        ceValUSD = Math.round(SALDOC.SUMAMNT * SALDOC.LRATE / ceCurs * 100) / 100;
    else
        ceValUSD = 0;
    ceValRotunjit = Math.round(ceValUSD);
    if (ceValRotunjit < ceValUSD)
        SALDOC.NUM02 = ceValRotunjit + 1;
    else
        SALDOC.NUM02 = ceValRotunjit;

    adauga_suma = 0;
    if (SALDOC.findoc < 0)
        adauga_suma = SALDOC.SUMAMNT;

    Ds = X.GETSQLDATASET('select (sum(ldebit)-sum(lcredit)) as credit from trdbalsheet where trdr in (select trdr from trdextra where sodtype=13 and utbl05=(select isnull(utbl05,0) from trdextra where trdr=' + SALDOC.TRDR + '))', null);
    ce_credit_mesaj = Ds.credit;
    ce_credit_are = Ds.credit + adauga_suma;
    Ds = X.GETSQLDATASET('select isnull(num01,0) as limita from utbl05 where utbl05=(select isnull(utbl05,0) from trdextra where trdr=' + SALDOC.TRDR + ')', null);
    ce_limita_credit = Ds.limita;

    if ((ce_credit_are > ce_limita_credit) && (ce_limita_credit != 0)) {
        X.EXCEPTION('Nu mai puteti factura. Limita de credit depasita.' + String.fromCharCode(13) + String.fromCharCode(10) + 'Limita de credit: ' + ce_limita_credit + String.fromCharCode(13) + String.fromCharCode(10) + 'Credit anterior: ' + ce_credit_mesaj + String.fromCharCode(13) + String.fromCharCode(10) + 'Factura curenta: ' + SALDOC.SUMAMNT);
    }

    Ds = X.GETSQLDATASET('select isnull(cccproces,0) as proces, isnull(ccctermen,0) as termen, isnull(cccaprov,0) as aprov from trdr where trdr=' + SALDOC.TRDR, null);
    if (Ds.proces == 1)
        VerificareProces();
    if (Ds.termen == 1)
        VerificareTermen();

    //IRU sync of TIR carnets:
    //sendSaleToIRU(tirAccSrvD);

}

function ON_AFTERPOST() {
    if (SALDOC.findoc < 0)
        v1 = X.NewId;
    else
        v1 = SALDOC.findoc;

    sDs1 = 'select * from snlines where findoc=' + v1;
    Ds1 = X.GETSQLDATASET(sDs1, '');
    numOfTirCards = Ds1.RECORDCOUNT;
    for (i = 1; i <= numOfTirCards; i++) {
        Ds1.RECNO = i;
        pSN = Ds1.CODE;
        sSQL = 'update ccctircard set cccemis=1, ccctrdr=' + SALDOC.TRDR + ' where cccserial=' + X.EVAL('QuoteStr("' + pSN + '")') + ' and isnull(cccexportat,0)=0';
        X.RUNSQL(sSQL, null);
    }
}

function ON_DELETE() {
    v1 = SALDOC.findoc;
    sDs1 = 'select * from snlines where findoc=' + v1;
    Ds1 = X.GETSQLDATASET(sDs1, '');
    numOfTirCards = Ds1.RECORDCOUNT;
    for (i = 1; i <= numOfTirCards; i++) {
        Ds1.RECNO = i;
        pSN = Ds1.CODE;
        sSQL = 'update ccctircard set cccemis=0, ccctrdr=0 where cccserial=' + X.EVAL('QuoteStr("' + pSN + '")') + ' and cccexportat=0';
        X.RUNSQL(sSQL, null);
    }
}

function ON_LOCATE() {
    X.FIELDCOLOR("SALDOC.DATE01", 33023);
    X.FIELDCOLOR("SALDOC.DATE02", 33023);

    loadSecureHeader();
}

function ON_SALDOC_NEW() {
    X.FIELDCOLOR("SALDOC.DATE01", 33023);
    X.FIELDCOLOR("SALDOC.DATE02", 33023);
}

function VerificareCredit() {
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
    stDate = X.EVAL('QuoteStr("' + stDate + '")');

    lcString = 'select isnull(count(*),0) as cate from cccdeblocare where trdr=' + SALDOC.TRDR + ' and ' + stDate + ' between datastart and datastop';
    Ds = X.GETSQLDATASET(lcString, null);
    if (Ds.cate == 0) {
        Ds = X.GETSQLDATASET('select count(*) as cate from finpayterms where isnull(iscancel,0)=0 and paydemandmd=1 and findoc in (select findoc from findoc where sosource=1351 and fprms in (2002,2004,2008,3001,9002,9006) and isnull(iscancel,0)=0) and isnull(opntamnt,0)>10 and datediff(d,trndate,getdate())>15 and trdr=' + SALDOC.TRDR, null);
        if (Ds.cate > 0) {
            vString = 'Nu puteti emite facturi pentru acest client. Are facturi neplatite mai vechi de 15 zile! Pentru detalii contactati departamentul contabilitate.';
            X.EXCEPTION(vString);
        } else {
            Ds = X.GETSQLDATASET('select day(' + stDate + ') as zi', null);
            zi_curent = Ds.zi;
            if ((zi_curent > 5)) {
                toDate = new Date(SALDOC.TRNDATE);
                stDateIni = '';
                stDateIni += toDate.getFullYear();
                if ((toDate.getMonth() + 1) < 10) {
                    stDateIni += '0';
                }
                stDateIni += (toDate.getMonth() + 1);
                stDateIni += '01';
                stDateIni = X.EVAL('QuoteStr("' + stDateIni + '")');
                Ds = X.GETSQLDATASET('select count(*) as cate from finpayterms where isnull(iscancel,0)=0 and paydemandmd=1 and findoc in (select findoc from findoc where sosource=1351 and fprms=2008) and isnull(opntamnt,0)>10 and trndate<' + stDateIni + ' and trdr=' + SALDOC.TRDR, null);
                if (Ds.cate > 0) {
                    vString = 'Nu puteti emite facturi pentru acest client. Are facturi neplatite pentru roviniete in intervalul 21-31 luna precedenta! Pentru detalii contactati departamentul contabilitate.';
                    X.EXCEPTION(vString);
                }
            }
            if (zi_curent > 15) {
                toDate = new Date(SALDOC.TRNDATE);
                stDateIni = '';
                stDateIni += toDate.getFullYear();
                if ((toDate.getMonth() + 1) < 10) {
                    stDateIni += '0';
                }
                stDateIni += (toDate.getMonth() + 1);
                stDateIni += '01';
                stDateIni = X.EVAL('QuoteStr("' + stDateIni + '")');
                toDate = new Date(SALDOC.TRNDATE);
                stDateFin = '';
                stDateFin += toDate.getFullYear();
                if ((toDate.getMonth() + 1) < 10) {
                    stDateFin += '0';
                }
                stDateFin += (toDate.getMonth() + 1);
                stDateFin += '10';
                stDateFin = X.EVAL('QuoteStr("' + stDateFin + '")');

                Ds = X.GETSQLDATASET('select count(*) as cate from finpayterms where isnull(iscancel,0)=0 and paydemandmd=1 and findoc in (select findoc from findoc where sosource=1351 and fprms=2008) and isnull(opntamnt,0)>10 and trndate between ' + stDateIni + ' and ' + stDateFin + 'and trdr=' + SALDOC.TRDR, null);
                if (Ds.cate > 0) {
                    vString = 'Nu puteti emite facturi pentru acest client. Are facturi neplatite pentru roviniete in intervalul 01-10 luna curenta! Pentru detalii contactati departamentul contabilitate.';
                    X.EXCEPTION(vString);
                }
            }

            if (zi_curent > 25) {
                toDate = new Date(SALDOC.TRNDATE);
                stDateIni = '';
                stDateIni += toDate.getFullYear();
                if ((toDate.getMonth() + 1) < 10) {
                    stDateIni += '0';
                }
                stDateIni += (toDate.getMonth() + 1);
                stDateIni += '11';
                stDateIni = X.EVAL('QuoteStr("' + stDateIni + '")');
                toDate = new Date(SALDOC.TRNDATE);
                stDateFin = '';
                stDateFin += toDate.getFullYear();
                if ((toDate.getMonth() + 1) < 10) {
                    stDateFin += '0';
                }
                stDateFin += (toDate.getMonth() + 1);
                stDateFin += '20';
                stDateFin = X.EVAL('QuoteStr("' + stDateFin + '")');

                Ds = X.GETSQLDATASET('select count(*) as cate from finpayterms where isnull(iscancel,0)=0 and paydemandmd=1 and findoc in (select findoc from findoc where sosource=1351 and fprms=2008) and isnull(opntamnt,0)>10 and trndate between ' + stDateIni + ' and ' + stDateFin + 'and trdr=' + SALDOC.TRDR, null);
                if (Ds.cate > 0) {
                    vString = 'Nu puteti emite facturi pentru acest client. Are facturi neplatite pentru roviniete in intervalul 11-20 luna curenta! Pentru detalii contactati departamentul contabilitate.';
                    X.EXCEPTION(vString);
                }
            }

        }
    }
}

function VerificareLimita() {
    Ds = X.GETSQLDATASET('select (sum(ldebit)-sum(lcredit)) as credit from trdbalsheet where trdr in (select trdr from trdextra where sodtype=13 and utbl05=(select isnull(utbl05,0) from trdextra where trdr=' + SALDOC.TRDR + '))', null);
    ce_credit_are = Ds.credit;
    Ds = X.GETSQLDATASET('select isnull(num01,0) as limita from utbl05 where utbl05=(select isnull(utbl05,0) from trdextra where trdr=' + SALDOC.TRDR + ')', null);
    ce_limita_credit = Ds.limita;

    if ((ce_credit_are > ce_limita_credit) && (ce_limita_credit != 0)) {
        ce_credit_mesaj = Math.round(ce_credit_are);
        X.EXCEPTION('Nu mai puteti factura. Limita de credit depasita.' + String.fromCharCode(13) + String.fromCharCode(10) + 'Limita de credit: ' + ce_limita_credit + ' RON' + String.fromCharCode(13) + String.fromCharCode(10) + 'Credit anterior: ' + ce_credit_mesaj + ' RON');
    }
}

function VerificareProces() {
    if (SALDOC.FINDOCPAY == 0) {
        are_incasari_necuplate = 0;
        are_facturi_necuplate = 0;
        DsIncasariNecuplate = X.GETSQLDATASET('select isnull(sum(opntamnt),0) as suma from finpayterms where paydemandmd=-1 and isnull(iscancel,0)=0 and isnull(opntamnt,0)>1 and trdr=' + SALDOC.TRDR, null);
        if (DsIncasariNecuplate.suma > 10) {
            are_incasari_necuplate = 1;
        }
        DsFacturiNecuplate = X.GETSQLDATASET('select isnull(sum(opntamnt),0) as suma from finpayterms where paydemandmd=1 and isnull(iscancel,0)=0 and isnull(opntamnt,0)>1 and trdr=' + SALDOC.TRDR, null);
        if (DsFacturiNecuplate.suma > 10) {
            are_facturi_necuplate = 1;
        }

        ce_avans_are = 0;
        DsIncasariNecuplate = X.GETSQLDATASET('select isnull(sum(trdrrate*opntamnt),0) as suma from finpayterms where paydemandmd=-1 and isnull(iscancel,0)=0 and isnull(opntamnt,0)>1 and trdr=' + SALDOC.TRDR, null);
        if (DsIncasariNecuplate.suma > 0) {
            ce_avans_are = DsIncasariNecuplate.suma;
        }

        adauga_suma = 0;
        if (SALDOC.findoc < 0)
            adauga_suma = SALDOC.SUMLAMNT;

        ce_credit_are = adauga_suma - ce_avans_are;
        if ((ce_credit_are > 0) && (SALDOC.FINDOCPAY == 0)) {
            X.EXCEPTION('Clientul este in proces cu UNTRR. Nu puteti factura fara incasare in avans sau incasare numerar!');
        }
    }
}

function VerificareTermen() {
    if (SALDOC.FINDOCPAY == 0) {
        are_incasari_necuplate = 0;
        are_facturi_necuplate = 0;
        DsIncasariNecuplate = X.GETSQLDATASET('select isnull(sum(trdrrate*opntamnt),0) as suma from finpayterms where paydemandmd=-1 and isnull(iscancel,0)=0 and isnull(opntamnt,0)>1 and trdr=' + SALDOC.TRDR, null);
        if (DsIncasariNecuplate.suma > 10) {
            are_incasari_necuplate = 1;
        }
        DsFacturiNecuplate = X.GETSQLDATASET('select isnull(sum(trdrrate*opntamnt),0) as suma from finpayterms where paydemandmd=1 and isnull(iscancel,0)=0 and isnull(opntamnt,0)>1 and trdr=' + SALDOC.TRDR, null);
        if (DsFacturiNecuplate.suma > 10) {
            are_facturi_necuplate = 1;
        }

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
        vDate = X.EVAL('QuoteStr("' + stDate + '")');

        DsFacturiNeplatite = X.GETSQLDATASET('select isnull(sum(opntamnt),0) as suma from finpayterms where paydemandmd=1 and isnull(iscancel,0)=0 and isnull(opntamnt,0)>1 and trdr=' + SALDOC.TRDR + ' and finaldate<' + vDate, null);
        if (DsFacturiNeplatite.suma > 10) {
            ce_avans_are = DsIncasariNecuplate.suma;

            adauga_suma = 0;
            if (SALDOC.findoc < 0)
                adauga_suma = SALDOC.SUMLAMNT;

            ce_credit_are = adauga_suma - ce_avans_are;
            if ((ce_credit_are > 0) && (SALDOC.FINDOCPAY == 0)) {
                X.EXCEPTION('Clientul are plata la termen si facturi cu scadenta depasita. Nu puteti factura fara incasare in avans sau incasare numerar!');
            }

        }
    }
}

function createTIRSale(tir, car, com, tir1, tir2, acc) {
    var _CarnetIssuanceTransaction_ns = {
        Count: 0,
        Start: {
            XML: function () {
                return '<' + tir + ':tirCarnetDespatchAdvice>';
            }
        },
        Id: {
            UI: null,
            requiredInXMLSchema: true,
            XML: function () {
                if (this.UI)
                    return '<' + com + ':Id>' + this.UI + '</' + com + ':Id>';
                else
                    return '';
            }
        },
        IssueDate: {
            UI: null,
            requiredInXMLSchema: true,
            XML: function () {
                if (this.UI)
                    return '<' + car + ':IssueDate>' + this.UI + '</' + car + ':IssueDate>';
                else
                    return '';
            }
        },
        DespatchParty_ns: {
            Count: 0,
            Start: {
                XML: function () {
                    return '<' + car + ':DespatchParty>';
                }
            },
            Association: {
                UI: null,
                requiredInXMLSchema: true,
                XML: function () {
                    if (this.UI)
                        return '<' + tir1 + ':Association id="ROU/050/' + this.UI.id + '" name="' + this.UI.name + '">' + '</' + tir1 + ':Association>';
                    else
                        return '';
                }
            },
            Stop: {
                XML: function () {
                    return '</' + car + ':DespatchParty>';
                }
            }
        },
        DeliveryParty_ns: {
            Count: 0,
            Start: {
                XML: function () {
                    return '<' + car + ':DeliveryParty>';
                }
            },
            Haulier: {
                UI: null,
                requiredInXMLSchema: true,
                XML: function () {
                    if (this.UI)
                        return '<' + tir1 + ':Haulier id="ROU/050/' + this.UI.id + '" name="' + this.UI.name + '">' + '</' + tir1 + ':Haulier>';
                    else
                        return '';
                }
            },
            Stop: {
                XML: function () {
                    return '</' + car + ':DeliveryParty>';
                }
            }
        },
        Stop: {
            XML: function () {
                return '</' + tir + ':tirCarnetDespatchAdvice>';
            }
        },
    }
    _TIRCarnetDespatchLines_ns = [],
    _errString = '';

    function bindUI(UiRef, UI, _prop) {
        if (UI && typeof UI === 'string') {
            UI = UI.trim();
        }
        if (_prop.requiredInXMLSchema) {
            if (UI) {
                _prop.UI = UI;
                return true;
            } else {
                //throw error
                _errString += UiRef + '\n';
                return false;
            }
        } else {
            if (UI) {
                _prop.UI = UI;
                return true;
            } else {
                return false;
            }
        }
    }

    return {
        set_CarnetIssuanceTransaction_ns: function (IdUiRef, Id, IssueDateUIRef, IssueDate) {
            if (bindUI(IssueDateUIRef, Id, _CarnetIssuanceTransaction_ns.Id))
                _CarnetIssuanceTransaction_ns.Count++;
            if (bindUI(IssueDateUIRef, IssueDate, _CarnetIssuanceTransaction_ns.IssueDate))
                _CarnetIssuanceTransaction_ns.Count++;
        },
        set_DespatchParty_ns: function (AssUiRef, Association) {
            if (bindUI(AssUiRef, Association, _CarnetIssuanceTransaction_ns.DespatchParty_ns.Association))
                _CarnetIssuanceTransaction_ns.DespatchParty_ns.Count++;
        },
        set_DeliveryParty_ns: function (HaulierUiRef, Haulier) {
            if (bindUI(HaulierUiRef, Haulier, _CarnetIssuanceTransaction_ns.DeliveryParty_ns.Haulier))
                _CarnetIssuanceTransaction_ns.DeliveryParty_ns.Count++;
        },
        set_TIRCarnetDespatchLine_ns: function (IdUiRef, Id, QuantityUIRef, Quantity, VCUIRef, VoletCount, CTUiRef, CarnetType, FTIRCNUiRef, FirstTIRCarnetNumber, LTIRCNUIRef, LastTIRCarnetNumber) {
            var _line = {
                Count: 0,
                Start: {
                    XML: function () {
                        return '<' + car + ':TIRCarnetDespatchLine>';
                    }
                },
                Id: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + com + ':Id>' + this.UI + '</' + com + ':Id>';
                        else
                            return '';
                    }
                },
                Quantity: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + car + ':Quantity>' + this.UI + '</' + car + ':Quantity>';
                        else
                            return '';
                    }
                },
                TIRCarnetItem_ns: {
                    Count: 0,
                    Start: {
                        XML: function () {
                            return '<' + tir2 + ':TIRCarnetItem>';
                        }
                    },
                    VoletCount: {
                        UI: null,
                        requiredInXMLSchema: true,
                        XML: function () {
                            if (this.UI)
                                return '<' + tir2 + ':VoletCount>' + this.UI + '</' + tir2 + ':VoletCount>';
                            else
                                return '';
                        }
                    },
                    CarnetType: {
                        UI: null,
                        requiredInXMLSchema: true,
                        XML: function () {
                            if (this.UI)
                                return '<' + tir2 + ':CarnetType>' + this.UI + '</' + tir2 + ':CarnetType>';
                            else
                                return '';
                        }
                    },
                    TIRCarnetRangeInstance_ns: {
                        Count: 0,
                        Start: {
                            XML: function () {
                                return '<' + tir2 + ':TIRCarnetRangeInstance>';
                            }
                        },
                        FirstTIRCarnetNumber: {
                            UI: null,
                            requiredInXMLSchema: false,
                            XML: function () {
                                if (this.UI)
                                    return '<' + tir2 + ':FirstTIRCarnetNumber>' + this.UI + '</' + tir2 + ':FirstTIRCarnetNumber>';
                                else
                                    return '';
                            }
                        },
                        LastTIRCarnetNumber: {
                            UI: null,
                            requiredInXMLSchema: false,
                            XML: function () {
                                if (this.UI)
                                    return '<' + tir2 + ':LastTIRCarnetNumber>' + this.UI + '</' + tir2 + ':LastTIRCarnetNumber>';
                                else
                                    return '';
                            }
                        },
                        Stop: {
                            XML: function () {
                                return '</' + tir2 + ':TIRCarnetRangeInstance>';
                            }
                        }
                    },
                    Stop: {
                        XML: function () {
                            return '</' + tir2 + ':TIRCarnetItem>';
                        }
                    }
                },
                Stop: {
                    XML: function () {
                        return '</' + car + ':TIRCarnetDespatchLine>';
                    }
                }
            };

            if (bindUI(IdUiRef, Id, _line.Id))
                _line.Count++;
            if (bindUI(QuantityUIRef, Quantity, _line.Quantity))
                _line.Count++;
            if (bindUI(VCUIRef, VoletCount, _line.TIRCarnetItem_ns.VoletCount))
                _line.TIRCarnetItem_ns.Count++;
            if (bindUI(CTUiRef, CarnetType, _line.TIRCarnetItem_ns.CarnetType))
                _line.TIRCarnetItem_ns.Count++;
            if (bindUI(CTUiRef, FirstTIRCarnetNumber, _line.TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.FirstTIRCarnetNumber))
                _line.TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.Count++;
            if (bindUI(LTIRCNUIRef, LastTIRCarnetNumber, _line.TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.LastTIRCarnetNumber))
                _line.TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.Count++;

            _TIRCarnetDespatchLines_ns.push(_line);

        },
        get_Messages: function () {
            return _errString;
        },
        get_XML: function () {
            var wrap1 = '<' + tir + ':authorizeAndCaptureTIRCarnetIssuanceTransaction>';
            wrap2 = '',
            main = '';
            if (_CarnetIssuanceTransaction_ns.Count) {
                main += _CarnetIssuanceTransaction_ns.Start.XML() +
                _CarnetIssuanceTransaction_ns.Id.XML() +
                _CarnetIssuanceTransaction_ns.IssueDate.XML();

                if (_CarnetIssuanceTransaction_ns.DespatchParty_ns.Count)
                    main += _CarnetIssuanceTransaction_ns.DespatchParty_ns.Start.XML() +
                    _CarnetIssuanceTransaction_ns.DespatchParty_ns.Association.XML() +
                    _CarnetIssuanceTransaction_ns.DespatchParty_ns.Stop.XML();

                if (_CarnetIssuanceTransaction_ns.DeliveryParty_ns.Count)
                    main += _CarnetIssuanceTransaction_ns.DeliveryParty_ns.Start.XML() +
                    _CarnetIssuanceTransaction_ns.DeliveryParty_ns.Haulier.XML() +
                    _CarnetIssuanceTransaction_ns.DeliveryParty_ns.Stop.XML();

                for (var i = 0; i < _TIRCarnetDespatchLines_ns.length; i++) {
                    if (_TIRCarnetDespatchLines_ns[i].Count)
                        main += _TIRCarnetDespatchLines_ns[i].Start.XML() +
                        _TIRCarnetDespatchLines_ns[i].Id.XML() +
                        _TIRCarnetDespatchLines_ns[i].Quantity.XML();
                    if (_TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.Count) {
                        main += _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.Start.XML() +
                        _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.VoletCount.XML() +
                        _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.CarnetType.XML();
                        if (_TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.Count) {
                            main += _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.Start.XML() +
                            _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.FirstTIRCarnetNumber.XML() +
                            _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.LastTIRCarnetNumber.XML() +
                            _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.TIRCarnetRangeInstance_ns.Stop.XML();
                        }
                        main += _TIRCarnetDespatchLines_ns[i].TIRCarnetItem_ns.Stop.XML();
                    }
                    if (_TIRCarnetDespatchLines_ns[i].Count)
                        main += _TIRCarnetDespatchLines_ns[i].Stop.XML();

                }
                main += _CarnetIssuanceTransaction_ns.Stop.XML()
            }

            wrap2 = '</' + tir + ':authorizeAndCaptureTIRCarnetIssuanceTransaction>';

            var ret = main ? wrap1 + main + wrap2 : ' ';

            return ret;
        }
    }
}

function initTIRSale() {
    var s = createTIRSale('tir', 'car', 'com', 'tir1', 'tir2', 'acc');
    s.set_CarnetIssuanceTransaction_ns('SALDOC.FINDOC', SALDOC.FINDOC, 'SALDOC.TRNDATE', new Date(SALDOC.TRNDATE).toISOString());
    s.set_DespatchParty_ns('{id:34570154, name:UNTRR}', {
        id: "34570154",
        name: "UNTRR"
    });
    s.set_DeliveryParty_ns('{id:SALDOC.TRDR_CUSTOMER_CODE1, name:SALDOC.TRDR_CUSTOMER_NAME}', {
        id: X.SQL('select CODE1 from trdr where trdr=' + SALDOC.TRDR, null),
        name: SALDOC.TRDR_CUSTOMER_NAME
    });

    var j = 1;
    ITELINES.FIRST;
    while (!ITELINES.EOF) {
        s.set_TIRCarnetDespatchLine_ns(SALDOC.FINDOC + '-' + j, SALDOC.FINDOC.toString() + '-' + j, 'ITELINES.QTY1', ITELINES.QTY1, 'ITELINES.MTRL_ITEM_CCCNRVOLETI', X.SQL('SELECT CCCNRVOLETI FROM MTRL WHERE MTRL=' + ITELINES.MTRL, null), 'ORDINARY', 'ORDINARY', 'ITELINES.CCCSNSTART', ITELINES.CCCSNSTART, 'ITELINES.CCCSNSTOP', ITELINES.CCCSNSTOP);
        j++;
        ITELINES.NEXT;
    }

    var mess = s.get_Messages();
    if (mess.length) {
        return {
            isError: true,
            message: 'Urmatoarele campuri sunt obligatorii:\n' + mess
        };
    } else {
        return {
            isError: false,
            message: s.get_XML()
        };
    }
}

function sendSaleToIRU(url) {
    var xmlHttp = createRequest(),
    soap = createSaleEnvelope();

    if (soap == 'xmlError') {
        return;
    }

    xmlHttp.open("POST", url, true);
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp && xmlHttp.readyState && xmlHttp.readyState == 4) {
            debugger;
            xmlResponse = xmlHttp.responseXML;
            //The provided entity already exist
            if (xmlResponse.text.indexOf('The provided sale already exist') !== -1) {
                X.WARNING('Factura ' + SALDOC.FINCODE + ' a fost introdusa deja.');
            } else {
                X.WARNING(decode_utf8(xmlResponse.text));
            }
            //xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            //xmlDoc.async = "false";
            //xmlDoc.loadXML(xmlResponse.xml);

            //} else {
            //    X.WARNING('HTTP status:' + xmlHttp.status + '\n' + xmlHttp.responseText);
            //}
        }
    };
    xmlHttp.setRequestHeader("Content-Type", 'application/soap+xml;charset=UTF-8;action="' + tirAccSrvP + '/authorizeAndCaptureTIRCarnetIssuanceTransaction');
    //debugger;
    //xmlHttp.setRequestHeader("Content-Length", lengthInUtf8Bytes(soap));
    xmlHttp.setRequestHeader("Host", demoHost);
    xmlHttp.setRequestHeader("Connection", "Keep-Alive");
    xmlHttp.setRequestHeader("Accept-Encoding", "identity");
    xmlHttp.setRequestHeader("User-Agent", "Apache-HttpClient/4.5.5 (Java/12.0.1)");
    xmlHttp.send(soap);
}

function lengthInUtf8Bytes(str) {
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    var m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
}

function createRequest() {
    var versions = ["MSXML2.XmlHttp.6.0", "MSXML2.XmlHttp.3.0"];

    for (var i = 0, len = versions.length; i < len; i++) {
        try {
            var xhr = new ActiveXObject(versions[i]);
            return xhr;
        } catch (e) {
            // do nothing
        }
    }
}

function encode_utf8(s) {
    return unescape(encodeURIComponent(s));
}

function decode_utf8(s) {
    return decodeURIComponent(escape(s));
}

var objSecHed = {};

function loadSecureHeader() {
    var dsSoImport,
    jsCode;

    if (Object.keys(objSecHed).length === 0 && objSecHed.constructor === Object) {
        dsSoImport = X.GETSQLDATASET("SELECT SOIMPORT FROM SOIMPORT WHERE CODE='SOAPSECURITY'", null);
        dsSoImport.FIRST;
        jsCode = dsSoImport.SOIMPORT;
        eval(jsCode); //returneaza var SOAP local
        objSecHed = SOAP; //o fac accesibila global
    }
}

function createSaleEnvelope() {
    //debugger;
    var saleXML = initTIRSale();
    if (saleXML.isError) {
        X.WARNING(saleXML.message);
        return 'xmlError';
    }

    var env = '<soap:Envelope ' +
        'xmlns:acc="' + acc + '" ' +
        'xmlns:car="' + car + '" ' +
        'xmlns:com="' + com + '" ' +
        'xmlns:soap="' + w3Env + '" ' +
        'xmlns:tir="' + tirAccSrvP + '"' +
        'xmlns:tir1="' + tir1 + '"' +
        'xmlns:tir2="' + tir2 + '"' +
        objSecHed.createHeader() +
        '<soap:Body>' + saleXML.message + '</soap:Body>' +
        '</soap:Envelope>',
    xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.async = 'false';
    xmlDoc.loadXML(env);
    var parseErr = xmlDoc.parseError;
    if (parseErr.errorCode != 0) {
        X.WARNING(parseErr.reason + '\n' + env);
        //return 'xmlError';
        return env;
    }

    var ret = xmlDoc.xml;
    X.WARNING(ret + '/' + ret.length);
    return ret;
}

function EXECCOMMAND(cmd) {
    if (cmd == 202107151) {
        //IRU sync of TIR carnets:
        sendSaleToIRU(tirAccSrvD);
    }
}
