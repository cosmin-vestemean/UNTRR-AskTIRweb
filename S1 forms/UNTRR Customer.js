/*
CREATE TABLE CCCXML2IRU(
CCCXML2IRU INT NOT NULL PRIMARY KEY IDENTITY(1,1),
SENDER SMALLINT NOT NULL,
XML VARCHAR(MAX),
RESPONSE VARCHAR(MAX),
INSDATE DATETIME,
TRDR INT NOT NULL
,CONNECTIONSTATUS INT
)
*/
var haulierServiceName = 'TIRHaulierService-1',
    accountingServiceName = 'TIRAccountingProxy-1',
    //demo
    hostDemo = 'https://wsdemo.asktirweb.org',
    servicesDemo = hostDemo + '/asktirweb-integration/services/',
    haulierServiceDemo = servicesDemo + haulierServiceName,
    accountingServiceDemo = servicesDemo + accountingServiceName,
    //production
    hostProd = 'http://www.asktirweb.org',
    servicesProd = hostProd + '/services/',
    haulierServiceProd = servicesProd + haulierServiceName,
    modelsProd = hostProd + '/model/',
    commonModel = modelsProd + 'common-1',
    haulierModel = modelsProd + 'haulier-1',
    vehicleModel = modelsProd + 'vehicle-1',
    //soap
    w3Env = 'http://www.w3.org/2003/05/soap-envelope',
    response_from_IRU = '',
    debugg_mode = true;

/*
mime-charset = 1*<Any CHAR except SPACE, CTLs, and cspecials>
cspecials = "(" / ")" / "<" / ">" / "@" / "," / ";" / ":" / "
<"> / "/" / "[" / "]" / "?" / "." / "=" / "*"
CHAR = <any ASCII character> ; ( 0-177, 0.-127.)
SPACE = <ASCII SP, space> ; ( 40, 32.)
CTL = <any ASCII control ; ( 0- 37, 0.- 31.)
character and DEL> ; ( 177, 127.)
 */

function ON_DELETE() {
    salvare_stergere();
}

function ON_CUSBRANCH_NEW() {
    CUSBRANCH.CODE = CUSBRANCH.RECORDCOUNT + 1;
    CUSBRANCH.NAME = CUSTOMER.NAME;
    CUSBRANCH.CCCCORESP = 1;
}

function ON_CUSBRANCH_ZIP() {

    if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1)) {
        CUSTOMER.ZIP = CUSBRANCH.ZIP;
    }
}

function ON_CUSBRANCH_CITY() {

    if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1)) {
        CUSTOMER.CITY = CUSBRANCH.CITY;
    }
}

function ON_CUSBRANCH_DISTRICT1() {

    if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1)) {
        CUSTOMER.DISTRICT1 = CUSBRANCH.DISTRICT1;
    }
}

function ON_CUSBRANCH_ADDRESS() {

    if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1)) {
        CUSTOMER.ADDRESS = CUSBRANCH.ADDRESS;
    }
}

function ON_CUSBRANCH_CCCADRESA() {

    if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1)) {
        CUSTOMER.CCCADRESA = CUSBRANCH.CCCADRESA;
    }
}

function ON_CUSBRANCH_JOBTYPE() {
    if (CUSBRANCH.JOBTYPE == 1) {
        cate = 0;
        for (i = 1; i <= CUSBRANCH.RECORDCOUNT; i++) {
            CUSBRANCH.RECNO = i;
            if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1))
                cate = cate + 1;
        }
        if (cate > 1)
            X.EXCEPTION('Atentie: Nu puteti avea decat o adresa de sediu valida!');
    }

    if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1)) {
        CUSTOMER.CCCADRESA = CUSBRANCH.CCCADRESA;
        CUSTOMER.ADDRESS = CUSBRANCH.ADDRESS;
        CUSTOMER.DISTRICT1 = CUSBRANCH.DISTRICT1;
        CUSTOMER.CITY = CUSBRANCH.CITY;
        CUSTOMER.ZIP = CUSBRANCH.ZIP;
    }
}

function ON_CUSBRANCH_CCCCORESP() {
    if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1)) {
        CUSTOMER.CCCADRESA = CUSBRANCH.CCCADRESA;
        CUSTOMER.ADDRESS = CUSBRANCH.ADDRESS;
        CUSTOMER.DISTRICT1 = CUSBRANCH.DISTRICT1;
        CUSTOMER.CITY = CUSBRANCH.CITY;
        CUSTOMER.ZIP = CUSBRANCH.ZIP;
    }
}

function ON_CUSTOMER_DISTRICT1() {
    if (CUSTOMER.DISTRICT1 != 0) {
        vBranch = X.SQL('select cccbranch from district where district=' + CUSTOMER.DISTRICT1, null);
        vAreas = X.SQL('select ccczona from district where district=' + CUSTOMER.DISTRICT1, null);

        if (vBranch != 0)
            CUSTOMER.BRANCH = vBranch;
        if (vAreas != 0)
            CUSTOMER.AREAS = vAreas;
    }

}

function ON_CUSTOMER_COUNTRY() {
    if (CUSTOMER.COUNTRY != 179)
        CUSTOMER.CCCPERSFJ = 3;
    CUSTOMER.SOCURRENCY = 47;
}

function ON_CUSTOMER_NEW() {
    //CUSTOMER.TRDCATEGORY = 1;
    CUSEXTRA.UTBL01 = 1;
    CUSTOMER.SOCURRENCY = 47;
    //CUSEXTRA.UTBL04 = 1;
}

function ON_CUSTOMER_TRDCATEGORY() {
    if (CUSTOMER.TRDR < 0) {
        if ((CUSTOMER.TRDCATEGORY == 1) || (CUSTOMER.TRDCATEGORY == 5)) {
            nextCode = X.SQL('select max(cast(code1 as int)) from trdr where trdcategory IN (1,5)', null);
            nextCode = parseInt(nextCode) + 1;
            CUSTOMER.CODE1 = nextCode;
        } else {
            CUSTOMER.CODE1 = '';
        }
    }
}

function ON_CUSTOMER_SALESMAN() {
    ceTruck = X.SQL('SELECT TRUCKS FROM PRSN WHERE PRSN=' + CUSTOMER.SALESMAN, null);
    CUSTOMER.TRUCKS = ceTruck;
}

function ON_CUSEXTRA_NUM05() {
    if (CUSEXTRA.NUM05 > CUSEXTRA.NUM04) {
        X.WARNING('Atentie: Parcul TIR nu poate depasi parcul auto total!');
        CUSEXTRA.NUM05 = CUSEXTRA.NUM04;
    }
    cotaS = X.SQL('select ccctype3 from company where company=' + X.SYS.COMPANY, null);
    CUSEXTRA.NUM03 = cotaS * CUSEXTRA.NUM05;
}

function calcul_cotizatie() {
    toDate = new Date(CUSTOMER.CCCDATASPA);
    _Anul = toDate.getFullYear();
    _Luna = toDate.getMonth() + 1;
    t1 = CUSTOMER.CCCMFP;
    t2 = CUSTOMER.CCCPERS;
    t3 = CUSTOMER.CCCAACE;
    t4 = CUSTOMER.CCCCEXP;
    t5 = CUSEXTRA.NUM04;
    p1 = X.SQL('select ccctype1 from company where company = ' + X.SYS.COMPANY, null);
    p2 = X.SQL('select ccctype2 from company where company = ' + X.SYS.COMPANY, null);
    suma = 0;
    if (((t1 == 1) || (t2 == 1)) && (t5 != 0)) {
        suma = (t5 * p1);
        pcccmfp = 1;
    } else
    if ((t3 == 1) || (t4 == 1)) {
        suma = p2;
        pcccaace = 1;
    }
    textS = 'update cccsubs set cccfee=' + suma + ', cccparc=' + t5 + ' where ccccustomer=' + CUSTOMER.TRDR + ' and cccinv=0 and ((cccmonth>=' + _Luna + ' and cccyear=' + _Anul + ') or cccyear>' + _Anul + ')';
    X.EVAL('RunSQL("' + textS + '")');
}

