function generareSerii() {

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

function ON_ITELINES_QTY1() {
    num = ITELINES.CCCSNSTART;
    next = num.substring(2);
    if ((ITELINES.QTY1 != 1) || (parseInt(next) > 0))
        generareSerii();

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

function ON_SALDOC_TRDR() {

    if (SALDOC.TRDR != 0) {
        var mySerie = X.SQL('select isnull(series,0) from series where fprms=3001 and sosource=1351 and branch=' + X.SYS.BRANCH, null);
        if (mySerie > 0)
            SALDOC.SERIES = mySerie;
        else
            X.WARNING('Nu exista serie definita pentru sucursala curenta!');
    }
}