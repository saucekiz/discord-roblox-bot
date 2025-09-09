require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const noblox = require('noblox.js');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;
const GROUP_ID = parseInt(process.env.GROUP_ID, 10);
const AUTHORIZED_ROLE_ID = process.env.ALLOWED_ROLE_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const PREFIX = '!';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let logChannel;

(async () => {
  try {
    await noblox.setCookie(ROBLOX_COOKIE);
    const currentUser = await noblox.getCurrentUser();
    console.log(`✅ Logged into Roblox as ${currentUser.UserName}`);
  } catch (err) {
    console.error('❌ Roblox login failed:', err.message);
  }
})();

client.once('ready', async () => {
  console.log(`✅ Logged into Discord as ${client.user.tag}`);
  try {
    logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
  } catch {
    console.warn('⚠️ Could not fetch log channel.');
  }
});

function getTimestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:F>`;
}

async function logAction(content) {
  if (logChannel && logChannel.isTextBased()) {
    await logChannel.send(`${getTimestamp()} — ${content}`);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'setrank') {
    if (!message.member.roles.cache.has(AUTHORIZED_ROLE_ID)) {
      return message.reply('🚫 You must have the proper role to use this command.');
    }

    const username = args[0];
    const rankId = parseInt(args[1]);

    if (!username || isNaN(rankId)) {
      return message.reply('⚠️ Usage: `!setrank <username> <rankId>`');
    }

    try {
      const userId = await noblox.getIdFromUsername(username);
      await noblox.setRank(GROUP_ID, userId, rankId);

      // Public confirmation message
      await message.channel.send(`${message.author.username} ranked ${username}!`);

      // Detailed log in logChannel
      await logAction(`✅ ${message.author.tag} set ${username} (ID: ${userId}) to rank ID ${rankId}`);
    } catch (err) {
      console.error(err);
      await message.reply('❌ An error occurred while attempting to set the rank.');
    }
  }
});

client.login(DISCORD_TOKEN);