function ON_POST() {

    if ((CUSTOMER.TRDCATEGORY == 1) && (CUSTOMER.CCCTRANSFER == 1)) {
        X.EXCEPTION('Clientul nu poate fi membru UNTRR daca este transferat din alta organizatie! Poate fi doar Titular TIR sau client cu abonament!');
    }

    ceDenumire = CUSTOMER.NAME;
    CUSTOMER.NAME = ceDenumire.toUpperCase();

    if (CUSTOMER.TRDR > 0)
        salvare_modificare();
    if (CUSTOMER.TRDR < 0)
        salvare_nou();

    if (CUSTOMER.CCCONRC == 1) {
        toDate = new Date(CUSTOMER.CCCDATAONRC);
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

        if (toDate.getFullYear() == 1899) {
            X.EXCEPTION('Atentie: Nu ati introdus Data inregistrarii pentru operat la ONRC.')
        }
    }

    if (CUSTOMER.TRDCATEGORY == 1) {
        cate = 0;
        CUSBRANCH.FIRST;
        while (!CUSBRANCH.Eof()) {
            if ((CUSBRANCH.JOBTYPE == 1) && (CUSBRANCH.CCCCORESP == 1))
                cate = cate + 1;
            CUSBRANCH.NEXT;
        }
        if (cate < 1)
            X.EXCEPTION('Atentie: Nu aveti nicio adresa de sediu valabila.');
    }

    // Istoric
    if (CUSTOMER.TRDR > 0) {
        toDate = new Date(X.SYS.LOGINDATE);
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
        vCccdatech = X.EVAL('QuoteStr("' + stDate + '")');
        vCccuser = X.SYS.USER;

        sDs = 'select * from trdr where trdr = ' + CUSTOMER.TRDR;
        Ds = X.GETSQLDATASET(sDs, null);

        sDs1 = 'select * from trdextra where trdr = ' + CUSTOMER.TRDR;
        Ds1 = X.GETSQLDATASET(sDs1, null);

        if (CUSTOMER.NAME != Ds.name) {
            ceNume = Ds.name;
            ceNume = ceNume.substring(0, 30);
            ceNume = ceNume.replace("'", '');

            ceNumeNou = CUSTOMER.NAME;
            ceNumeNou = ceNumeNou.substring(0, 30);
            ceNumeNou = ceNumeNou.replace("'", '');
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + String.fromCharCode(39) + 'Nume membru' + String.fromCharCode(39) + ',' + String.fromCharCode(39) + ceNume + String.fromCharCode(39) + ',' + String.fromCharCode(39) + ceNumeNou + String.fromCharCode(39) + ',' + vCccdatech + ',' + vCccuser + ')';

            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CODE1 != Ds.code1) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cod membru UNTRR")') + ',' + X.EVAL('QuoteStr("' + Ds.code1 + '")') + ',' + X.EVAL('QuoteStr("' + CUSTOMER.CODE1 + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCCRMOTIV != Ds.ccccrmotiv) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Motiv retragere garantie")') + ',' + X.EVAL('QuoteStr("' + Ds.ccccrmotiv.substring(0, 30) + '")') + ',' + X.EVAL('QuoteStr("' + CUSTOMER.CCCCRMOTIV.substring(0, 30) + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCMOTIVEXCLUS != Ds.cccmotivexclus) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Motiv excludere")') + ',' + X.EVAL('QuoteStr("' + Ds.cccmotivexclus.substring(0, 30) + '")') + ',' + X.EVAL('QuoteStr("' + CUSTOMER.CCCMOTIVEXCLUS.substring(0, 30) + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCGBMOTIV != Ds.cccgbmotiv) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Motiv blocare garantie")') + ',' + X.EVAL('QuoteStr("' + Ds.cccgbmotiv.substring(0, 30) + '")') + ',' + X.EVAL('QuoteStr("' + CUSTOMER.CCCGBMOTIV.substring(0, 30) + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.VARCHAR02 != Ds1.varchar02) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Motiv suspendare")') + ',' + X.EVAL('QuoteStr("' + Ds1.varchar02.substring(0, 30) + '")') + ',' + X.EVAL('QuoteStr("' + CUSEXTRA.VARCHAR02.substring(0, 30) + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.VARCHAR04 != Ds1.varchar04) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Numar retragere")') + ',' + X.EVAL('QuoteStr("' + Ds1.varchar04.substring(0, 30) + '")') + ',' + X.EVAL('QuoteStr("' + CUSEXTRA.VARCHAR04.substring(0, 30) + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.VARCHAR01 != Ds1.varchar01) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Motiv retragere")') + ',' + X.EVAL('QuoteStr("' + Ds1.varchar01.substring(0, 30) + '")') + ',' + X.EVAL('QuoteStr("' + CUSEXTRA.VARCHAR01.substring(0, 30) + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.VARCHAR05 != Ds1.varchar05) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Sursa UNTRR")') + ',' + X.EVAL('QuoteStr("' + Ds1.varchar05.substring(0, 30) + '")') + ',' + X.EVAL('QuoteStr("' + CUSEXTRA.VARCHAR05.substring(0, 30) + '")') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCTIR != Ds.ccctir) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Membru UNTRR")') + ',' + X.EVAL('QuoteStr(String(' + Ds.ccctir + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCTIR + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCSUSPENDED != Ds.cccsuspended) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Suspendat")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccsuspended + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCSUSPENDED + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCCRD != Ds.ccccrd) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cerere retragere depusa")') + ',' + X.EVAL('QuoteStr(String(' + Ds.ccccrd + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCCRD + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCCRA != Ds.ccccra) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cerere retragere aprobata")') + ',' + X.EVAL('QuoteStr(String(' + Ds.ccccra + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCCRA + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCCGA != Ds.ccccga) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Retras UNTRR")') + ',' + X.EVAL('QuoteStr(String(' + Ds.ccccga + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCCGA + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCEXCLUS != Ds.cccexclus) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Exclus UNTRR")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccexclus + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCEXCLUS + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCMFP != Ds.cccmfp) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Marfa")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccmfp + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCMFP + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCPERS != Ds.cccpers) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Persoane")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccpers + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCPERS + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCAACE != Ds.cccaace) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Activitati adiacente")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccaace + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCAACE + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCCEXP != Ds.ccccexp) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Case de expeditie")') + ',' + X.EVAL('QuoteStr(String(' + Ds.ccccexp + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCCEXP + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCGA != Ds.cccga) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Garantie acoperita")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccga + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCGA + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCAD1 != Ds.cccad1) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Anexa Decl. Angajament")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccad1 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCAD1 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCAD2 != Ds.cccad2) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Decl. Angajament si Manual Titular")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccad2 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCAD2 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCCERCOMP != Ds.ccccercomp) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cerere compensare")') + ',' + X.EVAL('QuoteStr(String(' + Ds.ccccercomp + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCCERCOMP + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCGB != Ds.cccgb) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Garantie blocata")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccgb + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCGB + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCCCF != Ds.cccccf) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cerere de contributie la FGN")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccccf + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCCCF + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSTOMER.CCCAFGN != Ds.cccafgn) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Aprobat FGN")') + ',' + X.EVAL('QuoteStr(String(' + Ds.cccafgn + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSTOMER.CCCAFGN + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.BOOL04 != Ds1.bool04) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cerere garantie")') + ',' + X.EVAL('QuoteStr(String(' + Ds1.bool04 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSEXTRA.BOOL04 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.BOOL03 != Ds1.bool03) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cerere aprobata")') + ',' + X.EVAL('QuoteStr(String(' + Ds1.bool03 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSEXTRA.BOOL03 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.NUM04 != Ds1.num04) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Parc auto total")') + ',' + X.EVAL('QuoteStr(String(' + Ds1.num04 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSEXTRA.NUM04 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);

            //Recalculare cotizatie

            toDate = new Date(CUSTOMER.CCCDATASPA);
            _Anul = toDate.getFullYear();
            _Luna = toDate.getMonth() + 1;
            if (_Anul == 1899) {
                CUSTOMER.CCCDATASPA = X.SYS.LOGINDATE;
            }
            calcul_cotizatie();
            cateRecalculate = X.SQL('select count(*) from cccsubs where ccccustomer=' + CUSTOMER.TRDR + ' and cccinv=0 and ((cccmonth>=' + _Luna + ' and cccyear=' + _Anul + ') or cccyear>' + _Anul + ')', null);
            cateNerecalculate = X.SQL('select count(*) from cccsubs where ccccustomer=' + CUSTOMER.TRDR + ' and cccinv=1 and ((cccmonth>=' + _Luna + ' and cccyear=' + _Anul + ') or cccyear>' + _Anul + ')', null);
            if (cateRecalculate != 0)
                X.WARNING('Cotizatia a fost recalculata pentru ' + cateRecalculate + ' luni!');
            if (cateNerecalculate != 0) {
                X.WARNING('Cotizatia nu a fost recalculata pentru ' + cateNerecalculate + ' luni!');
                sDs = 'select * from cccsubs where ccccustomer=' + CUSTOMER.TRDR + ' and cccinv=1 and ((cccmonth>=' + _Luna + ' and cccyear=' + _Anul + ') or cccyear>' + _Anul + ')';
                Ds = X.GETSQLDATASET(sDs, '');
                textMsg = '';
                for (i = 1; i <= Ds.RECORDCOUNT; i++) {
                    Ds.RECNO = i;
                    textMsg = textMsg + 'Luna facturata: ' + Ds.CCCMONTH + ' - ' + Ds.CCCYEAR + String.fromCharCode(13);
                }
                X.WARNING(textMsg);
            }

            //End recalculare cotizatie


        }

        if (CUSEXTRA.NUM01 != Ds1.num01) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Garantie necesara")') + ',' + X.EVAL('QuoteStr(String(' + Ds1.num01 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSEXTRA.NUM01 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.NUM05 != Ds1.num05) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("din care TIR")') + ',' + X.EVAL('QuoteStr(String(' + Ds1.num05 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSEXTRA.NUM05 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.NUM03 != Ds1.num03) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Cota carnete TIR")') + ',' + X.EVAL('QuoteStr(String(' + Ds1.num03 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSEXTRA.NUM03 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.UTBL01 != Ds1.utbl01) {
            sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Stare firma")') + ',' + X.EVAL('QuoteStr(String(' + Ds1.utbl01 + '))') + ',' + X.EVAL('QuoteStr(String(' + CUSEXTRA.UTBL01 + '))') + ',' + vCccdatech + ',' + vCccuser + ')';
            X.RUNSQL(sSql, null);
        }

        if (CUSEXTRA.DATE02 != Ds1.date02) {
            toDate = new Date(CUSEXTRA.DATE02);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vCccDataAderareN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds1.DATE02);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vCccDataAderareO = X.EVAL('QuoteStr("' + stDate + '")');
            if (vCccDataAderareO != vCccDataAderareN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data aderare")') + ',' + vCccDataAderareO + ',' + vCccDataAderareN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSEXTRA.DATE04 != Ds1.date04) {
            toDate = new Date(CUSEXTRA.DATE04);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds1.DATE04);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');
            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data suspendare")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSEXTRA.DATE03 != Ds1.date03) {
            toDate = new Date(CUSEXTRA.DATE03);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds1.DATE03);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data retras")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSEXTRA.DATE01 != Ds1.date01) {
            toDate = new Date(CUSEXTRA.DATE01);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds1.DATE01);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data cerere compensare")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCDATERD != Ds.cccdaterd) {
            toDate = new Date(CUSTOMER.CCCDATERD);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.cccdaterd);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data depunere cerere retragere")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCDATARA != Ds.cccdatara) {
            toDate = new Date(CUSTOMER.CCCDATARA);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.cccdatara);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data aprobare cerere retragere")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCDATAEXCLUS != Ds.cccdataexclus) {
            toDate = new Date(CUSTOMER.CCCDATAEXCLUS);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.cccdataexclus);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data exclus")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCDATASPA != Ds.cccdataspa) {
            toDate = new Date(CUSTOMER.CCCDATASPA);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.cccdataspa);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data schimbarii parcului auto")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCCR != Ds.ccccr) {
            toDate = new Date(CUSTOMER.CCCCR);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.ccccr);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data cerere retragere garantie")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCCGADATA != Ds.ccccgadata) {
            toDate = new Date(CUSTOMER.CCCCGADATA);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.ccccgadata);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {

                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data aprobare retragere garantie")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCGBDATA != Ds.cccgbdata) {
            toDate = new Date(CUSTOMER.CCCGBDATA);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.cccgbdata);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data blocare garantie")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCDATACCF != Ds.cccdataccf) {
            toDate = new Date(CUSTOMER.CCCDATACCF);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.cccdataccf);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data cerere de contributie la FGN")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }

        if (CUSTOMER.CCCAFGNDATA != Ds.cccafgndata) {
            toDate = new Date(CUSTOMER.CCCAFGNDATA);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vN = X.EVAL('QuoteStr("' + stDate + '")');

            toDate = new Date(Ds.cccafgndata);
            stDate = '';
            if (toDate.getDate() < 10) {
                stDate += '0';
            }
            stDate += toDate.getDate();
            stDate += '/';
            if ((toDate.getMonth() + 1) < 10) {
                stDate += '0';
            }
            stDate += (toDate.getMonth() + 1);
            stDate += '/';
            stDate += toDate.getFullYear();
            vO = X.EVAL('QuoteStr("' + stDate + '")');

            if (vO != vN) {
                sSql = 'insert into ccccustomer (ccctrdr,ccccamp,cccoldvaluea,cccnewvaluea,cccdatach,cccuser) values (' +
                    CUSTOMER.TRDR + ',' + X.EVAL('QuoteStr("Data aprobat FGN")') + ',' + vO + ',' + vN + ',' + vCccdatech + ',' + vCccuser + ')';
                X.RUNSQL(sSql, null);
            }
        }
    }

}

