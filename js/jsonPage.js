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
        
    var jsonText = editor.getSession().getValue();
    var validJSON = jsonlint.parse(jsonText);
    if( validJSON ){
        editor.getSession().setValue(JSON.stringify(transformObject(validJSON), null, 5));
        alert("done");
    }
}

function convertToNewSchema(){

    var allowedProperties = [
        "name",
        "label",
        "height",
        "width",
        "segment_height",
        "segment_width",
        "fields",
        "segments"];

    function initClassifierObject(obj){
        if(typeof obj["classifier"] !== 'object'){
            obj["classifier"] = { "classification_map" : { "empty" : false },
                                    "default_classification": true
            };
        }
        return obj;
    }

    function convertObject(obj){
        if(typeof obj !== 'object'){
                return obj;
        }
        else if( obj instanceof Array ){
            var new_obj = [];
            for (var key in obj){
                new_obj[key] = convertObject(obj[key]);
            }
            return new_obj;
        }
        else{
            var new_obj = {};
            for (var key in obj){
                if(key === "x"){
                    new_obj["segment_x"] = obj["x"];
                } else if(key === "y"){
                    new_obj["segment_y"] = obj["y"];
                } else if(key === "label"){
                    new_obj["label"] = obj["label"];
                    if( typeof obj["name"] === 'undefined' ){
                        //TODO: Try adding xmltag validation to schema.
                        new_obj["name"] = obj["label"].replace(/ /gi, "_");
                    }
                } else if(key === "bubble_locations"){
                    new_obj["items"] = [];
                    for (var i = 0; i < obj["bubble_locations"].length; i++){
                        new_obj["items"][i] = {
                            "item_x": obj["bubble_locations"][i][0],
                            "item_y": obj["bubble_locations"][i][1],
                            };
                        var labels = obj["bubble_labels"];
                        if(typeof labels !== 'undefined'){
                            new_obj["items"][i]["label"] = labels[i];
                            new_obj["items"][i]["value"] = labels[i].replace(/ /gi, "_");
                        }
                    }
                } else if(key === "classifier_size"){
                    initClassifierObject(new_obj);
                    new_obj["classifier"]["classifier_height"] = obj["classifier_size"][0];
                    new_obj["classifier"]["classifier_width"] = obj["classifier_size"][1];
                } else if(key === "training_data_uri"){
                    initClassifierObject(new_obj);
                    new_obj["classifier"]["training_data_uri"] = obj["training_data_uri"];
                } else if(key === "bounded"){
                    new_obj["align_segment"] = obj[key];
                } else if(key === "out_type"){
                    new_obj["type"] = obj[key];
                } else if($.inArray(key, allowedProperties) >= 0){
                    new_obj[key] = convertObject(obj[key]);
                }
            }
            /*
            if(typeof new_obj["type"] === 'undefined'){
                new_obj["type"] = "input"
            }
            */
            return new_obj;
        }
    }
    var jsonText = editor.getSession().getValue();
    var validJSON = jsonlint.parse(jsonText);
    if( validJSON ){
        editor.getSession().setValue(JSON.stringify(convertObject(validJSON), null, 5));
        alert("done");
    }
}