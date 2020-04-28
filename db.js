// TODO: REMEMBER TO ADD NEW FUNCTIONS TO module.exports

// placeholder for database
let rooms = {};

const message_types = {
  CHAT: "chat",
  INFO: "info",
  USER_DISCONNECT: "userdisconnected",
};

const socket_routes = {
  MESSAGE_READ: "messageread",
  MESSAGE_SENT: "messagesent",
  NEW_USER: "newuser",
  ERROR: "error",
  PERSON_JOIN: "personjoined",
  CHAT_MESSAGE: "chatmessage",
  WHISPER: "whisper",
  USER_DISCONNECT: "userdisconnected",
  CHAT_HISTORY: "chathistory",
};

/**
 * Stores a chat to a database.
 * @param {Room name} room
 * @param {Socket ID of the person who sent the message} socketID
 * @param {contents of message} msg
 * @param {Date as a string} time
 * These are encrypted WHEN they arrive from the client.
 */
function addChatToRoom(room, message) {
  rooms[room].messages.push(message);
}

/**
 * Given a room, return the messages.
 * @param {Name of room} room
 */
function chatHistory(room) {
  return rooms[room].messages;
}

/**
 * Returns whether the given room exists.
 * @param {Room name} room
 */
function roomExists(room) {
  if (rooms[room]) return true;
  return false;
}

/**
 * Checks if the given password is the same as the one
 * in the given room.
 * @param {The name of the room} room
 * @param {The hashed client password} password
 */
function correctPassword(room, password) {
  console.log(`${rooms[room].password}==${password}`);
  return rooms[room].password == password;
}

/**
 * Returns an array of the NAMES of the users.
 */
function getUserNames(room) {
  let names = [];
  for (let id in rooms[room].people) {
    names.push(rooms[room].people[id]);
  }
  return names;
}

/**
 * Creates a new room with the given room name and password.
 * @param {Room name} room
 * @param {Hashed password} password
 * Password is HASHED before being stored.
 */
function createRoom(room, password) {
  rooms[room] = {
    password,
    people: {},
    messages: [],
  };
}

/**
 * Given a room, return the time of its last message.
 * @param {Name of room} room
 */
function timeOfLastMessage(room) {
  return rooms[room].timeOfLastMessage;
}

/**
 * Returns the room name of a user given their socket ID
 */
function getRoomFromID(socketID) {
  for (room in rooms) {
    if (rooms[room].people[socketID]) {
      return room;
    }
  }

  return false;
}

/**
 * Checks if a name already exists in a given room.
 */
function nameAlreadyExists(room, name) {
  for (i in rooms[room].people) {
    if (rooms[room].people[i] == name) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the socket ID of a person in a room given their name.
 * @param {Room name} room
 * @param {Name of person in the room} name
 */
function getIdFromName(room, name) {
  for (i in rooms[room].people) {
    if (rooms[room].people[i] == name) {
      return i;
    }
  }
  return false;
}

/**
 * Returns the hashed version of some string `p`
 * @param {Password or any string} p
 */
function hash(p) {
  return SHA512(p).toString(CryptoJS.enc.Base64);
}

/**
 * Adds a new person to the list of clients in a given room.
 * @param {Room name} room
 * @param {Name of new client} name
 * @param {socket ID of the new client} socketID
 */
function addNewPersonToRoom(room, name, socketID) {
  rooms[room].people[socketID] = name;
}

/**
 * Stores the admin password for the given room.
 * @param {Name of room} room
 * @param {hashed admin password for the given room} adminPasswordHash
 */
function storeAdminPassword(room, adminPasswordHash) {
  rooms[room].adminPassword = adminPasswordHash;
}

/**
 * Returns if the room has been created
 * @param {Name of room} room
 */
function hasBeenCreated(room) {
  if (!rooms[room]) {
    return false;
  } else {
    return true;
  }
}

/**
 * Returns if the supplied admin password is the one for the room.
 * @param {Name of the room} room
 * @param {UN-hashed admin password} adminPassword
 * adminPassword is NOT hashed when stored in DB
 */
function correctAdminPassword(room, adminPassword) {
  let adminPasswordHash = adminPassword;
  if (
    rooms[room] &&
    rooms[room].adminPassword &&
    rooms[room].adminPassword == adminPasswordHash
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * Delete all messages from a room.
 * @param {Name of room} room
 */
function emptyRoom(room) {
  rooms[room].messages = [];
}

/**
 * For working with times.
 * Given any date (object), it returns a Date object converted to UTC time.
 */
function convertDateToUTC(date) {
  return date.toUTCString();
}

/**
 * Given a date, return a STRING formatted like so:
 *          January 2, 2020
 * @param {Date object} date
 */
function getMonthDayYearString(date) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let res = `${
    monthNames[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;

  return res;
}

/**
 * Removes a person from the list of people in a room.
 * @param {Room name} room
 * @param {Socket ID} socketID
 */
function deletePerson(room, socketID) {
  delete rooms[room].people[socketID];
}

/**
 * Returns the associated name of a socketID.
 * @param {*} socketID
 */
function getNameFromID(room, socketID) {
  return rooms[room].people[socketID];
}

module.exports = {
  addChatToRoom,
  chatHistory,
  roomExists,
  correctPassword,
  createRoom,
  timeOfLastMessage,
  getRoomFromID,
  nameAlreadyExists,
  getIdFromName,
  hash,
  addNewPersonToRoom,
  storeAdminPassword,
  hasBeenCreated,
  correctAdminPassword,
  emptyRoom,
  convertDateToUTC,
  getMonthDayYearString,
  deletePerson,
  getNameFromID,
  message_types,
  socket_routes,
  rooms,
  getUserNames,
};
