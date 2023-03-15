<?php
header('Access-Control-Allow-Origin: *');
include_once('../../common/index.php');

if(!$_SESSION['loggedin'])
{
	exit('{"success":false,"errormsg":"You have to be logged in to create games. Sorry!"}');
}

$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);

$bans = $mysqli->query('SELECT COUNT(*) AS total, time FROM trashbattle.bans WHERE  username="' . $_SESSION['username'] . '" OR ip="' . $_SERVER['REMOTE_ADDR'] . '"') or die($mysqli -> error);
if($bans->num_rows > 0) {
	$ban = $bans->fetch_assoc();
	if ($ban['time'] < time())
	{
		$mysqli->query('DELETE FROM trashbattle.bans WHERE  username="' . $_SESSION['username'] . '"');
	} else {
		$mysqli->close();
		exit('{"success":false,"errormsg":"You can\'t create games while you\'re banned!!"}');
	}
}

$sessions = $mysqli->query('SELECT sessions.username from trashbattle.sessions, trashbattle.games where sessions.username="' . $_SESSION['username'] . '" and games.id=sessions.game') or die($mysqli -> error);
if($sessions->num_rows > 0) {
	$mysqli->close();
	exit('{"success":false,"errormsg":"You can\'t create games while you\'re already in a game!!"}');
}

$userid = $_SESSION['userid'];

$JSON = stripslashes($_POST['gamedata']);
$gamedata = json_decode($JSON);
$chat = 0;
$maxplayers = 4;
$guests = 0;
$maxcoins = 10;
$lives = 3;
$maxwins = 5;
$items = json_decode('{"coin": 0, "bowlingball": 0, "star": 0, "heart": 0, "tnt": 0}');
$difficulty = 'medium';
$password = '';


if($gamedata -> {'maxplayers'})
{
	$maxplayers = $gamedata -> {'maxplayers'};
	if($maxplayers != 2 && $maxplayers != 3 && $maxplayers != 4)
	{
		$maxplayers = 4;
	}
}

if($gamedata -> {'chat'})
{
	$chat = $gamedata -> {'chat'};
	if($chat != 1 && $chat != 0)
	{
		$chat = 0;
	}
}

if($gamedata -> {'guests'})
{
	$guests = $gamedata -> {'guests'};
	if($guests != 1 && $guests != 0)
	{
		$guests = 1;
	}
	if($guests == 1 && !$GLOBALS['guests_allowed'])
	{
		$guests = 0;
	}
}

if($gamedata -> {'maxcoins'})
{
	$maxcoins = $gamedata -> {'maxcoins'};
	if($maxcoins != 5 && $maxcoins != 10 && $maxcoins != 15)
	{
		$maxcoins = 10;
	}
}

if($gamedata -> {'lives'})
{
	$lives = $gamedata -> {'lives'};
	if($lives != 1 && $lives != 2 && $lives != 3 && $lives != 5)
	{
		$lives = 3;
	}
}

if($gamedata -> {'maxwins'})
{
	$maxwins = $gamedata -> {'maxwins'};
	if($maxwins != 1 && $maxwins != 2 && $maxwins != 3 && $maxwins != 5 && $maxwins != 10 && $maxwins != 15)
	{
		$maxwins = 5;
	}
}

if($gamedata -> {'difficulty'})
{
	$difficulty = $gamedata -> {'difficulty'};
	if($difficulty != 'easy' && $difficulty != 'medium' && $difficulty != 'hard')
	{
		$difficulty = 'medium';
	}
}

if($gamedata -> {'password'})
{
	$password = $mysqli -> real_escape_string($gamedata -> {'password'});
	if(strlen($password) > 20 || strlen($password) < 1)
	{
		$password = '';
	}
}

if($gamedata -> {'items'})
{
	$itemsObject = $gamedata -> {'items'};
	if($itemsObject -> {'coin'})
	{
		$items -> {'coin'} = $itemsObject -> {'coin'};
		if($items -> {'coin'} != 0 && $items -> {'coin'} != 1)
		{
			$items -> {'coin'} = 0;
		}
	}
	if($itemsObject -> {'bowlingball'})
	{
		$items -> {'bowlingball'} = $itemsObject -> {'bowlingball'};
		if($items -> {'bowlingball'} != 0 && $items -> {'bowlingball'} != 1)
		{
			$items -> {'bowlingball'} = 0;
		}
	}
	if($itemsObject -> {'star'})
	{
		$items -> {'star'} = $itemsObject -> {'star'};
		if($items -> {'star'} != 0 && $items -> {'star'} != 1)
		{
			$items -> {'star'} = 0;
		}
	}
	if($itemsObject -> {'heart'})
	{
		$items -> {'heart'} = $itemsObject -> {'heart'};
		if($items -> {'heart'} != 0 && $items -> {'heart'} != 1)
		{
			$items -> {'heart'} = 0;
		}
	}
	if($itemsObject -> {'tnt'})
	{
		$items -> {'tnt'} = $itemsObject -> {'tnt'};
		if($items -> {'tnt'} != 0 && $items -> {'tnt'} != 1)
		{
			$items -> {'tnt'} = 0;
		}
	}
}

$items = json_encode($items);


$port = 10000;

$select_port_query = $mysqli -> query('SELECT port from games order by port DESC LIMIT 0,1');
if($select_port_query -> num_rows == 1)
{
	$row = $select_port_query -> fetch_assoc();
	$newport = $row['port'] + 1;
	if($newport > $port)
	{
		$port = $newport;
	}
}


$foundport = false;
$host = 'localhost';

while(!$foundport)
{
$connection = @fsockopen($host, $port);

	if (is_resource($connection))
	{
		// $port is in use
		$port++;
		fclose($connection);
	}
	else
	{
		// $port is not in use yet!
		$foundport = true;
		
		// LAUNCH THE NODE SERVER
		$pid = launchNodeServer($port);
		
		// Insert the port into the MySQL database
		$insert_request = $mysqli -> query('INSERT into games (host,port,pid,max_players,guests,chat,maxcoins,lives,maxwins,items,difficulty,password) VALUES ('.$userid.','.$port.','.$pid.','.$maxplayers.','.$guests.','.$chat.','.$maxcoins.','.$lives.','.$maxwins.',\''.$items.'\',"'.$difficulty.'","'.$password.'")') or die($mysqli -> error);
		
		// Select ID query
		$select_id_query = $mysqli -> query('SELECT id from games where host='.$userid.' and port='.$port.' and pid='.$pid.' order by id DESC LIMIT 0,1') or die($mysqli -> error);
		$select_id_row = $select_id_query -> fetch_assoc();
		$game_id = $select_id_row['id'];
		echo '{"success":true,"id":'.$game_id.',"pid":' . $pid . ',"port":'.$port.'}';
	}
	if($port > 10999)
	{
		// Could not find a port
		echo '{"success":false,"errormsg":"We could not create a game at the moment. This might be because the server is too full. Please try again later"}';
	}
}

$mysqli -> close();



function launchNodeServer($port)
{

	$cmd = '/usr/bin/node ../../server/game.js ' . $port;
	exec("$cmd 1>../../server/logs/outlog_" . $port . ".txt 2>../../server/logs/errorlog_" . $port . ".txt & echo $!", $output);
	$pid = $output[0];
	return $pid;
}

?>