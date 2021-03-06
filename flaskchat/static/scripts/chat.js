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
        this.group_members = [];
        this.room = false;
        this.time = 0;
    }
    self_join_system(self, msg){
        // send requests to server
        // load the users into the array
        this.group_members = array_remove(msg)
        const display = document.getElementById("chat-display");
        display.innerHTML = "";
        header_display(self, this);
        user_display(this.group_members);
        user_click(self, this);
    }
    self_join_chat(self, peers, room){
        // send the name of the peer selected to the server
        // get the new list of users in the group chat
        self.join_chat();
        // reassign room number and group members
        this.room = room;
        this.group_members = peers;
        // change the button to Leave Chat
        const leave = document.getElementById("leave-header");
        leave.innerHTML = "Leave Chat";
        // display the users on the sidebar
        header_display(self, this);
        user_display(this.group_members);
        // reassign click object to array objects
        user_click(self, this);
    }
    self_leave_chat(self){
        // quit back to single mode
        self.leave_chat();
        // reassign user and room value
        this.room = false;
        document.getElementById("leave-header").innerHTML = "Log Out";
    }
    // self_leave_system(self){
        
    // }
    peer_join(self, name){
        // display the new user list
        this.group_members.push(name);
        user_display(this.group_members);
        // sends an alert in group chat
        user_click(self, this);
        notice_display(name, true);
    }
    peer_leave(self, name){
        this.group_members = array_remove(this.group_members, name);
        user_display(this.group_members);
        user_click(self, this);
        notice_display(name, false);
    }
    get_id(){
        return this.room;
    }
    get_time(){
        return this.time;
    }
    update_time(min){
        this.time = min;
    }
}

// <!----------MAIN EXECUTION SECTION---------->
// get self name from the html file
const self_name = document.getElementById("username").textContent;
const self = new User(self_name);
const peer = new Peers();
// initialize connection with the server
const socket = io.connect('http://127.0.0.1:5000');
// upon connection send connection message to the server
socket.on("connect", ()=> {
    const self_info = JSON.stringify({"username": self.get_name()});
    socket.emit("users", self_info);
})
socket.on("users", (msg)=>{
    // display the users on the sidebar
    // assign click object to each list object
    const user_msg = JSON.parse(msg);
    // myself joining the system
    if (!self.get_state()){
        peer.self_join_system(self, user_msg["peers"]);
    }
})
// receiving messages from the server
socket.on("send", (msg)=>{
    const new_msg = JSON.parse(msg);
    const time = new Date();
    const min = time.getMinutes();
    if (!peer.get_time() || (min - peer.get_time()) > 2){
        notice_display();
        peer.update_time(min);
    }
    const name = new_msg["username"];
    const user_msg = new_msg["msg"];
    msg_display(name, user_msg);
})
// peers joining the chat
socket.on("join", (msg)=>{
    const join_msg = JSON.parse(msg);
    const name = join_msg["username"];
    if (join_msg["peers"].includes(self.get_name())){
        // user pulled into a group chat
        if (!self.get_state()){
            if (name == self.get_name()){
                // self is pulled into a group chat
                // load users in the array
                peer.self_join_chat(self, join_msg["peers"], join_msg["room"]);
            } else {
                const self_msg = JSON.stringify({"username": self.get_name(), "partner": name});
                socket.emit("join", self_msg);
            }
        } else{
            if (join_msg["peers"].length == 2){
                // this is the start of a group chat
                console.log("joined");
            } else {
                // peer joining the group chat
                peer.peer_join(self, name);
            }
        }
    } else if (!self.get_state()){
        console.log("others joining chat");
    } else {
        console.log("Error");
    }
})
socket.on("leave", (leave_msg)=>{
    const name = leave_msg["username"];
    if (name == self.get_name()){
        // self leaving the group chat
        const self_info = JSON.stringify({"username": self.get_name()});
        socket.emit("users", self_info);
        peer.self_leave_chat(self);
    } else {
        // peers leaving the group chat
        peer.peer_leave(self, name);
    }
})

socket.on("logout", (msg)=>{
    const logout_msg = JSON.parse(msg);
    const name = logout_msg["username"];
    if (!self.get_state()){
        if (name == self.get_name()){
            window.location.href = "/logout";
        } else {
            peer.peer_leave(self, name);
        }
    }
})

// <!----------MAIN SENDING FUNCTION---------->
const sendbtn = document.getElementById("user-send");

sendbtn.onclick = function (){
    // determine if the user is in chat
    if (self.get_state()){
        // send the data to the chat
        const chatbox = document.getElementById("user-chatbox");
        const msg = chatbox.value;
        // determine if the msg is empty
        if (msg === ""){
            chatbox.placeholder = "Empty Message";
            setTimeout(function(){
                chatbox.placeholder = "Say something";
            }, 2000);
        }else{
            // display only available after server echo
            chatbox.value = "";
            // Here the client also sends the message to the remote server
            const json_msg = JSON.stringify({"username": self.get_name(), "msg": msg});
            socket.emit("send", json_msg);
        }
        return false;
    } else {
        // will be replaced with box warning
        alert("Not in chat!")
    }
}

// <!---------- MAIN LEAVING FUNCTION ---------->

document.getElementById("leave-header").onclick = function (){
    const self_msg = JSON.stringify({"username": self.get_name()});
    if (self.get_state()){
        socket.emit("leave", self_msg);
    } else {
        socket.emit("logout", self_msg);
    }
}
// <!----------   UTILITY FUNCTIONS   ---------->

function msg_display(username, msg){
    // display the message and its sender
    // determine if the sender is self
    // user is a class object
    const display = document.getElementById("chat-display");
    const msg_class = username == self.get_name() ? "self":"other";
    display.innerHTML += `<p class="${msg_class}-message">${msg}</p><h4 class="${msg_class}-name">${username}</h4><br>`;
    const scrollbar = document.getElementById("main-content");
    scrollbar.scrollTop = scrollbar.scrollHeight;
}

function header_display(self, peer){
    const header = document.getElementById("group-header");
    if (self.get_state()){
        // change the header to the number of the group chat
        header.innerHTML = `Group ${peer.get_id()}`;
    } else {
        header.innerHTML = "Single mode";
    }
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

function user_click(self, peer){
    const sidebar = document.getElementById("users-sidebar").getElementsByTagName("li");
    let username = "";
    for (let i = 0; i < sidebar.length; i ++){
        sidebar[i].onclick = function() {
            // here sends the name of the user selected to the server to establish a connection
            if (!self.get_state()){
                const self_msg = JSON.stringify({"username": self.get_name(), "partner": sidebar[i].textContent});
                socket.emit("join", self_msg);
            } else {
                console.log("in chat");
            }
        }
    }
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
    const scrollbar = document.getElementById("main-content");
    scrollbar.scrollTop = scrollbar.scrollHeight;
}

function array_remove(arr, value){ 
    return arr.filter(function(ele){ 
        return ele != value; 
    });
}