const fs = require('fs');
const { Client, Collection, Events, EmbedBuilder, GatewayIntentBits  } = require('discord.js');
const { token } = require('./config.json');
const path = require('node:path');
const channelId = '1084465309559300173'; // ID del canal donde se creará el panel
const aufg = require('auto-update-from-github');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.login(token);

client.once('ready', () => {
  console.log("Discord bot online")
  const channel = client.channels.cache.get(channelId);
  if (!channel) return console.error(`No se encontró ningún canal con el ID ${channelId}.`);

  // Crear un mensaje de bienvenida
  const welcomeMessage = new EmbedBuilder()
  .setTitle('Bienvenido a nuestro sistema de tickets')
  .setDescription('Por favor, escribe /ticket para ver las opciones disponibles.')
  .setColor('#00bfff');

  channel.messages.fetch().then((messages) => {
    channel.bulkDelete(messages);
    channel.send({ embeds: [welcomeMessage] });
  }).catch((error) => {
    console.error(`No se pudieron borrar los mensajes del canal ${channelId}: ${error}`);
  });
});

// Detect Button Presses and Event Interactions
client.on(Events.InteractionCreate, async interaction => {
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
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on('guildMemberAdd', (member) => {
  console.log(`guildMemberAdd: ${member}`);
});

client.on('interactionCreate', async interaction => {
	const { guild } = interaction;    

	const logChannel = guild.channels.cache.find(channel => channel.name === 'interaction-logs');
  const commandName = interaction.commandName;

	if (!interaction.isButton()) return; // Ignore anything that isn't a button press
  
	if (interaction.customId === 'closeTicketBtn') {
		const channelToDelete = interaction.channel;
		channelToDelete.delete()
		.then(() => {
			console.log(`Canal ${channelToDelete.name} eliminado después de que el usuario lo cerró`);      
      const logMessage = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Se ha ejecutado un comando | Cerrar Ticket `)
      .setThumbnail('https://cdn.discordapp.com/attachments/1062088210462806026/1084220929120411780/Vintage_and_Classic_Car_Community_Club_Logo.png')
      .addFields(
          { name: 'ID Channel: ', value: channelToDelete.id, inline: true },
          { name: 'Channel Name: ', value: channelToDelete.name, inline: true },
      );
      
      logChannel.send({ embeds: [logMessage] });
		})
		.catch(error => {
			console.error(`Error al eliminar el canal ${channelToDelete.name}:`, error);
			logChannel.send(`Ha ocurrido un error al intentar eliminar el canal \`${channelToDelete.name}\`.`);
		});
	}
});

// Register crash bot
process.on('uncaughtException', (err) => {
	const date = new Date();
	const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
	const errorLog = `[${date}] Uncaught Exception: ${errorMsg}`;
  
	fs.writeFile("./crashlogs.txt", errorLog, err => {  
	  if(err) {
		console.error("Uncaught Exception: ", errorMsg);
		throw err;
	  }
	  process.exit(1); // Mandatory (as per the NodeJS docs)
	});
  });