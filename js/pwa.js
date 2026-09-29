var waitingAppWorker = null;

function offerAppUpdate(worker) {
  waitingAppWorker = worker;
  document.getElementById('appUpdateBanner').hidden = false;
}

function applyAppUpdate() {
  if (!waitingAppWorker || backupBusy) return;
  if (gameState && (gameState.isTurnBusy || (!gameState.gameOver && Object.values(gameState.players).some(function(p) { return p.pos !== -1; })))) {
    if (!confirm('更新会重新载入页面，当前未结束的对局会重置。照片、回忆与已保存数据会保留。现在更新？')) return;
  }
  waitingAppWorker.postMessage({ type: 'SKIP_WAITING' });
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (hadController) location.reload();
    hadController = true;
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function(registration) {
    if (registration.waiting) offerAppUpdate(registration.waiting);
    registration.addEventListener('updatefound', function() {
      var worker = registration.installing;
      worker.addEventListener('statechange', function() {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offerAppUpdate(worker);
      });
    });
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') registration.update().catch(function() {});
    });
  }).catch(function() {});
}
