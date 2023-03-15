<?php

if ($_GET['start'])
{
	$port = 2000;
	$file = 'room.js';
	if($_GET['port'])
	{
		$port = round($_GET['port']);
	}
	
	if($_GET['game'])
	{
		$file = 'game.js';
	}



$cmd = '/usr/local/bin/node ' . $file . ' ' . $port;
exec("$cmd >log.txt & echo $!", $output);
$pid = $output[0];
echo 'Launched process with pid '.$pid.'. <a href="killprocess.php?pid='.$pid.'">Kill process</a>';
}
?>