var CheckCNP, CheckCIF;

function VerificareCNP() {
    psTrNo = CUSTOMER.AFM;
    lung = psTrNo.length;

    if (lung != 13) {} else {
        c1 = psTrNo.substring(0, 1);
        c2 = psTrNo.substring(1, 2);
        c3 = psTrNo.substring(2, 3);
        c4 = psTrNo.substring(3, 4);
        c5 = psTrNo.substring(4, 5);
        c6 = psTrNo.substring(5, 6);
        c7 = psTrNo.substring(6, 7);
        c8 = psTrNo.substring(7, 8);
        c9 = psTrNo.substring(8, 9);
        c10 = psTrNo.substring(9, 10);
        c11 = psTrNo.substring(10, 11);
        c12 = psTrNo.substring(11, 12);
        c13 = psTrNo.substring(12);

        suma = parseInt(c1) * 2 + parseInt(c2) * 7 + parseInt(c3) * 9 + parseInt(c4) * 1 + parseInt(c5) * 4 + parseInt(c6) * 6 + parseInt(c7) * 3 + parseInt(c8) * 5 + parseInt(c9) * 8 + parseInt(c10) * 2 + parseInt(c11) * 7 + parseInt(c12) * 9;
        ver1 = (suma % 11);
        if (((ver1 == 10) && (parseInt(c13) == 1)) || (ver1 == parseInt(c13))) {
            CheckCNP = 1;
            CUSTOMER.CCCPERSFJ = 1;
        }
    }
}

function VerificareCIF() {
    psTrCIF = CUSTOMER.AFM;
    lung = psTrCIF.length;
    if (lung > 10) {} else {
        if (lung != 10)
            for (i = 1; i <= 10 - lung; i++)
                psTrCIF = '0' + psTrCIF;

        c1 = psTrCIF.substring(0, 1);
        c2 = psTrCIF.substring(1, 2);
        c3 = psTrCIF.substring(2, 3);
        c4 = psTrCIF.substring(3, 4);
        c5 = psTrCIF.substring(4, 5);
        c6 = psTrCIF.substring(5, 6);
        c7 = psTrCIF.substring(6, 7);
        c8 = psTrCIF.substring(7, 8);
        c9 = psTrCIF.substring(8, 9);
        c10 = psTrCIF.substring(9);

        suma = (parseInt(c1) * 7 + parseInt(c2) * 5 + parseInt(c3) * 3 + parseInt(c4) * 2 + parseInt(c5) * 1 + parseInt(c6) * 7 + parseInt(c7) * 5 + parseInt(c8) * 3 + parseInt(c9) * 2) * 10;
        ver1 = X.SQL('select (' + suma + ')%11 from company', null);

        if (((ver1 == 10) && (parseInt(c10) == 0)) || (ver1 == parseInt(c10))) {
            CheckCIF = 1;
            CUSTOMER.CCCPERSFJ = 2;
        }
    }
}

function ON_CUSTOMER_AFM() {
    if ((CUSTOMER.CCCPERSFJ != 3) && (CUSTOMER.CCCPERSFJ != 4)) {
        CheckCNP = 0;
        CheckCIF = 0;
        VerificareCIF();

        if (CheckCIF == 0)
            VerificareCNP();

        if ((CheckCNP == 0) && (CheckCIF == 0))
            X.EXCEPTION('Identificator introdus eronat!');
    }
    CUSTOMER.CCCCUI1 = CUSTOMER.AFM;
    CUSTOMER.CCCCUI2 = CUSTOMER.AFM;
    cod_client = CUSTOMER.CODE;
    if (cod_client.length == 0)
        CUSTOMER.CODE = CUSTOMER.AFM;

    if ((CUSTOMER.CCCPERSFJ == 1) || (CUSTOMER.CCCPERSFJ == 3)) {} else {
        vAnswer = X.ASK('Preluare date', 'Doriti preluarea datelor clientului?');
        if (vAnswer == 6) {
            DsCheie = X.GETSQLDATASET('select cheie from ccccheie', null);
            GetOpenAPI(CUSTOMER.AFM, DsCheie.cheie);
        }
    }
}

