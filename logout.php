<?php

include('common/index.php');

if($_SESSION['loggedin']) {
	session_destroy();
	setcookie(session_name(), '', time() - 42000, '/');
}

header('location: ./');
exit('<script>window.location="./";</script>');