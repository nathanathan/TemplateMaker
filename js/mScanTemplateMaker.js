var templateObject;
var editor;
jQuery(function($){
    ////////////////
    //Initialization:
    ///////////////
    editor = ace.edit("editor");
    editor.setTheme("ace/theme/twilight");
    editor.getSession().setMode("ace/mode/json");
    $("#save").click(function(){
        var uriContent = "data:application/octet-stream," + encodeURIComponent(editor.getSession().getValue());
		//newWindow=window.open(uriContent, 'generated.json');
		$("body").append("<iframe src='" + uriContent + "' style='display: none;' ></iframe>");
	});

	$.getJSON('example.json', 
		function(form){
            //TODO: Load JSON as text.
            templateObject = form;
            var jsonText = JSON.stringify(templateObject, null, 5);
            validate(jsonText);
            editor.getSession().setValue(jsonText);
	});
    
    var ondeSession = new onde.Onde($('#data-entry-form'));
    // Bind our form's submit event. We use this to get the data out from Onde
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
	var jcrop_api;
	//Initialize jquery ui tabs
	$( "#tabs" ).tabs({
		show: function(event, ui) {
			if (ui.panel.id == "rendered") {
				initJCrop();
			}
			if (ui.panel.id == "jsonEditor") {
				//Add the json template to the text area
                var jsonText = JSON.stringify(templateObject, null, 5);
                editor.getSession().setValue(jsonText);
                //$('#json_input').val(jsonText);
			}
            if (ui.panel.id == "jsonGUI"){
                $.getJSON('TemplateSchema.json', 
            	function(sampleSchema){
                    // Render the form with the schema
                    ondeSession.render(sampleSchema,
                        templateObject,
                        {}
                        //{ collapsedCollapsibles: true }
                        );
        	    });
            }
		},
        select: function(event, ui) {
            var currentTabId = $('#tabs .ui-tabs-panel:not(.ui-tabs-hide)').attr('id');
            
            if (currentTabId === "rendered") {
                if(jcrop_api){
                    jcrop_api.destroy();
                }
            }
            else if (currentTabId === "jsonEditor") {
                //var jsonText = $('#json_input').val();
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
                    console.error(outData);
                } else {
                      templateObject = outData.data;
                }
            }
        }
	});
    
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
    
	function initJCrop(){

		if(templateObject === null) return;

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
                        "segment_height":c.h
                    }
                ],
                "items":[],
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
    
    var warning = true;
    window.onbeforeunload = function(){ 
      if (warning) {
        return "If you navigate away from this page you will loose your unsaved changes.";
      }
    };
});
function shallowCopy(obj){
	var outObj = {};
	$.each(obj, function(key, val) {
		outObj[key] = val;
	});
	return outObj;
}
function findField(fieldName){
    for (var i = 0; i < templateObject.fields.length; i++) {
        if(templateObject.fields[i].name === fieldName){
            return templateObject.fields[i];
        }
    }
}
//Form Drawing functions:
function segmentFunction(segment, index){

    var fieldName = segment.name;

	var segmentDiv = $('<div id="seg_' + index + '"></div>')
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
        $('.selected').removeClass('selected');
        $('.'+fieldName).addClass('selected');
        
        $("#json_out").val(JSON.stringify( findField(fieldName) , null, 5));
        $(this).click(function(evt){
            var location = $(this).offset();
            var x = evt.pageX - location.left - segment.classifier.classifier_width/2,
                y = evt.pageY - location.top - segment.classifier.classifier_height/2;
            var newItem = $('<div>').addClass('item').addClass('newItem')
                .css("top", y).css("left", x)
                .css('width', segment.classifier.classifier_width)
                .css("height", segment.classifier.classifier_height);
            
            $(this).append(newItem);
        });
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
//TODO: Use popups instead?
//TODO: Use JSV
//Use Codemirror?
function validate(jsonText){
    try {
        var reformat = false;
        var result = jsonlint.parse(jsonText);
        if (result) {
            document.getElementById("result").innerHTML = "JSON is valid!";
            document.getElementById("result").className = "pass";
            if (reformat) {
                //document.getElementById("source").value = JSON.stringify(result, null, "  ");
            }
            return result;
        }
    } catch(e) {
        document.getElementById("result").innerHTML = e;
        document.getElementById("result").className = "fail";
        return false;
    }
}