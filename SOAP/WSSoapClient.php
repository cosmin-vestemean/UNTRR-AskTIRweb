<?php
ini_set("xdebug.var_display_max_children", "-1");
ini_set("xdebug.var_display_max_data", "-1");
ini_set("xdebug.var_display_max_depth", "-1");
ini_set('soap.wsdl_cache_enabled', '0');
ini_set('soap.wsdl_cache_ttl', '0');

/**
 * This class can add WSSecurity authentication support to SOAP clients
 * implemented with the PHP 5 SOAP extension.
 *
 * It extends the PHP 5 SOAP client support to add the necessary XML tags to
 * the SOAP client requests in order to authenticate on behalf of a given
 * user with a given password.
 *
 * This class was tested with Axis, WSS4J servers and CXF.
 *
 * @author Roger Veciana - http://www.phpclasses.org/browse/author/233806.html
 * @author John Kary <johnkary@gmail.com>
 * @author Alberto Martínez - https://gist.github.com/Turin86/5569152
 * @see http://stackoverflow.com/questions/2987907/how-to-implement-ws-security-1-1-in-php5
 */
class WSSoapClient extends \SoapClient
{

    private $OASIS = "http://docs.oasis-open.org/wss/2004/01";

    /**
     * WS-Security Username
     *
     * @var string
     */
    private $username;

    /**
     * WS-Security Password
     *
     * @var string
     */
    private $password;

    /**
     * WS-Security PasswordType
     *
     * @var string
     */
    private $passwordType;

    /**
     * Set WS-Security credentials
     *
     * @param string $username
     * @param string $password
     * @param string $passwordType
     */
    public function __setUsernameToken($username, $password, $passwordType)
    {
        $this->username = $username;
        $this->password = $password;
        $this->passwordType = $passwordType;
    }

    /**
     * Overwrites the original method adding the security header.
     * As you can see, if you want to add more headers, the method needs to be modified.
     */
    public function WSCallSrv($function_name, $arguments)
    {
        $this->__setSoapHeaders($this->generateWSSecurityHeader());
        // var_dump($this);
        // var_dump(parent::$function_name($arguments));
        return parent::$function_name($arguments);
    }

    /**
     * Generate password digest.
     *
     * Using the password directly may work also, but it's not secure to transmit it without encryption.
     * And anyway, at least with axis+wss4j, the nonce and timestamp are mandatory anyway.
     *
     * @return string base64 encoded password digest
     */
    private function generatePasswordDigest()
    {
        $this->nonce = mt_rand();
        $this->timestamp = gmdate("Y-m-d\TH:i:s\Z");

        $packedNonce = pack("H*", $this->nonce);
        $packedTimestamp = pack("a*", $this->timestamp);
        $packedPassword = pack("a*", $this->password);

        $hash = sha1($packedNonce . $packedTimestamp . $packedPassword);
        $packedHash = pack("H*", $hash);

        return base64_encode($packedHash);
    }

    /**
     * Generates WS-Security headers
     *
     * @return SoapHeader
     */
    private function generateWSSecurityHeader()
    {
        if ($this->passwordType === "PasswordDigest") {
            $password = $this->generatePasswordDigest();
            $nonce = sha1($this->nonce);
        } elseif ($this->passwordType === "PasswordText") {
            $password = $this->password;
            $nonce = sha1(mt_rand());
        } else {
            return "";
        }

        $xml = '
<wsse:Security xmlns:wsse="' . $this->OASIS . '/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="' . $this->OASIS . '/oasis-200401-wss-wssecurity-utility-1.0.xsd">
	<wsse:UsernameToken wsu:Id="UsernameToken-C57F57574EEC3A629C163541065638511">
	<wsse:Username>' . $this->username . '</wsse:Username>
	<wsse:Password Type="' . $this->OASIS . "/oasis-200401-wss-username-token-profile-1.0#" . $this->passwordType . '">' . $password . '</wsse:Password>
	<wsse:Nonce EncodingType="' . $this->OASIS . '/oasis-200401-wss-soap-message-security-1.0#Base64Binary">' . $nonce . "</wsse:Nonce>";

        if ($this->passwordType === "PasswordDigest") {
            $xml .= "\n\t" . "<wsu:Created>" . $this->timestamp . "</wsu:Created>";
        }

        $xml .= '
	</wsse:UsernameToken>
</wsse:Security>';

        return new \SoapHeader($this->OASIS . "/oasis-200401-wss-wssecurity-secext-1.0.xsd", "Security", new \SoapVar($xml, XSD_ANYXML), true);
    }
}

$client = new WSSoapClient("iruacc.wsdl", [
    "location" => "http://iruendpoint.untrr.ro",
    //"location" => "http://untrrsoapserver/WSSoapServer",
    "cache_wsdl" => WSDL_CACHE_NONE,
    "trace" => 1,
    "debug" => 1,
    "use" => SOAP_LITERAL,
    "document" => SOAP_DOCUMENT,
    'soap_version' => SOAP_1_2
]);

try {
    $client->__setUsernameToken("UNTRR50", "50-UNTRR50t", "PasswordDigest");

    $response = $client->WSCallSrv('authorizeAndCaptureTIRCarnetIssuanceTransaction', [
        "tirCarnetDespatchAdvice" => [
            "Id" => new SoapVar("4232772", XSD_STRING),
            "IssueDate" => new SoapVar("2013-11-01T00:00:00.000+03:00", XSD_DATE),
            "DespatchParty" => [
                "AssociationOffice" => [
                    "id" => new SoapVar("TST", XSD_STRING),
                    "name" => new SoapVar("Test Office", XSD_STRING),
                    "associationId" => new SoapVar("150", XSD_STRING)
                ]
            ],
            "DeliveryParty" => [
                "AssociationOffice" => [
                    "id" => new SoapVar("RCV", XSD_STRING),
                    "name" => new SoapVar("Receiving Office", XSD_STRING),
                    "associationId" => new SoapVar("150", XSD_STRING)
                ]
            ],
            "TIRCarnetDespatchLine" => [
                "Id" => new SoapVar("4232772", XSD_STRING),
                "Quantity" => new SoapVar("100", XSD_UNSIGNEDINT),
                "TIRCarnetItem" => [
                    "VoletCount" => new SoapVar("4", XSD_INT),
                    "CarnetType" => new SoapVar("ORDINARY", XSD_STRING),
                    "TIRCarnetRangeInstance" => [
                        "FirstTIRCarnetNumber" => "XB92115201",
                        "LastTIRCarnetNumber" => "XW92115300",
                        "UnitQuantity" => "100"
                    ]
                ]
            ]
        ]
    ]); // call doFilter() from .wsdl
        
    print_r("<pre><H3>Result</H3>*" . $response . "*</pre>");
} catch (SoapFault $sf) {
    echo "<pre><H3>SoapFault message</H3>" . $sf->getMessage() . "</pre><pre>";
    var_dump($sf);
    echo "</pre>";
}

echo "<pre><H3>Response</H3>";
var_dump($client->__getLastResponseHeaders());
var_dump($client->__getLastResponse());
echo "</pre><pre><H3>Request</H3>";
var_dump($client->__getLastRequestHeaders());
var_dump($client->__getLastRequest());
echo "</pre><pre><H3>Internals</H3>";
var_dump($client->__getFunctions());
var_dump($client->__getTypes());
echo "</pre>";
