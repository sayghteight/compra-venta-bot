const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const API = require('../core/api/apiCalls');
const api = new API();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Comando para registrar una compra o venta de un coche.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('comprar')
        .setDescription('Comprar un coche')
        .addStringOption(option => option.setName('marca').setDescription('Marca del coche'))
        .addStringOption(option => option.setName('model').setDescription('El modelo del coche a comprar.'))
        .addNumberOption(option => option.setName('precio-compra').setDescription('Precio de compra del coche.'))
        .addNumberOption(option => option.setName('precio-venta').setDescription('Precio de venta del coche.'))
        .addStringOption(option => option.setName('bastidor').setDescription('Bastidor del coche.'))
        .addStringOption(option => option.setName('kilometer').setDescription('KM que tiene el coche.'))
        .addStringOption(option => option.setName('color').setDescription('Color.'))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('vender')
        .setDescription('Vender un coche')
        .addStringOption(option => option.setName('bastidor').setDescription('Bastidor del coche a vender.'))
        .addNumberOption(option => option.setName('precio-venta').setDescription('Precio de venta del coche'))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('tunning')
        .setDescription('Este comando permitira agregar el nivel de tuneos')
        .addStringOption(option => option.setName('bastidor').setDescription('Llave del coche'))
        .addNumberOption(option => option.setName('engine').setDescription('Nivel de tuneo en el motor ( 0 - 5)'))
        .addNumberOption(option => option.setName('brake').setDescription('Nivel de tuneo en los frenos ( 0 - 5)'))
        .addNumberOption(option => option.setName('transmission').setDescription('Nivel de tuneo en la transmision ( 0 - 5)'))
    ),

  // Maneja la compra o venta de un coche
  async execute(interaction) {
    const command = interaction.options.getSubcommand();
    const { guild } = interaction;    
    
    let [marca, model, buyPrice, sellPrice, llave, km, color, motor, frenos, transmision ] = [ 
      interaction.options.getString('marca') || null, 
      interaction.options.getString('model') || null, 
      interaction.options.getNumber('precio-compra') || null, 
      interaction.options.getNumber('precio-venta') || null, 
      interaction.options.getString('bastidor') || null, 
      interaction.options.getString('kilometer') || null, 
      interaction.options.getString('color') || null, 
      interaction.options.getNumber('engine') || 0, 
      interaction.options.getNumber('brake') || 0, 
      interaction.options.getNumber('transmission') || 0, 
    ];

    if (command === 'comprar') {
      // Busca si el coche existe en el inventario
      const cars = await api.getData('catalogos');
      const carToBuy = cars.find(c => c.model === model);

      if (carToBuy) {
          return interaction.reply({ content: `Lo siento, el modelo ${ model } ya está disponible para la venta.`, ephemeral: true });
      }

      try {
        const response = await api.submitData('catalogos', {
          data: {
            name: marca,
            llave: llave,
            model: model,
            KM: km,
            sellPrice: sellPrice.toString(),
            buyPrice: buyPrice.toString(),
            engine: 0,
            brake: 0,
            transmission: 0,
            color: color
          }
        });

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#0099ff')
              .setTitle(`¡${model} comprado!`)
              .setDescription(`Ha comprado un ${model} por ${buyPrice}`)
          ]
        });
      } catch (error) {
        console.log('Error submitting data to API: ', error.message);
      }
    } else if (command === 'vender') {
      // Buscamos si el coche está disponible para la venta en el inventario
      const cars = await api.getData('catalogos');
      const car = cars.find(c => c.attributes.llave.toLowerCase() === llave);
    	

      const vendedorChannel = guild.channels.cache.find(channel => channel.name === 'vendedor-logs');

      if (!car) {
        return interaction.reply({
          content: `Lo siento, no tienes un ${model} que puedas vender`,
          ephemeral: true
        });
      }

      // Elimina el coche del catálogo
      // await api.deleteData(`catalogos/${car.id}`);

      const response = await api.submitData('catalogos', {
        data: {
          name: marca,
          llave: llave,
          model: model,
          KM: km,
          sellPrice: sellPrice.toString(),
          buyPrice: buyPrice.toString(),
          engine: 0,
          brake: 0,
          transmission: 0,
          color: color
        }
      });

      const beneficio = sellPrice - car.attributes.buyPrice;

      const exampleEmbed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`Se ha vendido el siguiente coche`)
      .setAuthor({ name: 'Skorost Motors', iconURL: 'https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png' })
      .setDescription('¡Se ha realizado una nueva venta!')
      .setThumbnail('https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png')
      .addFields(
        {name: 'Modelo', value: car.attributes.model, inline: true},
        {name: 'Vendedor', value: interaction.member.nickname, inline: true},
        {name: '\u200B', value: '\u200B' },
        {name: 'Bastidor', value: car.attributes.llave, inline: true},
        {name: 'Precio de venta', value: sellPrice.toString(), inline: true},
        {name: '\u200B', value: '\u200B' },
        {name: 'Beneficio a pagar al vendedor', value: beneficio.toString()}
      )
      .setImage(`https://files.lu-rp.ovh/v/vehiculos/${car.attributes.model}.png`)
      .setFooter({ text: 'Skorost Motors', iconURL: 'https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png' });

      vendedorChannel.send({ embeds: [exampleEmbed] });


      return interaction.reply({
        content: `Se ha comunicado tu venta al apartado de Financias, en breves se revisará tu venta para abonarte la totalidad.`,
        ephemeral: true
      });
    } else if (command === 'tunning') {
      // Buscamos si el coche está disponible para la venta en el inventario
      const cars = await api.getData('catalogos');
      const car = cars.find(c => c.attributes.llave.toLowerCase() === llave);
    	
      if (!car) {
        return interaction.reply({
          content: `Lo siento, no tienes un ${modelo} que puedas vender`,
          ephemeral: true
        });
      }

      const engine2 = motor;
      const brake2 = frenos;
      const transmision2 = transmision;
      
      // Elimina el coche del catálogo
      await api.updateData(`catalogos/${car.id}`, {
        data: {
            engine: engine2,
            brake: brake2,
            transmission: transmision2
        }
      });

      return interaction.reply({
        content: `Se ha realizado modificaciones a las opciones de tuneo del modeo ${car.attributes.model}, recuerda usar /catalogo.`,
        ephemeral: true
      });
    }
  }
};