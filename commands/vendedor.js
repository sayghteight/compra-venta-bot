const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const API = require('../core/api/apiCalls');
const api = new API();
const [sellT1,sellT2,sellT3,buyT1,buyT2,buyT3] = [0.7,0.7,0.75,0.85,0.85,0.85];


module.exports = {
    data: new SlashCommandBuilder()
    .setName('coche')
    .setDescription('Comando para comprar o vender coches')
    .addSubcommand(subcommand =>
      subcommand
        .setName('comprar')
        .setDescription('Comprar un coche')
        .addStringOption(option => option.setName('model').setDescription('El modelo del coche a comprar.'))
        .addNumberOption(option => option.setName('precio-compra').setDescription('Precio de compra del coche.'))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('vender')
        .setDescription('Vender un coche')
        .addStringOption(option => option.setName('model').setDescription('El modelo del coche a vender'))
        .addNumberOption(option => option.setName('precio-venta').setDescription('Precio de venta del coche'))
    ),

  // Maneja la compra o venta de un coche
  async execute(interaction) {
    const command = interaction.options.getSubcommand();
    const modelo = interaction.options.getString('model').toLowerCase();
    const buyPrice = interaction.options.getNumber('precio-compra');

    if (command === 'comprar') {
        // Busca si el coche existe en el inventario
        const cars = await api.getData('catalogos');
        const carToBuy = cars.find(c => c.attributes.model.toLowerCase() === modelo);

        if (carToBuy) {
            return interaction.reply({ content: `Lo siento, el modelo ${modelo} ya está disponible para la venta.`, ephemeral: true });
        }

        if(Cost < data.lowPrice)
        {
            CostBuy = Cost * buyT1;
        } else if (Cost >= data.lowPrice && Cost < data.highPrice){
            CostBuy = Cost * buyT2;
        } else if (Cost >= data.highPrice) {
            CostBuy = Cost * buyT3;
        } 

        await api.submitData('catalogos', {
            data: {
            type: 'coches',
            attributes: {
                model: carToBuy.attributes.model,
                sellPrice: sellPrice.toString(),
                buyPrice: buyPrice.toString()
            }
            }
        });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`¡${modelo} comprado!`)
            .setDescription(`Ha comprado un ${modelo} por ${car.attributes.sellPrice}`)
        ]
      });
    } else if (command === 'vender') {
      // Buscamos si el coche está disponible para la venta en el inventario
      const cars = await api.getData('catalogos');
      const car = cars.find(c => c.attributes.model.toLowerCase() === modelo);

      if (!car) {
        return interaction.reply({
          content: `Lo siento, no tienes un ${modelo} que puedas vender`,
          ephemeral: true
        });
      }

      // Elimina el coche del catálogo
      await api.deleteData(`catalogos/${car.id}`);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`¡${modelo} vendido!`)
            .setDescription(`Has vendido tu ${modelo}`)
        ]
      });
    }
  }
};