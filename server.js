const Socket = require("websocket").server
const http = require("http")

const server = http.createServer((req, res) => {})
//var PORT = 3003
var PORT = process.env.PORT || 3001
console.log(PORT);
server.listen(PORT, () => {
    console.log("Listening on port "  + PORT + "...")
})

const webSocket = new Socket({ httpServer: server })

let users = []

webSocket.on('request', (req) => {
    const connection = req.accept()

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
                if (user == null)
                    return
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

    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})

function sendData(data, conn) {
    conn.send(JSON.stringify(data))
}

function findRoom(roomid) {
    for (let i = 0;i < users.length;i++) {
        if (users[i].roomid == roomid)
            return users[i]
    }
}