<?php
include('common/index.php');
?>
<html>
	<head>
		<title>Trash Battle</title>
		<style>
			table {
				border-collapse: collapse;
				width: 100%;
			}
			
			table th {
				color: #ffffff;
				background-color: #555555;
				border: 1px solid #555555;
				padding: 3px;
				vertical-align: top;
				text-align: left;
			}
			
			table tr:nth-child(odd) {
				background-color: #f1f1f1;
			}
			
			table td {
				border: 1px solid #d4d4d4;
				padding: 5px;
				padding-top: 7px;
				padding-bottom: 7px;
				vertical-align: top;
			}
		</style>
	</head>
	<body>
	<?php
	if($_SESSION['loggedin'] && $_SESSION['moderator'])
	{
		$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
		$reports = $mysqli->query('SELECT * from reports') or die($mysqli->error());
		
		if ($reports->num_rows == 0) {
			echo 'There are no reports made';
		} else {
		?>
		<table>
		<tr>
			<th>Reporter</th>
			<th>Reportee</th>
			<th>Reason</th>
			<th>Time</th>
			<th>Actions</th>
		</tr>
		<?php
			while ($row = $reports->fetch_assoc())
			{
				$datetime = DateTime::createFromFormat('U', $row['datetime']);
			
				echo '<tr>';
				echo '<td>', $row['reporter'], '</td>';
				echo '<td>', $row['reportee'], '</td>';
				echo '<td>', $row['reason'], '</td>';
				echo '<td>', $datetime->format('Y-m-d H:i:s'), '</td>';
				echo '<td><button>See message log</button><button>Ban</button><button>Delete</button></td>';
				echo '</tr>';
			}
		?>
		</table>
		<?php
		}
		
		$mysqli->close();
	}
	else
	{
		echo 'You have to be logged in to see this page';
	}
	?>
	</body>
</html>