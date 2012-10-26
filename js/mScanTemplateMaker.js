'use strict';
var templateObject;
var templateSchema;
var editor;
var jcrop_api;
var uploadTemplate = function(callback){
    alert("Testing doesn't work with the default image right now.");
    callback();
};

//src: http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
function getParameter(paramName, defaultValue) {
    var searchString = window.location.search.substring(1);
    var params = searchString.split('&');
    
    for (var i=0;i<params.length;i++) {
        var val = params[i].split('=');
        if (val[0] === paramName) {
            return decodeURI(val[1]);
        }
    }
    return defaultValue;
}
var warning = true;
window.onbeforeunload = function(){ 
  if (warning) {
    return "If you navigate away from this page you will loose your unsaved changes.";
  }
};

////////////////
//Function Definitions
///////////////
//Move this somewhere reasonable.
function addUpdateField(fieldJSON){
    for (var i = 0; i < templateObject.fields.length; i++) {
        if(templateObject.fields[i].name === fieldJSON.name){
            templateObject.fields[i] = fieldJSON;
            return;
        }
    }
    templateObject.fields.push(fieldJSON);
}
//Find a field with the given name in the template object
function findField(fieldName){
    for (var i = 0; i < templateObject.fields.length; i++) {
        if(templateObject.fields[i].name === fieldName){
            return templateObject.fields[i];
        }
    }
}
//Form Drawing functions:
var outputObject;
function segmentFunction(segment, index){
    var fieldName = segment.name;

    var segmentDiv = $('<div id="seg_' + index + '" idx="'+index+'"></div>')
        	.css('top', segment.segment_y + 'px')
			.css('left', segment.segment_x + 'px')
			.css('width', segment.segment_width)
			.css('height', segment.segment_height)
            .addClass('segment')
            .addClass(fieldName);
            
    if(typeof segment.align_segment === 'undefined' || segment.align_segment){
        segmentDiv.css('outline-style', 'solid');
    }
    else{
        segmentDiv.css('outline-style', 'dotted');
    }
    
    segmentDiv.click(function(evt){
        evt.stopPropagation();
        if($(this).hasClass('selected')){
            //Add a item
            var location = $(this).offset();
            var x = evt.pageX - location.left,
                y = evt.pageY - location.top ;
            var newItem = $('<div>').addClass('item').addClass('newItem')
                .css("top", y - segment.classifier.classifier_width/2)
                .css("left", x - segment.classifier.classifier_height/2)
                .css('width', segment.classifier.classifier_width)
                .css("height", segment.classifier.classifier_height);
            $(this).append(newItem);
            var segmentObj = outputObject.segments[$(this).attr('idx')];
            var newItemObj = {"item_x" : x, "item_y" : y};
            if(segmentObj.items !== undefined){
                segmentObj.items.push(newItemObj);
            }
            else{
                segmentObj.items = [newItemObj];
                //segmentObj.items = segmentObj.items.concat(outputObject.items);
            }
        }
        else{
            $('.selected').removeClass('selected');
            $('.'+fieldName).addClass('selected');
            outputObject = jQuery.extend(true, {}, findField(fieldName));
        }
        $("#json_out").val(JSON.stringify(outputObject , null, 5));
        return;
    });
    
	segmentDiv.data('segmentObj', segment);
	//TODO: Different borders for segments and elements
	$(segment.items).each(
		function(field_idx){
			var bubble = $('<div></div>').addClass('item')
			.css('top', this.item_y - segment.classifier.classifier_height/2 + 'px')
			.css('left', this.item_x - segment.classifier.classifier_width/2 + 'px')
			.css('width', segment.classifier.classifier_width)
			.css('height', segment.classifier.classifier_height)
			.css('z-index', 289);
            
            if(segment.training_data_uri == "bubbles"){
                bubble.addClass("bubble");
            }
            segmentDiv.append(bubble);
		}
	);
	$('.jcrop-holder').append(segmentDiv);
}
function fieldFunction(field){
	$(field.segments).each(
		function(segment_idx){
			segmentFunction($.extend($.extend({}, field), this), segment_idx);
		}
	);
}
function formFunction(form){
	$(form.fields).each(
		function(field_idx){
			fieldFunction($.extend($.extend({}, form), this));
		}
	);
}
function applyInheritance(object, arrayNames){
    var outputArray = [];
    var arrayName = arrayNames[0];
    $(object[arrayName]).each(
		function(i){
			outputArray[i] = applyInheritance($.extend($.extend({}, object), this),
                                              arrayNames.slice(1, arrayNames.length));
		}
	);
    var objectCopy = $.extend({}, object);
    objectCopy[arrayName] = outputArray;
    return objectCopy;
}
function showCoords(c){
    var fieldObject = 
    {
        "name":"field",
        "label": "field",
        "segments": [
            {   
                "segment_x": c.x,
                "segment_y": c.y,
                "segment_width": c.w,
                "segment_height":c.h,
                "align_segment":false
            }
        ],
        "classifier": {
            "classification_map": {
                "empty": false
            },
            "default_classification": true,
            "training_data_uri": "bubbles",
            "classifier_height": 18,
            "classifier_width": 14
        }
    };
    $("#json_out").val(JSON.stringify(fieldObject, null, 5));
}
function clearCoords(){
    return;
}
function initJCrop(){
	if(templateObject === null) return;
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
//Validates a single field object
function validateField(field){
    //validate name
    if(field.name){
        if(/[0-9]/.test(field.name[0])){
            throw 'Name: [' + field.name + '] begins with a number.';
        } else if(/\s/.test(field.name)){
            throw 'Name: [' + field.name + '] has whitespace in it.';
        }
    } else {
        throw 'Field with no name: ' + JSON.stringify(field, 2, 2);
    }
    if(!field.type){
        throw 'Field with no type: ' + JSON.stringify(field, 2, 2);
    }
    //check for double bubbles
    var items = [];
    if('items' in field){
        items = field.items;
    } else if('segments' in field && field.segments.length > 0 && 'items' in field.segments[0]){
        items = field.segments[0].items;
    }
    $.each(items, function(idx1, item1){
        $.each(items.slice(idx1+1), function(idx2, item2){
            if(item1.item_x === item2.item_x &&
               item1.item_y === item2.item_y){
                throw 'Overlapping items in field: ' + field.name;
           }
        });
    });

    return field;
}
//Parse and validate some jsonText
//Return a JSON object if it is valid
//Otherwise return false
//Also updates the UI to reflect validation status.
function validate(jsonText){
    try{
        var result = jsonlint.parse(jsonText);
        $.each(result.fields, function(idx, field){validateField(field);})
        if (result) {
            $('.validation-message').text("JSON is valid!");
            $('.validation-message').removeClass('fail');
            $('.validation-message').addClass('pass');
            return result;
        }
    } catch(e){
        $('.validation-message').text(String(e));
        $('.validation-message').addClass('fail');
        return false;
    }
}

jQuery(function($){
////////////////
//Initialization:
///////////////
$("#add_field").click(function(){
    try{
        var jsonText = $("#json_out").val();
        var validJSON = jsonlint.parse(jsonText);
        validateField(validJSON);
        if( validJSON ){
            addUpdateField(validJSON);
            jcrop_api.destroy();
            initJCrop();
        }
        else{
            alert("No valid JSON.");
        }
    } catch(e){
        alert("Invalid JSON:\n"+e);
    }
});

editor = ace.edit("editor");
editor.setTheme("ace/theme/solarized_light");
editor.getSession().setMode("ace/mode/json");
$('#save').click(function(){
    var uriContent = "data:application/octet-stream," + encodeURIComponent(editor.getSession().getValue());
    $('body').append("<iframe src='" + uriContent + "' style='display: none;' ></iframe>");
});
//TODO: Do something to make sure all the json loads.
$.getJSON(getParameter("templateJson", "example.json"), 
	function(form){
        //TODO: Load JSON as text.
        templateObject = form;
        var jsonText = JSON.stringify(templateObject, null, 5);
        validate(jsonText);
        editor.getSession().setValue(jsonText);
});
$.getJSON('TemplateSchema.json', function(schema){
    templateSchema = schema;
});
$('.target').attr("src", getParameter("imageFilename", "example.jpg"));
/*
var ondeSession = new onde.Onde($('#data-entry-form'));
// Bind our form's submit event. For now this is just for debugging.
$('#data-entry-form').submit(function (evt) {
    evt.preventDefault();
    
    var outData = ondeSession.getData();
    
    if (outData.errorCount) {
          alert("Error");
    } else {
          console.log(JSON.stringify(outData.data, null, "  "));
          alert("Output is in your browser's console");
    }
    return false;
});
*/
////////////////
//Tab handling
///////////////
/*
Ths is the model for how the tabs work:
When a tab is selected changes are saved to the template object.
The show function for each tab then does something with the template object.
If there is a problem the select function can return false to stop the tabs from switching.
*/
$( "#tabs" ).tabs({
    select: function(event, ui) {
        var currentTabId = $('#tabs .ui-tabs-panel:not(.ui-tabs-hide)').attr('id');
        
        if (currentTabId === "rendered") {
            if(jcrop_api){
                jcrop_api.destroy();
            }
        }
        else if (currentTabId === "jsonEditor") {
            var jsonText = editor.getSession().getValue(jsonText);
            var validJSON = validate(jsonText);
            if( validJSON ){
                templateObject = validJSON;
                return true;
            }
            else{
                return false;
            }
        }
        /*
        else if (currentTabId === "jsonGUI") {
            var outData = ondeSession.getData();
            if (outData.errorCount) {
                return false;
            } else {
                //Here we take data out of onde and put it into the templateObject
                //There are a few considerations for how this can be done:
                //If we recursivley extend the templateObject i.e.:
                //$.extend(true, templateObject, outData.data);
                //deleting in onde won't be possible.
                //There is also the issue of preserving properties not in the schema,
                //which this won't do:
                templateObject = outData.data;
            }
        }
        */
    },
    show: function(event, ui) {
		if (ui.panel.id == "rendered") {
			initJCrop();
		}
		else if (ui.panel.id == "jsonEditor") {
            var jsonText = JSON.stringify(templateObject, null, 5);
            editor.getSession().setValue(jsonText);
		}
        else if (ui.panel.id == "test"){
            /*
            $('.testStatus').text("Loading...");
            uploadTemplate(function(i, file, response, time){
                console.log(this);
                //TODO: Response will contain token for uploading test images.
                var $iframe = $('<iframe>');
                $iframe.attr('src', response.imageUploadURL);
                $('.testStatus').replaceWith($iframe);
            });
            */
        }
        /*
        else if (ui.panel.id == "jsonGUI"){
            ondeSession.render(templateSchema,
                               applyInheritance(templateObject, ["fields", "segments"]),
                               //templateObject,
                               {}
                               // { collapsedCollapsibles: true }
                               );
        }
        */
	}
});
$('.devtab').css("float", "right");
});