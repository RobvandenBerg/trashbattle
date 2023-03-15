<?php

include('common/index.php');

if ($_GET['username']) {
$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
$username = $mysqli->real_escape_string($_GET['username']);
$session = $mysqli->query("SELECT session_id FROM `sessions` where username='" . $username . "'");
$row = $session->fetch_assoc();
$session_id = $row['session_id'];
$sessions = $mysqli->query("DELETE FROM `sessions` where username='" . $username . "'");
$sessionManager->destroy($session_id);
$mysqli->close();
}

header('location: ./');
exit('<script>window.location="./";</script>');