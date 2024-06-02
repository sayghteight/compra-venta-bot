const { EmbedBuilder, SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { employment } = require('../config.json'); 
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
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('El usuario a agregar a la lista de empleados.')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const { guild } = interaction;

        try {
            if (subcommand === 'agregar') {
                await addEmployee(interaction, guild);
            }
        } catch (err) {
            console.error(err);
            return interaction.reply({ content: 'Ocurrió un error al ejecutar el comando.', ephemeral: true });
        }
    }
};

async function addEmployee(interaction, guild) {
    const targetUser = interaction.options.getUser('user');
    if (!targetUser) {
        return interaction.reply({ content: 'No se ha especificado un usuario válido.', ephemeral: true });
    }

    const targetMember = guild.members.cache.get(targetUser.id);
    if (!targetMember) {
        return interaction.reply({ content: 'No se ha encontrado el usuario en el servidor.', ephemeral: true });
    }

    const channelName = `RSS-${targetMember.nickname || targetMember.user.username}`;
    const roles = employment.roles.split(',').map(role => role.trim());

    const employeeChannel = await createEmployeeChannel(guild, channelName, roles, targetMember);

    const employeeConfirmationMessage = createEmployeeConfirmationMessage();

    await employeeChannel.send({ embeds: [employeeConfirmationMessage] });

    await assignRolesToUser(targetMember, roles);
    
    return interaction.reply({
        content: `Se ha creado el área personal del empleado ${targetMember.nickname || targetMember.user.username}. Podrá visitarla en #${channelName}`,
        ephemeral: true
    });
}

async function createEmployeeChannel(guild, channelName, roles, targetMember) {
    return guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: employment.category,
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
                id: targetMember.id,
                allow: [PermissionsBitField.Flags.ViewChannel],
            }
        ]
    });
}

function createEmployeeConfirmationMessage() {
    return new EmbedBuilder()
        .setTitle('¡Bienvenido a tu área personal!')
        .setDescription(`¡Bienvenido a Public Relations! Nos complace darle la bienvenida a nuestro equipo y estamos emocionados de tenerlo a bordo. Esperamos trabajar juntos y lograr grandes cosas en los próximos días. Esta será tu área personal, donde podrás contactar con el supervisor de la división y proponerle ideas para realizar.`)
        .setColor('#00ff00');
}

async function assignRolesToUser(member, roles) {
    for (const roleId of roles) {
        const role = await member.guild.roles.fetch(roleId);
        if (role) {
            await member.roles.add(role);
        }
    }
}