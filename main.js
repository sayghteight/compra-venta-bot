const fs = require('fs');
const path = require('node:path');
const { handleCloseTicket } = require('./commands/ticket.js');
const { Client, Collection, Events, EmbedBuilder, GatewayIntentBits } = require('discord.js');
const { token, channelId, roleId, welcomeChannelId } = require('./config.json');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

const loadCommands = () => {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
};

const createWelcomeMessage = async () => {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        console.error(`No se encontró ningún canal con el ID ${channelId}.`);
        return;
    }

    const welcomeMessage = new EmbedBuilder()
        .setTitle('Bienvenido a nuestro sistema de tickets')
        .setDescription('Por favor, escribe /ticket para ver las opciones disponibles.')
        .setColor('#00bfff');

    try {
        const messages = await channel.messages.fetch();
        await channel.bulkDelete(messages);
        await channel.send({ embeds: [welcomeMessage] });
    } catch (error) {
        console.error(`No se pudieron borrar los mensajes del canal ${channelId}: ${error}`);
    }
};

const handleInteractionCreate = async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const response = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    }
};

const handleButtonInteraction = async interaction => {
    if (interaction.customId === 'closeTicketBtn') {
        await handleCloseTicket(interaction);
    } else {
        console.log(`Button interaction: ${interaction.customId}`);
    }
};

client.once('ready', async () => {
    console.log("Discord bot online");
    await createWelcomeMessage();
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        await handleInteractionCreate(interaction);
    } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
    }
});

client.on('guildMemberAdd', async member => {
    try {
        await member.roles.add(roleId);
    } catch (error) {
        console.error(`Error al asignar el rol: ${error}`);
    }

    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    if (welcomeChannel) {
        welcomeChannel.send(`**¡Bienvenido, ${member.user.tag}!** 🎉\nNos alegra tenerte aquí. Asegúrate de leer las reglas y disfrutar tu estadía.`);
    }
});

process.on('uncaughtException', err => {
    const date = new Date();
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
    const errorLog = `[${date}] Uncaught Exception: ${errorMsg}`;

    fs.writeFile('./crashlogs.txt', errorLog, err => {
        if (err) {
            console.error('Uncaught Exception: ', errorMsg);
            throw err;
        }
        process.exit(1); // Mandatory (as per the NodeJS docs)
    });
});

loadCommands();
client.login(token).catch(error => {
    console.error('Error logging in: ', error);
});
