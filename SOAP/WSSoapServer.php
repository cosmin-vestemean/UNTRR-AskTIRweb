<?php
ini_set("soap.wsdl_cache_enabled", "0");

class WSSoapServer
{

    protected $class_name = '';

    public function __construct($class_name)
    {
        $this->class_name = $class_name;
    }
	
	public function Security($data) {
		$username = $data->UsernameToken->Username;
		$password = $data->UsernameToken->Password;
		//check security credentials here
		$this->log("username:", $username);
		$this->log("password:", $password);
	}

    public function authorizeAndCaptureTIRCarnetIssuanceTransaction($params)
    {
        $this->log("authorizeAndCaptureTIRCarnetIssuanceTransaction", $params); // log
        // connect to S1 WS
        $lr = $this->loginS1WS('webuser1', 'webuser123', '5001');
        $this->debug('login response', $lr);
        $clientID = $this->authS1WS($lr);
        $this->debug('auth response', $clientID);

        // creaza factura in S1 din $params
        $arr = json_decode(json_encode($params), true);
        $doc['Id'] = $arr['tirCarnetDespatchAdvice']['Id'];
        $doc['IssueDate'] = $arr['tirCarnetDespatchAdvice']['IssueDate'];
		
        $doc['DesPid'] = $arr['tirCarnetDespatchAdvice']['DespatchParty']['AssociationOffice']['id'];
        $doc['DesPname'] = $arr['tirCarnetDespatchAdvice']['DespatchParty']['AssociationOffice']['name'];
        $doc['DesPassociationId'] = $arr['tirCarnetDespatchAdvice']['DespatchParty']['AssociationOffice']['associationId'];
        
		$doc['DelPFName'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']['firstName'];
        $doc['DelPLName'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']['lastName'];
        $doc['DelPHaulierId'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']['haulierId'];
        $doc['DelPHaulierName'] = $arr['tirCarnetDespatchAdvice']['DeliveryParty']['HaulierContact']['haulierName'];
		
        $doc['LineId'] = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']['Id'];
        $doc['LineQuantity'] = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']['Quantity'];
        $doc['LineVoletCount'] = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']['TIRCarnetItem']['VoletCount'];
        $doc['LineCarnetType'] = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']['TIRCarnetItem']['CarnetType'];
        $doc['LineFirstTIRCarnetNumber'] = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']['TIRCarnetItem']['TIRCarnetRangeInstance']['FirstTIRCarnetNumber'];
        $doc['LineLastTIRCarnetNumber'] = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']['TIRCarnetItem']['TIRCarnetRangeInstance']['LastTIRCarnetNumber'];
        $doc['LineUnitQuantity'] = $arr['tirCarnetDespatchAdvice']['TIRCarnetDespatchLine']['TIRCarnetItem']['TIRCarnetRangeInstance']['UnitQuantity'];

        $idDoc = $this->invoiceS1WS($clientID, $doc);
        $this->debug('invoice response', $idDoc);

        $transactionEntryReference['_'] = '_';
        $transactionEntryReference['type'] = 'type';
        $transactionEntryReference['date'] = gmdate("Y-m-d\TH:i:s\Z");

        return [
            "transactionEntryReference" => new SoapVar($transactionEntryReference, SOAP_ENC_OBJECT)
        ];
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

    private function authS1WS($lr)
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
            CURLOPT_POSTFIELDS => '{
    "service": "authenticate",
    "clientID": ' . $lr['clientID'] . ',
    "COMPANY": ' . $lr['COMPANY'] . ',
    "BRANCH": ' . $lr['BRANCH'] . ',
    "MODULE": ' . $lr['MODULE'] . ',
    "REFID": ' . $lr['REFID'] . '
}',
            CURLOPT_HTTPHEADER => array(
                'Content-Type: application/json'
            )
        ));

        $response = curl_exec($curl);
        if ($response === false) {
            return "Error in cURL : " . curl_error($curl);
        }

        curl_close($curl);

        $arr = json_decode(utf8_encode($response), true);
        if ($arr['success'] == 1) {
            return $arr['clientID'];
        } else {
            return "Eroare autentificare.";
        }
    }

