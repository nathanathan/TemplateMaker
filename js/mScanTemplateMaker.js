var templateObject;
var debugVar = "hi";

//TODO: Make JSTree into separate module.

jQuery(function($){


	var dropbox = $('#dropbox'),
		message = $('.message', dropbox);
	
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'pic',
		
		maxfiles: 1,
    		maxfilesize: 22,
		
		error: function(err, file) {
			switch(err) {
				case 'BrowserNotSupported':
					showMessage('Your browser does not support HTML5 file uploads!');
					break;
				case 'TooManyFiles':
					alert('Too many files! Please select 5 at most! (configurable)');
					break;
				case 'FileTooLarge':
					alert(file.name+' is too large! Please upload files up to 2mb (configurable).');
					break;
				default:
					break;
			}
		},
		
		// Called before each upload is started
		beforeEach: function(file){
			if(!file.type.match(/^image\//)){
				alert('Only images are allowed!');
				
				// Returning false will cause the
				// file to be rejected
				return false;
			}
		},
		
		uploadStarted:function(i, file, len){
			createImage(file);
		}
    	 
	});
	

	function createImage(file){

		var reader = new FileReader();
		reader.onload = function(e){
			
			// e.target.result holds the DataURL which
			// can be used as a source of the image:
			
			$(".target").attr('src',e.target.result);
			$(".target").css("width", "100%");
			$(".target").css("height", "100%");
		};
		
		// Reading the file as a DataURL. When finished,
		// this will trigger the onload function above:
		reader.readAsDataURL(file);
		
		message.hide();
		//preview.appendTo(dropbox);
		
		// Associating a preview container
		// with the file, using jQuery's $.data():
		
		//$.data(file,preview);

		jcrop_api.destroy();
		initJCrop();
	}

	function showMessage(msg){
		message.html(msg);
	}

	/////////

	$("#save").click(function(){
		uriContent = "data:application/octet-stream," + encodeURIComponent($("textarea#json").text());
		//newWindow=window.open(uriContent, 'generated.json');
		$("body").append("<iframe src='" + uriContent + "' style='display: none;' ></iframe>");
	});

	$.getJSON('checkbox_form_2.json', 
		function(form){
			$("textarea#json").text(JSON.stringify(form, null, 5));
		});

	var jcrop_api;

	$("#draggable-box").draggable({ handle: '#handy-handle', containment: 'document' });
	$("#draggable-box2").draggable({ handle: '#handy-handle2', containment: 'document' });

	//Initialize jquery ui tabs
	$( "#tabs" ).tabs({
		show: function(event, ui) {

			//Clean up old junk.
			if($("#demo1")){
				$("#demo1").jstree("destroy");
			}
			if(jcrop_api){
				jcrop_api.destroy();
			}

			if (ui.panel.id == "tabs-1") {
				
				initJCrop();

				initJSTree(templateObject);
			}
			if (ui.panel.id == "tabs-2") {
				//Add the json template to the text area
				$("textarea#json").text(JSON.stringify(templateObject, null, 5));
			}
		}
	});

	function initJCrop(){
		//Need to validate
		templateObject = $.parseJSON( $("textarea#json").text() );
		if(templateObject == null) return;

		//Initialize jcrop
		$('.target').Jcrop({
			onChange:   showCoords,
			onSelect:   showCoords,
			onRelease:  clearCoords
		}, function(){
			jcrop_api = this;
			//When jcrop is initialized render the json template.
			//We wait because they share a container.
			formFunction(templateObject);
		});	
	}

	function initJSTree(form){
		$("#demo1")
			// call `.jstree` with the options object
			.jstree({
				"contextmenu" : {
				"items" :
			{
			// Some key
			"rename" : {
				// The item label
				"label"				: "Rename",
				// The function to execute upon a click
				"action"			: function (obj) { this.rename(obj); },
				// All below are optional 
				"_disabled"			: true,		// clicking the item won't do a thing
				"_class"			: "class",	// class is applied to the item LI node
				"separator_before"	: false,	// Insert a separator before the item
				"separator_after"	: true,		// Insert a separator after the item
				// false or string - if does not contain `/` - used as classname
				"icon"				: false,
				"submenu"			: { 
					/* Collection of objects (the same structure) */
				}
			},
			"ccp" : null
			/* MORE ENTRIES ... */
			}

				},

				// the `plugins` array allows you to configure the active plugins on this instance
				"plugins" : ["themes","json_data","ui","crrm", "contextmenu", "hotkeys"],
				// each plugin you have included can have its own config object
				//"core" : { "initially_open" : [ "phtml_1" ] }

			"json_data" : {
				"data" : toTreeObjArray(form),
				"progressive_render" : true
			}


				// it makes sense to configure a plugin only if overriding the defaults
			})
			// EVENTS
			// each instance triggers its own events - to process those listen on the container
			// all events are in the `.jstree` namespace
			// so listen for `function_name`.`jstree` - you can function names from the docs
			.bind("loaded.jstree", function (event, data) {
			
				//$("#demo1").jstree("refresh");
				// you get two params - event & data - check the core docs for a detailed description
			});

		//$("#demo1").bind("select_node.jstree", jsTreeNodeSelect);
	}
/*
	var newNodeSelected = function(){};
	function jsTreeNodeSelect(e, data){
		newNodeSelected();
		if(data.rslt.obj.data("field")){
			var markupRef = $('.'+data.rslt.obj.data("field"));
			markupRef.css('border', '2px solid red');
			newNodeSelected = function(){
				markupRef.css('border', '2px solid blue');
				newNodeSelected = function(){};
			}
		}
		if(data.rslt.obj.data("seg_idx")){
			var markupRef = $('#'+data.rslt.obj.data("seg_idx"));
			//markupRef.css('display', 'none');
			var segmentObj = markupRef.data("segmentObj");
			jcrop_api.animateTo(
				[segmentObj.x, segmentObj.y,
				 segmentObj.x+segmentObj.segment_width,
				 segmentObj.y+segmentObj.segment_height]
			);
			newNodeSelected = function(){
				jcrop_api.release();
				segmentObj.x = 0;
				markupRef.replaceWith(segmentFunction(segmentObj, 0));
				markupRef.css('border', '2px solid blue');
				newNodeSelected = function(){};
			}
		}
		//debugVar = data;
		//alert(data.rslt.obj.data("field"));
	}
*/
});
// Simple event handler, called from onChange and onSelect
// event handlers, as per the Jcrop invocation above
function showCoords(c)
{
	$('#x1').val(c.x);
	$('#y1').val(c.y);
	$('#x2').val(c.x2);
	$('#y2').val(c.y2);
	$('#w').val(c.w);
	$('#h').val(c.h);
};

