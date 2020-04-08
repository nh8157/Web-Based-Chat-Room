// get the username and password from the user
document.getElementById("submit-button").onclick = function() {
    // const username, pswrd1, pswrd2;
    const username = document.getElementById("name").value;
    const pswrd1 = document.getElementById("pass1").value;
    const pswrd2 = document.getElementById("pass2").value;
    console.log(username, pswrd1, pswrd2);
    if ((username === "" || username == null) || (pswrd1 === "" || pswrd1 == null) || (pswrd2 === "" || pswrd2 == null)){
        alert("Please fill out the form")
    } else {
        // check if pswrd1 matches pswr2
        if (pswrd1 === pswrd2){
            // submit the form to remote server
        } else {
            // alert that the password doesn't match
            alert("Passwords don't match");
        }
    }
}