//A szerver működéséhez szükséges változók
const Socket = require("websocket").server
const http = require("http")
const express = require("express")
const app=express()
var server = http.Server(app)
const webSocket = new Socket({ httpServer: server })

app.use(express.static(__dirname))

let users = []
var PORT = process.env.PORT || 3000

//A szerver működésért felelős függvények
server.listen(PORT, () => {
    console.log("Listening on port "  + PORT + "...")
})
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  })

//Itt történik az üzenetek kezelése
webSocket.on('request', (req) => {
    const connection = req.accept()

    //Üzenet típusa alapján történő kezelés
    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)
        const user = findRoom(data.roomid)

        switch(data.type) {
            case "store_room":
                if (user != null) {
                    return
                }

                const newUser = {
                     conn: connection,
                     roomid: data.roomid
                }
                users.push(newUser)
                console.log(newUser.roomid)
                break

            case "store_offer":
                if (user == null){
                    return
                }

                user.offer = data.offer
                break
            
            case "store_candidate":
                if (user == null) {
                    return
                }

                if (user.candidates == null)
                    user.candidates = []
                
                user.candidates.push(data.candidate)
                break

            case "send_answer":
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break

            case "send_candidate":
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break

            case "join_call":
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)

                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                })
                break
        }
    })

    //A kapcsolat megszakításakor el kell távolítani a felhasználót a listából
    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})

//Az üzenetek küldését végző segédfüggvény
function sendData(data, conn) {
    conn.send(JSON.stringify(data))
}

//A felhasználó azonosítását végző segédfüggvény
function findRoom(roomid) {
    for (let i = 0;i < users.length;i++) {
        if (users[i].roomid == roomid)
            return users[i]
    }
}