function EXECCOMMAND(cmd) {
    if (cmd == 100001) {

        toDate = new Date(X.SYS.LOGINDATE);
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

        areAutorizatie = X.SQL('select count(*) from cccoldcode where ccccustomer = ' + CUSTOMER.TRDR +
            ' and cccdatech<' + String.fromCharCode(39) + stDate + String.fromCharCode(39) + ' and cccdatainc>' + String.fromCharCode(39) + stDate + String.fromCharCode(39), null);
        if (areAutorizatie > 0) {
            X.WARNING('Atentie: Clientul selectat are autorizatie vamala valabila. Nu-i puteti schimba codul!');
            wrong_count = 1;
        } else {
            if ((CUSTOMER.TRDCATEGORY != 1) && (CUSTOMER.TRDCATEGORY != 5)) {
                X.EXCEPTION('Atentie: Nu puteti aloca cod UNTRR pentru un client care nu este Membru TIR sau Titular TIR');
            } else {
                nextCode = X.SQL('select max(cast(code1 as int)) from trdr where trdcategory in (1,5)', null);
                if (nextCode > 0)
                    nextCode = parseInt(nextCode) + 1;
                else
                    nextCode = 1;

                CUSTOMER.CODE1 = nextCode;
            }
            //lcString = 'update trdr set trdcategory=1 where trdr='+CUSTOMER.TRDR;
            //X.RUNSQL(lcString,null);
        }
    }

    if (cmd == '1210091') {
        X.OPENSUBFORM('SFCOTIZATIE');
    }

    if (cmd == '1210092') {
        X.OPENSUBFORM('SFGARANTII');
    }

    if (cmd == '20201218') {
        debugger;
        sendHaulierToIRU(haulierServiceDemo);

        //TODO: check if the response is ok
        //daca a fost trimis transportatorul la IRU cu succes, trimite-i vehiculele
        //if response...        

        TRUCKS.FIRST;
        while (!TRUCKS.EOF) {
            //if (TRUCKS.CCCTIR) {
            sendVehicleToIRU(haulierServiceDemo);
            //}
            TRUCKS.NEXT;
        }
    }
}

function ON_SFCOTIZATIE_SHOW() {
    CCCSOLDCOTIZATIE.FIRST;
    while (!CCCSOLDCOTIZATIE.Eof) {
        CCCSOLDCOTIZATIE.DELETE;
    }

    Ds11 = X.GETSQLDATASET('select isnull(sum(cccfee-cccsumcol),0) as suma from cccsubs where ccccustomer=' + CUSTOMER.TRDR + ' and cccfindoci=123', null);
    suma_ron = Ds11.suma;
    Ds12 = X.GETSQLDATASET('select isnull(sum(cccfee-cccsumcol),0) as suma from cccsubs where ccccustomer=' + CUSTOMER.TRDR + ' and cccfindoci=47', null);
    suma_eur = Ds12.suma;
    Ds13 = X.GETSQLDATASET('select tprms, ltrnval from trdtrn where trdr=' + CUSTOMER.TRDR + ' and tprms in (3500,3501,3502,3999,5016,5017)', null);
    Ds14 = X.GETSQLDATASET('select sumamnt as suma from findoc where fprms=1201 and trdr=' + CUSTOMER.TRDR, null);
    suma_incerti = Ds14.suma;

    vIncerti = 0;
    vPierdut = 0;
    vIncasat = 0;
    Ds13.FIRST;
    while (!Ds13.Eof) {
        if (Ds13.tprms == 3500) {
            vIncerti = vIncerti + Ds13.ltrnval;
        } else
        if (Ds13.tprms == 3501) {
            vIncerti = vIncerti - Ds13.ltrnval;
        } else
        if (Ds13.tprms == 3502) {
            vPierdut = vPierdut + Ds13.ltrnval;
        } else
            vIncasat = vIncasat + Ds13.ltrnval;
        Ds13.NEXT;
    }

    CCCSOLDCOTIZATIE.APPEND;
    CCCSOLDCOTIZATIE.CCCDEUR = suma_eur;
    CCCSOLDCOTIZATIE.CCCDRON = suma_ron - suma_incerti;
    CCCSOLDCOTIZATIE.INCERTI = vIncerti;
    CCCSOLDCOTIZATIE.PIERDUT = vPierdut;
    CCCSOLDCOTIZATIE.INCASAT = vIncasat;
    CCCSOLDCOTIZATIE.POST;
}

function ON_SFGARANTII_SHOW() {
    CCCGARANTII.FIRST;
    while (!CCCGARANTII.Eof) {
        CCCGARANTII.DELETE;
    }

    Ds = X.GETSQLDATASET('SELECT SERIES, DATEOFS, FINALDATE, SOCURRENCY, CHEQUEBAL ' +
        'FROM CHEQUE ' +
        'WHERE TRDR=' + CUSTOMER.TRDR, null);
    Ds.FIRST;
    while (!Ds.Eof) {
        CCCGARANTII.APPEND;
        if (Ds.SERIES == 2000)
            CCCGARANTII.CCCTIP = 'Fond de garantie';
        if (Ds.SERIES == 3000)
            CCCGARANTII.CCCTIP = 'Garantie numerar';
        if (Ds.SERIES == 4000)
            CCCGARANTII.CCCTIP = 'Scrisoare de garantie';

        CCCGARANTII.CCCDATAS = Ds.DATEOFS;
        CCCGARANTII.CCCDATAF = Ds.FINALDATE;
        ce_valuta = X.SQL('select name from socurrency where socurrency=' + Ds.SOCURRENCY, null);
        CCCGARANTII.CCCVALUTA = ce_valuta;
        CCCGARANTII.CCCVALOARE = Ds.CHEQUEBAL;
        CCCGARANTII.POST;
        Ds.NEXT;
    }
}

