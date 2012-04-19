function transformFunction(){

    var scale_x = parseFloat($('.scale_x').val());
    var scale_y = parseFloat($('.scale_y').val());
    var offset_x =parseFloat($('.offset_x').val());
    var offset_y = parseFloat($('.offset_y').val());

    function transformProperty(key, value){
        if(typeof value === 'object'){
            return transformObject(value);
        } else if(key === "fields" || key === "segments"){
            return transformObject(value);
        } else if(key === "segment_width"){
            return Math.round(value * scale_x);
        } else if(key === "segment_height"){
            return Math.round(value * scale_y);
        } else if(key === "x"){
            return Math.round(value * scale_x + offset_x);
        } else if(key === "y"){
            return Math.round(value * scale_y + offset_y);
        } else if(key === "0"){
            return Math.round(value * scale_x);
        } else if(key === "1"){
            return Math.round(value * scale_y);
        } else{
            return value;
        }
    }

    function transformObject(obj){
        for (var fkey in obj){
            obj[fkey] = transformProperty(fkey, obj[fkey]);
        }
        return obj;
    }

        
    var jsonText = $('#json_input').val();
    var validJSON = validate(jsonText);
    if( validJSON ){
        $('#json_input').val(JSON.stringify(transformObject(validJSON), null, 5));
    }
}

