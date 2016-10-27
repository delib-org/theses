console.log(getUrl())
isDisbale = false;

var currentUrl = getUrl();
if (currentUrl == "aa" || currentUrl == "bb" || currentUrl == "cc"){
  var DB = firebase.database().ref().child(getUrl());
  if (currentUrl == "bb"){
    $("#groupSort").hide();
  }
  if (currentUrl == "cc"){
    $("#groupSort").hide();
    isDisbale = true;
  }
} else {
  var DB = firebase.database().ref().child("aa");
}

buildTools();



function buildTools(){


  DB.once("value",function(toolsDB){

    var toolsArray = new Object();
    var arrayLength = Object.keys(toolsDB.val()).length;

    var isUserHadOrderd = true;

    toolsDB.forEach(function(toolDB){
      if (toolDB.val().positions != null && toolDB.val().positions[uid] != null){
        //get order of user votes
        var toolOrder = arrayLength - toolDB.val().positions[uid];
        toolsArray[toolOrder] = toolDB.key;
      } else {
        isUserHadOrderd = false;
      }
    });

    if (isUserHadOrderd){
      for (i in toolsArray){

        var toolKey = toolsArray[i];
        var heName = toolsDB.val()[toolKey].heName;
        var color = toolsDB.val()[toolKey].backgroundColor;

        if (heName != null){
          buildTool(heName,toolKey, color)
        }
      };
    } else {
      toolsDB.forEach(function(toolDB){
        if (toolDB.val().heName != null){
          buildTool(toolDB.val().heName,toolDB.key, toolDB.val().backgroundColor)
        }
      })
    }

    //remove div on deletion from DB
    DB.on("child_removed", function(childRemoved){

      $("#"+childRemoved.key).remove();
    })

    setSortable();
    startScreen()
  })
}

function buildTool(heName, enMame, backgroundColor){

  if(isDisbale){
    prependTemplate ("#toolDis-tmpl", {heName:heName, enMame: enMame, backgroundColor: backgroundColor}, "#sortable");
  } else {
    prependTemplate ("#tool-tmpl", {heName:heName, enMame: enMame, backgroundColor: backgroundColor}, "#sortable");
  }
}





function setReason(option){



  var reasonText = $("#"+option+"Input").val();

  if (reasonText == null || reasonText == ""){
    return
  }

  DB.child(option + "/reasons").push({reasonText:reasonText, votes:0, creator: uid, color:"gray"});
  $("#"+option+"Input").val("");
}

function deleteReason (option, reasonId){
  DB.child(option+"/reasons/"+reasonId).once("value", function(reasonSnapshot){
    if (reasonSnapshot != null){
      var creator = reasonSnapshot.val().creator;
      if (creator != uid){
        alert ("רק מי שיצר את הסיבה, יכול למחוק אותה");
        return;
      }
      DB.child(option+"/reasons/"+reasonId).remove();
    }
  })
}


g_toolsArray = new Object();
g_userToolsPosition = new Object();

