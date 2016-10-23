
var uid;


function login(){
  firebase.auth().signInAnonymously().catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log("Error: ", errorCode, errorMessage);
  });
}

firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in.

    var isAnonymous = user.isAnonymous;
    uid = user.uid;

    console.log("User is signed in.", uid);

   $("#login").hide(200);
  } else {
    console.log("User is signed out.");
    $("#login").show(200);
  }
  // ...
});

function signout(){
  firebase.auth().signOut().then(function() {
  console.log('Signed Out');
}, function(error) {
  console.error('Sign Out Error', error);
});
}

function getUrl(){
  var currentUrl = window.location.href;
  var locationToCut = currentUrl.indexOf("?");
  currentUrl = currentUrl.substring(locationToCut+1);
  return currentUrl;

}
