<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://dev-untrronline.oncloud.gr/s1services',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>'{
    "service": "sqlData",
    "clientID": "9J8pM554GqabDqH4SbCbDK9DLa1YKLLCPqWbDZ1AM2KrH5TLTd1JI2KtGanLLNbPGqXX9JL3OLH9HLLOKq54KIKrHKLIIq5mS5WbDKH1TL1wPMLNLMn3J6fOGrKbDKHHLIKrGrf1OqfE9JT3KqbhP41NHIKtH7H99JOm9JT3KaToRM5KLoKtH6H0OKH2H69OObHKIKLFOb10IdSbDZ159JL39JL39JL4PLS",
    "appId": 5001,
    "SqlName": "getDetails",
    "asktirhauliercode": "xyz132",
    "asktirbranch": "4",
    "asktirbranch1": "0"
}',
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;
