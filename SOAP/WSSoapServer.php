<?php
ini_set("soap.wsdl_cache_enabled", "0");

//define constants for url and namespace
define('S1WS_URL', 'https://dev-untrronline.oncloud.gr/s1services');

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

        // login and auth in s1, getting token for transaction
        $clientID = $this->get_clientID_Sediu();

        // ------creaza factura in S1 din $params-------
        // stdClass > array
        $doc = $this->getTIRCarnetDespatchOrReceipt($params);
        // array > invoice json
        $s1Inv = $this->phpArrayToJsonInvoice($clientID, $doc);
        // send json to s1 and return newly created findoc
        $findoc = $this->talkToS1WS($s1Inv)['id'];
        // record findoc
        $this->debug('newly created findoc', $findoc);

        // response
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
    private function get_clientID_Sediu()
    {
        // connect to S1 WS
        $lr = $this->loginS1WS('asktir_sediu', 'asktir_sediu', '5003');
        $clientID = $this->authS1WS($lr)['clientID'];

        return $clientID;
    }

    private function get_clientID_Branch($branch)
    {
        // connect to S1 WS
        $lr = $this->loginS1WS('asktir_sediu', 'asktir_sediu', '5003');
        $clientID = $this->authS1WS_Branch($lr, $branch)['clientID'];

        return $clientID;
    }

    private function loginS1WS($usr, $pwd, $appId)
    {
        $data = '{
                "service": "login",
                "username": "' . $usr . '",
                "password":"' . $pwd . '",
                "appId": ' . $appId . '
            }';

        $this->debug('logging in s1 with', $data);

        return $this->talkToS1WS($data);
    }

    private function authS1WS($login_response)
    {
        $data = '{
            "service": "authenticate",
            "clientID": ' . $login_response['clientID'] . ',
            "COMPANY": ' . $login_response['objs'][0]['COMPANY'] . ',
            "BRANCH": ' . $login_response['objs'][0]['BRANCH'] . ',
            "MODULE": ' . $login_response['objs'][0]['MODULE'] . ',
            "REFID": ' . $login_response['objs'][0]['REFID'] . '
        }';

        $this->debug('authenticating in s1 with', $data);

        return $this->talkToS1WS($data);
    }

    private function authS1WS_Branch($login_response, $branch)
    {
        $data = '{
            "service": "authenticate",
            "clientID": ' . $login_response['clientID'] . ',
            "COMPANY": ' . $login_response['objs'][0]['COMPANY'] . ',
            "BRANCH": ' . $branch . ',
            "MODULE": ' . $login_response['objs'][0]['MODULE'] . ',
            "REFID": ' . $login_response['objs'][0]['REFID'] . '
        }';

        $this->debug('authenticating in s1 with', $data);

        return $this->talkToS1WS($data);
    }

    private function getTIRCarnetDespatchOrReceipt($params)
    {
        $arr = json_decode(json_encode($params), true);
        $action = [];
        $actionLines = [];

        //if key TIRCarnetDespatchAdvice exists in $arr then $action = $arr['TIRCarnetDespatchAdvice'] else if key tirCarnetDespatchAdvice exists then $action=$arr['tirCarnetDespatchAdvice'] else $action = $arr['TIRCarnetReceiptAdvice']
        if (array_key_exists('TIRCarnetDespatchAdvice', $arr)) {
            $action = $arr['TIRCarnetDespatchAdvice'];
        } elseif (array_key_exists('tirCarnetDespatchAdvice', $arr)) {
            $action = $arr['tirCarnetDespatchAdvice'];
        } else {
            $action = $arr['TIRCarnetReceiptAdvice'];
        }

        if (array_key_exists('TIRCarnetDespatchLine', $action)) {
            $actionLines = $action['TIRCarnetDespatchLine'];
        } elseif (array_key_exists('tirCarnetDespatchLine', $action)) {
            $actionLines = $action['tirCarnetDespatchLine'];
        } else {
            $actionLines = $action['TIRCarnetReceiptLine'];
        }

        // FINDOC
        $doc['Id'] = $action['Id']; // CCCIDTRANIRU
        $doc['IssueDate'] = $action['IssueDate']; // trndate, nu o voi folosi, se completeaza automat
        if (isset($action['Reference']))
            $doc['Reference'] = $action['Reference'];

        // id branch plecare/vanzare+transfer iesire sau sosire/retur+transfer intrare
        // [DespatchParty] poate fi [HaulierContact] la retur sau [AssociationOffice] la transferuri si vanzare
        if (isset($action['DespatchParty']['HaulierContact'])) {
            $doc['DesPFName'] = $action['DespatchParty']['HaulierContact']['firstName'];
            $doc['DesPLName'] = $action['DespatchParty']['HaulierContact']['lastName'];
            $doc['DesPHaulierId'] = $action['DespatchParty']['HaulierContact']['haulierId']; // code > trdr
        } else if (isset($action['DespatchParty']['AssociationOffice'])) {
            $doc['DesPid'] = $action['DespatchParty']['AssociationOffice']['id'];
        }

        // [DeliveryParty] poate fi [HaulierContact] la vanzari sau [AssociationOffice] la transferuri si retur
        if (isset($action['DeliveryParty']['HaulierContact'])) {
            $doc['DelPFName'] = $action['DeliveryParty']['HaulierContact']['firstName'];
            $doc['DelPLName'] = $action['DeliveryParty']['HaulierContact']['lastName'];
            $doc['DelPHaulierId'] = $action['DeliveryParty']['HaulierContact']['haulierId']; // code > trdr
        }

        if (isset($action['DeliveryParty']['AssociationOffice'])) {
            $doc['DelPid'] = $action['DeliveryParty']['AssociationOffice']['id'];
        }

        //ITELINES
        $i = 0;
        if (isset($actionLines[1])) {
            // linii multiple
            foreach ($actionLines as $curr_line) {
                $lines[$i]['LineId'] = $curr_line['Id'];
                $lines[$i]['LineQuantity'] = $curr_line['Quantity'];
                $lines[$i]['LineVoletCount'] = $curr_line['TIRCarnetItem']['VoletCount'];
                $lines[$i]['LineCarnetType'] = $curr_line['TIRCarnetItem']['CarnetType'];
                // retur, stare carnete
                if (isset($curr_line['TIRCarnetItem']['AdditionalCarnetProperties']['AdditionalCarnetProperty'])) {
                    $lines[$i]['Used'] = $curr_line['TIRCarnetItem']['AdditionalCarnetProperties']['AdditionalCarnetProperty'][0]['Value'];
                    $lines[$i]['Defective'] = $curr_line['TIRCarnetItem']['AdditionalCarnetProperties']['AdditionalCarnetProperty'][1]['Value'];
                }
                $lines[$i]['LineFirstTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['FirstTIRCarnetNumber'];
                $lines[$i]['LineLastTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['LastTIRCarnetNumber'];
                $lines[$i]['LineUnitQuantity'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['UnitQuantity'];
                $i ++;
            }
        } else {
            // o singura linie
            $curr_line = $actionLines;
            $lines[0]['LineId'] = $curr_line['Id'];
            $lines[0]['LineQuantity'] = $curr_line['Quantity'];
            $lines[0]['LineVoletCount'] = $curr_line['TIRCarnetItem']['VoletCount'];
            $lines[0]['LineCarnetType'] = $curr_line['TIRCarnetItem']['CarnetType'];
            // retur, stare carnete
            if (isset($curr_line['TIRCarnetItem']['AdditionalCarnetProperties']['AdditionalCarnetProperty'])) {
                $lines[0]['Used'] = $curr_line['TIRCarnetItem']['AdditionalCarnetProperties']['AdditionalCarnetProperty'][0]['Value'];
                $lines[0]['Defective'] = $curr_line['TIRCarnetItem']['AdditionalCarnetProperties']['AdditionalCarnetProperty'][1]['Value'];
            }
            $lines[0]['LineFirstTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['FirstTIRCarnetNumber'];
            $lines[0]['LineLastTIRCarnetNumber'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['LastTIRCarnetNumber'];
            $lines[0]['LineUnitQuantity'] = $curr_line['TIRCarnetItem']['TIRCarnetRangeInstance']['UnitQuantity'];
        }

        $doc['Lines'] = $lines;

        return $doc;
    }

    private function getTransferBranch($params) {
        $arr = json_decode(json_encode($params), true);
        //if key TIRCarnetDespatchAdvice exists in $arr then $action = $arr['TIRCarnetDespatchAdvice'] else if key tirCarnetDespatchAdvice exists then $action=$arr['tirCarnetDespatchAdvice'] else $action = $arr['TIRCarnetReceiptAdvice']
        if (array_key_exists('TIRCarnetDespatchAdvice', $arr)) {
            return $arr['TIRCarnetDespatchAdvice']['DespatchParty']['AssociationOffice']['id'];
        } else {
            return $arr['TIRCarnetReceiptAdvice']['DeliveryParty']['AssociationOffice']['id'];
        }
    }

    private function phpArrayToJsonInvoice($clientID, $doc)
    {
        $details = $this->getDetailsS1WS($clientID, $doc['DesPid'], $doc['DesPid'], substr($doc['DelPHaulierId'], 8));
        $branch = $details['rows'][0]['branch']; // select branch from branch where CCCASKTIRID=$doc['DesPid']
        $trdr = $details['rows'][0]['trdr']; // select trdr from trdr where code1 = substr($doc['DelPHaulierId'], 9)
        $series = $details['rows'][0]['series'];
        //sediu nu vinde:
        if ($branch == 1) {
            $this->debug('eroare vanzare', 'sediu nu vinde');
        }
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

        $linii = substr($linii, 0, -1);

        $s1Doc = '{
                "service": "setData",
                "clientID": "' . $clientID . '",
                "appId": 5003,
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
        return $s1Doc;
    }

    private function phpArrayToJsonRetur($clientID, $doc)
    {
        $details = $this->getDetailsS1WS($clientID, $doc['DelPid'], $doc['DelPid'], substr($doc['DesPHaulierId'], 8));
        $fromTrdr = $details['rows'][0]['trdr'];
        $toBranch = $details['rows'][0]['branch'];
        // retur la 3002 agentie (restul), 3004 sediu (cccasktirid = 0, branch=1)
        if ($toBranch == 1) {
            $series = 3004;
            $finstates = 17;
        } else {
            $series = 3002;
            $finstates = 3;
        }
        $linii = '';
        foreach ($doc['Lines'] as $linie) {
            $mtrl = $this->voletiToMtrl($linie['LineVoletCount']);
            $used = filter_var($linie['Used'], FILTER_VALIDATE_BOOLEAN);
            $defective = filter_var($linie['Defective'], FILTER_VALIDATE_BOOLEAN);
            $qty1 = $linie['LineQuantity'];
            $sncode = $linie['LineFirstTIRCarnetNumber'];
            $linii .= '{
                            "MTRL": "' . $mtrl . '",
                            "SNCODE": "' . $sncode . '",
                            "QTY1": "' . $qty1 . '"
                        },';
        }

        $linii = substr($linii, 0, strlen($linii) - 1);

        $s1Doc = '{
                "service": "setData",
                "clientID": "' . $clientID . '",
                "appId": 5003,
                "OBJECT": "SALDOC",
                "KEY": "",
                "FORM":"AskTIRweb returns",
                "DATA": {
                    "SALDOC": [
                        {
                            "SERIES": ' . $series . ',
                            "FINSTATES": ' . $finstates . ',
                            "TRDR": ' . $fromTrdr . ',
                            "BRANCH": ' . $toBranch . '
                        }
                    ],
                    "ITELINES": [' . $linii . '
                    ]
                }
            }';

        $this->debug('document s1', $s1Doc);
        return $s1Doc;
    }

    private function phpArrayToJsonTransfer($clientID, $doc, $isIesire)
    {  
        $details = $this->getDetailsS1WS($clientID, $doc['DesPid'], $doc['DelPid'], 'xyz132');

        // iesire 3001/AskTIRweb - Transfer (Iesire), intrare 3002/AskTIRweb - Transfer (Intrare)
        if (isset($isIesire) && $isIesire) {
            $fromBranch = $details['rows'][0]['branch1'];
            $toBranch = $details['rows'][0]['branch'];
            $series = 3002;
            $form = 'AskTIRweb - Transfer (Intrare)';
            $finstates = 1;
            $fromWhouse = 90;
            $toWhouse = $toBranch;
        } else {
            $fromBranch = $details['rows'][0]['branch'];
            $toBranch = $details['rows'][0]['branch1'];
            $series = 3001;
            $form = 'AskTIRweb - Transfer (Iesire)';
            $finstates = 13;
            $fromWhouse = $fromBranch;
            $toWhouse = 90;
        }
       
        $linii = '';
        foreach ($doc['Lines'] as $linie) {
            $mtrl = $this->voletiToMtrl($linie['LineVoletCount']);
            $qty1 = $linie['LineQuantity'];
            $cccsnstart = $linie['LineFirstTIRCarnetNumber'];
            $linii .= '{
                            "MTRL": "' . $mtrl . '",
                            "CCCSNSTART": "' . $cccsnstart . '",
                            "QTY2": "' . $qty1 . '",
                            "QTY1": "' . $qty1 . '"
                        },';
        }

        $linii = substr($linii, 0, strlen($linii) - 1);

        $s1Doc = '{
                "service": "setData",
                "clientID": "' . $clientID . '",
                "appId": 5003,
                "OBJECT": "ITEDOC",
                "KEY": "",
                "FORM":"'.$form.'",
                "DATA": {
                    "ITEDOC": [
                        {
                            "SERIES": ' . $series . ',
                            "FINSTATES": ' . $finstates . ',
                            "BRANCH": ' . $fromBranch . '
                        }
                    ],
                    "MTRDOC": [
                        {
                            "WHOUSE" : ' . $fromWhouse . ',
                            "BRANCHSEC": ' . $toBranch . ',
                            "WHOUSESEC": '.$toWhouse.'
                        }
                    ],
                    "ITELINES": [' . $linii . '
                    ]
                }
            }';

        $this->debug('document s1', $s1Doc);
        return $s1Doc;
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

    private function getDetailsS1WS($clientID, $asktirbranch, $asktirbranch1, $haulierCode)
    {
        // returns rows > branch, trdr
        /*
         * select
         * (select branch from branch where CCCASKTIRID=0) branch,
         * (select trdr from trdr where code1 = '13669') trdr
         */
        $detailsQry = '{
                "service": "sqlData",
                "clientID": "' . $clientID . '",
                "appId": 5003,
                "SqlName": "getDetails",
				"asktirhauliercode": "' . $haulierCode . '",
				"asktirbranch": "' . $asktirbranch . '",
                "asktirbranch1": "' . $asktirbranch1 . '"
			}';

        $this->debug('details qry', $detailsQry);

        return $this->talkToS1WS($detailsQry);
    }

    //Iesire
    public function sendTIRCarnetDespatchAdvice($params)
    {
        $this->log("sendTIRCarnetDespatchAdvice", $params); // log
        // ------creaza transfer in S1 din $params-------
        // stdClass > array
        $doc = $this->getTIRCarnetDespatchOrReceipt($params);

        // login and auth in s1 proper branch, getting token for transaction
        $properBranchIRU = $this->getTransferBranch($params);
        $clientID = $this->get_clientID_Sediu();
        $details = $this->getDetailsS1WS($clientID, $properBranchIRU, -1, 'xyz132');
        $properBranchS1 = $details['rows'][0]['branch'];
        $clientID = $this->get_clientID_Branch($properBranchS1);

        // array > transfer carnets json
        $s1Inv = $this->phpArrayToJsonTransfer($clientID, $doc, false);
        // send json to s1 and return newly created findoc
        $findoc = $this->talkToS1WS($s1Inv)['id'];
        // record findoc
        $this->debug('newly created findoc', $findoc);

        $transactionEntryReference['_'] = '_';
        $transactionEntryReference['type'] = 'type';
        $transactionEntryReference['date'] = gmdate("Y-m-d\TH:i:s\Z");

        return [
            "transactionEntryReference" => new SoapVar($transactionEntryReference, SOAP_ENC_OBJECT)
        ];
    }

    public function sendTIRCarnetReceiptAdvice($params)
    {
        // return & transfer acknowledgement (transfer in)
        /*
         * acknowledgement are [Reference] care indica perechea transfer din (despatch)
         * [Reference] => stdClass Object
         * (
         * [_] => 27673676
         * [type] => http://www.asktirweb.org/logistics/despatch
         * )
         */
        $this->log("sendTIRCarnetReceiptAdvice", $params); // log

        // login and auth in s1, getting token for transaction
        $clientID = $this->get_clientID_Sediu();

        // ------creaza transfer/retur in S1 din $params-------
        // stdClass > array
        $doc = $this->getTIRCarnetDespatchOrReceipt($params);
        // array > return/transfer carnets json
        if (isset($doc['Reference'])) {
            $properBranchIRU = $this->getTransferBranch($params);
            $details = $this->getDetailsS1WS($clientID, $properBranchIRU, -1, 'xyz132');
            $properBranchS1 = $details['rows'][0]['branch'];
            $clientID = $this->get_clientID_Branch($properBranchS1);
            $s1Inv = $this->phpArrayToJsonTransfer($clientID, $doc, true);
        } else {
            $s1Inv = $this->phpArrayToJsonRetur($clientID, $doc);
        }
        // send json to s1 and return newly created findoc
        $findoc = $this->talkToS1WS($s1Inv)['id'];
        // record findoc
        $this->debug('newly created findoc', $findoc);

        // response
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