// <!----------MAIN OOP SECTION---------->

// User object maintains two states
// When the user is single (default when first joining the system)
//      this.state=false
// When the user is in chat (after clicking one user from the navbar)
//      this.state=true
class User{
    constructor(username){
        this.username = username;
        this.state = false;
    }
    join_chat(){
        // send a request to the remote server
        // after getting the request
        // alter the state of the user
        this.state_change(true);
    }
    leave_chat(){
        // no leave option when user is no 
        this.state_change(false);
    }
    get_state(){
        return this.state
    }
    state_change(current_state){
        this.state = current_state;
    }
    get_name(){
        return this.username;
    }
}
// In single mode, Peers object is loaded with users in the system
// In chat mode, Peers object is loaded with users in the chat group
class Peers{
    constructor(){
        this.group_members = []
    }
    self_join_system(self){
        if (!self.get_state()){
            // send requests to server
            // load the users into the array

            const user_list = ["Amy", "Tom", "Vivian"];
            this.group_members = user_list;
            // display the users on the sidebar
            user_display(this.group_members);
        }
    }
    self_join_chat(self, peer){
        if (!self.get_state()){
            // send the name of the peer selected to the server
            // get the new list of users in the group chat
            self.join_chat();
            const user_list = ["Lily", "Tom", "Julia"];
            user_list.push(self.get_name());
            this.group_members = user_list;
            // display the users on the sidebar
            console.log("joining chat");
            user_display(this.group_members);
        } else {
            // already in chat mode
            // give user an alert that he's already chatting
            console.log("in chat");
        }
    }
    self_leave(self){
        if (self.get_state()){
            // in chat mode
            // quit back to single mode
            self.leave_chat();
            // get list of users in the system
            const user_list = ["Tom", "Cindy", "Vivian", "Julia"];
            this.group_members = user_list;
            // display the users on the sidebar
            user_display(this.group_members);
        }
    }
    peer_join(name){
        // display the new user list
        this.group_members.push(name);
        user_display(this.group_members);
        // sends an alert in group chat
        notice_display(name, true);
    }
    peer_leave(name){
        this.group_members = this.group_members.filter(() => {
            return this.group_members != name;
        }
        )
        user_delete(name);
        notice_display(name, false);
    }
}

// <!----------MAIN EXECUTION SECTION---------->

const self = new User("admin");
const peer = new Peers();
peer.self_join_system(self);
 
peer.peer_join("Zander");

user_click(self, peer);


// <!----------MAIN SENDING FUNCTION---------->
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
        // display only available after server echo
        chatbox.value = "";
        // Here the client also sends the message to the remote server
        msg_display(self, msg)
    }
    return false;
}

// <!----------MAIN RECEIVING FUNCTION---------->

function msg_receive(user){
    // Here the client receives the message from remote server in JSON format
    // translate the message into normal format
    msg_display(user, msg);
}

// <!----------   UTILITY FUNCTIONS   ---------->

function msg_display(user, msg){
    // display the message and its sender
    // determine if the sender is self
    // user is a class object
    const display = document.getElementById("chat-display");
    const scrollbar = document.getElementById("main-content");
    const username = user.get_name();
    const msg_class = user == self ? "self":"other";
    display.innerHTML += `<p class="${msg_class}-message">${msg}</p><h4 class="${msg_class}-name">${username}</h4><br>`;
    scrollbar.scrollTop = scrollbar.scrollHeight;
}

function user_display(users){
    // receives an array
    // display the user's name with fontawesome icon next to it
    const sidebar = document.getElementById("users-sidebar");
    sidebar.innerHTML = "";
    users.forEach(user => {
        sidebar.innerHTML += `<li id="user-${user}">${user}</li>`;
    });
}

function user_delete(user){
    const sidebar = document.getElementById("users-sidebar");
    const element = document.getElementById(`user-${user}`);
    console.log(element);
    sidebar.removeChild(element);
}

function user_click(self, peer){
    const sidebar = document.getElementById("users-sidebar").getElementsByTagName("li");
    let username="";
    for (let i = 0; i < sidebar.length; i ++){
        sidebar[i].onclick = function() {
            username = sidebar[i].textContent;
            console.log(username);
            peer.self_join_chat(self, username);
        }
    }
    // here sends the name of the user selected to the server to establish a connection
}

function notice_display(user=false, state=0){
    // display in the middle the timestamp of the message
    // display in the middle of the chat that the user has left/joined the chat 
    const display = document.getElementById("chat-display");
    if (state === 0){
        const time = new Date();
        const hr = time.getHours();
        const min = time.getMinutes();
        display.innerHTML += `<h5 class="notice-message">${hr}:${min}</h5>`;
    } else if (state == false){
        // user leaves the group chat
        display.innerHTML += `<h5 class="notice-message">${user} left the group chat</h5>`;
    } else {
        // user joins the group chat
        display.innerHTML += `<h5 class="notice-message">${user} joined the group chat</h5>`;
    }
}