function salvare_modificare() {
    ceZip = CUSTOMER.ZIP;
    if (!CUSTOMER.ZIP)
        ceZip = 0;

    ceAreas = CUSTOMER.AREAS;
    if (!CUSTOMER.AREAS)
        ceAreas = 0;

    cePersFj = CUSTOMER.CCCPERSFJ;
    if (!CUSTOMER.CCCPERSFJ)
        cePersFj = 0;

    ceDistrict1 = CUSTOMER.DISTRICT1;
    if (!CUSTOMER.DISTRICT1)
        ceDistrict1 = 0;

    ceNume = CUSTOMER.NAME;
    ceNume = ceNume.replace("'", '');

    lcString = 'select count(*) as cate from trdr where sodtype=13 and trdr=' + CUSTOMER.TRDR + ' and code=' + String.fromCharCode(39) + CUSTOMER.CODE + String.fromCharCode(39) +
        ' and name=' + String.fromCharCode(39) + ceNume + String.fromCharCode(39) + ' and isnull(afm,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.AFM + String.fromCharCode(39) +
        ' and country=' + CUSTOMER.COUNTRY + ' and isnull(address,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.ADDRESS + String.fromCharCode(39) +
        ' and isnull(zip,0)=' + ceZip + ' and isnull(district,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.DISTRICT + String.fromCharCode(39) +
        ' and isnull(city,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.CITY + String.fromCharCode(39) + ' and isnull(district1,0)=' + ceDistrict1 +
        ' and isnull(areas,0)=' + ceAreas + ' and isnull(phone01,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.PHONE01 + String.fromCharCode(39) +
        ' and isnull(phone02,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.PHONE02 + String.fromCharCode(39) + '  and isnull(fax,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.FAX + String.fromCharCode(39) +
        ' and isnull(email,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.EMAIL + String.fromCharCode(39) + ' and isnull(cccindfisc,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.CCCINDFISC + String.fromCharCode(39) + ' and isnull(cccpersfj,0)=' + cePersFj +
        ' and isnull(cccadresa,' + String.fromCharCode(39) + String.fromCharCode(39) + ')=' + String.fromCharCode(39) + CUSTOMER.CCCADRESA + String.fromCharCode(39);

    Ds = X.GETSQLDATASET(lcString, null);

    if (Ds.cate == 0) {
        lcString = 'insert into ccctrdr (trdr, code, name, afm, country, address, zip, district, city, district1, areas, phone01, phone02,' +
            ' fax, email, cccpersfj, cccindfisc, cccadresa, action, users, userdate) values (' + CUSTOMER.TRDR + ',' + String.fromCharCode(39) + CUSTOMER.CODE + String.fromCharCode(39) + ',' +
            String.fromCharCode(39) + ceNume + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.AFM + String.fromCharCode(39) + ',' +
            CUSTOMER.COUNTRY + ',' + String.fromCharCode(39) + CUSTOMER.ADDRESS + String.fromCharCode(39) + ',' + ceZip + ',' + String.fromCharCode(39) + CUSTOMER.DISTRICT + String.fromCharCode(39) +
            ',' + String.fromCharCode(39) + CUSTOMER.CITY + String.fromCharCode(39) + ',' + ceDistrict1 + ',' + ceAreas + ',' +
            String.fromCharCode(39) + CUSTOMER.PHONE01 + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.PHONE02 + String.fromCharCode(39) +
            ',' + String.fromCharCode(39) + CUSTOMER.FAX + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.EMAIL + String.fromCharCode(39) + ',' + cePersFj +
            ',' + String.fromCharCode(39) + CUSTOMER.CCCINDFISC + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.CCCADRESA + String.fromCharCode(39) +
            ',' + String.fromCharCode(39) + 'Modificare' + String.fromCharCode(39) + ',' + X.SYS.USER + ', getdate())';

        X.RunSQL(lcString, null);
    }
}

function salvare_nou() {
    ceZip = CUSTOMER.ZIP;
    if (!CUSTOMER.ZIP)
        ceZip = 0;

    ceAreas = CUSTOMER.AREAS;
    if (!CUSTOMER.AREAS)
        ceAreas = 0;

    cePersFj = CUSTOMER.CCCPERSFJ;
    if (!CUSTOMER.CCCPERSFJ)
        cePersFj = 0;

    ceDistrict1 = CUSTOMER.DISTRICT1;
    if (!CUSTOMER.DISTRICT1)
        ceDistrict1 = 0;

    lcString = 'insert into ccctrdr (trdr, code, name, afm, country, address, zip, district, city, district1, areas, phone01, phone02,' +
        ' fax, email, cccpersfj, cccindfisc, cccadresa, action, users, userdate) values (' + CUSTOMER.TRDR + ',' + String.fromCharCode(39) + CUSTOMER.CODE + String.fromCharCode(39) + ',' +
        String.fromCharCode(39) + CUSTOMER.NAME + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.AFM + String.fromCharCode(39) + ',' +
        CUSTOMER.COUNTRY + ',' + String.fromCharCode(39) + CUSTOMER.ADDRESS + String.fromCharCode(39) + ',' + ceZip + ',' + String.fromCharCode(39) + CUSTOMER.DISTRICT + String.fromCharCode(39) +
        ',' + String.fromCharCode(39) + CUSTOMER.CITY + String.fromCharCode(39) + ',' + ceDistrict1 + ',' + ceAreas + ',' +
        String.fromCharCode(39) + CUSTOMER.PHONE01 + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.PHONE02 + String.fromCharCode(39) +
        ',' + String.fromCharCode(39) + CUSTOMER.FAX + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.EMAIL + String.fromCharCode(39) + ',' + cePersFj +
        ',' + String.fromCharCode(39) + CUSTOMER.CCCINDFISC + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.CCCADRESA + String.fromCharCode(39) +
        ',' + String.fromCharCode(39) + 'Adaugare' + String.fromCharCode(39) + ',' + X.SYS.USER + ', getdate())';

    X.RunSQL(lcString, null);

}

function salvare_stergere() {
    ceZip = CUSTOMER.ZIP;
    if (!CUSTOMER.ZIP)
        ceZip = 0;

    ceAreas = CUSTOMER.AREAS;
    if (!CUSTOMER.AREAS)
        ceAreas = 0;

    cePersFj = CUSTOMER.CCCPERSFJ;
    if (!CUSTOMER.CCCPERSFJ)
        cePersFj = 0;

    ceDistrict1 = CUSTOMER.DISTRICT1;
    if (!CUSTOMER.DISTRICT1)
        ceDistrict1 = 0;

    lcString = 'insert into ccctrdr (trdr, code, name, afm, country, address, zip, district, city, district1, areas, phone01, phone02,' +
        ' fax, email, cccpersfj, cccindfisc, cccadresa, action, users, userdate) values (' + CUSTOMER.TRDR + ',' + String.fromCharCode(39) + CUSTOMER.CODE + String.fromCharCode(39) + ',' +
        String.fromCharCode(39) + CUSTOMER.NAME + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.AFM + String.fromCharCode(39) + ',' +
        CUSTOMER.COUNTRY + ',' + String.fromCharCode(39) + CUSTOMER.ADDRESS + String.fromCharCode(39) + ',' + ceZip + ',' + String.fromCharCode(39) + CUSTOMER.DISTRICT + String.fromCharCode(39) +
        ',' + String.fromCharCode(39) + CUSTOMER.CITY + String.fromCharCode(39) + ',' + ceDistrict1 + ',' + ceAreas + ',' +
        String.fromCharCode(39) + CUSTOMER.PHONE01 + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.PHONE02 + String.fromCharCode(39) +
        ',' + String.fromCharCode(39) + CUSTOMER.FAX + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.EMAIL + String.fromCharCode(39) + ',' + cePersFj +
        ',' + String.fromCharCode(39) + CUSTOMER.CCCINDFISC + String.fromCharCode(39) + ',' + String.fromCharCode(39) + CUSTOMER.CCCADRESA + String.fromCharCode(39) +
        ',' + String.fromCharCode(39) + 'Stergere' + String.fromCharCode(39) + ',' + X.SYS.USER + ', getdate())';

    X.RunSQL(lcString, null);

}

function ON_CUSTOMER_TRDBUSINESS_VALIDATE() {
    Ds = X.GETSQLDATASET('select groups from users where users=' + X.SYS.USER, null);
    if (Ds.groups != 600)
        X.EXCEPTION('Nu aveti dreptul sa modificati categoria comerciala a unui client');
}

function ON_CUSTOMER_CCCASOCIATIE() {
    Ds = X.GETSQLDATASET('select tara from cccasociatie where cccasociatie=' + CUSTOMER.CCCASOCIATIE, null);
    CUSTOMER.CCCCOUNTRY = Ds.tara;
}

function CountGetOpenAPI(afm, tipInterogare) {
    myObj = X.CREATEOBJ('CCCSERRACFHCOUNT');
    try {
        CustTbl = myObj.FINDTABLE('CCCSERRACFHCOUNT');
        myObj.DBINSERT;
        CustTbl.TYPE = tipInterogare;
        CustTbl.INSUSER = X.SYS.USER;
        sSQL = 'select getdate() dataInterogare';
        ds = X.GETSQLDATASET(sSQL, null);
        CustTbl.INSDATE = ds.dataInterogare;
        CustTbl.AFM = afm;
        newid = myObj.DBPOST;
        //X.WARNING('New ID is:'+newid);
    } catch (e) {
        //X.WARNING('Error: '+myObj.GETLASTERROR);
    }
}

function GetOpenAPI(Companies, cheie) {
    var xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    xmlhttp.open("GET", "https://api.openapi.ro/api/companies/" + Companies, false);
    xmlhttp.setRequestHeader('x-api-key', cheie);
    xmlhttp.send("");
    //X.WARNING("Response code was: " + xmlhttp.responseText);
    eval('var data = ' + xmlhttp.responseText);

    CountGetOpenAPI(Companies, 2);
    //X.WARNING(xmlhttp.status);
    if (xmlhttp.status == 202) {
        X.EXCEPTION('Codul fiscal introdus este valid, dar nu se gaseste in baza de date!..');
    }

    if (xmlhttp.status == 404) {
        X.EXCEPTION('Codul fiscal introdus nu este valid!..');
    }

    tva = data.tva;
    if ((tva == 'null') || (!tva))
        tva = 0;
    else
        tva = 1;
    zip = data.cod_postal;
    name = data.denumire;
    jobtypetrd = data.numar_reg_com;
    address = data.adresa;
    city = data.judet;
    phone = data.telefon;
    stare = data.stare;
    radiata = data.radiata;

    if (data.tva_la_incasare.length > 0) {
        i = 0;
        while (i < data.tva_la_incasare.length) {
            if (data.tva_la_incasare[i].tip == 'I')
                tva_la_incasare = 1;
            if (data.tva_la_incasare[i].tip == 'D')
                tva_la_incasare = 0;
            i = i + 1;
        }
    } else
        tva_la_incasare = 0;

    lcString = 'Preluati datele de mai jos?' + String.fromCharCode(13) + String.fromCharCode(10);
    lcString = lcString + String.fromCharCode(13) + String.fromCharCode(10);

    lcString = lcString + 'Denumire client: ' + name + String.fromCharCode(13) + String.fromCharCode(10);
    if (tva == 1)
        lcString = lcString + 'Platitor de TVA: DA' + String.fromCharCode(13) + String.fromCharCode(10);
    else
        lcString = lcString + 'Platitor de TVA: NU' + String.fromCharCode(13) + String.fromCharCode(10);
    if (tva_la_incasare == 1)
        lcString = lcString + 'TVA la incasare: DA' + String.fromCharCode(13) + String.fromCharCode(10);
    else
        lcString = lcString + 'TVA la incasare: NU' + String.fromCharCode(13) + String.fromCharCode(10);
    lcString = lcString + 'Stare: ' + stare + String.fromCharCode(13) + String.fromCharCode(10);
    if (radiata == 'true')
        lcString = lcString + 'Radiata: ' + 'DA' + String.fromCharCode(13) + String.fromCharCode(10);
    else
        lcString = lcString + 'Radiata: ' + 'NU' + String.fromCharCode(13) + String.fromCharCode(10);

    lcString = lcString + String.fromCharCode(13) + String.fromCharCode(10);

    lcString = lcString + 'Adresa: ' + address + String.fromCharCode(13) + String.fromCharCode(10);
    lcString = lcString + 'Oras: ' + city + String.fromCharCode(13) + String.fromCharCode(10);

    vAnswer = X.ASK('Preluare date', lcString);

    if (vAnswer == 6) {
        //CUSTOMER.TRDCATEGORY = 3000;
        name = name.replace('\u0219', 's');
        name = name.replace('\u0218', 'S');
        name = name.replace('\u021A', 'T');
        name = name.replace('\u021B', 't');
        CUSTOMER.NAME = name;
        if (tva == 1)
            CUSTOMER.CCCINDFISC = 'RO';

        address = address.replace('\u0219', 's');
        address = address.replace('\u0218', 'S');
        address = address.replace('\u021A', 'T');
        address = address.replace('\u021B', 't');
        CUSTOMER.ADDRESS = address;
        CUSTOMER.ZIP = zip;

        city = city.replace('\u0219', 's');
        city = city.replace('\u0218', 'S');
        city = city.replace('\u021A', 'T');
        city = city.replace('\u021B', 't');
        CUSTOMER.CITY = city;
        CUSTOMER.PHONE01 = phone;
        CUSTOMER.BGBULSTAT = jobtypetrd;
        CUSTOMER.CCCPERSFJ = 2;
    }
}

//18.12.2020, Cosmin, Integrare IRU/AskTir web
//--------------------------------------------
function createHaulierEnvelope() {
    //debugger;
    var d2 = new Date(CUSTOMER.CCCADERARETIR);

    if (d2.getFullYear() == 1899)
        return '1899';
    else {
        var haulierXML = initHaulier();
        if (haulierXML.isError) {
            X.WARNING(haulierXML.message);
            return 'xmlError';
        }

        var env = '<soap:Envelope ' +
            'xmlns:com="' + commonModel + '" ' +
            'xmlns:nsHaulierModel="' + haulierModel + '" ' +
            'xmlns:soap="' + w3Env + '" ' +
            'xmlns:nsHaulierService="' + haulierServiceProd + '">' +
            objSecHed.createHeader() +
            '<soap:Body>' + haulierXML.message + '</soap:Body>' +
            '</soap:Envelope>',
            xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
        xmlDoc.async = 'false';
        xmlDoc.loadXML(env.replace(/\r\n/g, ''));
        var parseErr = xmlDoc.parseError;
        if (parseErr.errorCode != 0) {
            X.WARNING(parseErr.reason);
            return 'xmlError';
        }

        var ret = xmlDoc.xml.replace(/\r\n/g, '').replace('^M', '');
        if (debugg_mode)
            X.WARNING(ret);
        return ret;
    }
}

function createVehicleEnvelope() {
    var vehicleXML = initVehicle();
    if (vehicleXML.isError) {
        X.WARNING(vehicleXML.message);
        return 'xmlError';
    }

    var env = '<soap:Envelope ' +
        'xmlns:com="' + commonModel + '" ' +
        'xmlns:veh="' + vehicleModel + '" ' +
        'xmlns:soap="' + w3Env + '" ' +
        'xmlns:tir="' + haulierServiceProd + '">' +
        objSecHed.createHeader() +
        '<soap:Body>' + vehicleXML.message + '</soap:Body>' +
        '</soap:Envelope>',
        xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
    xmlDoc.async = 'false';
    xmlDoc.loadXML(env.replace(/\r\n/g, ''));
    var parseErr = xmlDoc.parseError;
    if (parseErr.errorCode != 0) {
        X.WARNING(parseErr.reason);
        return 'xmlError';
    }

    var ret = xmlDoc.xml.replace(/\r\n/g, '').replace('^M', '');
    if (debugg_mode)
        X.WARNING(ret);
    return ret;
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

function sendHaulierToIRU(url) {
    var xmlHttp = createRequest(),
        soap = createHaulierEnvelope().replace(/\r\n/g, '').replace('^M', ''),
        msg = '';
    if (soap == '1899') {
        X.WARNING('Nu s-a transmis nimic.\nVerificati data admitere TIR.');
        return;
    } else if (soap == 'xmlError') {
        return;
    }

    response_from_IRU = '';

    xmlHttp.open("POST", url, true);
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp && xmlHttp.readyState && xmlHttp.readyState == 4) {
            //debugger;
            xmlResponse = xmlHttp.responseXML;
            //TODO:
            //X.RUNSQL("INSERT INTO CCCXML2IRU (SENDER, XML, RESPONSE, INSDATE, TRDR, CONNECTIONSTATUS) VALUES (1, '"+soap.replace(/"/g, "**")+"', '"+xmlResponse.text.replace(/"/g, "**")+"', getDate(), "+CUSTOMER.TRDR+", "+xmlHttp.status+")", null);
            //The provided entity already exist
            if (xmlResponse.text.indexOf('The provided haulier already exist') !== -1) {
                msg = 'Transportatorul fost introdus anterior.';
            } else {
                msg = decode_utf8(xmlResponse.text);
            }

            response_from_IRU += msg + '\n';

            if (debugg_mode)
                X.WARNING(msg);

            //xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            //xmlDoc.async = "false";
            //xmlDoc.loadXML(xmlResponse.xml);

            //} else {
            //    X.WARNING('HTTP status:' + xmlHttp.status + '\n' + xmlHttp.responseText);
            //}
        }
    };
    xmlHttp.setRequestHeader("Host", hostDemo);
    xmlHttp.setRequestHeader("Accept-Encoding", "identity");
    xmlHttp.setRequestHeader("Content-Type", 'application/xml;charset=UTF-8;action="' + haulierServiceProd + '/createHaulier"');
    xmlHttp.setRequestHeader("Content-Length", lengthInUtf8Bytes(soap));
    xmlHttp.setRequestHeader("Connection", "Keep-Alive");
    xmlHttp.send(soap);
}

function sendVehicleToIRU(url) {
    var xmlHttp = createRequest(),
        soap = createVehicleEnvelope().replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '').replace('^M', ''),
        msg = '',
        nr_linie = TRUCKS.RECNO,
        nrVeh = X.SQL('SELECT NAME FROM TRUCKS WHERE TRUCKS=' + TRUCKS.TRUCKS + ' AND TRDR=' + CUSTOMER.TRDR, null);

    if (soap == 'xmlError') {
        return;
    }

    xmlHttp.open("POST", url, true);
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp && xmlHttp.readyState && xmlHttp.readyState == 4) {
            //debugger;
            xmlResponse = xmlHttp.responseXML;
            X.RUNSQL("INSERT INTO CCCXML2IRU (SENDER, XML, RESPONSE, INSDATE, TRDR, CONNECTIONSTATUS) VALUES (2, '" + soap.replace(/"/g, "**") + "', '" + xmlResponse.text.replace(/"/g, "**") + "', getDate(), " + CUSTOMER.TRDR + ", " + xmlHttp.status + ")", null);
            //The provided entity already exist
            if (xmlResponse.text.indexOf('The provided vehicle already exist') !== -1) {
                msg = 'Vehiculul cu numarul ' + nrVeh + ' a fost introdus anterior.';
            } else {
                //msg = nrVeh + '\n' + decode_utf8(xmlResponse.text);
                msg = nrVeh + '\n' + decode_utf8(xmlResponse.text);
            }

            response_from_IRU += msg + '\n';

            if (debugg_mode)
                X.WARNING(msg);

            vehCallBack(nr_linie);

            //xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            //xmlDoc.async = "false";
            //xmlDoc.loadXML(xmlResponse.xml);

            //} else {
            //    X.WARNING('HTTP status:' + xmlHttp.status + '\n' + xmlHttp.responseText);
            //}
        }
    };
    xmlHttp.setRequestHeader("Host", hostDemo);
    xmlHttp.setRequestHeader("Accept-Encoding", "identity");
    xmlHttp.setRequestHeader("Content-Type", 'application/soap+xml;charset=UTF-8;action="' + haulierServiceProd + '/createVehicle"');
    xmlHttp.setRequestHeader("Content-Length", lengthInUtf8Bytes(soap));
    xmlHttp.send(soap);
}

