import express from 'express'
import bodyParser from 'body-parser'
import axios from 'axios'
import pg from 'pg'
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended:true }))
app.use(express.static('public'))

const db = new pg.Client({
    user: '',
    host: 'localhost',
    database: '',
    password: '',
    port: 5432,
})

db.connect()

app.get("/", (req, res)=>{
    res.render("signIn.ejs")
})

let username="";
let user_id;

app.post("/signIn", async (req, res) => {
    username = req.body;
    const { password } = req.body;

    const userResult = await db.query('SELECT * FROM users WHERE username = $1 AND pass = $2', [username, password]);

    if (userResult.rows.length === 0) {
        res.send("Invalid user, try signing Up!");
        return;
    }

    res.redirect("/books");
});

app.get("/signUp", (req, res) => {
    res.render("signUp.ejs");
});

app.post("/signUp", async (req, res) => {
    const { email, password } = req.body;
    const usernameCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    await db.query('INSERT INTO users (username, email, pass) VALUES($1, $2, $3)', [username, email, password]);
    res.redirect("/books");
});

app.get("/books", async (req, res) => {
    try {
        const idResult = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        user_id = idResult.rows[0].id;

        const result = await db.query('SELECT title, author, isbn, summary FROM books WHERE user_id = $1', [user_id]);
        const books = result.rows;

        if (books.length > 0) {
            res.render("books.ejs", { books: books });
        } else {
            console.log("No books found. Redirecting to /add");
            res.redirect("/add");
        }
    } catch (error) {
        console.error("Error querying the database:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/add", (req, res) => {
    res.render("add.ejs")
});

app.post("/add", async (req, res) => {
    const { title, author, isbn, summary } = req.body;
    await db.query('INSERT INTO books (user_id, title, author, isbn, summary) VALUES($1, $2, $3, $4, $5)', [user_id, title, author, isbn, summary]);
    res.redirect("/books");
});

app.listen(port,()=>{
    console.log(`server running on port http://localhost:${port}`)
});
