
class User{
    constructor(name, msg){
        this.name = name;
        this.msg = [];
    }
}
console.log(document.title)

document.getElementById("sendbtn").onclick = function() {
    // send the data to the chat
    const msg = document.getElementById("text").value;
    // tell if the msg is null
    if (msg === ""){
        document.getElementById("text").placeholder = "Empty Message";
        setTimeout(function(){
            document.getElementById("text").placeholder = "Say something";
        }, 2000);
    }else{
        // display the message on the screen
        document.getElementById("msgDisplay").innerHTML += `<p>${msg}</p>`;
        document.getElementById("text").value = "";
    }
}