function vehCallBack(nr_linie) {
    if (nr_linie == TRUCKS.RECORDCOUNT) {
        if (response_from_IRU.length > 0) {
            X.WARNING(response_from_IRU);
        }
    }
}

// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i = 1; i < data.length; i++) {
        currChar = data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        } else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase = currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i = 0; i < out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i = 1; i < data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        } else {
            phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }

    return out.join("");
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
    return encodeURIComponent(s);
}

function decode_utf8(s) {
    return decodeURIComponent(s);
}

//end

//Haulier interface
function ON_LOCATE() {
    loadSecureHeader();

    //test
    //debugger;
    //var ret = initHaulier();
    //X.WARNING('isError=' + ret.isError + '\n' + ret.message);
}

function createHaulier(nsHaulierService, nsHaulierModel, nsCommon) {
    var _haulier_ns = {
            Count: 0,
            Start: {
                XML: function () {
                    return '<' + nsHaulierService + ':haulier>';
                }
            },
            Id: {
                UI: null,
                requiredInXMLSchema: true,
                XML: function () {
                    if (this.UI)
                        return '<' + nsHaulierModel + ':Id>' + 'ROU/050/' + this.UI.toString() + '</' + nsHaulierModel + ':Id>';
                    else
                        return '';
                }
            },
            OrganisationName: {
                UI: '',
                requiredInXMLSchema: true,
                XML: function () {
                    if (this.UI)
                        return '<' + nsHaulierModel + ':OrganisationName>' + this.UI + '</' + nsHaulierModel + ':OrganisationName>';
                    else
                        return '';
                }
            },
            NationalityType: {
                UI: '',
                requiredInXMLSchema: true,
                XML: function () {
                    if (this.UI)
                        return '<' + nsHaulierModel + ':NationalityType>' + this.UI + '</' + nsHaulierModel + ':NationalityType>';
                    else
                        return '';
                }
            },
            Stop: {
                XML: function () {
                    return '</' + nsHaulierService + ':haulier>';
                }
            }
        },
        _legalLocation_ns = {
            Count: 0,
            Start: {
                XML: function () {
                    return '<' + nsHaulierService + ':legalLocation>';
                }
            },
            Addressee: {
                UI: null,
                requiredInXMLSchema: true,
                XML: function () {
                    if (this.UI)
                        return '<' + nsCommon + ':Addressee>' + this.UI + '</' + nsCommon + ':Addressee>';
                    else
                        return '';
                }
            },
            Address: {
                Count: 0,
                Start: {
                    XML: function () {
                        return '<' + nsCommon + ':Address>';
                    }
                },
                AddressLine: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + nsCommon + ':AddressLines><' + nsCommon + ':AddressLine>' + this.UI + '</' + nsCommon + ':AddressLine></' + nsCommon + ':AddressLines>';
                        else
                            return '';
                    }
                },
                Locality: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + nsCommon + ':Locality>' + this.UI + '</' + nsCommon + ':Locality>';
                        else
                            return '';
                    }
                },
                PostalCode: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + nsCommon + ':PostalCode>' + this.UI + '</' + nsCommon + ':PostalCode>';
                        else
                            return '';
                    }
                },
                CountryCode: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + nsCommon + ':CountryCode>' + this.UI + '</' + nsCommon + ':CountryCode>';
                        else
                            return '';
                    }
                },
                Stop: {
                    XML: function () {
                        return '</' + nsCommon + ':Address>';
                    }
                }
            },
            CommunicationMeans: {
                Count: 0,
                Start: {
                    XML: function () {
                        return '<' + nsCommon + ':CommunicationMeans>';
                    }
                },
                EmailAddress: {
                    UI: null,
                    requiredInXMLSchema: false,
                    XML: function () {
                        if (this.UI)
                            return '<' + nsCommon + ':EmailAddress type="type" usage="EmailAddress"' + this.UI + '</' + nsCommon + ':EmailAddress';
                        else
                            return '';
                    }
                },
                PhoneNumber: {
                    UI: null,
                    requiredInXMLSchema: false,
                    XML: function () {
                        if (this.UI)
                            return '<' + nsCommon + ':PhoneNumber type="type" usage="PhoneNumber">' + this.UI + '</' + nsCommon + ':PhoneNumber>';
                        else
                            return '';
                    }
                },
                FaxNumber: {
                    UI: null,
                    requiredInXMLSchema: false,
                    XML: function () {
                        if (this.UI)
                            return '<' + nsCommon + ':FaxNumber type="type" usage="FaxNumber"' + this.UI + '</' + nsCommon + ':FaxNumber';
                        else
                            return '';
                    }
                },
                Stop: {
                    XML: function () {
                        return '</' + nsCommon + ':CommunicationMeans>';
                    }
                }
            },
            Stop: {
                XML: function () {
                    return '</' + nsHaulierService + ':legalLocation>';
                }
            }
        },
        _otherLocations_ns = {},
        _applicationDate = null,
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
        set_haulier_ns: function (IdUiRef, Id, ONUiRef, OrganisationName, NTRef, NationalityType) {
            if (bindUI(IdUiRef, Id, _haulier_ns.Id))
                _haulier_ns.Count++;
            if (bindUI(ONUiRef, OrganisationName, _haulier_ns.OrganisationName))
                _haulier_ns.Count++;
            var nat = (NationalityType == 179) ? 'NATIONAL' : 'FOREIGN';
            if (bindUI(NTRef, nat, _haulier_ns.NationalityType))
                _haulier_ns.Count++;
        },
        set_legalLocation_ns: function (AddresseeUiRef, Addressee, AddressLineUiRef, AddressLine, LocalityUiRef, Locality, PostalCodeUiRef, PostalCode, CountryCodeUiRef, CountryCode) {
            if (bindUI(AddresseeUiRef, Addressee, _legalLocation_ns.Addressee))
                _legalLocation_ns.Count++;
            if (bindUI(AddressLineUiRef, AddressLine, _legalLocation_ns.Address.AddressLine))
                _legalLocation_ns.Address.Count++;
            if (bindUI(LocalityUiRef, Locality, _legalLocation_ns.Address.Locality))
                _legalLocation_ns.Address.Count++;
            if (bindUI(PostalCodeUiRef, PostalCode, _legalLocation_ns.Address.PostalCode))
                _legalLocation_ns.Address.Count++;
            if (bindUI(CountryCodeUiRef, CountryCode, _legalLocation_ns.Address.CountryCode))
                _legalLocation_ns.Address.Count++;
        },
        set_otherLocations_ns: function () {},
        set_applicationDate: function (UIRef, applicationDate) {
            if (typeof applicationDate == 'date') {
                _applicationDate = new Date(applicationDate).toISOString();
            } else {
                _errString += UIRef + '\n';
            }
        },
        get_Messages: function () {
            return _errString;
        },
        get_XML: function () {
            var wrap1 = '<' + nsHaulierService + ':createHaulier>',
                wrap2 = '',
                main = '';
            if (_haulier_ns.Count)
                main += _haulier_ns.Start.XML() +
                _haulier_ns.Id.XML() +
                _haulier_ns.OrganisationName.XML() +
                _haulier_ns.NationalityType.XML() +
                _haulier_ns.Stop.XML();

            if (_legalLocation_ns.Count)
                main += _legalLocation_ns.Start.XML() +
                _legalLocation_ns.Addressee.XML();

            if (_legalLocation_ns.Address.Count)
                main += _legalLocation_ns.Address.Start.XML() +
                _legalLocation_ns.Address.AddressLine.XML() +
                _legalLocation_ns.Address.Locality.XML() +
                _legalLocation_ns.Address.PostalCode.XML() +
                _legalLocation_ns.Address.CountryCode.XML() +
                _legalLocation_ns.Address.Stop.XML();

            if (_legalLocation_ns.CommunicationMeans.Count)
                main += _legalLocation_ns.CommunicationMeans.Start.XML() +
                _legalLocation_ns.CommunicationMeans.EmailAddress.XML() +
                _legalLocation_ns.CommunicationMeans.PhoneNumber.XML() +
                _legalLocation_ns.CommunicationMeans.FaxNumber.XML() +
                _legalLocation_ns.CommunicationMeans.Stop.XML();

            main += _legalLocation_ns.Stop.XML();
            wrap2 = '<' + nsHaulierService + ':applicationDate>' + _applicationDate + '</' + nsHaulierService + ':applicationDate>' + '</' + nsHaulierService + ':createHaulier>';

            var ret = main ? wrap1 + main + wrap2 : '';

            return ret;
        }
    }
}

