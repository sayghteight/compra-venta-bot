const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('financiar')
        .setDescription('Calcula el valor de financiamiento mensual')
        .addIntegerOption(option => 
            option.setName('monto')
                .setDescription('Monto a financiar')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('plazo')
                .setDescription('La cantidad de meses de financiamiento')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('interes')
                .setDescription('Tasa de interés anual en %')
                .setRequired(true)),
    async execute(interaction) {
        
        const monto = interaction.options.getInteger('monto');
        const plazo = interaction.options.getInteger('plazo');
        const interes = interaction.options.getNumber('interes') / 1200;

        const cuota = monto * ((interes * Math.pow((1 + interes), plazo)) / (Math.pow((1 + interes), plazo) - 1));

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Cálculo de financiamiento')
            .addFields(
                { name: 'Monto', value: `$${monto.toLocaleString()}` },
                { name: 'Plazo', value: `${plazo} meses` },
                { name: 'Interés anual', value: `${(interes*100).toFixed(2)}%` },
                { name: 'Cuota Mensual', value: `$${cuota.toFixed(2)}` }
            );

        return interaction.reply({ embeds: [embed] });
    },
};
