<?php
header('Access-Control-Allow-Origin: *');
include('../../common/index.php');
$mysqli = new mysqli($dbhost,$dbuser,$dbpass,$db);
$select_games_query = $mysqli -> query('SELECT games.id,users.username,games.players,games.max_players from games, users where users.id=games.host order by games.players DESC, games.max_players DESC, games.guests DESC, games.chat DESC, games.created DESC LIMIT 0,10') or die($mysqli -> error);
$games = array();
$total_games = $select_games_query -> num_rows;
for($i = 0; $i < $total_games; $i++)
{
	$select_games_row = $select_games_query -> fetch_assoc();
	$game_id = round($select_games_row['id']);
	$host_username = $select_games_row['username'];
	$players = round($select_games_row['players']);
	$max_players = round($select_games_row['max_players']);
	$game = array();
	$game['id'] = $game_id;
	$game['host_username'] = $host_username;
	$game['players'] = $players;
	$game['max_players'] = $max_players;
	array_push($games,$game);
}
echo json_encode($games);
?>