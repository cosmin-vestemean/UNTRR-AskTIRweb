# UNTRR-AskTIRweb
Integrare UNTRR S1 cu AskTIRweb WS, server SOAP intermediar, conform specificatii din "AskTIRweb Integration WebServices
AskTIRweb Team — September 24, 2020", capitolul 5.3.

## APIs implementate: 
-authorizeAndCaptureTIRCarnetIssuanceTransaction
-sendTIRCarnetDespatchAdvice
-sendTIRCarnetReceiptAdvice

## Logging:
Logging requests from IRU: log.txt.
Logging vars and intermediate sequences in the process: debug.txt

## Resurse instalare:
https://github.com/cosmin-vestemean/UNTRR-AskTIRweb

## Instalare:
1. Copiati SOAP dir in html_docs pe server web
2. Creati prin mostenire de la forms in uz form-urile din "S1 forms" si merge codul
3. Creati in SQL Scripts getDetails.sql.
4. Creati un web service si cont aferent cu drepturi in toate filialele. (Web and Mobile/Cont web.jpg). Adaugati credentiale si appId in urmatoarele functii:

```
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
```
