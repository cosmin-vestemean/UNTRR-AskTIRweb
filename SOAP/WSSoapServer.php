<?php
ini_set("soap.wsdl_cache_enabled", "0");

class WSSoapServer
{

    protected $class_name = '';

    public function __construct($class_name)
    {
        $this->class_name = $class_name;
    }

    public function Security($data)
    {
        $username = $data->UsernameToken->Username;
        $password = $data->UsernameToken->Password;
        // check security credentials here
        $this->log("username:", $username);
        $this->log("password:", $password);
    }

    public function authorizeAndCaptureTIRCarnetIssuanceTransaction($params)
    {
        $this->log("authorizeAndCaptureTIRCarnetIssuanceTransaction", $params); // log

        $clientID = $this->get_clientID();

        // creaza factura in S1 din $params
        $doc = $this->getTIRCarnetDespatchAdvice($params);
        $this->invoiceS1WS($clientID, $doc);

        $transactionEntryReference['_'] = '_';
        $transactionEntryReference['type'] = 'type';
        $transactionEntryReference['date'] = gmdate("Y-m-d\TH:i:s\Z");

        return [
            "transactionEntryReference" => new SoapVar($transactionEntryReference, SOAP_ENC_OBJECT)
        ];
    }

    /*
     * login and auth, procure clientID;
     */
    private function get_clientID()
    {
        // connect to S1 WS
        $lr = $this->loginS1WS('webuser1', 'webuser123', '5001');
        $this->debug('login response', $lr);
        $clientID = $this->authS1WS($lr);
        $this->debug('auth response', $clientID);

        return $clientID;
    }

