const { Collection, EmbedBuilder } = require("discord.js");
const { readdirSync } = require("fs");

module.exports = async(client, interaction) => {

  if(interaction.isChatInputCommand()) {

    if (!interaction.guildId) return;

    readdirSync('./komutlar').forEach(f => {

      const cmd = require(`../komutlar/${f}`);

      if(interaction.commandName.toLowerCase() === cmd.name.toLowerCase()) {

        return cmd.run(client, interaction);


      }


    });



  }

};
