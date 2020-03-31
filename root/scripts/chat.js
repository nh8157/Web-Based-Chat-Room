class User{
    constructor(username){
        this.username = username;
        this.state = false;
    }
    join_room(){
        // send a request to the remote server
        // after getting the request
        // alter the state of the user
        this.state_change(true);
    }
    leave_group(){
        // no leave option when user is no 
        this.state_change(this, false);
    }
    state_change(current_state){
        this.state = current_state;
    }
    return_name(){
        return this.username;
    }
}

const self = new User("admin")

const sendbtn = document.getElementById("user-send")

sendbtn.onclick = function (){
    // send the data to the chat
    const chatbox = document.getElementById("user-chatbox");
    const msg = chatbox.value;
    // determine if the msg is empty
    if (msg === ""){
        chatbox.placeholder = "Empty Message";
        setTimeout(function(){
            chatbox.placeholder = "Say something";
        }, 2000);
        console.log("emptymessage");
    }else{
        // display the message on the screen
        console.log("here");
        console.log(msg);
        msg_display(self, msg);
        chatbox.value = "";
        // Here the client also sends the message to the remote server


    }
    return false;
}

function receive_msg(user){
    // Here the client receives the message from remote server in JSON format
    // translate the message into normal format
    msg_display(user, msg);
}

function msg_display(user, msg){
    // display the message and its sender
    // determine if the sender is self
    // user is a class object
    const display = document.getElementById("chat-display");
    const scrollbar = document.getElementById("main-content");
    const msg_class = user == self ? "self":"other";
    display.innerHTML += `<p class="${msg_class}-message">${msg}</p><h4 class="${msg_class}-name">${user.return_name()}</h4><br>`;
    scrollbar.scrollTop = scrollbar.scrollHeight;
}

function load_users(){
    // grabs the current users in the system after logging in
    // or grabs the users in the group chat
    // load users on the left column of the webpage
    // users are class objects
    // pass
    users = ["Amy", "Tom", ]
}