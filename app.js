const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require("path");

const app = express();

//  http ka server vo link kiya express sa yeah server sockit chalye ga
const server = http.createServer(app);
const io = socket(server); //real time connection

const chess = new Chess();

let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (socket) {
    console.log("connected");

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on("disconected", function () {
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

    socket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const resutl = chess.move(move);  //moves btaye ga ki right ha ya wrong
            if (resutl) {
                currentPlayer = chess.turn();
                io.emit("move", move)
                io.emit("boardState", chess.fen());//board ki correct state
            }
            else {
                console.log("Invalid move", move);
                socket.emit("invalidMove", move);
            }


        } catch (error) {
            console.log(error);
            socket.emit("Invalid move :",move);
        }
    })
})

server.listen(3000, function () {
    console.log("listening on 3000");
})
