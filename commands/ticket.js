const { EmbedBuilder, ChannelType, SlashCommandBuilder, ButtonStyle, PermissionsBitField, ButtonBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const API = require('../core/api/apiCalls');
const api = new API();


module.exports = {
    data: new SlashCommandBuilder()
            .setName('ticket')
            .setDescription('Ticket Tool'),

    async execute(interaction) {
        // Crear un mensaje de bienvenida
        const ticketMessage = new EmbedBuilder()
            .setTitle('Bienvenido a nuestro sistema de tickets')
            .setDescription('Por favor, seleccione una opción del menú desplegable a continuación.')
            .setColor('#00bfff')
            .addFields(
                { name: 'Opciones disponibles', value: '1️⃣ Soporte de ventas \n2️⃣ Trabajar con vosotros \n3️⃣ Ayuda financiera \n4️⃣. Otras preguntas' }
            );        
        // Crear una lista de opciones para el menú desplegable
        const optionList = [
            {label: "Soporte de ventas", description: "¿Necesita ayuda? Utilice esta opción para contactar con nuestro soporte de compras y ventas.", value: "sales_support"},
            {label: "Trabajar con vosotros", description: "Únete a nuestro equipo, contribuye con tu talento en un entorno dinámico y colaborativo.", value: "recruitment"},
            {label: "Ayuda financiera", description: "¿No puedes costearte el vehiculo? En Skorost Motors podemos ayudarte.", value: "finacial_help"},
            {label: "Otras preguntas", description: "Cualquier otra pregunta que tenga, por favor utilice este campo.", value: "other_questions"}
        ];
        
        // Crear el menú desplegable
        const dropdownMenu = new StringSelectMenuBuilder()
            .setCustomId('menu')
            .setPlaceholder('Seleccione una opción...')
            .addOptions(optionList);

        // Encapsule el menú desplegable dentro de un objeto de fila de acción para mostrarlo en el mensaje
        const row = new ActionRowBuilder()
            .addComponents(dropdownMenu);
                
        // Enviar el mensaje de bienvenida y el menú desplegable
        await interaction.reply({ embeds: [ticketMessage], components: [row] });

        // Esperar hasta que el usuario seleccione una opción del menú desplegable
        const collectorFilter = (interaction) => {
            return interaction.customId === 'menu' && interaction.user.id === interaction.user.id;
        };

        const collector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter, time: 60000 }); 

        collector.on('end', collected => {
            if (collected.size === 0) {
                // calcular opciones elegidas
                interaction.deleteReply();
            } else {
                console.log(`Se han recolectado ${collected.size} interacciones.`);
            }
        });

        collector.on('collect', async (interaction) => {
            try {
                const selectedOption = optionList.find(opt => opt.value === interaction.values[0]); // Encontrar la opción seleccionada por el usuario
                            
                const categoryId = '1084465309743841302'; // ID de la categoría donde se crearán los canales de soporte
                const supportRoleIds = ['1084465309194408033', '1084465309194408030']; // IDs de los roles que tendrán permiso para acceder a los canales
                
                const { guild } = interaction;                
                let channelName = 'Ticket-undefined'
                const supportCategory = guild.channels.cache.get(categoryId);
                
                if (selectedOption.value == 'sales_support') 
                {
                    channelName = `Sales-${interaction.member.displayName}`.replace(/[^\w-]/g, '-');
                } 
                else if (selectedOption.value == 'recruitment')
                {
                    channelName = `Recruitment-${interaction.member.displayName}`.replace(/[^\w-]/g, '-');
                } else if (selectedOption.value == 'finacial_help')
                {
                    channelName = `Finacial-${interaction.member.displayName}`.replace(/[^\w-]/g, '-');
                
                } else {
                    channelName = `Other-${interaction.member.displayName}`.replace(/[^\w-]/g, '-');
                }

                const newChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: supportCategory.id,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        ...supportRoleIds.map(roleId => ({
                            id: roleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        })),
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        }
                    ]
                });
                
                // Crear una fila(action row) con botones
                const btnRow = new ActionRowBuilder()
                .addComponents(
                new ButtonBuilder()
                    .setCustomId('closeTicketBtn')
                    .setLabel('Cerrar Ticket')
					.setStyle(ButtonStyle.Primary),
                );


                // Aviso al usuario de que se ha abierto el ticket
                const userConfirmationMessage = new EmbedBuilder()
                .setTitle('Su ticket ha sido abierto')
                .setDescription(`Gracias por contactarnos. Uno de nuestros Directivos o Vendedores se pondrá en contacto pronto para atenderlo.`)
                .setColor('#00ff00');

                await newChannel.send({ embeds: [userConfirmationMessage], components: [btnRow] });

                if (interaction.customId === 'closeTicketBtn') {
                    newChannel.delete().then(() => {
                        console.log(`Canal ${newChannel.name} eliminado después de que el usuario lo cerró`);
                    }).catch((error) => {
                        console.error(`Error al eliminar el canal ${newChannel.name}:`, error);
                    });
                }

                await interaction.message.delete();
                collector.stop();

            } catch (error) {
                console.error(error);
            }
        });     
    }
}