    private function getTIRCarnetDespatchAdvice($params)
    {
        $arr = json_decode(json_encode($params), true);
        $doc['Id'] = $arr['tirCarnetDespatchAdvice']['Id'];
        $doc['IssueDate'] = $arr['tirCarnetDespatchAdvice']['IssueDate'];

        $doc['DesPid'] = $arr['tirCarnetDespatchAdvice']['DespatchParty']['AssociationOffice']['id'];

        $this->debug('W1', $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']);
        $this->debug('W2', isset($arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']));

        if (isset($arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact'])) {
            $doc['DelPFName'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']['firstName'];
            $doc['DelPLName'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']['lastName'];
            $doc['DelPHaulierId'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']['haulierId']; // code > trdr
        }

        if (isset($arr['tirCarnetDespatchAdvice']['DeliveryParty']['AssociationOffice'])) {
            $doc['DelPid'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['AssociationOffice']['id'];
        }

        $this->debug('W3', is_array($arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']));
        $i = 4;
        if (is_array($arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine'])) {
            foreach ($arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine'] as $curr_line) {
                $this->debug("W$i", $curr_line);
                $lines[$i]['LineId'] = $curr_line['Id'];
                $lines[$i]['LineQuantity'] = $curr_line['Quantity'];
                $lines[$i]['LineVoletCount'] = $curr_line['TIRCarnetItem']['VoletCount'];
                $lines[$i]['LineCarnetType'] = $curr_line['TIRCarnetItem']['CarnetType'];
                $lines[$i]['LineFirstTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['FirstTIRCarnetNumber'];
                $lines[$i]['LineLastTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['LastTIRCarnetNumber'];
                $lines[$i]['LineUnitQuantity'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['UnitQuantity'];
                $i ++;
            }
        } else {
            $curr_line = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine'];
            $this->debug("W4", $curr_line);
            $lines[0]['LineId'] = $curr_line['Id'];
            $lines[0]['LineQuantity'] = $curr_line['Quantity'];
            $lines[0]['LineVoletCount'] = $curr_line['TIRCarnetItem']['VoletCount'];
            $lines[0]['LineCarnetType'] = $curr_line['TIRCarnetItem']['CarnetType'];
            $lines[0]['LineFirstTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['FirstTIRCarnetNumber'];
            $lines[0]['LineLastTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['LastTIRCarnetNumber'];
            $lines[0]['LineUnitQuantity'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['UnitQuantity'];
        }

        $this->debug("Lines", $lines);
        $doc['Lines'] = $lines;

        return $doc;
    }

    private function loginS1WS($usr, $pwd, $appId)
    {
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://dev-untrronline.oncloud.gr/s1services',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json'
            ),
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => '{
                "service": "login",
                "username": "' . $usr . '",
                "password":"' . $pwd . '",
                "appId": ' . $appId . '
            }'
        ));

        $response = curl_exec($curl);
        if ($response === false) {
            return "Error in cURL : " . curl_error($curl);
        }

        $arr = json_decode(utf8_encode($response), true);
        if ($arr['success'] == 1) {
            $auth["clientID"] = $arr['clientID'];
            $auth["COMPANY"] = $arr['objs'][0]['COMPANY'];
            $auth["BRANCH"] = $arr['objs'][0]['BRANCH'];
            $auth["MODULE"] = $arr['objs'][0]['MODULE'];
            $auth["REFID"] = $arr['objs'][0]['REFID'];
            return $auth;
        } else {
            return "Eroare logare.";
        }
    }

    private function authS1WS($login_response)
    {
        $data = '{
            "service": "authenticate",
            "clientID": ' . $login_response['clientID'] . ',
            "COMPANY": ' . $login_response['COMPANY'] . ',
            "BRANCH": ' . $login_response['BRANCH'] . ',
            "MODULE": ' . $login_response['MODULE'] . ',
            "REFID": ' . $login_response['REFID'] . '
        }';

        $this->debug('authenticate in s1', $data);

        $ret = $this->talkToS1WS($data)['clientID'];
        $this->debug('auth clientID', $ret);
        return $ret;
    }

    private function invoiceS1WS($clientID, $doc)
    {
        $details = $this->getDetailsS1WS($clientID, $doc);

        $trndate = str_replace("-", "", substr($doc['IssueDate'], 0, 10)); // IssueDate
        $seriesnum = $details['rows'][0]['seriesnum'];
        $date02 = $details['rows'][0]['date02']; // select dateadd(dd, 70, $trndate)
        $branch = $details['rows'][0]['branch']; // select branch from branch where CCCASKTIRID=$doc['DesPid']
        $trdr = $details['rows'][0]['trdr']; // select trdr from trdr where code1 = substr($doc['DelPHaulierId'], 9)
        $series = $details['rows'][0]['series'];
        $linii = '';
        foreach ($doc['Lines'] as $linie) {
            $mtrl = $this->voletiToMtrl($linie['LineVoletCount']);
            $qty1 = $linie['LineQuantity'];
            $cccsnstart = $linie['LineFirstTIRCarnetNumber'];
            $cccsnstop = $linie['LineLastTIRCarnetNumber'];
            $linii .= '{
                            "MTRL": "' . $mtrl . '",
                            "CCCSNSTART": "' . $cccsnstart . '",
                            "QTY1": "' . $qty1 . '"
                        },';
        }

        $linii = substr($linii, 0, strlen($linii) - 1);

        $s1Doc = '{
                "service": "setData",
                "clientID": "' . $clientID . '",
                "appId": 5001,
                "OBJECT": "SALDOC",
                "KEY": "",
                "FORM":"AskTIRweb sales",
                "DATA": {
                    "SALDOC": [
                        {               
                            "SERIES": ' . $series . ',            
                            "TRDR": ' . $trdr . '                                
                        }
                    ],
                    "ITELINES": [' . $linii . '
                    ]
                }
            }';

        $this->debug('document s1', $s1Doc);
        $ret = $this->talkToS1WS($s1Doc)['id'];
        $this->debug('findoc', $ret);
        return $ret;
    }

    private function talkToS1WS($data)
    {
        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://dev-untrronline.oncloud.gr/s1services',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json'
            )
        ));

        $response = curl_exec($curl);
        if ($response === false) {
            return "Eroare in cURL : " . curl_error($curl);
            $this->debug('Eroare in cURL', curl_error($curl));
        }

        curl_close($curl);

        $arr = json_decode(utf8_encode($response), true);
        $this->debug('S1 WS response', $arr);
        if ($arr['success'] == 1) {
            $ret = $arr;
        } else {
            $ret = $arr['error'] . "\r\nDetalii:" . utf8_encode($response);
        }

        return $ret;
    }

    private function voletiToMtrl($voleti_count)
    {
        $voleti_mtrl['4'] = 13450;
        $voleti_mtrl['6'] = 13451;
        $voleti_mtrl['14'] = 13452;
        $voleti_mtrl['20'] = 13453;

        $mtrl = $voleti_mtrl[$voleti_count];

        return $mtrl;
    }

    private function getDetailsS1WS($clientID, $doc)
    {
        // returns rows > seriesnum, date02, branch, trdr
        /*
         * select
         * (select seriesnum+1 from seriesnum where fiscprd=year(getdate()) and series=3110) seriesnum,
         * (select dateadd(dd, 70, '20220131')) date02,
         * (select branch from branch where CCCASKTIRID=0) branch,
         * (select trdr from trdr where code1 = '13669') trdr
         */
        $trndate = str_replace("-", "", substr($doc['IssueDate'], 0, 10)); // IssueDate
        $asktirbranch = $doc['DesPid'];
        $haulierCode = substr($doc['DelPHaulierId'], 8);
        // $prsnout = 0; //select prsn from prsn where name=$doc['DelPFName'] and name2=$doc['DelPLName'] and sodtype=21 and trdr=$trdr
        $detailsQry = '{
                "service": "sqlData",
                "clientID": "' . $clientID . '",
                "appId": 5001,
                "SqlName": "getDetails",
				"asktirhauliercode": "' . $haulierCode . '",
				"asktirbranch": "' . $asktirbranch . '",
				"asktirissuedate": "' . $trndate . '"
			}';

        $this->debug('details qry', $detailsQry);

        $curl = curl_init();

        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://dev-untrronline.oncloud.gr/s1services',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_CUSTOMREQUEST => 'POST',
            CURLOPT_POSTFIELDS => $detailsQry,
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json'
            )
        ));

        $response = curl_exec($curl);
        if ($response === false) {
            return "Eroare in cURL : " . curl_error($curl);
            $this->debug('Eroare in cURL', curl_error($curl));
        }

        curl_close($curl);

        $arr = json_decode(utf8_encode($response), true);
        $this->debug('detalii pentru vanzare', $arr);
        if ($arr['success'] == 1) {
            return $arr;
        } else {
            return "Eroare preluare detalii mapare asktirweb cu S1.\r\nEroarea:" . $arr['error'] . "\r\nDetalii:" . utf8_encode($response);
            $this->debug('Eroare preluare detalii mapare asktirweb cu S1', $arr['error'] . "\r\nDetalii:" . utf8_encode($response));
        }
    }

    public function authorizeTIRCarnetIssuanceTransaction($params)
    {
        $this->log("authorizeTIRCarnetIssuanceTransaction", $params); // log
        return new SoapVar("authorizeTIRCarnetIssuanceTransaction", XSD_STRING);
    }

    public function sendTIRCarnetReceiptAdvice($params)
    {
        $this->log("sendTIRCarnetReceiptAdvice", $params); // log
    }

    public function sendTIRCarnetDespatchAdvice($params)
    {
        $this->log("sendTIRCarnetDespatchAdvice", $params); // log
                                                            // cod creare transfer in s1
        $transactionEntryReference['_'] = '_';
        $transactionEntryReference['type'] = 'type';
        $transactionEntryReference['date'] = gmdate("Y-m-d\TH:i:s\Z");

        return [
            "transactionEntryReference" => new SoapVar($transactionEntryReference, SOAP_ENC_OBJECT)
        ];
    }

    private function log($method_name, $data)
    {
        $filename = 'log.txt';
        $handle = fopen($filename, 'a+');
        fwrite($handle, date("Y-m-d H:i:s") . ' - ' . $_SERVER['REMOTE_ADDR'] . "\r\n" . $method_name . "\r\n" . print_r($data, true));
        fclose($handle);
    }

    private function debug($method_name, $data)
    {
        $filename = 'debug.txt';
        $handle = fopen($filename, 'a+');
        fwrite($handle, date("Y-m-d H:i:s") . ' - ' . $method_name . "\r\n" . print_r($data, true) . "\r\n");
        fclose($handle);
    }
}

class tirCarnetDespatchAdvice
{

    public $Id;

    public $IssueDate;
}

class DespatchParty
{
}
try {
    $Service = new WSSoapServer('UNTRRSOAPIRU');
    $classmap = [
        array(
            'tirCarnetDespatchAdvice' => tirCarnetDespatchAdvice::class,
            'DespatchParty' => DespatchParty::class
        )
    ];

    $server = new SoapServer("iruacc.wsdl", array(
        'soap_version' => SOAP_1_2,
        'style' => SOAP_DOCUMENT,
        'use' => SOAP_LITERAL,
        'classmap' => $classmap,
        "trace" => 1,
        "exceptions" => 0
    ));
    $server->setObject($Service);
    $server->handle();
} catch (SoapFault $exc) {
    echo $exc->getTraceAsString();
}

var_dump($server->getFunctions());

/*
 * TRANSFER IESIRE
2022-03-09 12:10:47 - 194.209.227.150
username:
UNTRR502022-03-09 12:10:47 - 194.209.227.150
password:
w1bg8likt13aNlcp0+4QrfZCCWU=2022-03-09 12:10:47 - 194.209.227.150
sendTIRCarnetDespatchAdvice
stdClass Object
(
    [TIRCarnetDespatchAdvice] => stdClass Object
        (
            [Id] => 27673676
            [IssueDate] => 2022-03-09T14:10:46.090+02:00
            [DespatchParty] => stdClass Object
                (
                    [AssociationOffice] => stdClass Object
                        (
                            [id] => 0
                            [name] => Sediu
                            [associationId] => 50
                        )

                )

            [DeliveryParty] => stdClass Object
                (
                    [AssociationOffice] => stdClass Object
                        (
                            [id] => 4
                            [name] => Târgu Mureş
                            [associationId] => 50
                        )

                )

            [TIRCarnetDespatchLine] => stdClass Object
                (
                    [Id] => 27673676-1
                    [Quantity] => 1
                    [TIRCarnetItem] => stdClass Object
                        (
                            [VoletCount] => 14
                            [CarnetType] => ORDINARY
                            [TIRCarnetRangeInstance] => stdClass Object
                                (
                                    [FirstTIRCarnetNumber] => XW83126251
                                    [LastTIRCarnetNumber] => XW83126251
                                    [UnitQuantity] => 1
                                )

                        )

                )

        )

)

TRANSFER INTRARE
2022-03-09 12:13:23 - 194.209.227.150
username:
UNTRR502022-03-09 12:13:23 - 194.209.227.150
password:
H9sJ2GGuF9sdshDZ7/W+QhP6/RA=2022-03-09 12:13:23 - 194.209.227.150
sendTIRCarnetReceiptAdvice
stdClass Object
(
    [TIRCarnetReceiptAdvice] => stdClass Object
        (
            [Id] => 27673677
            [IssueDate] => 2022-03-09T14:13:22.395+02:00
            [Reference] => stdClass Object
                (
                    [_] => 27673676
                    [type] => http://www.asktirweb.org/logistics/despatch
                )

            [DespatchParty] => stdClass Object
                (
                    [AssociationOffice] => stdClass Object
                        (
                            [id] => 0
                            [name] => Sediu
                            [associationId] => 50
                        )

                )

            [DeliveryParty] => stdClass Object
                (
                    [AssociationOffice] => stdClass Object
                        (
                            [id] => 4
                            [name] => Târgu Mureş
                            [associationId] => 50
                        )

                )

            [TIRCarnetReceiptLine] => stdClass Object
                (
                    [Id] => 27673677-1
                    [Quantity] => 1
                    [TIRCarnetItem] => stdClass Object
                        (
                            [VoletCount] => 14
                            [CarnetType] => ORDINARY
                            [TIRCarnetRangeInstance] => stdClass Object
                                (
                                    [FirstTIRCarnetNumber] => XW83126251
                                    [LastTIRCarnetNumber] => XW83126251
                                    [UnitQuantity] => 1
                                )

                        )

                )

        )

)
VANZARE LA TRANSPORTATOR
2022-03-09 13:51:33 - 194.209.227.150
username:
UNTRR502022-03-09 13:51:33 - 194.209.227.150
password:
XzwcTJuE5qFF4hH4uObqHc7QQkw=2022-03-09 13:51:33 - 194.209.227.150
authorizeAndCaptureTIRCarnetIssuanceTransaction
stdClass Object
(
    [tirCarnetDespatchAdvice] => stdClass Object
        (
            [Id] => 27673678
            [IssueDate] => 2022-03-09T15:51:31.151+02:00
            [DespatchParty] => stdClass Object
                (
                    [AssociationOffice] => stdClass Object
                        (
                            [id] => 4
                            [name] => Târgu Mureş
                            [associationId] => 50
                        )

                )

            [DeliveryParty] => stdClass Object
                (
                    [HaulierContact] => stdClass Object
                        (
                            [firstName] => Cosmin
                            [lastName] => Vestemean
                            [haulierId] => ROU/050/13669
                            [haulierName] => GAL SPEDITION SRL
                        )

                )

            [TIRCarnetDespatchLine] => stdClass Object
                (
                    [Id] => 27673678-1
                    [Quantity] => 1
                    [TIRCarnetItem] => stdClass Object
                        (
                            [VoletCount] => 14
                            [CarnetType] => ORDINARY
                            [TIRCarnetRangeInstance] => stdClass Object
                                (
                                    [FirstTIRCarnetNumber] => XW83126251
                                    [LastTIRCarnetNumber] => XW83126251
                                    [UnitQuantity] => 1
                                )

                        )

                )

        )

)

RETUR DE LA TRANSPORTATOR
2022-03-09 13:53:25 - 194.209.227.150
username:
UNTRR502022-03-09 13:53:25 - 194.209.227.150
password:
vHPTHe2QY3WNtGiYa12um1aB1iI=2022-03-09 13:53:25 - 194.209.227.150
sendTIRCarnetReceiptAdvice
stdClass Object
(
    [TIRCarnetReceiptAdvice] => stdClass Object
        (
            [Id] => 27673679
            [IssueDate] => 2022-03-09T15:53:24.575+02:00
            [DespatchParty] => stdClass Object
                (
                    [HaulierContact] => stdClass Object
                        (
                            [firstName] => Cosmin
                            [lastName] => Vestemean
                            [haulierId] => ROU/050/13669
                            [haulierName] => GAL SPEDITION SRL
                        )

                )

            [DeliveryParty] => stdClass Object
                (
                    [AssociationOffice] => stdClass Object
                        (
                            [id] => 4
                            [name] => Târgu Mureş
                            [associationId] => 50
                        )

                )

            [TIRCarnetReceiptLine] => stdClass Object
                (
                    [Id] => 27673679-1
                    [Quantity] => 1
                    [TIRCarnetItem] => stdClass Object
                        (
                            [VoletCount] => 14
                            [CarnetType] => ORDINARY
                            [AdditionalCarnetProperties] => stdClass Object
                                (
                                    [AdditionalCarnetProperty] => Array
                                        (
                                            [0] => stdClass Object
                                                (
                                                    [NameCode] => stdClass Object
                                                        (
                                                            [_] => USED
                                                            [type] => http://www.asktirweb.org/model/tir-carnet-1/property-name
                                                        )

                                                    [Value] => true
                                                )

                                            [1] => stdClass Object
                                                (
                                                    [NameCode] => stdClass Object
                                                        (
                                                            [_] => DEFECTIVE
                                                            [type] => http://www.asktirweb.org/model/tir-carnet-1/property-name
                                                        )

                                                    [Value] => false
                                                )

                                        )

                                )

                            [TIRCarnetRangeInstance] => stdClass Object
                                (
                                    [FirstTIRCarnetNumber] => XW83126251
                                    [LastTIRCarnetNumber] => XW83126251
                                    [UnitQuantity] => 1
                                )

                        )

                )

        )

)

VANZARE LINII MULTIPLE
2022-03-09 14:15:11 - 194.209.227.150
username:
UNTRR502022-03-09 14:15:11 - 194.209.227.150
password:
BbJ1cEsApAMF57BHGOmQBwHDsnE=2022-03-09 14:15:11 - 194.209.227.150
authorizeAndCaptureTIRCarnetIssuanceTransaction
<?php
stdClass Object
(
    [tirCarnetDespatchAdvice] => stdClass Object
        (
            [Id] => 27673680
            [IssueDate] => 2022-03-09T16:15:10.086+02:00
            [DespatchParty] => stdClass Object
                (
                    [AssociationOffice] => stdClass Object
                        (
                            [id] => 0
                            [name] => Sediu
                            [associationId] => 50
                        )

                )

            [DeliveryParty] => stdClass Object
                (
                    [HaulierContact] => stdClass Object
                        (
                            [firstName] => Cosmin
                            [lastName] => Vestemean
                            [haulierId] => ROU/050/13669
                            [haulierName] => GAL SPEDITION SRL
                        )

                )

            [TIRCarnetDespatchLine] => Array
                (
                    [0] => stdClass Object
                        (
                            [Id] => 27673680-1
                            [Quantity] => 2
                            [TIRCarnetItem] => stdClass Object
                                (
                                    [VoletCount] => 14
                                    [CarnetType] => ORDINARY
                                    [TIRCarnetRangeInstance] => stdClass Object
                                        (
                                            [FirstTIRCarnetNumber] => XT84887751
                                            [LastTIRCarnetNumber] => XW84887752
                                            [UnitQuantity] => 2
                                        )

                                )

                        )

                    [1] => stdClass Object
                        (
                            [Id] => 27673680-2
                            [Quantity] => 2
                            [TIRCarnetItem] => stdClass Object
                                (
                                    [VoletCount] => 14
                                    [CarnetType] => ORDINARY
                                    [TIRCarnetRangeInstance] => stdClass Object
                                        (
                                            [FirstTIRCarnetNumber] => XZ83126252
                                            [LastTIRCarnetNumber] => XC83126253
                                            [UnitQuantity] => 2
                                        )

                                )

                        )

                )

        )

)
 
*/