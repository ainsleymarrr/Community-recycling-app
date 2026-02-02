//require(): takes info from...
//router: mini server
const express=require("express");
const router=express.Router();
const pool=require("../db");

function normalizePair(a, b) {
  const user1 = Math.min(a, b);
  const user2 = Math.max(a, b);
  return { user1, user2 };
}


//handle a post request here and will wait for database work
//=> means "this function does this"
router.post("/",async(req,res) => {
    //extracts data sent by user
    const {author_id,description}=req.body;
    //send information into database and wait till finishes
    const result=await pool.query(
        //sql; add a new post(in table) fill out id & description with provided values
        "INSERT INTO posts (author_id, description) VALUES ($1, $2) RETURNING *",
        //supplies values to VALUES($1,$2)
        [author_id,description]
    );

    //rows is an array with info of all the datas in the table
    //send the info of the newly created post back as JSON
    res.json(result.rows[0]);
});

//handle a get request here and will wait for the database work
router.get("/", async (req, res) => {
  const result = await pool.query(
    //sql; gets all the posts, joins with users to get usernames, orders posts from newest to oldest
    "SELECT posts.*, users.username FROM posts JOIN users ON posts.author_id = users.id ORDER BY created_at DESC"
  );
  //send this info back as json
  res.json(result.rows);
});

router.post("/:postId/message", async(req,res)=>{
    const postId=Number(req.params.postId);
    const {current_user_id}=req.body;
    if(!postId){
        res.status(400).json({error:"Post id is required in the URL"});
    }
    if(!current_user_id){
        res.status(400).json({error:"Current user id is required"});
    }
    const post=await pool.query(
        "SELECT id,author_id FROM posts WHERE id=$1",
        [postId]
    );
    if(post.rows.length===0) return res.status(404).json({error:"Post not found"});
    
    const seller=post.rows[0].author_id;
    const buyer=Number(current_user_id);
    if(seller===buyer) res.status(400).json({error:"You cannot message yourself!"});
    
    const {user1,user2}=normalizePair(seller,buyer);
    
    await pool.query(
        "INSERT INTO conversations (user1_id,user2_id) VALUES ($1,$2) ON CONFLICT (user1_id,user2_id) DO NOTHING",
        [user1,user2]
    );

    const convo=await pool.query(
        "SELECT * FROM conversations WHERE user1_id=$1 AND user2_id=$2",
        [user1,user2]
    );

    res.json({
        coversation:convo.rows[0],
        post_id:post,
        seller_id:seller,
        buyer_id:buyer,
    });
});

//make this router available to other files
module.exports=router;