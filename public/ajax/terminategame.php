<?php
header('Access-Control-Allow-Origin: *');
include('../../common/index.php');

if(!$_SESSION['moderator'])
{
	// Haha, nice try ;)
	exit('Haha, nice try ;)');
}
if($_GET['id'])
{
	$game_id = round($_GET['id']);
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
	$select_pid_query = $mysqli -> query('SELECT pid from games where id='.$game_id) or die($mysqli -> error);
	if($select_pid_query -> num_rows != 1)
	{
		$mysqli -> close();
		exit('That game does not exist anymore. <a href="../client">Back to menu</a>');
	}

	$select_pid_row = $select_pid_query -> fetch_assoc();
	$pid = $select_pid_row['pid'];
	
	exec('kill '.$pid);
	
	$delete_game_query = $mysqli -> query('DELETE from games where id='.$game_id) or die($mysqli -> error);
	
	$mysqli -> close();
	echo 'Terminated game ' . $game_id . ' with pid ' . $pid;
}
?>