function initHaulier() {
    var h = createHaulier('nsHaulierService', 'nsHaulierModel', 'com');
    h.set_haulier_ns('CUSTOMER.CODE1', encode_utf8(CUSTOMER.CODE1), 'CUSTOMER.NAME', encode_utf8(CUSTOMER.NAME), 'CUSTOMER.COUNTRY', CUSTOMER.COUNTRY);
    var completare = (CUSTOMER.CCCADRESA) ? ',' + CUSTOMER.CCCADRESA : '',
        adresaCompleta = encode_utf8(CUSTOMER.ADDRESS) + encode_utf8(completare);
    adresaCompleta = adresaCompleta.replace(',', '').replace('.', '');
    h.set_legalLocation_ns('SEDIU', 'SEDIU', 'CUSTOMER.ADDRESS', adresaCompleta, 'CUSTOMER.CITY', encode_utf8(CUSTOMER.CITY), 'CUSTOMER.ZIP', CUSTOMER.ZIP, 'ROU', 'ROU');
    h.set_applicationDate('CUSTOMER.CCCADERARETIR', CUSTOMER.CCCADERARETIR);

    var mess = h.get_Messages();
    if (mess.length) {
        return {
            isError: true,
            message: 'Urmatoarele campuri sunt obligatorii:\n' + mess
        };
    } else {
        return {
            isError: false,
            message: h.get_XML()
        };
    }
}

