const { EmbedBuilder, SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { employmentRoles, categoryIdEmploye } = require('../config.json'); 
const API = require('../core/api/apiCalls');
const api = new API();
module.exports = {
    data: new SlashCommandBuilder()
        .setName('empleado')
        .setDescription('Crea un empleado o elimina uno existente.')
        .addSubcommand(subcommand =>
            subcommand
              .setName('agregar')
              .setDescription('Agrega un nuevo empleado')        
              .addUserOption(option => option
                .setName('user')
                .setDescription('El usuario a agregar a la lista de empleados.'))
              .addStringOption(option => option.setName('bank').setDescription('Cuenta bancaría para realizar los pagos.')),
          )
        .addSubcommand(subcommand =>
            subcommand
                .setName('eliminar')
                .setDescription('Borrara el empleado')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('El usuario a eliminar de la lista de empleados.')),
            )
        .addSubcommand(subcommand =>
            subcommand
                .setName('actualizar')
                .setDescription('Este comando permitira agregar el nivel de tuneos')
                .addUserOption(option => option
                    .setName('user')
                    .setDescription('El usuario a actualizar de la lista de empleados.')),
            ),
    async execute(interaction) {
        const type = interaction.options.getSubcommand();
        const { guild } = interaction;
    	try {
    		if (type === "agregar") {

                let [target, banco, channelName] = [ 
                    interaction.options.getUser('user') || null, 
                    interaction.options.getString('bank') || 'PS-Undefined', 
                    ""
                ];

                const roles = employmentRoles;

                const targetMember = interaction.guild.members.cache.find(member => member.id === target.id);
                
                channelName = `Employment-${targetMember.nickname}`;

                const employeChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: categoryIdEmploye,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        ...roles.map(roleId => ({
                            id: roleId,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        })),
                        {
                            id: targetMember.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        }
                    ]
                });

                await api.submitData('workers', {
                    data: {
                      Nombre: targetMember.nickname,
                      bank: banco,
                      active: true,
                    }
                });

                // Aviso al usuario de que se ha abierto el ticket
                const employeConfirmationMessage = new EmbedBuilder()
                .setTitle('¡Bienvenido a tu area personal!')
                .setDescription(`¡Bienvenido a Skoros't Motors! Nos complace darle la bienvenida a nuestro equipo y estamos emocionados de tenerlo a bordo. Esperamos trabajar juntos y lograr grandes cosas en los próximos días. Esta será su area personal donde podrá contactar con nosotros y se le comunicara los ingresos a su cuenta bancaría con las ventas realizadas.`)
                .setColor('#00ff00');
                
                await employeChannel.send({ embeds: [employeConfirmationMessage] });

                return interaction.reply({
                    content: `Se ha creado el area personal del empleado ${targetMember.nickname} podrá visitarla en #${channelName}`,
                    ephemeral: true
                });
    		} else if (type === "eliminar") {
    			// Code to delete an existing employee 
    		} else if (type === "actualizar") {
    			// Code to update an existing employee 
    		}
    	} catch (err) {
    		console.error(err);
    	}
    }

}