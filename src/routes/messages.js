//file responsible for private communication between two users
const express=require("express");
const router=express.Router();
const pool=require("../db");

//make sure msg a->b and b->a does not get separated into 2 convos
function normalizePair(a,b){
    const user1=Math.min(a,b);
    const user2=Math.max(a,b);
    // {}=key-value pairs
    return {user1,user2};
}

//handles a post request under conversations, runs when someone wants to start chatting
router.post("/conversations", async(req,res)=>{
    //extract json values sent by client
    const {user_a,user_b}=req.body;
    if(!user_a||!user_b){
        //set status code
        return res.status(400).json({error:"user_a and user_b are required"});
    }
    if(user_a===user_b){
        return res.status(400).json({error:"cannot create a conversation with yourself"});
    }
    const {user1,user2}=normalizePair(Number(user_a),Number(user_b));

    //try to create convo between 2 users, if it alrd exists dont create another one
    await pool.query(
        "INSERT INTO conversations (user1_id, user2_id) VALUES ($1,$2) ON CONFLICT (user1_id,user2_id) DO NOTHING",
        [user1,user2]
    );
    
    //always return the existing conversation (either the alrd existed one or the newly created one)
    const convo=await pool.query(
        "SELECT * FROM conversations WHERE user1_id=$1 AND user2_id=$2",
        [user1,user2]
    );
    //gives the frontend conversation id
    res.json(convo.rows[0]);
});

//listing conversations for a user
//show all the conversatins that this user is part of
//reading data, generate url with dynamic values of user id
router.get("/conversations/:userId",async(req,res)=>{
    //convert userid into a number
    const userId=Number(req.params.userId);
    //the sql query will find all convos where the user is either 1/2
    //figures out the other person
    //attaches the other person's username
    const result=await pool.query(
        //for a given user show all their convos and find the other person
        //case: sql's if/else
        `SELECT
            c.*,
            CASE
                WHEN c.user1_id = $1 THEN u2.username
                ELSE u1.username
            END AS other_username,
            CASE
                WHEN c.user1_id = $1 THEN c.user2_id
                ELSE c.user1_id
            END AS other_user_id
        FROM conversations c
        JOIN users u1 ON u1.id = c.user1_id
        JOIN users u2 ON u2.id = c.user2_id
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY c.created_at DESC`,[userId]
    );

    res.json(result.rows);
});

//send a new message
router.post("/",async(req,res)=>{
    const {conversation_id,sender_id,body}=req.body;
    if(!conversation_id||!sender_id||!body){
        res.status(400).json({error:"conversation_id, sender_id, and body are required"});
    }
    const result=await pool.query(
        //returning *: returns the newly inserted row
        "INSERT INTO messages (conersation_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *",
        [Number(conversation_id), Number(sender_id), String(body)]
    );
    res.json(result.rows[0]);
});

//get messages for a conversation
router.get("/:conversationId",async(req,res)=>{
    const convoId=Number(req.params.conversationId);
    const result=await pool.query(
        //find u.id that's equal to sender_id, find it's username through u
        `SELECT m.*, u.username AS sender_username
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1
         ORDER BY m.created_at ASC`,
         [convoId]
    );
    res.json(result.rows);
});

module.exports=router;