function startScreen(){
  DB.once("value", function(tools){
    //    var toolsObj = new Object();
    //    iTools = 0;
    //    tools.forEach(function(tool){
    //      toolsObj[tool.val().positions[uid]] = tool.key;
    //      iTools++;
    //    })
    //
    //    for (i in toolsObj){
    //      if (tools.val()[toolsObj[i]].heName != null){
    //        buildTool(tools.val()[toolsObj[i]].heName, tools.val()[toolsObj[i]].enName,tools.val()[toolsObj[i]].backgroundColor)
    //      }
    //    }
    //    setSortable();


    tools.forEach(function(tool){

      //on reason added (and preivious reasons)
      DB.child(tool.key + "/reasons").orderByChild("votes").on("child_added", function(reasonChanged){


        DB.child(tool.key).child("reasons/"+ reasonChanged.key + "/votes").on("value", function(votesReason){
          var votesCurrent = votesReason.val();

          $("#"+reasonChanged.key).attr("data-sort", votesCurrent);

          //sort
          DB.child(tool.key + "/reasons").orderByChild("votes").once("value", function(dataSort){
            $("#"+tool.key+"Reasons").html("");
            dataSort.forEach(function(datum){

              if (datum.val().reasonText != undefined){
                $("#"+tool.key+"Reasons").prepend(
                  "<tr class='reason' id='"+datum.key+"' data-sort='"+datum.val().votes+"'><td><img src='x.png' width='13px' align='middle' onclick=deleteReason('"+tool.key+"','"+datum.key+"')></td><td><div class='reasonText'>"+datum.val().reasonText+"</div></td><td><td class='votes' id='yes"+tool.key+datum.key+"' onclick=setVote('yes','"+tool.key+"','"+datum.key+"')>כן</td><td class='votes' id='abs"+tool.key+datum.key+"' onclick=setVote('abs','"+tool.key+"','"+datum.key+"')>נמנע</td><td class='votes' id='no"+tool.key+datum.key+"' onclick=setVote('no','"+tool.key+"','"+datum.key+"')>לא</td></td></tr>"
                )
              }

              //color according to vote
              if (datum.val().voters != null){
                var voterVote = datum.val().voters[uid]

                switch (voterVote){
                  case 1:
                    $("#yes"+tool.key+datum.key).css("color", "green");
                    $("#abs"+tool.key+datum.key).css("color", "lightgray");
                    $("#no"+tool.key+datum.key).css("color", "lightgray");
                    break;
                  case 0:
                    $("#yes"+tool.key+datum.key).css("color", "lightgray");
                    $("#abs"+tool.key+datum.key).css("color", "green");
                    $("#no"+tool.key+datum.key).css("color", "lightgray");
                    break;
                  case -1:
                    $("#yes"+tool.key+datum.key).css("color", "lightgray");
                    $("#abs"+tool.key+datum.key).css("color", "lightgray");
                    $("#no"+tool.key+datum.key).css("color", "green");
                    break;
                }
              }
            })
          })
        })

      });

      //listen to change in positions and update window
      DB.child(tool.key + "/positions").on("value", function(postionsByUsers){

        if (postionsByUsers != null){


          var totalPosition = 0;

          postionsByUsers.forEach(function(positionByUser){
            totalPosition = totalPosition + parseInt( positionByUser.val());
            if (uid == positionByUser.key){
              g_userToolsPosition[tool.key] = parseInt( positionByUser.val())

            }
          });

          DB.child(tool.key).update({position: totalPosition});

          g_toolsArray[tool.key] =totalPosition;

        }
      })
    });

  })
}

function showGroupPositions(){
  DB.orderByChild("position").on("value", function(toolsDB){

    var orderToolsGroup = new Object();
    var orderToolsUser = new Object();
    var diff = 0;

    var i = 0;

    $("#groupSortTools").html("");
    var numberOfTools;

    toolsDB.forEach(function(toolDB){

      var headerHeb = toolDB.val().heName;
      var backgroundColor = toolDB.val().backgroundColor;
      numberOfTools = Object.keys(toolsDB.val()).length;

      //      orderToolsGroup[i] = toolDB.key;
      orderToolsGroup[toolDB.key] = i;
      //      orderToolsUser[toolDB.val().positions[uid]] = toolDB.key;
      if(toolDB.val().positions != null && toolDB.val().positions[uid] != null){
        orderToolsUser[toolDB.key] = toolDB.val().positions[uid];



        $("#groupSortTools").append("<div class='groupTools' style='background:"+backgroundColor+"'>"+headerHeb+"</div>");
        i++;
      }

    })
    for (i in orderToolsGroup){

      var dist = Math.abs(orderToolsGroup[i]-orderToolsUser[i]);
      var invDist = numberOfTools-dist;
      var singleInvDist = invDist/Math.pow(numberOfTools,2);

      diff = diff + singleInvDist;

    }


    var diff2 = (1-diff)*2;
    diff = Math.round((1-diff2)*1000)/1000
    $("#diff").text(diff);
    var agreemnetColor = levelOfAgreementColor(diff);
    $("#groupMatchBar").css("height", (diff*100)+"%").css("background", agreemnetColor)

  });
}

showGroupPositions();

