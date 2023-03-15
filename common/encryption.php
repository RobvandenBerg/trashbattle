<?php
function encrypt_password($password)
{
	$password = 'j3' . $password . 'v ';
	$password = md5($password);
	return $password;
}
?>