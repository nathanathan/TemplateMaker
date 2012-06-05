var templateObject;
var templateSchema;
var editor;
var jcrop_api;

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


jQuery(function($){
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
//TODO: Use JSV
function validate(jsonText){
    try {
        var reformat = false;
        var result = jsonlint.parse(jsonText);
        if (result) {
            $('.validation-message').text("JSON is valid!");
            $('.validation-message').addClass('pass');
            if (reformat) {
                //document.getElementById("source").value = JSON.stringify(result, null, "  ");
            }
            return result;
        }
    } catch(e) {
        ('.validation-message').text(e);
        $('.validation-message').addClass('fail');
        return false;
    }
}
////////////////
//Initialization:
///////////////
$("#add_field").click(function(){
    var validJSON = validate($("#json_out").val());
    if( validJSON ){
        addUpdateField(validJSON);
        jcrop_api.destroy();
        initJCrop();
    }
    else{
        alert("Invalid JSON");
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
    },
    show: function(event, ui) {
		if (ui.panel.id == "rendered") {
			initJCrop();
		}
		if (ui.panel.id == "jsonEditor") {
            var jsonText = JSON.stringify(templateObject, null, 5);
            editor.getSession().setValue(jsonText);
		}
        if (ui.panel.id == "jsonGUI"){
            ondeSession.render(templateSchema,
                               applyInheritance(templateObject, ["fields", "segments"]),
                               //templateObject,
                               {}
                               // { collapsedCollapsibles: true }
                               );
        }
	}
});

});