    private function invoiceS1WS($clientID, $doc)
    {
        $voleti_mtrl['4'] = 13450;
        $voleti_mtrl['6'] = 13451;
        $voleti_mtrl['14'] = 13452;
        $voleti_mtrl['20'] = 13453;

        //$mtrl = 13450;
		/*
		select 
			(select seriesnum+1 from seriesnum where fiscprd=year(getdate()) and series=3110) seriesnum,
			(select dateadd(dd, 70, '20220131')) date02,
			(select branch from branch where CCCASKTIRID=0) branch,
			(select trdr from trdr where code1 = '13669') trdr
		*/
		
        $details = $this->getDetailsS1WS($clientID, $doc);
		
		$trndate = str_replace("-", "", substr($doc['IssueDate'], 0, 10));	//IssueDate
		$seriesnum = $details['rows'][0]['seriesnum'];
		$date02 = $details['rows'][0]['date02'];	//select dateadd(dd, 70, $trndate)
		$branch = $details['rows'][0]['branch'];	//select branch from branch where CCCASKTIRID=$doc['DesPid']
		$trdr = $details['rows'][0]['trdr'];	//select trdr from trdr where code1 = substr($doc['DelPHaulierId'], 9)
		$series = $details['rows'][0]['series'];
		
		$mtrl = $voleti_mtrl[$doc['LineVoletCount']];
		$qty1 = $doc['LineQuantity'];
		$cccsnstart = $doc['LineFirstTIRCarnetNumber'];
		$cccsnstop = $doc['LineLastTIRCarnetNumber'];
		
		//"DATE02":"'.$date02.'",
		//"TRNDATE": "'.$trndate.'",
		//"DATE01":"'.$trndate.'",
		//"SERIESNUM":"'.$seriesnum.'"
		//"DATE01":"2022/02/04"    
		//"PAYMENT": "1000"
		
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
                            "TRDR": '. $trdr .'                                
                        }
                    ],
                    "ITELINES": [
                        {
                            "MTRL": "'.$mtrl.'",
                            "CCCSNSTART": "'.$cccsnstart.'",
                            "QTY1": "'.$qty1.'"
                        }
                    ]
                }
            }';
			
		$this->debug('document s1', $s1Doc);
		
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
            CURLOPT_POSTFIELDS => $s1Doc,
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
		$this->debug('vanzare', $arr);
        if ($arr['success'] == 1) {
            return $arr['id'];
        } else {
            return "Eroare introducere document.\r\nEroarea:" . $arr['error'] . "\r\nDetalii:" . utf8_encode($response);
        }
    }

	private function getDetailsS1WS($clientID, $doc)
    {
		//returns  rows > seriesnum, date02, branch, trdr
		/*
		select 
			(select seriesnum+1 from seriesnum where fiscprd=year(getdate()) and series=3110) seriesnum,
			(select dateadd(dd, 70, '20220131')) date02,
			(select branch from branch where CCCASKTIRID=0) branch,
			(select trdr from trdr where code1 = '13669') trdr
		*/
		
		$trndate = str_replace("-", "", substr($doc['IssueDate'], 0, 10));	//IssueDate
		$asktirbranch = $doc['DesPid'];
		$haulierCode = substr($doc['DelPHaulierId'], 8);
		//$prsnout = 0;	//select prsn from prsn where name=$doc['DelPFName'] and name2=$doc['DelPLName'] and sodtype=21 and trdr=$trdr
		$detailsQry = '{
                "service": "sqlData",
                "clientID": "' . $clientID . '",
                "appId": 5001,
                "SqlName": "getDetails",
				"asktirhauliercode": "'.$haulierCode.'",
				"asktirbranch": "'.$asktirbranch.'",
				"asktirissuedate": "'.$trndate.'"
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
            $this->debug('Eroare preluare detalii mapare asktirweb cu S1',  $arr['error'] . "\r\nDetalii:" . utf8_encode($response));
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
        return new SoapVar("sendTIRCarnetReceiptAdviceResponse", XSD_STRING);
    }

    public function sendTIRCarnetDespatchAdvice($params)
    {
        $this->log("sendTIRCarnetDespatchAdvice", $params); // log
        return new SoapVar("sendTIRCarnetDespatchAdvice", XSD_STRING);
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