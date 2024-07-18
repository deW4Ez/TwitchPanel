const express = require("express");
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv'); 
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config({ path: './.env' }); 

const app = express();

const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const tempDB = []

app.use(express.json());
app.use(cors());

app.use(async (req, res, next) => {
  try {
    const auth = req.get('Authorization');
    console.log(auth)
    if (!auth.startsWith('Bearer ')) {
      res.sendStatus(403);
      // Данные авторизации не были предоставлены
      return;
    }
    const token = auth.slice(7); // Пропускаем 'Bearer '  
    req.user = await jwt.verify(token, Buffer.from(process.env.SECRET, 'base64'));    
  } catch (e) {
    console.log(e)
    res.sendStatus(403);
    // Неверный или истекший токен
    return;
  }

  next();
})

app.post('/list', async (req,res) =>{
  try {    
    await client.connect();    
    const collection = await client.db("TwitchPanel").collection("UsersLists");
    const data = await collection.updateOne({id: req.body.id}, {$set: {
      id: req.body.id,
      list: req.body.list,
      type: req.body.type
    }})   
    res.json(data)    
  } finally {    
    await client.close();
  }
})

app.get('/list', async (req, res) =>{
  const {channel_id} = req.user

  try {    
    await client.connect();    
    const collection = await client.db("TwitchPanel").collection("UsersLists");
    const data = await collection.findOne({id: channel_id})    
    if(data){
      res.json(data)
    } else {
      const tempData = {
            id: channel_id,
            type: "default",
            list: []
          }
      await collection.insertOne(tempData)
      res.json(tempData)
    }
  } finally {    
    await client.close();
  }
   
})

app.listen(process.env.PORT || 8080,
  console.log('Сервер запущен с портом 8080')
);