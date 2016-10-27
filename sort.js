function setSortable(){


        $( function() {
          $( "#sortable" ).sortable({
            cursor: "move"
          }).on( "sortbeforestop", function( event, ui ) {

            var toolsArray = getArray();

            for (i in toolsArray){
              DB.child(toolsArray[i]+"/positions/"+uid).set(i)
            }

          } );
        } );

        $( function() {
          $( ".accordion" ).accordion({
            active: false,
            collapsible: true
          });
        } );
      }

      function getArray(){
        var result = $("#sortable").sortable('toArray');

        return result;
      }
