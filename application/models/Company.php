<?php
/**
 * COMPANY SPECIFIC FUNCTIONS
 *
 * @author Baycik
 */
require_once 'Catalog.php';
class Company extends Catalog{
    public function branchFetch() {
	$parent_id = $this->input->get('id') or $parent_id=0;
	$table = "companies_tree LEFT JOIN companies_list USING(branch_id)";
	$assigned_path=  $this->Base->svar('user_assigned_path');
	$level=$this->Base->svar('user_level');
	return $this->treeFetch($table, $parent_id, 'top', $assigned_path, $level);
    }
    public function listFetch( $mode='' ){
	$q = $this->input->get('q') or $q = 0;
	$assigned_path=$this->Base->svar('user_assigned_path');
	$level=$this->Base->svar('user_level');
	if( $q ){
	    $sql="SELECT *
		FROM
		    companies_tree
		JOIN 
		    companies_list USING(branch_id)
		WHERE
		    label LIKE '%$q%'
			AND
		    is_leaf=1
			AND
		    path LIKE '$assigned_path%'
			AND
		    level<=$level
		    ";
	    return $this->get_list( $sql );
	}
	else if( $mode=='selected_passive_if_empty' ){
	    return array($this->Base->svar('pcomp'));    
	}
	return array();
    }

    public function companyGet( $company_id=0 ){
	$assigned_path=$this->Base->svar('user_assigned_path');
	$sql="SELECT
		*
	    FROM
		companies_list cl
	    JOIN
		companies_tree USING(branch_id)
	    WHERE
		path LIKE '$assigned_path%'
		    AND
		company_id=$company_id";
	return $this->get_row($sql);
    }
    
    
    public function companyCreate($parent_id){
    }
    public function companyUpdate($company_id, $field, $value) {
	$key = array(
	    'company_id' => $company_id
	);
	$data = array(
	    $field => $value
	);
	return $this->update("companies_tree LEFT JOIN companies_list USING(branch_id)", $key, $data);
    }
    public function companyDelete($company_id){
	$company_id=(int) $company_id;
	$row = $this->db->query("SELECT branch_id FROM companies_list WHERE company_id='$company_id'")->row();
	if( $row && $row->branch_id ){
	    // don't forget delete from companies_list
	    return $this->treeDelete('companies_tree', $row->branch_id);
	}
	return false;
    }

    public function selectPassiveCompany( $company_id ){
	$company=$this->companyGet( $company_id );
	$this->Base->svar('pcomp',$company);
	return $company;
    }
    
    public function companyPrefsGet(){
	$passive_company_id=$this->Base->pcomp('company_id');
	if( !$passive_company_id ){
	    return null;
	}
	$sql_disct="SELECT
		st.branch_id,
		label,
		discount
	    FROM
		stock_tree st
	    LEFT JOIN
		companies_discounts cd ON st.branch_id=cd.branch_id AND company_id=$passive_company_id
	    WHERE 
		parent_id=0
	    ORDER BY label";
	$sql_other="SELECT
		deferment,
		curr_code,
		manager_id,
		is_supplier,
		company_acc_list,
		language,
		'".$this->Base->pcomp('path')."' path
	    FROM
		companies_list
	    WHERE 
		company_id='$passive_company_id'
	    ";
	return array(
	    'discounts'=>$this->get_list($sql_disct),
	    'other'=>$this->get_row($sql_other)
		);
    }
    public function companyPrefsUpdate( $type, $field, $value ){
	$this->Base->set_level(2);
	switch( $type ){
	    case 'discount':
		return $this->discountUpdate($field,$value);
	    case 'other':
		if( in_array($field, array('deferment','curr_code','manager_id','is_supplier','company_acc_list','language')) ){
		    $passive_company_id = $this->Base->pcomp('company_id');
		    return $this->db->query("UPDATE companies_list SET $field='$value' WHERE company_id=$passive_company_id");
		}
		return false;
	}
    }
    private function discountUpdate( $branch_id, $discount ){
	$passive_company_id = $this->Base->pcomp('company_id');
	if( $discount==1 ){/*Discount is zero so lets delete it*/
	    $this->db->query("DELETE FROM companies_discounts WHERE branch_id=$branch_id AND company_id=$passive_company_id");
	} else {
	    $this->db->query("REPLACE INTO companies_discounts SET company_id=$passive_company_id, branch_id=$branch_id, discount=$discount");
	}
	return true;
    }
}