function createVehicle(tir, veh, com) {
    var _haulier_ns = {
            Count: 0,
            haulierId: {
                UI: null,
                requiredInXMLSchema: true,
                XML: function () {
                    if (this.UI)
                        return '<' + tir + ':haulierId>' + 'ROU/050/' + this.UI + '</' + tir + ':haulierId>';
                    else
                        return '';
                }
            }
        },
        _vehicle_ns = {
            Count: 0,
            Start: {
                XML: function () {
                    return '<' + tir + ':vehicle>';
                }
            },
            Make: {
                UI: null,
                requiredInXMLSchema: false,
                XML: function () {
                    if (this.UI)
                        return '<' + veh + ':Make>' + this.UI + '</' + veh + ':Make>';
                    else
                        return '';
                }
            },
            PayloadWeightMeasure: {
                UI: null,
                requiredInXMLSchema: false,
                XML: function () {
                    if (this.UI)
                        return '<' + veh + ':PayloadWeightMeasure>' + this.UI + '</' + veh + ':PayloadWeightMeasure>';
                    else
                        return '';
                }
            },
            Type: {
                Count: 0,
                Start: {
                    XML: function () {
                        return '<' + veh + ':Type>';
                    }
                },
                TypeCode: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + veh + ':TypeCode type="http://www.asktirweb.org/vehicle/type">' + this.UI + '</' + veh + ':TypeCode>';
                        else
                            return '';
                    }
                },
                Stop: {
                    XML: function () {
                        return '</' + veh + ':Type>';
                    }
                }
            },
            RegistrationNumber: {
                Count: 0,
                Start: {
                    XML: function () {
                        return '<' + veh + ':RegistrationNumber>';
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
                Type: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + com + ':Type>http://www.asktirweb.org/vehicle/registration-number</' + com + ':Type>';
                        else
                            return '';
                    }
                },
                Stop: {
                    XML: function () {
                        return '</' + veh + ':RegistrationNumber>';
                    }
                }
            },
            ContractualRelationship: {
                Count: 0,
                Start: {
                    XML: function () {
                        return '<' + veh + ':ContractualRelationship>';
                    }
                },
                Type: {
                    UI: null,
                    requiredInXMLSchema: true,
                    XML: function () {
                        if (this.UI)
                            return '<' + com + ':Type>' + this.UI + '</' + com + ':Type>';
                        else
                            return '';
                    }
                },
                Stop: {
                    XML: function () {
                        return '</' + veh + ':ContractualRelationship>';
                    }
                }
            },
            Stop: {
                XML: function () {
                    return '</' + tir + ':vehicle>';
                }
            },
        }
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
        set_haulier_ns: function (IdUiRef, Id) {
            if (bindUI(IdUiRef, Id, _haulier_ns.haulierId))
                _haulier_ns.Count++;
        },
        set_vehicle_ns: function (MakeUiRef, Make, PWMUIRef, PayloadWeightMeasure) {
            if (bindUI(MakeUiRef, Make, _vehicle_ns.Make))
                _vehicle_ns.Count++;
            if (bindUI(PWMUIRef, PayloadWeightMeasure, _vehicle_ns.PayloadWeightMeasure))
                _vehicle_ns.Count++;
        },
        set_Type_ns: function (TypeCodeUiRef, TypeCode) {
            if (bindUI(TypeCodeUiRef, TypeCode, _vehicle_ns.Type.TypeCode))
                _vehicle_ns.Type.Count++;
        },
        set_RegistrationNumber_ns: function (IdUiRef, Id, TypeUiRef, Type) {
            if (bindUI(IdUiRef, Id, _vehicle_ns.RegistrationNumber.Id))
                _vehicle_ns.RegistrationNumber.Count++;
            if (bindUI(TypeUiRef, Type, _vehicle_ns.RegistrationNumber.Type))
                _vehicle_ns.RegistrationNumber.Count++;
        },
        set_ContractualRelationship_ns: function (TypeUiRef, Type) {
            if (bindUI(TypeUiRef, Type, _vehicle_ns.ContractualRelationship.Type))
                _vehicle_ns.ContractualRelationship.Count++;
        },
        get_Messages: function () {
            return _errString;
        },
        get_XML: function () {
            var wrap1 = '<' + tir + ':createVehicle>',
                wrap2 = '',
                main = '';
            if (_haulier_ns.Count)
                main += _haulier_ns.haulierId.XML();

            main += _vehicle_ns.Start.XML();

            main += '<veh:InQuota>false</veh:InQuota>';

            if (_vehicle_ns.Count)
                main += _vehicle_ns.Make.XML() +
                _vehicle_ns.PayloadWeightMeasure.XML();

            if (_vehicle_ns.Type.Count)
                main += _vehicle_ns.Type.Start.XML() +
                _vehicle_ns.Type.TypeCode.XML() +
                _vehicle_ns.Type.Stop.XML();

            if (_vehicle_ns.RegistrationNumber.Count)
                main += _vehicle_ns.RegistrationNumber.Start.XML() +
                _vehicle_ns.RegistrationNumber.Id.XML() +
                _vehicle_ns.RegistrationNumber.Type.XML() +
                _vehicle_ns.RegistrationNumber.Stop.XML();

            if (_vehicle_ns.ContractualRelationship.Count)
                main += _vehicle_ns.ContractualRelationship.Start.XML() +
                _vehicle_ns.ContractualRelationship.Type.XML() +
                _vehicle_ns.ContractualRelationship.Stop.XML();

            main += _vehicle_ns.Stop.XML();
            wrap2 = '</' + tir + ':createVehicle>';

            var ret = main ? wrap1 + main + wrap2 : '';

            return ret;
        }
    }
}

function initVehicle() {
    var v = createVehicle('tir', 'veh', 'com');
    v.set_haulier_ns('CUSTOMER.CODE1', CUSTOMER.CODE1);
    //debugger;
    v.set_vehicle_ns('TRUCKS.CCCCARMODEL', encode_utf8(X.SQL('SELECT CCCDESC FROM CCCCARMODEL WHERE CCCCARMODEL='+TRUCKS.CCCCARMODEL)), 'TRUCKS.WEIGHT', TRUCKS.WEIGHT);
    v.set_Type_ns('TRUCKS.CCCCARCLASS', encode_utf8(X.SQL('SELECT CCCDESCEN FROM CCCCARCLASS WHERE CCCCARCLASS = ' + TRUCKS.CCCCARCLASS, null)));
    v.set_RegistrationNumber_ns('TRUCKS.TRUCKS', encode_utf8(X.SQL('SELECT NAME FROM TRUCKS WHERE TRUCKS=' + TRUCKS.TRUCKS + ' AND TRDR=' + CUSTOMER.TRDR + ' AND COMPANY=' + X.SYS.COMPANY, null)), 'E', 'E');
    v.set_ContractualRelationship_ns('OWNERSHIP', 'OWNERSHIP');

    var mess = v.get_Messages();
    if (mess.length) {
        return {
            isError: true,
            message: mess
        };
    } else {
        return {
            isError: false,
            message: v.get_XML()
        };
    }
}