// 情侣飞行棋 - IndexedDB 封装（相册存储）

var DB_NAME = 'ludo-album';
var DB_VERSION = 2;
var STORE_NAME = 'photos';
var MEMORY_STORE = 'memories';
var _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(MEMORY_STORE)) {
        var store = db.createObjectStore(MEMORY_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
      }
    };
    request.onsuccess = function() { _db = request.result; resolve(_db); };
    request.onerror = function() { reject(request.error); };
  });
}

async function getAllPhotos() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, 'readonly');
    var store = tx.objectStore(STORE_NAME);
    var request = store.getAll();
    request.onsuccess = function() {
      var photos = request.result || [];
      photos.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      resolve(photos);
    };
    request.onerror = function() { reject(request.error); };
  });
}

async function addPhoto(photo) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);
    var record = {
      data: photo.data,
      caption: photo.caption || '',
      date: photo.date || '',
      createdAt: Date.now()
    };
    var request = store.add(record);
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

async function deletePhoto(id) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);
    var request = store.delete(id);
    request.onsuccess = function() { resolve(); };
    request.onerror = function() { reject(request.error); };
  });
}

async function updatePhoto(id, updates) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);
    var getReq = store.get(id);
    getReq.onsuccess = function() {
      var photo = getReq.result;
      if (!photo) { reject(new Error('照片不存在')); return; }
      Object.assign(photo, updates);
      var putReq = store.put(photo);
      putReq.onsuccess = function() { resolve(); };
      putReq.onerror = function() { reject(putReq.error); };
    };
    getReq.onerror = function() { reject(getReq.error); };
  });
}

// ============ 回忆存储 ============

async function getAllMemories() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(MEMORY_STORE, 'readonly');
    var store = tx.objectStore(MEMORY_STORE);
    var request = store.getAll();
    request.onsuccess = function() {
      var memories = request.result || [];
      memories.sort(function(a, b) { return (a.date || '').localeCompare(b.date || '') || (b.createdAt || 0) - (a.createdAt || 0); });
      resolve(memories);
    };
    request.onerror = function() { reject(request.error); };
  });
}

async function addMemory(memory) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(MEMORY_STORE, 'readwrite');
    var store = tx.objectStore(MEMORY_STORE);
    var record = {
      date: memory.date || '',
      title: memory.title || '',
      content: memory.content || '',
      photoId: memory.photoId || null,
      createdAt: Date.now()
    };
    var request = store.add(record);
    request.onsuccess = function() { resolve(request.result); };
    request.onerror = function() { reject(request.error); };
  });
}

async function updateMemory(id, updates) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(MEMORY_STORE, 'readwrite');
    var store = tx.objectStore(MEMORY_STORE);
    var getReq = store.get(id);
    getReq.onsuccess = function() {
      var memory = getReq.result;
      if (!memory) { reject(new Error('回忆不存在')); return; }
      Object.assign(memory, updates);
      var putReq = store.put(memory);
      putReq.onsuccess = function() { resolve(); };
      putReq.onerror = function() { reject(putReq.error); };
    };
    getReq.onerror = function() { reject(getReq.error); };
  });
}

async function deleteMemory(id) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(MEMORY_STORE, 'readwrite');
    var store = tx.objectStore(MEMORY_STORE);
    var request = store.delete(id);
    request.onsuccess = function() { resolve(); };
    request.onerror = function() { reject(request.error); };
  });
}
