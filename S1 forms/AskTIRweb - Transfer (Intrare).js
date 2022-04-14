var cate, num, v1, v2, v3, v4, next, next1, v5, LastSN, ceCant;

function ON_ITELINES_MTRL() {

    myFirstSN = 'SELECT TOP 1 A.FINDOC, A.CODE, A.MTRLINES, B.WHOUSE, B.WHOUSESEC, FC.TRNDATE FROM SNLINES A, MTRLINES B inner join FINDOC FC on B.FINDOC=FC.FINDOC WHERE A.FINDOC   = B.FINDOC AND A.MTRLINES = B.MTRLINES AND A.COMPANY  = ' + X.SYS.COMPANY +
        'AND A.MTRL     = ' + ITELINES.MTRL +
        'AND A.SNTYPE  IN (1,3,5,8,4)' +
        'AND A.APPRV    = 1' +
        'AND A.ISCANCEL = 0 ' +
        'AND ( ( B.WHOUSESEC IS NOT NULL AND B.WHOUSESEC =' + MTRDOC.WHOUSE + ' )' +
        'OR ( B.WHOUSESEC IS NULL AND B.WHOUSE = ' + MTRDOC.WHOUSE + ') )' +
        'AND FC.FINSTATES IN (1) AND A.FINDOC=(SELECT MAX(SN1.FINDOC) FROM SNLINES SN1 JOIN FINDOC FN1 ON SN1.FINDOC=FN1.FINDOC ' +
        'WHERE SN1.MTRL=A.MTRL AND SN1.CODE=A.CODE AND ' +
        'FN1.TRNDATE=(SELECT MAX(FN2.TRNDATE) FROM SNLINES SN2 JOIN FINDOC FN2 ON SN2.FINDOC=FN2.FINDOC ' +
        'WHERE SN2.MTRL=A.MTRL AND SN2.CODE=A.CODE)) ORDER BY FC.TRNDATE, SUBSTRING(A.CODE,3,LEN(A.CODE)-2)';
    DS = X.GETSQLDATASET(myFirstSN, '');

    ITELINES.CCCSNSTART = DS.code;
    myFindoc = DS.findoc;

    myLastSN = 'SELECT MAX(SUBSTRING(CODE,3,LEN(CODE)-2)) as ceCod FROM SNLINES WHERE FINDOC =' + myFindoc + ' and mtrl=' + ITELINES.MTRL + ' and mtrlines=' + DS.MTRLINES;
    DS2 = X.GETSQLDATASET(myLastSN, '');

    next = DS2.ceCod;
    v1 = parseInt(next);
    v3 = X.SQL('SELECT (' + next + '+1)%23 from COMPANY', null);
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
    ITELINES.CCCSNSTOP = num;

    ceFirst = DS.code;
    ceFirst = ceFirst.substring(2);
    ceFirst = parseInt(ceFirst);

    LastSN = num;
    LastSN = LastSN.substring(2);
    LastSN = parseInt(LastSN);

    ceCant = 0;
    ceCant = LastSN - ceFirst + 1;

    primul = DS.code;
    cantcant = 0;

    for (i = 1; i <= ceCant; i++) {

        next = primul.substring(2);
        v1 = parseInt(next);
        v3 = X.SQL('SELECT (' + next + '+1)%23 from COMPANY', null);
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

        numstr = X.EVAL('QuoteStr("' + num + '")');
        usedSN = 'select count(*) as cate from snlines where code=' + numstr + ' and sntype not in  (1,3,5,8)';
        DS3 = X.GETSQLDATASET(usedSN, '');
        estefolosit = DS3.cate;


        if (estefolosit > 0) {
            i = ceCant;
        } else {
            cantcant = cantcant + 1;
            v2 = num.substring(2);
            v5 = parseInt(v2) + 1;
            num = next1 + v5;
            primul = num
        }
    }

    ITELINES.QTY2 = cantcant;
}


function ON_ITELINES_QTY1() {

    nrSnlines = SNLINES.RECORDCOUNT;
    for (i = 1; i <= nrSnlines; i++)
        SNLINES.DELETE;

    ceCant = ITELINES.QTY1;
    primul = ITELINES.CCCSNSTART;

    //if (ceCant>1)
    //{
    for (i = 1; i <= ceCant; i++) {
        next = primul.substring(2);
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
        primul = num;
    }
    //}
    //else
    //{
    //ITELINES.CCCSNSTOP = primul;
    //SNLINES.APPEND;
    //SNLINES.CODE = num;
    //SNLINES.POST;
    //}
}


function ON_ITELINES_CCCSNSTART() {
    num = ITELINES.CCCSNSTART;
    if (num.length != 10)
        X.EXCEPTION('Atentie: Lungimea campului este eronata!');
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
    if (num != ITELINES.CCCSNSTART)
        X.EXCEPTION('Atentie literele de control sunt eronate! Literele corecte sunt: ' + next1);
    ITELINES.QTY1 = 0;
    ITELINES.CCCSNSTOP = '';

}

function ON_MTRDOC_BRANCHSEC() {
    if (ITEDOC.FPRMS == 3001)
        MTRDOC.WHOUSESEC = 90;
}


function ON_RESTOREEVENTS() {
    if (ITEDOC.FPRMS == 3002) {
        MTRDOC.WHOUSESEC = MTRDOC.WHOUSE;
        MTRDOC.WHOUSE = 90;
    }
    if (ITEDOC.FPRMS == 7001) {
        MTRDOC.WHOUSESEC = MTRDOC.WHOUSE;
        MTRDOC.WHOUSE = 90;
    }
}