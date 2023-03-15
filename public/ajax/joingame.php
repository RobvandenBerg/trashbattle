<?php
header('Access-Control-Allow-Origin: *');
include('../../common/index.php');


$game_id = round($_GET['id']);

$response = array();

$_SESSION['ip'] = $_SERVER['REMOTE_ADDR'];

$moderator = 0;

if($_SESSION['moderator'])
{
	$moderator = $_SESSION['moderator'];
}

if ($_SESSION['loggedin']) {
	// The visitor is logged in
	$username = $_SESSION['username'];
	$userid = $_SESSION['userid'];
} else {
	// The visitor is a guest!
	if($_SESSION['username']) {
		// The guest already has a guest username
		$username = $_SESSION['username'];
	} else {
		// The guest does not have a username yet, let's create one for him/ her
		$username = 'Guest ' . rand(0,100000);
		$_SESSION['username'] = $username;
		
		if($_GET['r']) {
			// The game already reloaded after setting a session, but somehow there's still no session now
			// This most likely means the user doesn't have cookies enabled
			$response['error'] = 'Please allow cookies to play this game.';
			exit(json_encode($response));
			exit('Please allow cookies to play this game. <a href="joingame.php?id='.$game_id.'&r=1">Retry</a>');
		}
		
		// &r=1 means reload=true
		header('location: joingame.php?id='.$game_id.'&r=1');
		exit();
	}
}

if($_GET['r'] && $_SESSION['username']) {
	// The game redirected the user and the session got remembered. Now let's reload the page to join the game
	header('location: joingame.php?id='.$game_id);
	exit();
}

$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);

if($_SESSION['usernameColor'] && $_SESSION['username']) {
	$record = $mysqli->query('SELECT usernameColor,coins,ranking from users where username="' . $_SESSION['username'] . '"');
	$data = $record->fetch_assoc();
	$_SESSION['coins'] = $data['coins'];
	$_SESSION['ranking'] = $data['ranking'];
	$_SESSION['usernameColor'] = $data['usernameColor'];
}

$select_port_query = $mysqli->query('SELECT games.port,games.chat,users.username,games.password,servers.server from games, users, servers where games.id='.$game_id.' and users.id=games.host and games.server_id=servers.id') or die($mysqli->error());
$mysqli -> close();

if($select_port_query->num_rows != 1) {
	$response['error'] = 'That game does not exist (anymore).';
	exit(json_encode($response));
	exit('That game does not exist (anymore). <a href="./">Back to menu</a>');
}

$select_port_row = $select_port_query->fetch_assoc();
$port = $select_port_row['port'];
$chat = $select_port_row['chat'];
$gameHost = $select_port_row['username'];
$password = $select_port_row['password'];
$server = $select_port_row['server'];
$passwordProtected = false;
if(strlen($password) > 0)
{
	// This game has a password
	$passwordProtected = true;
}

$response['server'] = $server;
$response['port'] = $port;
$response['chat'] = $chat;
$response['host'] = $gameHost;
$response['p'] = $passwordProtected;
$response['userid'] = $_SESSION['userid'];
$response['sessid'] = session_id();
$response['m'] = $_SESSION['moderator'];
$response['username'] = $_SESSION['username'];
$response['loggedIn'] = $_SESSION['loggedin'];

$detect = new Mobile_Detect;
 
// Any mobile device (phones or tablets).
$onScreenControlls = false;
if ( $detect->isMobile() ) {
	$onScreenControlls = true;
}
$response['mobile'] = $onScreenControlls;

echo json_encode($response);
?>