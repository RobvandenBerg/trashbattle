# Trash Battle

An online multiplayer game that was in development many years ago, but never got to the point of release. Try the game on http://trashbattle.com.
Released now as open-source.

**Requirements:**
PHP
MySQL
Node.js with socket.io

Create a MySQL database, use trashbattle.sql to import the schema, and then edit database_info.json: replace \*database user here* and \*password here\* with the MySQL database user and password that you have set up.

*Note:* Currently only works over HTTP. No HTTPS support. If desired, this needs to be added to the node.js socket.io setup.
