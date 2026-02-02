//contains database functions such as inserting a message
const pool=require("../db");

async function isConversationParticipant(conversation_id,userId){
    const result=await pool.query(
        "SELECT 1 FROM conversations WHERE id=$1 AND (user1_id=$2 OR user2_id=$2)",
        [conversation_id,userId]
    );
    return result.rows.length>0;
}

async function insertMessage(conversation_id,sender_id,body){
    const result=await pool.query(
        "INSERT INTO messages (conversation_id,sender_id,body) VALUES ($1,$2,$3) RETURNING *",
        [conversation_id,sender_id,body]
    );
    return result.rows[0];
}

async function getUsername(userId){
    const result=await pool.query(
        "SELECT username FROM users WHERE id=$1",
        [userId]
    );
    //if rows[0] is undefined returns undefined
    //if username not found use null
    return result.rows[0]?.username||null;
}

//export functions so other parts of the app can use them
module.exports={
    isConversationParticipant,
    insertMessage,
    getUsername,
};