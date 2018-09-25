const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const client = new Discord.Client();
var quitVoiceTimeout;
var playlist = [];

function playInternetFile(connection, message) {
  const address = message.content.slice(6);
  let dispatcher;

  if (address.includes('youtu.be') || address.includes('youtube.com')) {
    const stream = ytdl(address, { filter: 'audioonly' });
    dispatcher = connection.playStream(stream, { seek: 0, volume: 1 });
  } else {
    dispatcher = connection.playArbitraryInput(address);
  }

  dispatcher.on('error', e => {
    // Catch any errors that may arise
    console.log(e);
    if (playlist.length > 0) {
      message.channel.send('Couldn\'t play the specified audio file, moving on to the next item on the playlist.');
    } else {
      message.channel.send('Couldn\'t play the specified audio file.');
    }
  });

  dispatcher.on('end', () => {
    if (dispatcher.time === 0 && playlist.length > 1) {
      message.channel.send('The URL of this request was not valid. Moving on to the next item on the playlist.');
    } else if (dispatcher.time === 0) {
      message.channel.send('The URL of this request was not valid.');
    }

    if (playlist.length !== 0) {
      playlist.shift();
    }

    if (playlist.length === 0) {
      message.channel.send('The playlist has ended.');
      quitVoiceTimeout = client.setTimeout(() => { 
        connection.disconnect();
      }, 5 * 60000);
    } else {
      message.channel.send('Playing the next item on the playlist...');
      playInternetFile(connection, playlist[0]);
    }
  });

  dispatcher.on('start', () => {
    if (playlist.length === 1) {
      if (quitVoiceTimeout) {
        client.clearTimeout(quitVoiceTimeout);
      }
    }
  });
}

client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message => {
  const content = message.content;
  if (content.startsWith('*play')) {
    if (!message.guild) return;

    if (message.member.voiceChannel && (!message.guild.voiceConnection || message.guild.voiceConnection.channel != message.member.voiceChannel)) {
    	message.member.voiceChannel.join()
    		.then(connection => {
          playlist.push(message);
          if (playlist.length === 1) {
            playInternetFile(connection, message);
          } else {
            message.channel.send('Added a video to the playlist.');
          }
    		})
    		.catch(console.log);
    } else if (message.member.voiceChannel && message.member.voiceChannel === message.guild.voiceConnection.channel) {
      playlist.push(message);
      if (playlist.length === 1) {
        playInternetFile(message.guild.voiceConnection, message);
      } else {
        message.channel.send('Added a video to the playlist.');
      }
    } else {
      message.channel.send('Join a voice channel, or if the bot is already playing something, you need to be in the same voice channel!');
    }
  } else if (message.content === '*neeperi') {
    message.channel.send(new Discord.Attachment('https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/ac/ac20baf8a04741aeb774f3059997fa50aae6abe2_full.jpg'));
  } else if (message.content === '*skip') {
    if (message.member.voiceChannel && message.guild.voiceConnection && message.member.voiceChannel === message.guild.voiceConnection.channel) {
      if (message.guild.voiceConnection.dispatcher) {
        message.guild.voiceConnection.dispatcher.end();
      }
    }
  } else if (message.content === '*quit') {
    if (message.member.voiceChannel && message.guild.voiceConnection && message.member.voiceChannel === message.guild.voiceConnection.channel) {
      message.guild.voiceConnection.disconnect();
      playlist = [];
    }
  } else if (message.content === '*skipall') {
    playlist = [];
    message.guild.voiceConnection.dispatcher.end();
  }
});
//Testing Google Cloud.
client.login('key');