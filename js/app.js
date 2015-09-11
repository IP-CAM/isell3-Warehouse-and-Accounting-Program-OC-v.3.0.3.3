/* global Mark, encodeURIComponent */

var App = {
    tplcache:{},
    handler:$.Deferred(),
    init: function () {
	App.loadBg();
	App.updaterInit();
        App.chatInit();
	App.onReady && App.onReady();
    },
    flash:function (msg, type) {
	if (type === 'error') {
	    $("#appStatus").html(msg);
	    $("#appStatus").window({
		title: 'Ошибка',
		width: 800,
		height: 300
	    });
	    $("#appStatus").window('move', {top: 0});
	}
	else if (type === 'alert') {
	    $.messager.alert('Внимание!', msg, 'error');
	}
	else {
	    clearTimeout(App.flashClock);
	    App.flashClock = setTimeout(function () {
		$.messager.show({title: 'Сообщение', msg: App.msg, showType: 'show'});
		App.msg = '';
	    }, 300);
	    App.msg = (App.msg || '') + msg + '<br>';
	}
    },
    setTitle:function( title ){
        this.title = title;
        $("#module_title").html('<span style="color:#b09"><b>' + App.user.props.active_company_name + '</b></span> - ' + this.title);
        document.title = this.title + ' / ' +  App.user.props.active_company_name;
    },
    initTabs: function (tab_id) {
	$('#' + tab_id).tabs({
	    selected: App.store(tab_id) || 0,
	    onSelect: function (title, index) {
		var href = $('#' + tab_id).tabs('getTab', title).panel('options').href;
		var id = href.replace(/\//g, '_').replace('.html', '');
		App[id] && App[id].focus && App[id].focus();
		App.store(tab_id, title);		    
	    },
	    onLoad:function(panel){
		var href = panel.panel('options').href;
		if( href ){
		    var id = href.replace(/\//g, '_').replace('.html', '');
		    if( App[id] ){
			if( !$("#" + id).length ){
			    panel.wrapInner('<div id="'+id+'" style="padding:0px"></div>');
			    panel.css('padding','5px');
			}
			App[id].data={inline:true};
			App[id].node=$("#" + id);
			App[id].init && App[id].init();
			App[id].initAfter && App[id].initAfter();
		    }
		}
	    }
	});
    },
    initModule: function(id,data,handler){
	App[id].data = data;
	App[id].handler = handler;
	App[id].node = $("#" + id);
	App[id].init ? App[id].init(data, handler) : '';
	if( !App[id].parsed ){
	    $.parser.parse("#" + id);//for easy ui
	    App[id].parsed=true;
	}
	App[id].initAfter ? App[id].initAfter(data, handler) : '';
    },
    loadModule: function (path, data) {
	var id = path.replace(/\//g, '_');
	var handler = $.Deferred();
	if( App[id] ){
	    App.initModule(id,data,handler);
	} else {
	    App[id] = {};
	    $("#" + id).load(path + '.html', function () {
		App.initModule(id,data,handler);
	    });	    
	}
	return handler.promise();	
    },
    loadWindow: function (path, data) {
	var id = path.replace(/\//g, '_');
	if (!$('#' + id).length) {
	    $('#appWindowContainer').append('<div id="' + id + '" class="app_window"></div>');
	}
	return App.loadModule(path, data || {});
    }
};
$(App.init);
//////////////////////////////////////////////////
//UTILS
//////////////////////////////////////////////////
App.json=function( text ){
    try{
	return text===''?null:JSON.parse(text);
    }
    catch(e){
	console.log('isell-app-json-err: '+e+text);
	return null;
    }
};
App.uri = function () {
    var args = Array.prototype.slice.call(arguments);
    return args.map(function(text){
	return encodeURIComponent(String(text).replace(/\n/g," "));
    }).join('/');
};
App.toIso = function (dmY) {
    if (dmY instanceof Date) {
	return dmY.getFullYear() + '-' + String("0" + (dmY.getMonth() + 1)).slice(-2) + '-' + String("0" + dmY.getDate()).slice(-2);
    }
    return dmY ? dmY.replace(/[^\d]/g, '').replace(/^[\d]{4}(\d\d)$/, "20$1").replace(/^(\d\d)(\d\d)(\d\d\d\d)$/, "$3-$2-$1") : null;
};
App.toDmy = function (iso) {
    if (iso instanceof Date) {
	return String("0" + iso.getDate()).slice(-2) + '.' + String("0" + (iso.getMonth() + 1)).slice(-2) + '.' + iso.getFullYear();
    }
    return iso.replace(/^(\d\d\d\d)-(\d\d)-(\d\d)T?(\d\d:\d\d:\d\d)?Z?$/, "$3.$2.$1");
};
App.today = function () {
    return App.toDmy(new Date());
};
App.formatNum = function (num, mode) {
    if (num === undefined || num === null || mode === 'clear' && num * 1 === 0) {
	return '';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};
App.formElements=function( fquery ){
    return $(fquery + " input," + fquery + " textarea," + fquery + " select");
};
App.setupForm = function ( fquery, fvalue, mode ) {
    if (!fquery) {
	return false;
    }
    fvalue=fvalue||{};
    App.formElements(fquery).each(function (i, element) {
	var value=fvalue[element.name] || ( mode==='use_inp_values'&&$(element).val() ?$(element).val():'');//Support for document header
	$(element).val(value);
	if ($(element).attr('type') === 'hidden') {
	    return true;
	}
	if ($(element).attr('title') && !$(element).attr('data-skip')) {
	    $(element).wrap('<div class="inp_group"><label></label></div>');
	    $(element).before("<b>" + element.title + ": </b>");
	}
	if ($(element).attr('type') === 'checkbox' && fvalue[element.name] * 1) {
	    $(element).attr('checked', 'checked');
	}
	$(element).attr('data-skip', 1);
    });
    return App.formElements(fquery);
};
App.collectForm = function (fquery) {
    var fvalue = {};
    App.formElements(fquery).each(function (i, element) {
	if (element.name) {
	    fvalue[element.name] = App.val(element);
	}
    });
    return fvalue;
};
App.val = function (element) {
    if ($(element).attr('type') === 'checkbox') {
	return $(element).is(':checked') ? 1 : 0;
    }
    return $(element).val();
};
App.store=function(key,value){
    if(value===undefined){
	return localStorage.getItem(key);
    }
    localStorage.setItem(key,value);
};
App.cookie = function (cname, cvalue) {
    if (cvalue === undefined) {
	var name = cname + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
	    var c = ca[i];
	    while (c.charAt(0) === ' ')
		c = c.substring(1);
	    if (c.indexOf(name) === 0)
		return c.substring(name.length, c.length);
	}
	return "";
    }
    else {
	var d = new Date();
	d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
    }
};
App.getUrlParent=function(){
    return location.href.split('/')[3];
};
App.loadBg = function () {
    if (localStorage.getItem('isell_bg'+App.getUrlParent())) {
	$("body").css('background', 'url("' + localStorage.getItem('isell_bg'+App.getUrlParent()) + '") repeat fixed center top');
	$("body").css('background-size', '100%');
    }
};
App.setBg = function () {
    App.loadWindow('page/dialog/background_setter');
};
App.datagrid = {
    tooltip: function (value, row) {
	if( !value ){
	    return '';
	}
	var parts = value.split(' ');
	var cmd = parts.shift();
	if (cmd)
	    return '<img src="img/' + cmd + '.png" title="' + parts.join(' ') + '">';
	else
	    return '';
    }
};
App.renderTpl=function( id, data, mode ){
    if( !this.tplcache[id] || mode==='nocache' ){
	this.tplcache[id]=$('#'+id).html().replace('&gt;','>').replace('<!--','').replace('-->','');
    }
    $('#'+id).html( Mark.up(App.tplcache[id], data) );
    $('#'+id).removeClass('covert');
};
App.updaterCheck=function ( skip_release_check ){ 
    var handler=$.Deferred();
    $.get('Maintain/getCurrentVersionStamp',function(stamp){
	$.getJSON('https://api.github.com/repos/baycik/isell3/commits?since='+stamp+'&callback=?',function(resp){
	    try{
		var is_release=false;
		var list=[];
		for(var i in resp.data){
		    var commit=resp.data[i].commit;
		    list.push({name:commit.committer.name,date:App.toDmy(commit.committer.date),message:commit.message});
		    if( commit.message.indexOf('release')>-1 || commit.message.indexOf('bugfix')>-1 ){
			is_release=true;
		    }
		}
		App.renderTpl('sync_panel',{updates:list,is_release:is_release});
                handler.notify('updatesChecked',list);
		if( !skip_release_check && is_release && App.flash("Поступили важные обновления!") ){
		    App.loadWindow('page/dialog/updater',{updates:list});
		}
	    } catch (e){
		console.log( e );
	    }
	});
    });
    return handler;
};
App.updaterInit=function(){
    if( App.user.signedIn ){
	App.renderTpl('sync_panel',{updates:[]});
	$('#sync_panel').click(function(){
	    App.updaterCheck( false ).progress(function(status,list){
		App.loadWindow('page/dialog/updater',{updates:list});
	    });
	});
	setTimeout(App.updaterCheck,1000*5);
    } else {
	setTimeout(App.updaterInit,1000*30);
    }
};
App.chatCheck=function(){
    if( App.user.signedIn ){
	$.get('Chat/checkNew',function(resp){
	    var count=resp*1;
	    App.renderTpl('chat_panel',{count:count});
	    if( count ){
		App.flash("У вас "+count+" новых сообщенией!");
	    }
	});
    }
    setTimeout(App.chatCheck,1000*60);
};
App.chatInit=function(){
    setTimeout(App.chatCheck,1000*5);
};
//////////////////////////////////////////////////
//AJAX SETUP
//////////////////////////////////////////////////
$.ajaxSetup({
    cache: true
});
$(document).ajaxComplete(function (event, xhr, settings) {
    if( settings.crossDomain===false ){
	$(document).css('cursor', '');
	var type = xhr.getResponseHeader('X-isell-type');
	var msg = xhr.getResponseHeader('X-isell-msg');
	if (msg) {
	    var msg = decodeURIComponent(msg.replace(/\+/g, " "));
	    if (type === 'error') {
		App.flash(msg, 'error');
	    }
	    else {
		App.flash(msg);
	    }
	}
	else if (!type || type.indexOf('error') > -1) {
	    //alert( xhr.responseText );
	    App.flash("<h3>url: " + settings.url + "</h3><big>" + xhr.responseText+"</big>", 'error');
	}
    }
});
$(document).ajaxError(function (event, xhr, settings) {
    var type = xhr.getResponseHeader('X-isell-type');
    if (type && type.indexOf('OK') > -1 || settings.crossDomain===true) {
	return;
    }
    App.flash("<h3>error url: " + settings.url + "</h3>" + xhr.responseText, 'error');
});
$(document).ajaxSend(function () {
    $(document).css('cursor', 'wait');
});
$.fn.pagination.defaults.layout=['list','sep','first','prev','sep','links','sep','next','sep'];
$.fn.pagination.defaults.displayMsg="{from}-{to}/{total}";

$.fn.datebox.defaults.formatter = function (date) {
    return App.toDmy(date);
};
$.fn.datebox.defaults.parser = function (input) {
    if (input instanceof Date) {
	return input;
    }
    var parts=input.replace(/[^\d]/g, '').replace(/^(\d\d)(\d\d)(\d\d\d\d)$/, "$2/$1/$3").substr(0,10);
    var date=Date.parse(parts);
    if( parts.length===10 && !isNaN(Date.parse(parts)) ){
	var date=new Date(Date.parse(parts));
	$(this).datebox('setValue',date);
	return date;
    }
};
