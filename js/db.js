// 情侣飞行棋 - IndexedDB 封装（相册存储）

var DB_NAME = 'ludo-album';
var DB_VERSION = 2;
var STORE_NAME = 'photos';
var MEMORY_STORE = 'memories';
var _db = null;

// 备份从同一事务读取两张表，恢复也在同一事务提交。
async function readBackupRecords() {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction([STORE_NAME, MEMORY_STORE], 'readonly');
    var photos = tx.objectStore(STORE_NAME).getAll();
    var memories = tx.objectStore(MEMORY_STORE).getAll();
    tx.oncomplete = function() { resolve({ photos: photos.result, memories: memories.result }); };
    tx.onabort = tx.onerror = function() { reject(tx.error || new Error('读取失败')); };
  });
}

async function writeBackupRecords(records, settings) {
  var db = await openDB();
  var before = {};
  BACKUP_KEYS.forEach(function(key) { before[key] = localStorage.getItem(key); });
  return new Promise(function(resolve, reject) {
    var tx = db.transaction([STORE_NAME, MEMORY_STORE], 'readwrite');
    var failure = null;
    tx.oncomplete = function() { resolve(); };
    tx.onabort = function() {
      try { applyBackupSettings(before); } catch (e) { failure = new Error('恢复失败，请保留备份文件并检查存储空间'); }
      reject(failure || tx.error || new Error('恢复失败，原数据已保留'));
    };
    try {
      var photos = tx.objectStore(STORE_NAME);
      var memories = tx.objectStore(MEMORY_STORE);
      photos.clear();
      memories.clear();
      records.photos.forEach(function(photo) { photos.put(photo); });
      records.memories.forEach(function(memory) { memories.put(memory); });
      applyBackupSettings(settings);
    } catch (e) {
      failure = e;
      tx.abort();
    }
  });
}

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
    tx.oncomplete = function() { resolve(request.result); };
    tx.onabort = function() { reject(tx.error || new Error('保存失败')); };
  });
}

async function deletePhoto(id) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);
    var request = store.delete(id);
    tx.oncomplete = function() { resolve(); };
    tx.onabort = function() { reject(tx.error || new Error('删除失败')); };
  });
}

async function updatePhoto(id, updates) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(STORE_NAME, 'readwrite');
    var store = tx.objectStore(STORE_NAME);
    var getReq = store.get(id);
    tx.oncomplete = function() { resolve(); };
    tx.onabort = function() { reject(tx.error || new Error('更新失败')); };
    getReq.onsuccess = function() {
      var photo = getReq.result;
      if (!photo) { tx.abort(); return; }
      Object.assign(photo, updates);
      var putReq = store.put(photo);
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
    tx.oncomplete = function() { resolve(request.result); };
    tx.onabort = function() { reject(tx.error || new Error('保存失败')); };
  });
}

async function updateMemory(id, updates) {
  var db = await openDB();
  return new Promise(function(resolve, reject) {
    var tx = db.transaction(MEMORY_STORE, 'readwrite');
    var store = tx.objectStore(MEMORY_STORE);
    var getReq = store.get(id);
    tx.oncomplete = function() { resolve(); };
    tx.onabort = function() { reject(tx.error || new Error('更新失败')); };
    getReq.onsuccess = function() {
      var memory = getReq.result;
      if (!memory) { tx.abort(); return; }
      Object.assign(memory, updates);
      var putReq = store.put(memory);
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
    tx.oncomplete = function() { resolve(); };
    tx.onabort = function() { reject(tx.error || new Error('删除失败')); };
  });
}
