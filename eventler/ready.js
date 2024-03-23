const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { url } = require("./handler.json");
const texter = require(url)
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const INTENTS = Object.values(GatewayIntentBits);
const PARTIALS = Object.values(Partials);
const config = require("../config.json");
const client = new Client({
    intents: INTENTS,
    allowedMentions: {
        parse: ["users"]
    },
    partials: PARTIALS,
    retryLimit: 3
});

module.exports = async (client) => {

  const rest = new REST({ version: "10" }).setToken(config.bot.token);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: client.commands,
    });
  } catch (error) {
    console.error(error);
  }

    console.log(`${client.user.username} Discorda başarıyla giriş yaptı`);
    console.log(texter.text())
};
