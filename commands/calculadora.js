const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Utils = require('../core/lib/utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculadora')
        .setDescription('Calculadora de precios de compra y venta.')
        .addNumberOption(option => option.setName('precio_inicial').setDescription('Precio Inicial').setRequired(true)),
    async execute(interaction) {
        const precioInicial = interaction.options.getNumber('precio_inicial');
        if (typeof precioInicial !== 'number') return;

        const prices = Utils.getSellBuyPrices(precioInicial);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Calculadora de Precios')                
            .setThumbnail('https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png')
            .addFields(
                { name: 'Precio de compra', value: `${prices.sellPrice}` },
                { name: 'Precio de venta', value: `${prices.buyPrice}` },
            );

        await interaction.reply({ embeds: [embed] });
    }
};