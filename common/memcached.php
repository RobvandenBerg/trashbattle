<?php

class MemcachedSessionHandler {

    private $host = "localhost";
    private $port = 11211;
    private $lifetime = 0;
    private $memcache = null;
 
    public function __construct() {
        $this->memcache = new Memcached;
        $this->memcache->addServer($this->host, $this->port) or die("Error : Memcache is not ready");
		session_set_save_handler(
            array($this, "open"),
            array($this, "close"),
            array($this, "read"),
            array($this, "write"),
            array($this, "destroy"),
            array($this, "gc")
        );
    }
 
    public function __destruct() {
        session_write_close();
        //$this->memcache->close();
    }
 
    public function open($savePath, $name) {
        $this->lifetime = ini_get('session.gc_maxlifetime');
        return true;
    }
 
    public function read($id) {
        $_SESSION = json_decode($this->memcache->get("sessions/{$id}"), true);
        if (isset($_SESSION) && !empty($_SESSION) && $_SESSION != null) {
             return session_encode();
        } else {
            return "";
        }
    }
 
    public function write($id, $data) {
        return $this->memcache->set("sessions/{$id}", json_encode($_SESSION), 0);
    }
 
    
    public function destroy($id) {
        return $this->memcache->delete("sessions/{$id}");
    }
 
    public function gc($maxlifetime) {
        return true;
    }
 
    public function close() {
        return true;
    }
}

$sessionManager = new MemcachedSessionHandler();