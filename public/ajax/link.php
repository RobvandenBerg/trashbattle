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
	
	include('/var/www/html/3dsplaza/members/db_leden.php');
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$select_link_query = $mysqli -> query('SELECT gebruikersnaam from ledengegevens where trashbattle_user_id="'.$mysqli->real_escape_string($data['id']).'"') or die($mysqli -> error);
	$num_links = $select_link_query -> num_rows;
	$linked_username = '';
	if($num_links == 1)
	{
		$row = $select_link_query -> fetch_assoc();
		$linked_username = $row['gebruikersnaam'];
	}
	
	$mysqli -> close();

	echo json_encode(array('success' => 1, 'linked_plaza_username' => $linked_username));
	exit();
}
else if($_GET['action'] == 'link')
{
	$username = $_GET['username'];
	$plaza_username = $_POST['plaza_username'];
	$plaza_passsword = $_POST['plaza_password'];
		
	
	// Encrypt Plaza password
	$plaza_passsword = sha1($plaza_passsword);
	$plaza_passsword = $plaza_passsword . "sl";
	$plaza_passsword = md5($plaza_passsword);
	// Done encrypting
	
	if(!$_SESSION['loggedin'] || (!$_SESSION['moderator'] && $_SESSION['username'] != $username))
	{
		exit(json_encode(array('success' => 0, 'msg' => 'You don\'t have the privilege to do this')));
	}
	
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$select_profile_query = $mysqli -> query('SELECT id, username, registered, coins, ranking, moderator, god, aboutme from users where username="'.$mysqli->real_escape_string($username).'"') or die($mysqli -> error);
	if($select_profile_query -> num_rows != 1)
	{
		exit(json_encode(array('success' => 0, 'msg' => 'The user ' . htmlentities(stripslashes($username)) . ' does not exist')));
	}
	$data = $select_profile_query -> fetch_assoc();
	$user_id = $data['id'];
	$username = $data['username'];
	$mysqli -> close();

	include('/var/www/html/3dsplaza/members/db_leden.php');
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$select_link_query = $mysqli -> query('SELECT gebruikersnaam from ledengegevens where trashbattle_user_id="'.$mysqli->real_escape_string($user_id).'"') or die($mysqli -> error);
	$num_links = $select_link_query -> num_rows;
	if($num_links != 0)
	{
		$row = $select_link_query -> fetch_assoc();
		$linked_plaza_account = $row['gebruikersnaam'];
		$mysqli -> close();
		echo json_encode(array('success' => 0, 'msg' => 'The Trash Battle account '.$username.' is already linked to the 3DSPlaza account '. htmlentities(stripslashes($linked_plaza_account))));
		exit();
	}
	
	$select_link_query = $mysqli -> query('SELECT gebruikersnaam, wachtwoord, trashbattle_user_id from ledengegevens where gebruikersnaam="'.$mysqli->real_escape_string($plaza_username).'"') or die($mysqli -> error);
	$num_links = $select_link_query -> num_rows;
	if($num_links != 1)
	{
		$mysqli -> close();
		echo json_encode(array('success' => 0, 'msg' => 'The 3DSPlaza username '. htmlentities(stripslashes($plaza_username)) . ' does not exist!'));
		exit();
	}
	$row = $select_link_query -> fetch_assoc();
	$plaza_username = $row['gebruikersnaam'];
	$plaza_check_password = $row['wachtwoord'];
	if($plaza_passsword != $plaza_check_password && !$_SESSION['moderator'])
	{
		$mysqli -> close();
		echo json_encode(array('success' => 0, 'msg' => 'Invalid password for account '. htmlentities(stripslashes($plaza_username)) . '!'));
		exit();
	}
	$linked_trashbattle_user_id = $row['trashbattle_user_id'];
	if($linked_trashbattle_user_id != 0)
	{
		// Check if the account that they are already linked to still exists
		$mysqli -> close();
		include('../../common/db_info.php');
		$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
		$select_profile_query = $mysqli -> query('SELECT id, username, registered, coins, ranking, moderator, god, aboutme from users where id="'.$mysqli->real_escape_string($linked_trashbattle_user_id).'"') or die($mysqli -> error);
		if($select_profile_query -> num_rows == 1)
		{
			$row = $select_profile_query -> fetch_assoc();
			$linked_trashbattle_username = $row['username'];
			$mysqli -> close();
			exit(json_encode(array('success' => 0, 'msg' => 'The user 3DSPlaza user ' .  htmlentities(stripslashes($plaza_username))  . ' is already linked to the Trash Battle account ' . htmlentities(stripslashes($linked_trashbattle_username)) . '!')));
		}
		$mysqli -> close();
		include('/var/www/html/3dsplaza/members/db_leden.php');
		$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	}
	// Everything is OK, link the accounts
	
	$update_link_query = $mysqli -> query('UPDATE ledengegevens set trashbattle_user_id="'.$user_id.'" where gebruikersnaam="'.$mysqli -> real_escape_string($plaza_username).'"') or die($mysqli -> error);
	$mysqli -> close();
	include('../../common/db_info.php');

	echo json_encode(array('success' => 1, 'linked_plaza_username' => htmlentities(stripslashes($plaza_username))));
	exit();
}
exit(json_encode(array('success' => 0, 'msg' => 'Invalid request')));
	
?>