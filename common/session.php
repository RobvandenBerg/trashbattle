<?php

session_start();
setcookie(session_name(), session_id(), 0, '/');