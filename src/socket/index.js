//creates socket.io and defines events
//should not directly contain sql anymore
const {Server}=require("socket.io");

//import database helper functions
const {
    isConversationParticipant,
    insertMessage,
    getUsername,
} = require("../services/messagesService");

function roomName(conversationId){
    return "conversation:${conversationId}";
}

function socketfunc(server){
    //io: main object use to manage sockets and emit events
    //attaches to the http server
    const io=new Server(server,{
        //cors: cross-origin resource sharing
        cors:{
            //allow any website to connect (for now)
            origin:"*",
        },
    });

    //sets up an event listener on the socket.io server
    //"connection" fires every time a client connects via socket.io
    //(socket)=>{} runs for the connected client, socket represents that one user's live connection
    io.on("connection",(socket)=>{
        //socket.id: unique id assigned to the connection
        console.log("Socket connected:", socket.id);
        //socket.on(): listens for an event from the client
        //client's name: "conversation.join"
        socket.on("conversation.join", async ({conversation_id,user_id})=>{
            const convoid=Number(conversation_id);
            const userid=Number(user_id);
            if(!convoid||!userid){
                return socket.emit("conversation:error",{
                    error:"conversation_id and user_id are required",
                });
            }
            //user must belong to the conversation in order to start real-time chatting
            const allowed=await isConversationParticipant(convoid,userid);
            if(!allowed){
                return socket.emit("conversation:error", {
                    error: "Not allowed to join this conversation",
                });
            }

            //adds this socket connection to room
            socket.join(roomName(convoid));
            console.log("Socket ${socket.id} joined ${roomName(cid)}");
        });
        //destructs incoming objects to get conversation_id, sender_id, and body
        socket.on("message:send", async({conversation_id,sender_id,body})=>{
            try{
                const convo=Number(conversation_id);
                const send=Number(sender_id);
                //body||"" means if body is missing use empty string
                //.trim() removes spaces at the start/end
                const msg=String(body||"").trim();
                if(!convo||!send||!msg){
                    return socket.emit("message:error", {
                        error: "conversation id, sender id and body are required",
                    });
                }
                const allowed=await isConversationParticipant(convo,send);
                if(!allowed){
                    return socket.emit("message:error", {
                        error: "Not allowed to send message",
                    });
                }
                const saved=await insertMessage(convo,send,msg);
                const sender_username=await getUsername(send);
                //...smth: spreads all fields in the array
                const obj={...saved,sender_username};

                //io.to(roomName(convo)) targets the room
                //.emit sends an event named message:new to everyone in the room
                //obj is the message
                io.to(roomName(convo)).emit("message:new",obj);
            }
            catch (err){
                console.error("message:send error:", err.message);
                socket.emit("message:error", { error: "Failed to send message" });
            }
        });

        socket.on("disconnect", ()=>{
            console.log("Socket disconnected:", socket.id);
        });

    });

    //return io in case server.js wants to use it later
    return io;
}

module.exports={socketfunc};