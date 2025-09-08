const CACHE_NAME = 'athletecore-pro-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn1.genspark.ai/user-upload-image/gpt_image_generated/1d48ae2f-e2df-4a7c-a800-832043efb262_wm'
];

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('AthleteCore Pro: キャッシュを作成しました');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('AthleteCore Pro: 古いキャッシュを削除しました:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ネットワークリクエストの処理
self.addEventListener('fetch', event => {
  // API リクエストの場合はネットワークファーストで処理
  if (event.request.url.includes('/tables/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // レスポンスが正常な場合はそのまま返す
          if (response.status === 200) {
            return response;
          }
          // エラーの場合はオフライン用のレスポンスを返す
          return new Response(JSON.stringify({
            error: 'オフライン中のため、データの保存・取得ができません',
            offline: true
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
        .catch(() => {
          // ネットワークエラーの場合
          return new Response(JSON.stringify({
            error: 'ネットワークに接続できません',
            offline: true
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 静的リソースの場合はキャッシュファーストで処理
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあれば返す
        if (response) {
          return response;
        }
        
        // キャッシュになければネットワークから取得
        return fetch(event.request)
          .then(response => {
            // レスポンスが無効な場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスのクローンを作成してキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // オフライン時のフォールバック
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('AthleteCore Pro: バックグラウンド同期を実行しました');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // バックグラウンドでの同期処理
  // 例：オフライン時に保存されたデータを送信
  console.log('バックグラウンド同期処理を実行中...');
}

// プッシュ通知の処理
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '新しい分析結果が利用可能です',
    icon: 'https://cdn1.genspark.ai/user-upload-image/gpt_image_generated/1d48ae2f-e2df-4a7c-a800-832043efb262_wm',
    badge: 'https://cdn1.genspark.ai/user-upload-image/gpt_image_generated/1d48ae2f-e2df-4a7c-a800-832043efb262_wm',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '結果を確認',
        icon: 'https://cdn1.genspark.ai/user-upload-image/gpt_image_generated/1d48ae2f-e2df-4a7c-a800-832043efb262_wm'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: 'https://cdn1.genspark.ai/user-upload-image/gpt_image_generated/1d48ae2f-e2df-4a7c-a800-832043efb262_wm'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AthleteCore Pro', options)
  );
});

// 通知クリックの処理
self.addEventListener('notificationclick', event => {
  console.log('通知がクリックされました:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/#results')
    );
  } else if (event.action === 'close') {
    // 何もしない（通知を閉じるだけ）
  } else {
    // デフォルトアクション
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});