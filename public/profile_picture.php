<?php

function profile_picture_url($memberid)
{
	return 'http://trashbattle.com/profile_pics/'.$memberid.'.png';
}

function profile_picture($memberid)
{
	return '<img class="profile_picture" src="'.profile_picture_url($memberid).'" onerror="this.src=\'http://trashbattle.com/client/images/default_profile_picture.png\'">';
}

include_once('../common/index.php');


if(!$_SESSION['loggedin'])
{
	exit('You have to be logged in to do this.');
}
if(isset($banned))
{
	echo 'You can not upload pictures while being banned';
	exit();
}

$uploadmemberid = round($_GET['memberid']);

$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
$select_profile_query = $mysqli -> query('SELECT id, username, registered, coins, ranking, moderator, god, aboutme from users where id="'.$mysqli->real_escape_string($uploadmemberid).'"') or die($mysqli -> error);
$mysqli -> close();
if($select_profile_query -> num_rows != 1)
{
	exit('The user with id ' . $uploadmemberid . ' does not exist');
}
$data = $select_profile_query -> fetch_assoc();
$uploadmemberid = $data['id'];

if($uploadmemberid != $_SESSION['id'] && !$_SESSION['moderator'])
{
	exit('You don\'t have the privilege to do this');
}


require('resize_func.php');
//define a maxim size for the uploaded images in Kb
 define ("MAX_SIZE","500"); 

//This function reads the extension of the file. It is used to determine if the file  is an image by checking the extension.
 function getExtension($str)
 {
		 $i = strrpos($str,'.');
		 if (!$i) { return ''; }
		 $l = strlen($str) - $i;
		 $ext = substr($str,$i+1,$l);
		 return $ext;
 }
 
 if(isset($_POST['reset']))
 {
	// Reset the profile picture
	$file = './profile_pics/'.$uploadmemberid.'.png';
	if(file_exists($file))
	{
		unlink($file);
	}
 }

//This variable is used as a flag. The value is initialized with 0 (meaning no error  found)  
//and it will be changed to 1 if an errro occures.  
//If the error occures the file will not be uploaded.
 $errors=0;
//checks if the form has been submitted
 if(isset($_POST['checktime']) && !isset($_POST['reset'])) 
 {
	$post_time = $_POST['checktime'];
	session_start();
	
	// Lets look if our session called "form" does not exist or does not have the time sent via the form (no double post)
	if($_SESSION['uploadform']!= $post_time)
	{
		$_SESSION['uploadform'] = $post_time;
		$checked = "yes";
	}
	// But IF there is a session with the same time as the time sent, that the same information must have been posted twice!
	elseif(!isset($checked))
	{
		$doublepost = "yes";
	}
	if(!isset($doublepost))
	{
		
		//reads the name of the file the user submitted for uploading
		$image=$_FILES['image']['name'];
		//if it is not empty
		if ($image) 
		{
			//get the original name of the file from the clients machine
			$filename = stripslashes($_FILES['image']['name']);
			//get the extension of the file in a lower case format
			$extension = getExtension($filename);
			$extension = strtolower($extension);
			if ($extension != 'jpg' && $extension != 'png' && $extension != 'gif') 
			{
				// echo '<h1>Unknown extension!</h1>';
				$errors='Wrong file extension!';
			}
			else
			{
				 $size=filesize($_FILES['image']['tmp_name']);
				
				if ($size > MAX_SIZE*1024)
				{
					// echo '<h1>You have exceeded the size limit!</h1>';
					$errors='The picture is too big to be uploaded!';
				}
				if($errors == 0)
				{
					$thumb_name='./profile_pics/'.$uploadmemberid.'.png';
					$newname="./profile_pics/".$image_name;
					$image = new SimpleImage();
					  $image->load($_FILES['image']['tmp_name']);
					  //$image->resizeToMaximumDimension(50);
					  $image->resize(50,50);
					  $image->save($thumb_name,IMAGETYPE_PNG);
				}
			}
		}
		else
		{
			$errors = 'No picture selected!';
		}
	}
	else
	{
		$silent = 'yes';
	}
}
?>
<html>
<head>
<title>
Upload Picture - Trash Battle
</title>
<meta name='viewport' content='width=device-width'>
<style>
.option_button
{
	position: relative;
	padding-top: 10px;
	width: 280px;
	height: 40px;
	border-radius: 15px;
	border: 1px solid gray;
	background-image: url('images/button_background.png');
	background-repeat:repeat-x;
	text-align: center;
	font-family: Verdana, 'sans-serif';
	font-size: 20px;
}
.in_button_icon
{
	position: absolute;
	top: 5px;
	left: 10px;
}
.menulink
{
	text-decoration: none;
	color: black;
}
.upload_passed
{
	color: lime;
}
.upload_failed
{
	color: red;
}
.container
{
	text-align: center;
	padding: 5px;
}
table
{
	display: inline-block;
}

.profile_picture
{
	width: 50px;
	height: 50px;
	border: 1px solid black;
}
</style>
</head>
<body onLoad="document.body.scrollTop=218;">
<div class='container'>
<?php
//If no errors registred, print the success message
 if(isset($_POST['checktime']) && !$errors && !isset($silent)) 
 {
	if(isset($_POST['reset']))
	{
		echo '<span class="upload_passed">Picture reset to default!</span><br><br>';
	}
	else
	{
		echo '<span class="upload_passed">Picture uploaded successfully!</span><br><br>';
	}
 }
 elseif(isset($_POST['checktime']) && $errors && !isset($silent))
 {
	echo '<span class="upload_failed">Picture upload failed: '.$errors.'</span><br><br>';
 }


 ?>
 <!--next comes the form, you must set the enctype to "multipart/frm-data" and use an input type "file" -->
 Current profile picture:<br>
 <?php echo profile_picture($uploadmemberid);?>
 <hr>
 Allowed file formats: JPG, PNG, GIF<br>
 Upload profile picture:<br>
 <form onSubmit="document.getElementById('send').disabled=true;" method="post" enctype="multipart/form-data"  action="<?php echo $_SERVER['PHP_SELF'];?>?memberid=<?php echo $uploadmemberid;?>">
 <table>
	<tr><td><input type="file" name="image"></td></tr>
	<tr><td><input type='hidden' name='checktime' value='<?php echo microtime();?>'><input id='send' name="Submit" type="submit" value="Upload image"> <input name="reset" type="submit" value="Reset to default"></td></tr>
 </table>	
 </form>
 </div>
 </div>
</body>
</html>
