# UNTRR-AskTIRweb
Integrare UNTRR S1 cu AskTIRweb WS, server SOAP intermediar, conform specificatii din "AskTIRweb Integration WebServices
AskTIRweb Team — September 24, 2020", capitolul 5.3.

## APIs implementate in SOAP server: 
- authorizeAndCaptureTIRCarnetIssuanceTransaction (with no haulierAccount)
>Without reservation In this mode of operation, after the issuance is finished successfully,
>there will be an asynchronous call to the authorizeAndCaptureTIRCarnetIssuanceTransaction method with tirCarnetDespatchAdvice and optionally the selected haulierAccount if the Association chose to use Haulier orders.
- sendTIRCarnetDespatchAdvice
- sendTIRCarnetReceiptAdvice

## Logging:
Fisierele se creaza la prima rulare a serverului.
- Logging requests from IRU: log.txt.
- Logging vars and intermediate sequences in the process: debug.txt

## Resurse instalare:
https://github.com/cosmin-vestemean/UNTRR-AskTIRweb

## Instalare:
- Copiati SOAP dir in html_docs (public html dir) pe server web (Este necesar un server de web on some host)
- Creati SOAPSECURITY script in S1 Import
- Creati prin mostenire de la forms in uz form-urile din "S1 forms" and merge the code
- Creati in SQL Scripts getDetails.sql
- Creati un web service si cont aferent cu drepturi in toate filialele. (Web and Mobile/Cont web.jpg)
- Adaugati credentiale si appId in urmatoarele functii:

```
    private function get_clientID_Sediu()
    {
        // connect to S1 WS
        $lr = $this->loginS1WS('username', 'password', '5003');
        $clientID = $this->authS1WS($lr)['clientID'];

        return $clientID;
    }

    private function get_clientID_Branch($branch)
    {
        // connect to S1 WS
        $lr = $this->loginS1WS('username', 'password', '5003');
        $clientID = $this->authS1WS_Branch($lr, $branch)['clientID'];

        return $clientID;
    }
```

## Teste:
Atasata colectia Postman ("Db test IRU/UNTRR_IRU.postman_collection.json")