function setVote(vote, tool, reasonId){
  //set visual on votes
  var voteValue = 0;

  switch (vote){
    case "yes":
      if ($("#yes"+tool+reasonId).css("color") != "rgb(0, 128, 0)"){
        $("#yes"+tool+reasonId).css("color", "green");
        $("#abs"+tool+reasonId).css("color", "gray");
        $("#no"+tool+reasonId).css("color", "gray");
        voteValue = 1;
      }
      break;
    case "no":
      if ($("#no"+tool+reasonId).css("color") != "rgb(0, 128, 0)"){
        $("#yes"+tool+reasonId).css("color", "gray");
        $("#abs"+tool+reasonId).css("color", "gray");
        $("#no"+tool+reasonId).css("color", "green");
        voteValue = -1;
      }
      break;
    case "abs":
      if ($("#abs"+tool+reasonId).css("color") != "rgb(0, 128, 0)"){
        $("#yes"+tool+reasonId).css("color", "gray");
        $("#abs"+tool+reasonId).css("color", "green");
        $("#no"+tool+reasonId).css("color", "gray");
        voteValue = 0;
      }
      break;
  }

  DB.child(tool+"/reasons/"+reasonId+"/voters/"+uid).set(voteValue);
  DB.child(tool+"/reasons/"+reasonId+"/voters").once("value",function(dataSnapshot){
    var totalVotes=0;
    dataSnapshot.forEach(function(voter){

      totalVotes = totalVotes + voter.val();
    })

    DB.child(tool+"/reasons/"+reasonId+"/votes").set(totalVotes);
  })
}



// helpers functions

function setTool(heName, enName){
  DB.child(enName).set({heName:heName, backgroundColor:"gray",reasons:{placeholder:"placeholder"}});
}

function orderObject(objectToSort){

  var tempArray = new Array();
  for (i in objectToSort){
    tempArray.push([objectToSort[i],i])
  }

  tempArray.sort();

  var newOrderObject = new Object;
  for (i in tempArray){
    newOrderObject[tempArray[i][1]] = i;
  }
  return newOrderObject;

}

function comparePesonalNGroups(personal, group){
  var diff = 0;
  var numberOfTools = Object.keys(personal).length;

  var group1 = orderObject(group);

  for (i in personal){
    toolDiff = Math.abs(personal[i] - group1[i]);
    diff = diff + ((numberOfTools-toolDiff)/Math.pow(numberOfTools,2));
  }
  return diff;
}

function levelOfAgreementColor (levelOfAgreement){

  if (levelOfAgreement > 0.9) return "green";
  if (levelOfAgreement > 0.8) return "lightgreen";
  if (levelOfAgreement > 0.7) return "yellow";
  if (levelOfAgreement > 0.6) return "orange";
  if (levelOfAgreement <= 0.6) return "red";
}

function setSorting(){

  if ($("#buttonSort").html() == "הפסקת סידור"){

    $("#buttonSort").html("סידור כלים");
    $( "#sortable" ).sortable("destroy");

  } else {

    $("#buttonSort").html("הפסקת סידור")
    $( "#sortable" ).sortable();
  }
}

function deleteAllReasons(){
  var DBB = firebase.database().ref()
  DBB.once("value", function(DBBsnap){
    DBBsnap.forEach(function(DBsnap){
      DBB.child(DBsnap.key).once("value", function(dataSnapshot){
        dataSnapshot.forEach(function(datumSnapshot){
          DBB.child(DBsnap.key).child(datumSnapshot.key).child("reasons").once("value",function(reasonsSnapshoot){
            reasonsSnapshoot.forEach(function(reasonDB){
              if (reasonDB.val() != "placeholder"){
                DBB.child(DBsnap.key).child(datumSnapshot.key).child("reasons").child(reasonDB.key).remove();
              }
            })
          })
        })
      })
    })
  })

}

function deleteAllPositions(){
  var DBB = firebase.database().ref();
  DBB.once("value", function(DBBsnap){
    DBBsnap.forEach(function(DBsnap){
      DBB.child(DBsnap.key).once("value", function(dataSnapshot){
        dataSnapshot.forEach(function(datumSnapshot){
          DBB.child(DBsnap.key).child(datumSnapshot.key).child("positions").once("value",function(positionsSnapshoot){
            positionsSnapshoot.forEach(function(positionDB){
              if (positionDB.val() != "placeholder"){
                DBB.child(DBsnap.key).child(datumSnapshot.key).child("positions").child(positionDB.key).remove();
              }
            })
          })
        })
      })
    })
  })


}

function newGame(){
  var isConfirm = confirm("האם אתה בטוח שאתה רוצה למחוק את המשחק הקודם?");
  if (isConfirm){
    deleteAllPositions();
    deleteAllReasons();
  }
}
