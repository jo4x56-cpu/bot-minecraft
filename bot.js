const mineflayer = require('mineflayer');

const CONFIG = {
  host: 'JOUA.aternos.me',
  port: 56528,
  username: 'Bot_AntiAFK',
  version: '1.21',
  reconnectDelay: 60000 // Tenta reconectar apenas 1 minuto após ser desconectado
};

let bot = null;
let afkInterval = null;
let reconnectTimeout = null;

function startBot() {
  if (bot) return;

  console.log('[BOT] Tentando conectar...');

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    auth: 'offline',
    version: CONFIG.version,
    viewDistance: 'tiny',
    physicsEnabled: false
  });

  bot.on('spawn', () => {
    console.log('[BOT] Conectado com sucesso!');

    if (bot.entities) bot.entities = {};

    setTimeout(() => {
      if (bot) bot.chat('AntiAFK ativo.');
    }, 2000);

    if (!afkInterval) {
      afkInterval = setInterval(() => {
        if (!bot) return;
        bot.look(Math.random() * Math.PI * 2, 0);
      }, 15000);
    }

    // Checa se já tem alguém no servidor assim que entra
    checkAndDisconnectIfOccupied();
  });

  // Se outro jogador entrar com o bot lá dentro
  bot.on('playerJoined', (player) => {
    if (player.username !== bot.username) {
      console.log(`[BOT] Jogador "${player.username}" entrou. Saindo...`);
      disconnectBot();
    }
  });

  bot.on('kicked', (reason) => {
    console.log('[BOT] Expulso/Kicked. Aguardando para tentar novamente.');
    scheduleReconnect();
  });

  bot.on('end', () => {
    console.log('[BOT] Desconectado.');
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.log('[BOT] Erro:', err.message);
    scheduleReconnect();
  });
}

function checkAndDisconnectIfOccupied() {
  if (!bot || !bot.players) return;
  
  const otherPlayers = Object.keys(bot.players).filter(name => name !== bot.username);
  
  if (otherPlayers.length > 0) {
    console.log(`[BOT] Jogador real no servidor (${otherPlayers.join(', ')}). Desconectando...`);
    disconnectBot();
  }
}

function disconnectBot() {
  cleanup();
  if (bot) {
    bot.quit();
    bot = null;
  }
  scheduleReconnect();
}

function cleanup() {
  if (afkInterval) {
    clearInterval(afkInterval);
    afkInterval = null;
  }
  bot = null;
}

function scheduleReconnect() {
  cleanup();
  if (!reconnectTimeout) {
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      startBot();
    }, CONFIG.reconnectDelay);
  }
}

// Inicia o bot pela primeira vez
startBot();