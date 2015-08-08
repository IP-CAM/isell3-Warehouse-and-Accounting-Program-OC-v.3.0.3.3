<?php

require_once 'Catalog.php';
class User extends Catalog {
    public $min_level=0;
    public function SignIn(){
	$login=$this->input->post('login');
	$pass=$this->input->post('pass');
	$this->check($login,'^[a-zA-Z_0-9]*$');
	$this->check($pass,'^[a-zA-Z_0-9]*$');
	if( !$login || !$pass ){
	    $this->Base->kick_out();
	}
	$pass_hash = md5($pass);
	$user_data = $this->get_row("SELECT * FROM " . BAY_DB_MAIN . ".user_list WHERE user_login='$login' AND user_pass='$pass_hash'");
	if ($user_data->user_id) {
	    $this->Base->svar('user_id', $user_data->user_id);
	    $this->Base->svar('user_level', $user_data->user_level);
	    $this->Base->svar('user_level_name', $this->Base->level_names[$user_data->user_level]);
	    $this->Base->svar('user_login', $user_data->user_login);
	    if ( method_exists($this, 'initLoggedUser') ) {
		$this->initLoggedUser($user_data);
	    }
	    return $this->getUserData();
	}
	return false;
    }
    public function SignOut(){
	$this->Base->svar('user_id', 0);
	$this->Base->svar('user_level', 0);
	$this->Base->svar('user_login', '');
	$this->Base->svar('user_sign', '');
	$this->Base->svar('user_position', '');
	return true;
    }
    public function getUserData(){
	return [
	    'user_id'=>$this->Base->svar('user_id'),
	    'user_login'=>$this->Base->svar('user_login'),
	    'user_level'=>$this->Base->svar('user_level'),
	    'user_level_name'=>$this->Base->svar('user_level_name'),
	    'active_company_name'=>$this->Base->acomp('company_name'),
	    'module_list'=>$this->getModuleList()
	];
    }
    private function getModuleList(){
	$mods=json_decode(file_get_contents('config/modules.json',true));
	$alowed=array();
	foreach( $mods as $mod ){
	    if( $this->svar('user_level')>=$mod->level && strpos(BAY_ACTIVE_MODULES, "/{$mod->name}/")!==false ){
		$alowed[]=$mod;
	    }
	}
	return $alowed;
    }
}