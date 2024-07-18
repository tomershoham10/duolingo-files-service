import startServer from './server.js';

(async () => {
  try {
    console.log('file server connected');
    startServer();
  } catch (e) {
    console.log(e);
  }
})();