function clearCoords()
{
	$('#coords input').val('');
	$('#h').css({color:'red'});
	window.setTimeout(function() {
		$('#h').css({color:'inherit'});
		},500);
};
function shallowCopy(obj){
	var outObj = {};
	$.each(obj, function(key, val) {
		outObj[key] = val;
	});
	return outObj;
}

function toTreeObjArray(obj){
	return toTreeObjArray(obj, null, false);
}
function toTreeObjArray(obj, field, isSegArray){
	var treeObjArray = [];

	$.each(obj, function(key, val) {
		var treeObj = { "data" : { "title" : '' + key }};
		
		if($.isArray(val) || Object.prototype.toString.call( val ) === '[object Object]'){
			if( val.label ) {
				field = val.label.replace(/ /gi, "-");
			}
			treeObj["children"] = toTreeObjArray(val, field, key == "segments");
	
		}
		else{
			treeObj.data.title += ' : ' + val;
			//treeObj.data["attr"] = { "href" : "http://www.google.com" };
		}
		//Metadata is used to link different components together
		treeObj["metadata"] = { "field" : field, "seg_idx" : (isSegArray ? 'seg_' + key : null)  };

		treeObjArray.push(treeObj);
	});
	return treeObjArray;
}
//@Deprecated
function safeAddNode(place){
	var added = false;
	var node;
	place.jstree("create", "-1" , false, "namee", function(maybeNode){ added = true; node = maybeNode; } , true );
	while(!added) continue;
	return node;
}

//Form Drawing functions:
function segmentFunction(segment, index){
	var borderWidth = 2;
	//safeAddNode($("#demo1"));

	var segmentDiv = $('<div id="seg_' + index + '" class="' + segment.label.replace(/ /gi, "-") + '"></div>')
			.css('position', 'absolute')
			.css('top', segment.y - borderWidth/2 + 'px')
			.css('left', segment.x - borderWidth/2 + 'px')
			.css('width', segment.segment_width - borderWidth/2)
			.css('height', segment.segment_height - borderWidth/2)
			.css('border', borderWidth + 'px solid blue')
			.css('z-index', 289);
	segmentDiv.data('segmentObj', segment);
	//TODO: Different borders for segments and elements
	$(segment.bubble_locations).each(
		function(field_idx){
			segmentDiv.append($('<div></div>')
			.css('position', 'absolute')
			.css('top', this[1] - borderWidth - segment.classifier_size[1]/2 + 'px')
			.css('left', this[0] - borderWidth - segment.classifier_size[0]/2 + 'px')
			.css('width', segment.classifier_size[0] - borderWidth/2)
			.css('height', segment.classifier_size[1] - borderWidth/2)
			.css('border', borderWidth + 'px solid blue')
			.css('z-index', 289));
		}
	);
	$('.jcrop-holder').append(segmentDiv);
}
function fieldFunction(field){
	$(field.segments).each(
		function(segment_idx){
			segmentFunction($.extend(shallowCopy(field), this), segment_idx);
		}
	);
}
function formFunction(form){
	$(form.fields).each(
		function(field_idx){
			fieldFunction($.extend(shallowCopy(form), this));
		}
	);
}

    
