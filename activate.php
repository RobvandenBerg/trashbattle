<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


include('common/index.php');
$user_id = $_GET['id'];
$key = $_GET['key'];

if(empty($user_id) or empty($key) or !ctype_alnum($user_id) or !ctype_alnum($key))
{
	echo 'f';
	exit();
}
$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
$select_registration_key_query = $mysqli -> query('SELECT registration_key,activated from users where id="'.$user_id.'"');
if($select_registration_key_query -> num_rows != 1)
{
	$mysqli -> close();
	echo 'f2';
	exit();
}
$row = $select_registration_key_query -> fetch_assoc();
$real_key = $row['registration_key'];
if($real_key != $key)
{
	$mysqli -> close();
	exit();
}

// Correct code, let's activate the account
if($row['activated'] == 0)
{
	$activate_request = $mysqli -> query('UPDATE users set activated=1 where id="'.$user_id.'"');
}

?>Congratulations! You activated your Trash Battle account! You can now play by <a href='login.php'>Logging in</a>