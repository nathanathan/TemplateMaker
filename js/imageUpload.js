jQuery(function($){
    var dropbox = $('#dropbox');
	
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'pic',
		
		maxfiles: 1,
        
        maxfilesize: 22,
		
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
                loaded = true;
                templateObject.imageFilename = file.name;
                var width = parseInt($(".target").css("width"));
                var height = parseInt($(".target").css("height"));
                
                //Scale the image
                height = 832/width * height;
                width = 832;
                $(".target").css("width", width);
                $(".target").css("height", height);
                
                jcrop_api.destroy();
                initJCrop();
            });
		};
		
		// Reading the file as a DataURL. When finished,
		// this will trigger the onload function above:
		reader.readAsDataURL(file);
	}
});