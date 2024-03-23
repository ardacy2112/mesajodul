const { Client, GatewayIntentBits, Partials } = require("discord.js");
const INTENTS = Object.values(GatewayIntentBits);
const PARTIALS = Object.values(Partials);
const Discord = require("discord.js")
const db = require("./db")
const client = new Client({
    intents: INTENTS,
    allowedMentions: {
        parse: ["users"]
    },
    partials: PARTIALS,
    retryLimit: 3
});
const { AdvancedEmbed, AdvancedEmbedType } = require("utilscord");

global.client = client;
client.commands = (global.commands = []);

const { readdirSync } = require("fs")
const config = require("./config.json");
readdirSync('./komutlar').forEach(f => {
    if (!f.endsWith(".js")) return;

    const props = require(`./komutlar/${f}`);

    client.commands.push({
        name: props.name.toLowerCase(),
        description: props.description,
        options: props.options,
        dm_permission: props.dm_permission,
        type: 1
    });

    console.log(`${props.name} Başarıyla yüklendi`)

});
readdirSync('./eventler').forEach(e => {

    const eve = require(`./eventler/${e}`);
    const name = e.split(".")[0];

    client.on(name, (...args) => {
        eve(client, ...args)
    });
});

const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention } = require("discord.js");
const interactionCreate = require("./eventler/interactionCreate");

client.login(config.bot.token);

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.lenght < 3) return;
    db.add(`mesajlar_${message.author.id}`, 1);
    if (db.has(`teslim_${message.author.id}`)) return;
    if (db.has(`gonderildi_${message.author.id}`)) return;
    const mesajlar = db.get(`mesajlar_${message.author.id}`)
    if (mesajlar > config.settings.mesaj_sayisi || mesajlar === config.settings.mesaj_sayisi) {
        const embed = new EmbedBuilder()
            .setColor("Green")
            .setAuthor({ name: `${message.author.username} tebrikler ödül kazandın 🎉`, iconURL: message.author.displayAvatarURL() })
            .setDescription(`Sunucuda **${config.settings.mesaj_sayisi}** mesaj attığın için **${config.settings.kazandiği_odul}** kazandın.`)
            .setFooter({ text: "Coded by Speste & Slenzy", iconURL: client.user.displayAvatarURL() })
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Butona basarak ödülünüzü alabilirsiniz.")
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${config.settings.discord_sunucusu}`)
            )
        message.author.send({ embeds: [embed], components: [button] }).catch((err) => {
            console.log("Kullanıcıya dm atılamadı.");
        });
        const logEmbed = new EmbedBuilder()
            .setColor("Green")
            .setAuthor({ name: `${message.author.username} ödül kazandı.`, iconURL: message.guild.iconURL() })
            .setDescription(`**${message.author.username}** adlı kullanıcı bir adet **${config.settings.kazandiği_odul}** ödülünden kazandı aşağıda kullanıcı detaylı bilgileri verilmiştir.`)
            .addFields([
                { name: "👤 Kullanıcı", value: `${message.author.username} (${userMention(message.author.id)})`, inline: true },
                { name: "👤 Kullanıcı ID", value: `${message.author.id}`, inline: true },
                { name: "\n", value: "\n", inline: true },
                { name: "🤖 Kullanıcı bot mu?", value: `${message.author.bot ? 'Evet' : 'Hayır'}`, inline: true }
            ])
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter({ text: "Coded by Speste & Slenzy", iconURL: client.user.displayAvatarURL() })
        const teslimbtn = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Teslim Edildi")
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`teslimedildi`)
            )
        client.channels.cache.get(config.settings.odul_log).send({ embeds: [logEmbed], components: [teslimbtn] });
        db.set(`gonderildi_${message.author.id}`, true);
        const userdm = client.users.cache.get(message.author.id);
        const user = {
            userId: message.author.id,
            userName: message.author.username,
            userMention: userMention(message.author.id),
            globalName: message.author.globalName,
            avatarUrl: message.author.displayAvatarURL(),
            dm: userdm
        }
        client.on("interactionCreate", async (interaction) => {
            if (interaction.customId === "teslimedildi") {
                if (!interaction.member.roles.cache.has(config.settings.yetkili_rol_id)) return interaction.reply({ content: "Yetkin yetersiz.", ephemeral: true });
                if (db.has(`teslim_${user.userId}`)) return interaction.reply({ content: "Bu kullanıcı daha önceden ödülünü almış", ephemeral: true });
                const teslimEmbed = new AdvancedEmbed()
                    .setInteraction(interaction)
                    .setDescription(`${user.userMention} adlı kullanıcıya başarıyla **${config.settings.kazandiği_odul}** adlı ödül teslim edildi 🥳`)
                    .addFields([
                        { name: "👤 Kullanıcı", value: `${user.userName} (${user.userMention})`, inline: true },
                        { name: "👤 Kullanıcı ID", value: `${user.userId}`, inline: true },
                        { name: "👤 Ödülünü Veren Yetkili", value: `${interaction.user.username} (${userMention(interaction.user.id)})`, inline: true },
                        { name: "👤 Ödülünü Veren Yetkili ID", value: `${interaction.user.id}`, inline: true },
                    ])
                    .setImage(user.avatarUrl)
                    .setStyle(AdvancedEmbedType.Success)
                    .setFooter({ text: "Coded by Speste & Slenzy", iconURL: client.user.displayAvatarURL() })
                const teslimbtn = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel("Teslim Edildi")
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(`teslimedildi`)
                            .setDisabled(true)
                    )

                interaction.update({ embeds: [teslimEmbed], components: [teslimbtn] });
                db.delete(`mesajlar_${user.userId}`);
                db.delete(`gonderildi_${user.userId}`);
                db.set(`teslim_${user.userId}`, true);
                const dmEmbed = new AdvancedEmbed()
                    .setInteraction(interaction)
                    .setFooter({ text: "Coded by Speste & Slenzy", iconURL: client.user.displayAvatarURL() })
                    .setDescription(`${user.userMention} sana bir müjdeyle geldim dostum.\n\n**${config.settings.kazandiği_odul}** adlı ödülün teslim edildi.`)
                    .setStyle(AdvancedEmbedType.Success)
                user.dm.send({ embeds: [dmEmbed] }).catch((err) => {
                    interaction.reply({ content: "Bir hata ile karşılaştım", ephemeral: true });
                });
            };
        });
    };
});
/*
client.on("interactionCreate", async (interaction) => {
    if (interaction.customId === "teslimedildi") {
        const teslimEmbed = new AdvancedEmbed()
            .setInteraction(interaction)
            .setStyle(AdvancedEmbedType.Success)
        interaction.reply({ embeds: [teslimEmbed] })
    };
});
*/
client.on("messageDelete", async (message) => {
    try {
        if (message.author.bot) return;
        if (db.get(`mesajlar_${message.author.id}`) === 0 || db.get(`mesajlar_${message.author.id}`) < 0) return;
        db.math(`mesajlar_${message.author.id}`, "-", 1);
    } catch (err) {

    }
})
