<?php
if($_GET['pid'])
{
	$pid = round($_GET['pid']);
	exec('kill '.$pid);
	echo 'Killed ' . $pid;
}
?>