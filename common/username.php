<?php
function valid_username($username)
{
	if(preg_match('/^\w{5,20}$/', $username)) { // \w equals "[0-9A-Za-z_]"
		// valid username, alphanumeric & longer than or equals 5 chars
		return true;
	}
	return false;
}
?>