const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculadora')
        .setDescription('Calculadora de precios de compra y venta.')
        .addNumberOption(option => option.setName('precio_inicial').setDescription('Precio Inicial').setRequired(true))
        .addNumberOption(option => option.setName('porcentaje_compra').setDescription('Porcentaje de Compra').setRequired(true))
        .addNumberOption(option => option.setName('porcentaje_venta').setDescription('Porcentaje de Venta').setRequired(true)),
    async execute(interaction) {
        const precioInicial = interaction.options.getNumber('precio_inicial');
        const porcentajeCompra = interaction.options.getNumber('porcentaje_compra');
        const porcentajeVenta = interaction.options.getNumber('porcentaje_venta');

        const precioCompra = precioInicial * porcentajeCompra;
        const precioVenta = precioInicial * porcentajeVenta;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Calculadora de Precios')
            .addFields(
                { name: 'Precio de compra', value: `${precioCompra}` },
                { name: 'Precio de venta', value: `${precioVenta}` },
            );

        await interaction.reply({ embeds: [embed] });
    },

    getFloat(value) {
        if (isNaN(parseFloat(value))) {
          return null;
        }
        return parseFloat(value);
    }
};

