
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
    
    $("#validate").click(function(){
    });

	$("#save").click(function(){
		var uriContent = "data:application/octet-stream," + encodeURIComponent($('#json_input').val());
		//newWindow=window.open(uriContent, 'generated.json');
		$("body").append("<iframe src='" + uriContent + "' style='display: none;' ></iframe>");
	});

	$.getJSON('checkbox_form_2.json', 
		function(form){
            //TODO: clean this up
            templateObject = form;
            $('#json_input').first().val(JSON.stringify(templateObject, null, 5));
			//$("textarea#json").text(JSON.stringify(form, null, 5));
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
                $('#json_input').val(JSON.stringify(templateObject, null, 5));
				//$("textarea#json").text(JSON.stringify(templateObject, null, 5));
			}
		},
        select: function(event, ui) { 
			if(jcrop_api){
				jcrop_api.destroy();
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