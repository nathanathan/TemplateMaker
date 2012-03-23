jQuery(function($){
    var templateObject;

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
            $(".target").load(function(){
                //TODO: There is some kind of bug here, this gets called multiple times
                templateObject.width = parseInt($(".target").css("width"));
                templateObject.height = parseInt($(".target").css("height"));
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

	/////////

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
    window.onbeforeunload = function() { 
      if (warning) {
        return "If you navigate away from this page you will loose your unsaved changes.";
      }
    };
});
// Simple event handler, called from onChange and onSelect
// event handlers, as per the Jcrop invocation above
function showCoords(c)
{   
    var fieldObject = 
    {
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
};

function clearCoords()
{
	$('#coords').val('');
};
function shallowCopy(obj){
	var outObj = {};
	$.each(obj, function(key, val) {
		outObj[key] = val;
	});
	return outObj;
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

