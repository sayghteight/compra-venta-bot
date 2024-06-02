const { EmbedBuilder, ChannelType, SlashCommandBuilder, ButtonStyle, PermissionsBitField, ButtonBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { tickets, employment } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket Tool'),

    async execute(interaction) {
        const ticketMessage = new EmbedBuilder()
            .setTitle('Bienvenido a nuestro sistema de tickets')
            .setDescription('Por favor, seleccione una opción del menú desplegable a continuación.')
            .setColor('#00bfff')
            .addFields(
                { name: 'Opciones disponibles', value: '1️⃣ Convenios \n2️⃣ Eventos' }
            );

        const optionList = [
            { 
                label: "Convenios", 
                description: "¿Propone un convenio con nosotros? Contáctenos.", 
                value: "convenios" 
            },
            { 
                label: "Eventos", 
                description: "¿Planea un evento? Obtenga asistencia aquí.", 
                value: "events" 
            },
        ];

        const dropdownMenu = new StringSelectMenuBuilder()
            .setCustomId('menu')
            .setPlaceholder('Seleccione una opción...')
            .addOptions(optionList);

        const row = new ActionRowBuilder()
            .addComponents(dropdownMenu);

        await interaction.reply({ embeds: [ticketMessage], components: [row] });

        const filter = i => i.customId === 'menu' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            try {
                const selectedOption = optionList.find(opt => opt.value === i.values[0]);
                const channelName = generateChannelName(selectedOption.value, i.member.displayName);
                const newChannel = await createTicketChannel(i.guild, channelName, i.user.id);
                await sendConfirmationMessage(newChannel);
                await addButtons(newChannel);
                await i.message.delete();
                collector.stop();
            } catch (error) {
                console.error(error);
                await i.reply({ content: 'Hubo un error al crear el ticket.', ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.deleteReply();
            }
        });
    },

    handleCloseTicket
};

function generateChannelName(option, displayName) {
    const baseNames = {
        convenios: 'Convenio',
        events: 'Eventos'
    };

    const baseName = baseNames[option.toLowerCase()] || 'Canal';

    return `${baseName}-${displayName}`.replace(/[^a-zA-Z0-9-]/g, '-');
}

async function createTicketChannel(guild, channelName, userId) {
    const supportRoleIds = employment.roles.split(',').map(role => role.trim());
    return guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: tickets.category,
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
                id: userId,
                allow: [PermissionsBitField.Flags.ViewChannel],
            }
        ]
    });
}

async function sendConfirmationMessage(channel) {
    const userConfirmationMessage = new EmbedBuilder()
        .setTitle('Su ticket ha sido abierto')
        .setDescription('Gracias por contactarnos. Pronto una persona de Public Relations le responderá a su pregunta.')
        .setColor('#00ff00');
    await channel.send({ embeds: [userConfirmationMessage] });
}

async function addButtons(channel) {
    const btnRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('closeTicketBtn')
                .setLabel('Cerrar Ticket')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('transcriptTicketBtn')
                .setLabel('Guardar Transcript')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
        );
    await channel.send({ components: [btnRow] });

    const buttonFilter = i => i.customId === 'closeTicketBtn' || i.customId === 'transcriptTicketBtn';
    const buttonCollector = channel.createMessageComponentCollector({ filter: buttonFilter, time: 86400000 });

    buttonCollector.on('collect', async i => {
        if (i.customId === 'closeTicketBtn') {
            await handleCloseTicket(i);
        } else if (i.customId === 'transcriptTicketBtn') {
            await handleTranscriptTicket(i);
        }
    });
}

async function handleCloseTicket(interaction) {
    try {
        const channel = interaction.channel;
        if (!channel) {
            throw new Error('El canal ya ha sido eliminado.');
        }

        const { guild, channel: ticketChannel } = interaction;
        const logChannel = guild.channels.cache.find(ch => ch.name === 'interaction-logs');

        const logMessage = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Se ha ejecutado un comando | Cerrar Ticket')
            .setThumbnail('https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png')
            .addFields(
                { name: 'ID Channel:', value: ticketChannel.id, inline: true },
                { name: 'Channel Name:', value: ticketChannel.name, inline: true }
            );

        if (logChannel) {
            await logChannel.send({ embeds: [logMessage] });
        } else {
            console.error(`Log channel not found.`);
        }

        await ticketChannel.delete();
        console.log(`El canal ${ticketChannel.name} ha sido eliminado correctamente.`);
    } catch (error) {
        console.error('Error al eliminar el ticket:', error);
    }
}

async function handleTranscriptTicket(interaction) {
    try {
        const transcript = await fetchTranscript(interaction.channel);
        const transcriptFilePath = saveTranscriptToFile(interaction.channel.name, transcript);
        await interaction.reply({ content: `Transcript guardado: ${transcriptFilePath}`, ephemeral: true });
    } catch (error) {
        console.error(`Error al guardar el transcript del canal ${interaction.channel.name}:`, error);
        await interaction.reply({ content: 'Hubo un error al guardar el transcript.', ephemeral: true });
    }
}

async function fetchTranscript(channel) {
    const messages = [];
    let lastMessageId;
    while (true) {
        const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
        if (fetchedMessages.size === 0) break;
        messages.push(...fetchedMessages.values());
        lastMessageId = fetchedMessages.last().id;
    }

    return messages.reverse().map(msg => formatMessage(msg)).join('\n');
}

function formatMessage(msg) {
    let content = '';
    
    if (msg.content) {
        content += `${msg.author.tag}: ${msg.content}\n`;
    }
    
    if (msg.embeds.length > 0) {
        content += `[Embed: ${msg.embeds[0].title}]\n`;
    }
    
    if (msg.attachments.size > 0) {
        content += `[Attachment: ${msg.attachments.first().url}]\n`;
    }
    
    return content.trim();
}

function saveTranscriptToFile(channelName, transcript) {
    const transcriptDir = path.resolve(__dirname, '../transcripts');
    if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
    }
    const filePath = path.join(transcriptDir, `${channelName}.txt`);
    fs.writeFileSync(filePath, transcript);
    return filePath;
}
