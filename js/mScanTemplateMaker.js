var templateObject;
jQuery(function($){

    /////////////
    //JSON Editing
    ////////////

	$("#save").click(function(){
		var uriContent = "data:application/octet-stream," + encodeURIComponent($('#json_input').val());
		//newWindow=window.open(uriContent, 'generated.json');
		$("body").append("<iframe src='" + uriContent + "' style='display: none;' ></iframe>");
	});

	$.getJSON('example.json', 
		function(form){
            //TODO: Load JSON as text.
            templateObject = form;
            var jsonText = JSON.stringify(templateObject, null, 5);
            validate(jsonText);
            $('#json_input').first().val(jsonText);
	});


    /////////////
    //Image Uploader
    ////////////

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
			$(".target").css("width", "auto");
			$(".target").css("height", "auto");
            var loaded = false;
            $(".target").load(function(){
                if(loaded){
                    return;
                }
                templateObject.imageFilename = file.name;
                templateObject.width = parseInt($(".target").css("width"));
                templateObject.height = parseInt($(".target").css("height"));
                loaded = true;
            });
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

    ////////////////
    //Tab handling and JCrop
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
                $('#json_input').val(jsonText);
			}
		},
        select: function(event, ui) {
            //TODO: This works because there are only two tabs.
            //Decide what to do based on which tab I'm on rather than which is selected.
            if (ui.panel.id != "rendered") {
                if(jcrop_api){
                    jcrop_api.destroy();
                }
            }
            if (ui.panel.id != "jsonEditor") {
                var jsonText = $('#json_input').val();
                var validJSON = validate(jsonText);
                if( validJSON ){
                    templateObject = validJSON;
                    return true;
                }
                else{
                    return false;
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
// Simple event handler, called from onChange and onSelect
// event handlers, as per the Jcrop invocation above
function showCoords(c){
    var fieldObject = 
    {
        "name":"field",
        "label": "field",
        "segments": [
            {   
                "x": c.x,
                "y": c.y,
                "segment_width": c.w,
                "segment_height":c.h
            }
        ]
    };
	$("#json_out").val(JSON.stringify(fieldObject, null, 5));
}
function clearCoords(){
	return;
}
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

    var fieldName = segment.name ? segment.name : segment.label.replace(/ /gi, "_");

	var segmentDiv = $('<div id="seg_' + index + '"></div>')
			.css('top', segment.y + 'px')
			.css('left', segment.x + 'px')
			.css('width', segment.segment_width)
			.css('height', segment.segment_height)
            .addClass('segment')
            .addClass(fieldName);
            
    if(typeof segment.bounded === 'undefined' || segment.bounded){
        segmentDiv.css('outline-style', 'solid');
    }
    else{
        segmentDiv.css('outline-style', 'dotted');
    }
    
    segmentDiv.click(function(){
        $('.selected').removeClass('selected');
        $('.'+fieldName).addClass('selected');
        
        $("#json_out").val(JSON.stringify( findField(fieldName) , null, 5));
    });
    
	segmentDiv.data('segmentObj', segment);
	//TODO: Different borders for segments and elements
	$(segment.bubble_locations).each(
		function(field_idx){
			var bubble = $('<div></div>')
			.css('position', 'absolute')
			.css('top', this[1] - segment.classifier_size[1]/2 + 'px')
			.css('left', this[0] - segment.classifier_size[0]/2 + 'px')
			.css('width', segment.classifier_size[0])
			.css('height', segment.classifier_size[1])
			.css('outline', '1px solid blue')
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