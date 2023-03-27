const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const API = require('../core/api/apiCalls');
const api = new API();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('catalogo')
        .setDescription('Envia el catalogo actual en un embed'),
    async execute(interaction) {
        const channel = interaction.channel;
        const memberRoles = interaction.member.roles;
        const hasRequiredRole =
          memberRoles.cache.has('1084465309194408030') || // ROLE_SELLER_ID
          memberRoles.cache.has('1084465309194408033'); // ROLE_DIRECTIVA_ID
    
        if (!hasRequiredRole) {
          await interaction.reply('Lo siento, no tienes permisos suficientes');
          return;
        }

        if (channel.id != '1084465309559300171') {
          await interaction.reply('Lo siento, este comando debe ser ejecutado solo en el canal de Catalogos.');
          return;
        }

        // Obtenemos una colección con todos los mensajes del canal
        const messages = await channel.messages.fetch();

        // Utilizamos bulkDelete para borrar los mensajes del canal
        await channel.bulkDelete(messages);
    
        try {
          const cars = await api.getData('catalogos');


          if (cars.length === 0) {
            await interaction.reply('No se encontraron coches en el catálogo.');
            return;
          }

          // Crear el primer mensaje embed e incluir los detalles del primer coche
          // La info de los siguientes coches se enviará en mensajes adicionales
          
          const firstCarDetails = cars[0].attributes;
          
          let car = {
            engine: firstCarDetails.engine === 0 ? 'De fabrica' : `Mejorado a ${firstCarDetails.engine.toString()}`,
            brake: firstCarDetails.brake === 0 ? 'De fabrica' : `Mejorado a ${firstCarDetails.brake.toString()}`,
            transmission: firstCarDetails.transmission === 0 ? 'De fabrica' : `Mejorado a ${firstCarDetails.transmission.toString()}`
          };

          const firstEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${firstCarDetails.name} | Color ${firstCarDetails.color} `)
            .setImage(`https://files.lu-rp.ovh/v/vehiculos/${firstCarDetails.model}.png`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png')
            .addFields(
                { name: 'Bastidor', value: firstCarDetails.llave, inline: true },
                { name: 'KM', value: firstCarDetails.KM, inline: true },
                { name: 'Precio de Compra final', value: `${parseFloat(firstCarDetails.buyPrice).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}`, inline: true },
                
                { name: 'Motor', value: car.engine, inline: true },
                { name: 'Frenos', value: car.brake, inline: true },
                { name: 'Transmissión', value: car.transmission, inline: true },
            );
          
          // Enviar el primer mensaje con la info del primer coche
          await interaction.reply({ embeds: [firstEmbed] });
                
          // Si hay más de 1 coche en el catálogo, enviar un embed por cada uno después del primero
          if (cars.length > 1) {
            for (let i = 1; i < cars.length; i++) {
              const carDetails = cars[i].attributes;

              let car2 = {
                engine: carDetails.engine === 0 ? 'De fabrica' : `Mejorado a ${carDetails.engine.toString()}`,
                brake: carDetails.brake === 0 ? 'De fabrica' : `Mejorado a ${carDetails.brake.toString()}`,
                transmission: carDetails.transmission === 0 ? 'De fabrica' : `Mejorado a ${carDetails.transmission.toString()}`
              };
  
              const carEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${carDetails.name} | Color ${carDetails.color} `)
                .setImage(`https://files.lu-rp.ovh/v/vehiculos/${carDetails.model}.png`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png')
                .addFields(
                    { name: 'Bastidor', value: carDetails.llave, inline: true },
                    { name: 'KM', value: carDetails.KM, inline: true },
                    { name: 'Precio de Compra final', value: `${parseFloat(carDetails.buyPrice).toLocaleString('en-US', {style: 'currency', currency: 'USD'})}`, inline: true },
                    { name: 'Motor', value: car2.engine, inline: true },
                    { name: 'Frenos', value: car2.brake, inline: true },
                    { name: 'Transmissión', value: car2.transmission, inline: true },
                );
              await interaction.followUp({ embeds: [carEmbed] });
            }
        }
        } catch (error) {
          console.log(error);
          await interaction.reply('Hubo un error al obtener el catálogo. Por favor, inténtalo de nuevo más tarde.');
        }
      }
};