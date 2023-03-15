<?php
function valid_email($email)
{
	if (!preg_match("/([\w\-]+\@[\w\-]+\.[\w\-]+)/",$email)) {
	  return false;
	}
	return true;
}

function generate_registration_key($email = 'none')
{
	$gentime = microtime(true) * 10000 + strlen($email);
	$alphabet = 'abcdefghijklmnop';
	$splittedalphabet = str_split($alphabet . strtoupper($alphabet));
	shuffle($splittedalphabet);
	$substrtime = substr($gentime, -7);
	$explsubstrtime = str_split($substrtime);
	for($i = 0; $i < count($explsubstrtime); $i++)
	{
		$registration_key .= $splittedalphabet[$explsubstrtime[$i]];
	}
	return $registration_key;
}

function send_registration_mail($username,$email,$user_id,$registration_key)
{
	// the message
	$message = "Hi $username!\n\nCongratulations! You succesfully registered to Trash Battle! In order to activate your account and play,\nwe ask you to visit the link below:\n<a href='http://trashbattle.com/activate.php?id=$user_id&key=$registration_key'>http://trashbattle.com/activate.php?id=$user_id&key=$registration_key</a>\n\nWe hope to see you soon!\n\n-The Trash Battle team\n";
	$message = nl2br($message);
	// use wordwrap() if lines are longer than 70 characters
	
	$headers = "MIME-Version: 1.0" . "\r\n";
	$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

	// More headers
	//$headers .= 'From: <administration@3dsplaza.com>' . "\r\n";
	
	$subject = 'Welcome to Trash Battle, '.$username.'!';

	// send email
	mail($email,$subject,$message,$headers);
}
?>