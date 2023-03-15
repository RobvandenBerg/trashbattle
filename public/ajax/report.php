<?php
header('Access-Control-Allow-Origin: *');
require('../../common/index.php');

if ($_GET['reports']) {
	$arr = array('loggedIn' => $_SESSION['loggedin'], 'username' => $_SESSION['username'], 'userId' => $_SESSION['userid'], 'm' => $_SESSION['moderator'], 'usernameColor' => $_SESSION['usernameColor'], 'q' => $_SESSION['god']);
	echo json_encode($arr);
}