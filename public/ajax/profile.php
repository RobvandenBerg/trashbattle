<?php
header('Access-Control-Allow-Origin: *');
include('../../common/index.php');

if($_GET['action'] == 'fetch')
{
	$username = $_GET['username'];
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$select_profile_query = $mysqli -> query('SELECT id, username, registered, coins, ranking, moderator, god, aboutme from users where username="'.$mysqli->real_escape_string($username).'"') or die($mysqli -> error);
	$mysqli -> close();
	if($select_profile_query -> num_rows != 1)
	{
		exit(json_encode(array('success' => 0, 'msg' => 'The user ' . htmlentities(stripslashes($username)) . ' does not exist')));
	}
	$data = $select_profile_query -> fetch_assoc();
	$id = $data['id'];
	$username = $data['username'];
	$registered = $data['registered'];
	$coins = $data['coins'];
	$ranking = $data['ranking'];
	$moderator = $data['moderator'];
	$god = $data['god'];
	$aboutme = htmlentities($data['aboutme']);

	$responsedata = $data;
	$responsedata['aboutme'] = $aboutme;

	echo json_encode(array('success' => 1, 'data' => $responsedata));
	exit();
}
else if($_GET['action'] == 'saveAboutme')
{
	$username = $_GET['username'];
	$aboutme = $_POST['aboutme'];
	
	if(!$_SESSION['loggedin'] || (!$_SESSION['moderator'] && $_SESSION['username'] != $username))
	{
		exit(json_encode(array('success' => 0, 'msg' => 'You don\'t have the privilege to do this')));
	}

	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$select_profile_query = $mysqli -> query('UPDATE users set aboutme="'.$mysqli->real_escape_string($aboutme).'" where username="'.$mysqli->real_escape_string($username).'"') or die($mysqli -> error);
	$mysqli -> close();

	echo json_encode(array('success' => 1, 'aboutme' => htmlentities(stripslashes($aboutme))));
	exit();
}
exit(json_encode(array('success' => 0, 'msg' => 'Invalid request')));
	
?>