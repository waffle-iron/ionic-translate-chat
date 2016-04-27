/**
 * @author Hana Lee
 * @since 2016-04-13 14:13
 */
/*jslint
 browser  : true,
 continue : true,
 devel    : true,
 indent   : 2,
 maxerr   : 50,
 nomen    : true,
 plusplus : true,
 regexp   : true,
 vars     : true,
 white    : true,
 todo     : true,
 unparam  : true,
 node     : true
 */
/*global angular */
var translateChat = (function () {
  'use strict';

  var QUERIES = {};
  QUERIES.CREATE_USERS =
    'CREATE TABLE IF NOT EXISTS Users(' +
    'user_id VARCHAR(255) NOT NULL, ' +
    'user_name VARCHAR(255) NOT NULL, ' +
    'user_face VARCHAR(255) NOT NULL DEFAULT \'img/sarah.png\' , ' +
    'device_id VARCHAR(512) NOT NULL, ' +
    'device_type VARCHAR(512) NOT NULL, ' +
    'device_version VARCHAR(512) NOT NULL, ' +
    'socket_id VARCHAR(255) NOT NULL, ' +
    'connection_time TIMESTAMP NOT NULL DEFAULT (STRFTIME(\'%s\', \'now\') || \'000\'), ' +
    'created TIMESTAMP NOT NULL DEFAULT (STRFTIME(\'%s\', \'now\') || \'000\'), ' +
    'PRIMARY KEY(device_id)' +
    ')';
  QUERIES.CREATE_FRIENDS =
    'CREATE TABLE IF NOT EXISTS Friends(' +
    'user_id VARCHAR(255) NOT NULL, ' +
    'friend_id VARCHAR(255) NOT NULL, ' +
    'created TIMESTAMP NOT NULL DEFAULT (STRFTIME(\'%s\', \'now\') || \'000\'), ' +
    'PRIMARY KEY(user_id, friend_id)' +
    ')';
  QUERIES.CREATE_CHAT_ROOMS =
    'CREATE TABLE IF NOT EXISTS ChatRooms(' +
    'chat_room_id VARCHAR(255) NOT NULL, ' +
    'created TIMESTAMP NOT NULL DEFAULT (STRFTIME(\'%s\', \'now\') || \'000\'), ' +
    'PRIMARY KEY(chat_room_id)' +
    ')';
  QUERIES.CREATE_CHAT_ROOM_SETTINGS =
    'CREATE TABLE IF NOT EXISTS ChatRoomSettings(' +
    'chat_room_id VARCHAR(255) NOT NULL, ' +
    'user_id VARCHAR(255) NOT NULL, ' +
    'translate_ko BOOLEAN NOT NULL CHECK (translate_ko IN (0, 1)), ' +
    'show_picture BOOLEAN NOT NULL CHECK (show_picture IN (0, 1)), ' +
    'created TIMESTAMP NOT NULL DEFAULT (STRFTIME(\'%s\', \'now\') || \'000\'), ' +
    'PRIMARY KEY(chat_room_id, user_id)' +
    ')';
  QUERIES.CREATE_CHAT_ROOM_USERS =
    'CREATE TABLE IF NOT EXISTS ChatRoomUsers(' +
    'chat_room_id VARCHAR(255) NOT NULL, ' +
    'user_id VARCHAR(255) NOT NULL, ' +
    'created TIMESTAMP NOT NULL DEFAULT (STRFTIME(\'%s\', \'now\') || \'000\')' +
    ')';
  QUERIES.CREATE_CHAT_MESSAGES =
    'CREATE TABLE IF NOT EXISTS ChatMessages(' +
    'chat_message_id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'chat_room_id VARCHAR(255) NOT NULL, ' +
    'user_id VARCHAR(255) NOT NULL, ' +
    'o_message VARCHAR(2048), ' +
    't_message VARCHAR(2048), ' +
    'from_lang_code CHAR(6), ' +
    'to_lang_code CHAR(6), ' +
    'read BOOLEAN NOT NULL CHECK (read IN (0, 1)), ' +
    'read_time TIMESTAMP, ' +
    'created TIMESTAMP NOT NULL DEFAULT (STRFTIME(\'%s\', \'now\') || \'000\') ' +
    ')';
  QUERIES.CREATE_UNIQUE_INDEX_CHAT_MESSAGES = 'CREATE UNIQUE INDEX IF NOT EXISTS cmuidx01 ON ChatMessages(chat_message_id)';
  QUERIES.CREATE_COMPLEX_INDEX1_CHAT_MESSAGES = 'CREATE INDEX IF NOT EXISTS cmidx01 ON ChatMessages (chat_message_id)';
  QUERIES.CREATE_COMPLEX_INDEX2_CHAT_MESSAGES = 'CREATE INDEX IF NOT EXISTS cmidx02 ON ChatMessages (user_id)';
  QUERIES.CREATE_COMPLEX_INDEX3_CHAT_MESSAGES = 'CREATE INDEX IF NOT EXISTS cmidx03 ON ChatMessages (user_id, o_message, t_message)';

  QUERIES.INSERT_CHAT_MESSGE = 'INSERT INTO ChatMessages (' +
    'chat_room_id, user_id, o_message, t_message, from_lang_code, to_lang_code, read' +
    ') VALUES (?, ?, ?, ?, ?, ?, 0)';
  QUERIES.INSERT_USER =
    'INSERT INTO Users ' +
    '(' +
    'user_id, user_name, user_face, device_id, device_type, ' +
    'device_version, socket_id, connection_time, created' +
    ') ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  QUERIES.INSERT_FRIEND = 'INSERT INTO Friends (user_id, friend_id) VALUES (?, ?)';
  QUERIES.INSERT_CHAT_ROOM = 'INSERT INTO ChatRooms (chat_room_id) VALUES (?)';
  QUERIES.INSERT_CHAT_ROOM_USER = 'INSERT INTO ChatRoomUsers (chat_room_id, user_id) VALUES (?, ?)';
  QUERIES.INSERT_CHAT_ROOM_SETTINGS =
    'INSERT INTO ChatRoomSettings (' +
    'chat_room_id, user_id, translate_ko, show_picture' +
    ') VALUES (?, ?, ?, ?)';

  QUERIES.UPDATE_CHAT_ROOM_SETTINGS_SET_TRANSLATE_KO_BY_CHAT_ROOM_ID_AND_USER_ID =
    'UPDATE ChatRoomSettings SET translate_ko = ? ' +
    'WHERE chat_room_id = ? AND user_id = ?';
  QUERIES.UPDATE_CHAT_ROOM_SETTINGS_SET_SHOW_PICTURE_BY_CHAT_ROOM_ID_AND_USER_ID =
    'UPDATE ChatRoomSettings SET show_picture = ? ' +
    'WHERE chat_room_id = ? AND user_id = ?';
  QUERIES.UPDATE_CHAT_MESSAGE_BY_CHAT_MESSAG_ID =
    'UPDATE ChatMessages SET read = ?, read_time = ? WHERE chat_message_id = ?';
  QUERIES.UPDATE_USERS_SET_USER_NAME_BY_USER_ID = 'UPDATE Users SET user_name = ? WHERE user_id = ?';
  QUERIES.UPDATE_USERS_SET_CONNECTION_TIME_BY_USER_ID =
    'UPDATE Users SET connection_time = ? WHERE user_id = ?';
  QUERIES.UPDATE_USERS_SET_SOCKET_ID_BY_USER_ID = 'UPDATE Users SET socket_id = ? WHERE user_id = ?';

  QUERIES.SELECT_USER_BY_USER_ID =
    'SELECT ' +
    'user_id, user_name, user_face, ' +
    'device_id, device_type, device_version, socket_id, ' +
    'connection_time, created ' +
    'FROM Users WHERE user_id = ?';
  QUERIES.SELECT_USER_BY_USER_NAME =
    'SELECT ' +
    'user_id, user_name, user_face, ' +
    'device_id, device_type, device_version, socket_id, ' +
    'connection_time, created ' +
    'FROM Users WHERE user_name = ?';
  QUERIES.SELECT_USER_BY_DEVICE_ID =
    'SELECT ' +
    'user_id, user_name, user_face, ' +
    'device_id, device_type, device_version, socket_id, ' +
    'connection_time, created ' +
    'FROM Users WHERE device_id = ?';
  QUERIES.SELECT_ALL_USERS =
    'SELECT ' +
    'user_id, user_name, user_face, ' +
    'device_id, device_type, device_version, socket_id, ' +
    'connection_time, created ' +
    'FROM Users ORDER BY user_name DESC';
  QUERIES.SELECT_ALL_FRIENDS_BY_USER_ID =
    'SELECT ' +
    'u.user_id, u.user_name, u.user_face, ' +
    'u.device_id, u.device_type, u.device_version, u.socket_id, ' +
    'u.connection_time, f.created ' +
    'FROM Friends AS f ' +
    'JOIN Users AS u ON f.friend_id = u.user_id ' +
    'WHERE f.user_id = ? ' +
    'ORDER BY u.user_name DESC';
  QUERIES.SELECT_ALL_CHAT_ROOMS = 'SELECT * FROM ChatRooms';
  QUERIES.SELECT_ALL_CHAT_ROOM_IDS_BY_USER_ID =
    'SELECT chat_room_id FROM ChatRoomUsers WHERE user_id = ? ORDER BY created DESC';
  QUERIES.SELECT_ALL_CHAT_ROOM_USERS_BY_CHAT_ROOM_ID =
    'SELECT chat_room_id, user_id FROM ChatRoomUsers WHERE chat_room_id = ?';
  QUERIES.SELECT_LAST_MESSAGE_BY_CHAT_ROOM_ID_AND_USER_ID =
    'SELECT MAX(created) AS max, ' +
    'o_message, t_message, from_lang_code, to_lang_code, read, read_time, created ' +
    'FROM ChatMessages ' +
    'WHERE chat_room_id = ? AND user_id = ? ORDER BY created DESC';
  QUERIES.SELECT_ALL_LAST_MESSAGE_BY_CHAT_ROOM_ID_AND_USER_ID =
    'SELECT MAX(created) AS max, ' +
    'o_message, t_message, from_lang_code, to_lang_code, read, read_time, created ' +
    'FROM ChatMessages ' +
    'WHERE user_id = ? chat_room_id in ($room_ids) ' +
    'GROUP BY chat_room_id ORDER BY created DESC';
  QUERIES.SELECT_ALL_CHAT_MESSAGES_BY_CHAT_ROOM_ID =
    'SELECT ' +
    'chat_message_id, chat_room_id, user_id, o_message, t_message, ' +
    'from_lang_code, to_lang_code, read, read_time, created ' +
    'FROM ChatMessages ' +
    'WHERE chat_room_id = ? ORDER BY created DESC';
  QUERIES.SELECT_CHAT_ROOM_ID_BY_USER_ID_AND_TO_USER_ID =
    'SELECT chat_room_id FROM ChatRoomUsers WHERE user_id = ? AND user_id = ?';
  QUERIES.SELECT_CHAT_ROOM_ID_BY_USER_ID =
    'SELECT chat_room_id FROM ChatRoomUsers WHERE user_id = ? LIMIT 1';
  QUERIES.SELECT_CHAT_ROOM_SETTINGS_BY_CHAT_ROOM_ID_AND_USER_ID =
    'SELECT chat_room_id, user_id, translate_ko, show_picture FROM ChatRoomSettings ' +
    'WHERE chat_room_id = ? AND user_id = ?';

  QUERIES.DELETE_USER_BY_ID = 'DELETE FROM Users WHERE user_id = ?';
  QUERIES.DELETE_FRIEND_BY_USER_ID_AND_FRIEND_ID = 'DELETE FROM Friends WHERE user_id = ? AND friend_id = ?';
  QUERIES.DELETE_CHAT_ROOM_BY_ID = 'DELETE FROM ChatRooms WHERE chat_room_id = ?';
  QUERIES.DELETE_CHAT_MESSAGES_BY_CHAT_ROOM_ID = 'DELETE FROM ChatMessages WHERE char_room_id = ?';
  QUERIES.DELETE_CHAT_ROOM_USERS_BY_CHAT_ROOM_ID = 'DELETE FROM ChatRoomUsers WHERE chat_room_id = ?';
  QUERIES.DELETE_CHAT_ROOM_USERS_BY_USER_ID = 'DELETE FROM ChatRoomUsers WHERE user_id = ?';

  var prepareQueries = [
    QUERIES.CREATE_USERS,
    QUERIES.CREATE_FRIENDS,
    QUERIES.CREATE_CHAT_ROOMS,
    QUERIES.CREATE_CHAT_ROOM_SETTINGS,
    QUERIES.CREATE_CHAT_ROOM_USERS,
    QUERIES.CREATE_CHAT_MESSAGES,
    QUERIES.CREATE_UNIQUE_INDEX_CHAT_MESSAGES,
    QUERIES.CREATE_COMPLEX_INDEX1_CHAT_MESSAGES,
    QUERIES.CREATE_COMPLEX_INDEX2_CHAT_MESSAGES,
    QUERIES.CREATE_COMPLEX_INDEX3_CHAT_MESSAGES
  ];
  return {
    QUERIES : QUERIES,
    prepareQueries : prepareQueries
  };
}());
