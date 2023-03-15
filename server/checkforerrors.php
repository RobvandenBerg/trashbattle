<?php
include_once('../common/index.php');

$errorsavefile = './founderrors.txt';

$delports = array();
foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator('./logs')) as $filename)
{
	echo "$filename\n";
	$filecontent = file_get_contents($filename);
	unlink($filename);
	if(!empty($filecontent))
	{
		// The file is not empty, so something went wrong. Export the log data and make sure this game gets deleted from the MySQL table
		$filenamesplit = explode('./logs/errorlog_',$filename);
		$split2 = explode('.txt',$filenamesplit[1]);
		$portNumber = $split2[0];
		array_push($delports,$portNumber);
		echo 'NOT AN EMPTY FILE AT PORT ' . $portNumber;
		$now = date("Y-m-d H:i:s");
		$writedata = 'Error found at '. $now . ' at port '.$portNumber.':' . "\n" . $filecontent . "\n\n";
		file_put_contents($errorsavefile, $writedata, FILE_APPEND | LOCK_EX);
	}
	echo '<br>';
}

if(!empty($delports))
{
	echo 'EXECUTE QUERY:<br>';
	$query = 'DELETE FROM games WHERE port='.$delports[0];
	for($i = 1; $i < count($delports); $i++)
	{
		$query .= ' OR port='.$delports[$i];
	}
	echo $query;
	$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db) or die($mysqli -> error);
	$delete_mysql_rows_query = $mysqli -> query($query);
	$mysqli -> close();
}

?>