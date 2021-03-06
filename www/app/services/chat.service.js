/**
 * @author Hana Lee
 * @since 2016-05-04 13:37
 */

(function () {
  'use strict';

  angular
    .module('translate-chat')
    .factory('ChatService', ChatService);

  ChatService.$inject = [
    '$q', 'SocketService', '_', 'FriendService', 'STORAGE_KEYS'
  ];

  function ChatService($q, SocketService, _, FriendService, STORAGE_KEYS) {
    var chatRoomList = [];

    if (localStorage.getItem(STORAGE_KEYS.CHATS)) {
      chatRoomList = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS));
    }

    return {
      getChatRoom : getChatRoom,
      joinChatRoom : joinChatRoom,
      getToUserByChatRoomId : getToUserByChatRoomId,
      getAllRoom : getAllRoom,
      updateLastText : updateLastText
    };

    function getChatRoom(friend) {
      return _.find(chatRoomList, function (chatRoom) {
        return chatRoom.to_user.user_id === friend.user_id;
      });
    }

    function joinChatRoom(user, friend, chatRoomId) {
      var deferred = $q.defer();

      if (chatRoomId) {
        _joinChatRoom(user, friend, chatRoomId).then(function () {
          deferred.resolve(chatRoomId);
        });
      } else {
        _getChatRoomIdFromServer(user, friend).then(function (result) {
          if (result) {
            _joinChatRoom(user, friend, result.chat_room_id).then(function () {
              deferred.resolve(result);
            });
          } else {
            _createChatRoom(user, friend).then(function (result) {
              _joinChatRoom(user, friend, result.chat_room_id).then(function () {
                deferred.resolve(result);
              });
            });
          }
        });
      }

      return deferred.promise;
    }

    function _getChatRoomIdFromServer(user, friend) {
      var deferred = $q.defer();

      console.debug('get chat room id');
      SocketService.emit('retrieveChatRoomId', {
        user : user, to_user : friend
      });
      SocketService.on('retrievedChatRoomId', function (data) {
        SocketService.removeListener('retrievedChatRoomId');

        if (data.error) {
          deferred.reject(data);
        } else if (data.result) {
          console.info('chat room id : ', data);
          chatRoomList.push({
            user : user,
            to_user : friend,
            chat_room_id : data.result.chat_room_id,
            last_text : ''
          });
        }
        deferred.resolve(data.result);
      });

      return deferred.promise;
    }

    function _joinChatRoom(user, friend, chatRoomId) {
      var deferred = $q.defer();

      SocketService.emit('joinChatRoom', {
        chat_room_id : chatRoomId,
        user : user,
        to_user : friend
      });
      SocketService.on('joinedChatRoom', function (data) {
        SocketService.removeListener('joinedChatRoom');

        if (data.error) {
          deferred.reject(data);
        } else {
          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function _createChatRoom(user, friend) {
      var deferred = $q.defer();

      SocketService.emit('createChatRoom', {
        user : user, to_user : friend
      });
      SocketService.on('createdChatRoom', function (data) {
        SocketService.removeListener('createdChatRoom');

        if (data.error) {
          deferred.reject(data);
        } else {
          chatRoomList.push({
            user : user,
            to_user : friend,
            chat_room_id : data.result.chat_room_id,
            last_text : ''
          });

          _saveLocalStorage();

          deferred.resolve(data.result);
        }
      });

      return deferred.promise;
    }

    function getToUserByChatRoomId(chatRoomId) {
      console.debug('get to user by chat room id : ', chatRoomId, chatRoomList);
      var chatRoom = _.find(chatRoomList, function (chatRoom) {
        return chatRoom.chat_room_id === chatRoomId;
      });

      if (chatRoom) {
        return chatRoom.to_user;
      }

      return null;
    }

    function getAllRoom(userData) {
      var deferred = $q.defer();
      var promise = deferred.promise;

      if (chatRoomList.length === 0) {
        FriendService.getAll(userData).then(function (result) {
          console.log('get all friend result : ', result);
          SocketService.emit('retrieveAllChatRoomByUserId', userData);
          SocketService.on('retrievedAllChatRoomByUserId', function (data) {
            SocketService.removeListener('retrievedAllChatRoomByUserId');
            console.log('all chat room data : ', data);
            if (data.error) {
              deferred.reject(data);
            } else if (data.result && data.result.length > 0) {
              data.result.forEach(function (/** @prop {String} r.to_user_id */r) {
                var friend = _.find(result, function (f) {
                  return r.to_user_id === f.user_id;
                });
                chatRoomList.push({
                  user : userData,
                  to_user : friend,
                  chat_room_id : r.chat_room_id,
                  last_text : r.last_text
                });
              });
              _saveLocalStorage();
              deferred.resolve(chatRoomList);
            } else {
              chatRoomList = [];
              _saveLocalStorage();
              deferred.resolve(chatRoomList);
            }
          });
        }, function (error) {
          console.log('get friends error : ', error);
          deferred.reject(error);
        });
      } else {
        deferred.resolve(chatRoomList);
      }
      return promise;
    }

    function updateLastText(chatRoomId, text) {
      var chatRoom = _.find(chatRoomList, function (chatRoom) {
        return chatRoom.chat_room_id === chatRoomId;
      });

      chatRoom.last_text = text;

      _saveLocalStorage();
    }

    function _saveLocalStorage() {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chatRoomList));
    }
  }

})();
