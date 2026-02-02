console.log("RUNNING SRC SERVER.JS");

const express=require("express");
//create a server socket.io can attach to
const http=require("http"); 
const {Server}=require("socket.io");
const postsRoutes=require("./routes/posts");
const messagesRoutes=require("./routes/messages");
const {socketfunc}=require("./socket/index");
const pool=require("./db");

// creates main server
const app=express();
//parse json
app.use(express.json());

//safety check
app.get("/health", (req, res) => {
  res.send("OK");
});

//when request starts with /posts, send it to postsRoutes
//makes posts.js work as a mini server
console.log("About to mount postsRoutes...");
app.use("/posts",postsRoutes);
console.log("Mounted postsRoutes at /posts");

console.log("About to mount messagesRoutes...");
app.use("/messages",messagesRoutes);
console.log("Mounted messagesRoutes at /messages");

//create an http server from express
const server=http.createServer(app);
//initialize socket.io on the http server
socketfunc(server);


server.listen(3000, () => {
  console.log("Server running on port 3000");
});



