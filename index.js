let db = require("./db");

// server and socket.io imports
let app = require("express")();
let http = require("http").createServer(app);
let io = require("socket.io")(http);

// for getting JSON in req body
let bodyParser = require("body-parser");
app.use(bodyParser.json());

// ENABLE cors
let cors = require("cors");
app.use(cors());

// For end-to-end encryption of data.
// Messages are encrypted and decrypted using the hash of the
// room password.
let SHA512 = require("crypto-js/sha512");
let CryptoJS = require("crypto-js");

const port = process.env.PORT || 5000;

/*
rooms = 
{
    "room name": {
      messages: [{name: "sally", 
                  text:"poop in the pants", 
                  time: "Sun Apr 19 2020 17:08:08 GMT-0500 (Central Daylight Time)",
                  type: "info"|"chat"
                  }]
      password: string (should be hashed),
      people: {
        "socket ID": "name"
      } (list of names, cannot duplicate names in room) ,
    }
    
}


*/

/**
 * Create a new room
 * URL looks like this: "/dannysroom?p=23848hh"
 * The URL parameter `q` is the password.
 * Send back:
 *    200 if room has already been created and password is correct or if room was created
 *    404 if password not correct
 */
app.post("/:room", (req, res) => {
  let room = req.params.room;
  let password = req.body.password;

  // check if room is not created
  if (db.roomExists(room)) {
    if (db.correctPassword(room, password)) {
      res.sendStatus(200); // all good
    } else {
      res.sendStatus(401); // wrong password (unauthorized)
    }
  } else {
    // otherwise, create the room
    db.createRoom(room, password);
    res.sendStatus(200);
  }
});

io.on("connection", (socket) => {
  /**
   * First time user, check password
   */
  socket.on(db.socket_routes.NEW_USER, (room, name, password) => {
    let hasAccess = db.correctPassword(room, password);

    if (db.nameAlreadyExists(room, name)) {
      io.to(socket.id).emit(db.socket_routes.ERROR, "name taken");
    } else {
      if (hasAccess) {
        // if the person is the first, have them create an admin password
        if (!db.hasBeenCreated(room)) {
          io.to(socket.id).emit("error", "error. room hasn't been created");
        } else {
          console.log("there are people here!!!");
        }

        socket.join(room);
        db.addNewPersonToRoom(room, name, socket.id);

        // broadcast that a new person has joined
        socket.to(room).broadcast.emit(db.socket_routes.PERSON_JOIN, name);

        // send all of the previous chats back to that person
        io.to(socket.id).emit(
          db.socket_routes.CHAT_HISTORY,
          db.chatHistory(room)
        );
      } else {
        io.to(socket.id).emit("error", "unauthorized user");
      }
    }

    console.log(db.rooms);
  });

  /**
   * Time has NOT been converted to UTC time.
   * Must convert time within the server response here.
   * room, msg, and time are all strings.
   */
  socket.on(db.socket_routes.CHAT_MESSAGE, (room, msg, time) => {
    console.log("message: " + msg);
    console.log(`id: ${socket.id}`);

    let UTCTimeString = db.convertDateToUTC(new Date(time)).toString();

    // AFTER new day broadcast, then send chat.
    // Broadcast does NOT send back to the original sender.
    socket
      .to(room)
      .broadcast.emit(
        db.socket_routes.CHAT_MESSAGE,
        msg,
        db.getNameFromID(room, socket.id),
        UTCTimeString
      );

    db.addChatToRoom(
      room,
      socket.id,
      msg,
      UTCTimeString,
      db.message_types.CHAT
    );
  });

  /**
   * When a user wants to whisper (private message) to another person.
   * Time has NOT been converted to UTC time.
   * Must convert time within the server response here.
   */
  socket.on(
    db.socket_routes.WHISPER,
    (room, actualMessage, recipient, time) => {
      // gather the socket.id of the person
      let recipientID = db.getIdFromName(room, recipient);
      // error name not in room people list
      if (!recipientID) {
        io.to(socket.id).emit(db.socket_routes.ERROR, "cannot whisper");
      }

      // send the whisper JUST to the one person
      io.to(recipientID).emit(
        db.socket_routes.WHISPER,
        actualMessage,
        db.getNameFromID(room, socket.id),
        time
      );
    }
  );

  /**
   * When a user disconnects, remove their entry from the `people` property.
   */
  socket.on("disconnect", () => {
    let room = db.getRoomFromID(socket.id);
    if (!room) {
      console.log("error on user disconnect");
    } else {
      socket
        .to(room)
        .broadcast.emit(
          db.socket_routes.USER_DISCONNECT,
          db.getNameFromID(room, socket.id)
        );
      db.addChatToRoom(
        room,
        socket.id,
        `${db.getNameFromID(room, socket.id)} has left the chat`,
        new Date(),
        db.message_types.INFO
      );
      db.deletePerson(room, socket.id);
    }

    console.log("\n\n");
    // console.log(rooms);
  });
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});
