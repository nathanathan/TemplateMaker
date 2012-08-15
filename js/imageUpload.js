jQuery(function($){
    var sessionToken = (new Date()).toISOString()
    $('input[name=sessionToken]').val(sessionToken);
    
    ////TemplateImage upload
    $('#dropbox').filedrop({
        url: 'http://174.129.255.189/upload_template',
		// The name of the $_FILES entry:
		paramname:'image',
		
        data: {
            sessionToken:sessionToken,
            templateJson: function(){
                return JSON.stringify(templateObject);
            }
        },
        
		maxfiles: 1,
        
        maxfilesize: 22,
        
		allowedfiletypes: 'image/*',
        
		error: function(err, file) {
			switch(err) {
				case 'BrowserNotSupported':
					alert('Your browser does not support HTML5 file uploads!');
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
		beforeSend: function(file, i, send){
            var that = this;
            createImage(file);
            $("#uploadTemplate").unbind('click');
            $("#uploadTemplate").click(function(){
                send();
            });
            /*
            uploadTemplate = function(callback){
                var defaultUploadFinished = that.uploadFinished;
                that.uploadFinished = function(i, file, response, time){
                    callback(i, file, response, time);
                    defaultUploadFinished(i, file, response, time);
                };
                send();
            };
            */
            /*
            var $sendBtn = $('<button>').click(function(){
                send();
            });
            $('body').append($sendBtn);
            */
		},

        uploadFinished: function(i, file, response, time) {
            console.log(response);
            $("#uploadTemplate").after("done");//TODO: Add datestamp
        }

	});
	
    var imageLoaded = false;
    $(".target").load(function(){
        if(imageLoaded){
            return;
        }
        imageLoaded = true;
        //Scale the target image so it has the desired width
        var desired_width = 832;
        var width = parseInt($(".target").css("width"), 0);
        var height = parseInt($(".target").css("height"), 0);
        height = Math.round(desired_width/width * height);
        width = desired_width;
        $(".target").css("width", width);
        $(".target").css("height", height);
        templateObject.height = height;
        templateObject.width = width;
        //Refresh jcrop
        if(jcrop_api !== undefined){
            jcrop_api.destroy();
            initJCrop();
        }
    });
    
	function createImage(file){

		var reader = new FileReader();
		reader.onload = function(e){
            templateObject.image_filename = file.name;
			imageLoaded = false;
			$(".target").css("width", "auto");
			$(".target").css("height", "auto");
    		// e.target.result holds the DataURL which
			// can be used as a source of the image:
            $(".target").attr('src',e.target.result);
		};
        
		// Reading the file as a DataURL. When finished,
		// this will trigger the onload function above:
		reader.readAsDataURL(file);
	}
    ////test image upload
    $('#testImageDrop').filedrop({
        url: 'http://174.129.255.189/upload_form',
    	// The name of the $_FILES entry:
		paramname:'image',
		
        data: {
            sessionToken:sessionToken
        },
        
		maxfiles: 1,
        
        maxfilesize: 22,
        
		allowedfiletypes: 'image/*',
        
		error: function(err, file) {
			switch(err) {
				case 'BrowserNotSupported':
					alert('Your browser does not support HTML5 file uploads!');
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
		beforeSend: function(file, i, send){
            var that = this;
        	var reader = new FileReader();
    		reader.onload = function(e){
                var $imageContainer = $("#testImageDrop");
    			$imageContainer.css("width", "auto");
    			$imageContainer.css("height", "auto");
        		// e.target.result holds the DataURL which
    			// can be used as a source of the image:
                $imageContainer.attr('src', e.target.result);
                console.log(e);
                send();
    		};
            
    		// Reading the file as a DataURL. When finished,
    		// this will trigger the onload function above:
    		reader.readAsDataURL(file);
		},

        uploadFinished: function(i, file, response, time) {
            var $imageContainer = $("#testImageDrop");
            $imageContainer.after("sent");
            console.log(response);
        }

	});
});