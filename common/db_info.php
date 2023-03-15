<?php

$dbInfo = json_decode(file_get_contents(__DIR__ . '/../database_info.json'), true);
$dbhost = $dbInfo['host'];
$db = $dbInfo['db'];
$dbuser = $dbInfo['user'];
$dbpass = $dbInfo['password'];

?>