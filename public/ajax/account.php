<?php
header('Access-Control-Allow-Origin: *');
require('../../common/index.php');

if ($_GET['method'] && $_GET['method'] == 'getuserinfo') {
	if (!$_SESSION['loggedin']) {
		echo json_encode(array('success' => 0, 'msg' => 'User is not logged in'));
		exit();
	}
	
	$coins = 0;
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$check_coins = $mysqli -> query('SELECT `coins`, `ranking` FROM users WHERE id=' . $mysqli -> real_escape_string($_SESSION['userid']));
	if($check_coins -> num_rows == 1) {
		$row = $check_coins -> fetch_assoc();
		$coins = $row['coins'];
		$ranking = $row['ranking'];
	}
	$mysqli->close();
	
	$arr = array('loggedIn' => $_SESSION['loggedin'], 'username' => $_SESSION['username'], 'userId' => $_SESSION['userid'], 'm' => $_SESSION['moderator'], 'usernameColor' => $_SESSION['usernameColor'], 'q' => $_SESSION['god'], 'coins' => $coins, 'ranking' => $ranking);
	echo json_encode(array('success' => 1, 'data' => $arr));
	exit();
}

if ($_GET['method'] && $_GET['method'] == 'logout') {
	if($_SESSION['loggedin']) {
		session_destroy();
		setcookie(session_name(), '', time() - 42000, '/');
		echo json_encode(array('success' => 1));
		exit();
	}

	echo json_encode(array('success' => 0, 'msg' => 'User was already logged out'));
	exit();
}

if ($_GET['method'] && $_GET['method'] == 'login') {
	if($_SESSION['loggedin']) {
		echo json_encode(array('success' => 0, 'msg' => 'User already logged in'));
		exit();
	}
	
	if($_POST['username'] && $_POST['password']) {
		$username = $_POST['username'];
		$password = encrypt_password($_POST['password']);
		
		$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
		$check_login_request = $mysqli -> query('SELECT id, username, password, activated, moderator, god, coins, ranking, usernameColor FROM users WHERE username=\'' . $mysqli -> real_escape_string($username) . '\'');
		if($check_login_request -> num_rows != 1) {
			$errors = 'Invalid username';
		}
		if(empty($errors)) {
			$row = $check_login_request -> fetch_assoc();
			$real_password = $row['password'];
			$activated = $row['activated'];
			if($real_password != $password) {
				$errors = 'Invalid password';
			}
			if(empty($errors) && $activated == 0) {
				$errors = 'Your account is not activated yet! Please click the link in the email we sent you';
			}
			if(empty($errors)) {
				$_SESSION['userid'] = $row['id'];
				$_SESSION['username'] = $row['username'];
				$_SESSION['usernameColor'] = $row['usernameColor'];
				$_SESSION['loggedin'] = true;
				$_SESSION['moderator'] = $row['moderator'];
				$_SESSION['god'] = $row['god'];
				$_SESSION['coins'] = $row['coins'];
				$_SESSION['ranking'] = $row['ranking'];
					
				// Logged in
				$arr = array('loggedIn' => $_SESSION['loggedin'], 'username' => $_SESSION['username'], 'userId' => $_SESSION['userid'], 'm' => $_SESSION['moderator'], 'usernameColor' => $_SESSION['usernameColor'], 'q' => $_SESSION['god'], 'coins' => $_SESSION['coins'], 'ranking' => $_SESSION['ranking']);
				echo json_encode(array('success' => 1, 'data' => $arr));
				$mysqli->close();
				exit();
			}
		}
		echo json_encode(array('success' => 0, 'msg' => $errors));
		$mysqli->close();
		exit();
	}
	
	echo json_encode(array('success' => 0, 'msg' => 'Missing information provided'));
	exit();
}

echo json_encode(array('success' => 0, 'msg' => 'Invalid method'));
exit();