const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const packageJSON = require('../package.json');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Información acerca del bot que se esta usando.'),
    async execute(interaction) {
        const uptime = process.uptime();
        const uptimeString = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(
            uptime % 60,
        )}s`;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Información del Bot')
            .setDescription('Información acerca del bot que se esta usando.')
            .addFields(
                { name: 'Version', value: `${packageJSON.version}` },
                { name: 'Uptime', value: `${uptimeString}` },
                { name: 'Users', value: `${interaction.client.users.cache.size}`, inline: true },
                { name: 'Desarrollado', value: `Darthar`, inline: true }
            )
            .setTimestamp()
            .setFooter('Skorost Motors');

        return interaction.reply({ embeds: [embed] });
    },
};