const Discord = require('discord.js-selfbot-v13');
const client = new Discord.Client();

// Core Configuration
const CONFIG = {
    prefix: '.',
    deleteDelay: 30000,
    owner: 'ACCID',
    app: 'ACCID', // Updated application ID
    spotify: 'spotifyid',
    credits: Buffer.from('QVJBQk4gU0hFSUtI', 'base64').toString('utf-8'),
    version: '1.0.0'
};

// Global State Management
const STATE = {
    statusRotation: false,
    currentRotationIndex: 0,
    timeInterval: null
};

// Status Configurations
const STATUS_CONFIG = {
    gamePresets: {
        valorant: { 
            name: 'VALORANT',
            details: 'Competitive',
            state: 'In Game',
            largeImageKey: 'valorant',
            smallImageKey: 'valorant_small'
        },
        minecraft: { 
            name: 'Minecraft',
            details: 'Survival Mode',
            state: 'Building',
            largeImageKey: 'minecraft',
            smallImageKey: 'minecraft_small'
        }
    },
    tournamentGames: ['Valorant', 'Fortnite', 'CSGO', 'League of Legends'],
    afkReasons: ['Away', 'Busy', 'Sleeping', 'Do Not Disturb'],
    randomStatuses: {
        games: ['Valorant', 'Minecraft', 'Fortnite', 'CSGO', 'League of Legends', 'Apex Legends', 'GTA V'],
        activities: ['Grinding Ranked', 'Competitive', 'Custom Games', 'Practice', 'Scrims', 'Tournament'],
        ranks: ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Immortal', 'Radiant'],
        emojis: ['🎮', '🎯', '🏆', '⚔️', '🔥', '💫', '✨', '🌟']
    },
    defaultImages: {
        valorant: 'https://i.imgur.com/rqXHyI7.png',
        minecraft: 'https://i.imgur.com/Qz6LmHK.png',
        fortnite: 'https://i.imgur.com/TgZuCnp.png',
        csgo: 'https://i.imgur.com/ZWKi5Ue.png',
        default: 'https://i.imgur.com/f2G2qF9.png'
    }
};

// Helper Functions
const Helpers = {
    clearAllIntervals: () => {
        if (STATE.timeInterval) clearInterval(STATE.timeInterval);
        STATE.timeInterval = null;
        STATE.statusRotation = false;
    },
    
    sendTemp: async (message, content) => {
        try {
            const sent = await message.channel.send(content);
            setTimeout(() => sent.delete().catch(() => {}), CONFIG.deleteDelay);
            if (message.deletable) {
                setTimeout(() => message.delete().catch(() => {}), CONFIG.deleteDelay);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    },

    createRichPresence: (name, details, state, imageKey) => {
        return {
            name: name,
            type: 'PLAYING',
            application_id: CONFIG.app,
            details: details,
            state: state,
            assets: {
                large_image: imageKey || 'default',
                large_text: name,
                small_image: 'default',
                small_text: 'Playing'
            },
            timestamps: {
                start: Date.now()
            },
            flags: 1 << 0
        };
    }
};

// Message Handler
client.on('messageCreate', async message => {
    if (message.author.id !== CONFIG.owner) return;
    if (!message.content.startsWith(CONFIG.prefix)) return;

    const [command, ...args] = message.content
        .slice(CONFIG.prefix.length)
        .trim()
        .split(/\s+/);

    switch (command) {
        case 'game':
            try {
                const [gameName, gameDetails, imageUrl] = args.join(' ').split('|').map(s => s.trim());
                
                if (!gameName) {
                    await Helpers.sendTemp(message, '❌ Please provide a game name!');
                    return;
                }

                const presence = {
                    application_id: CONFIG.app,
                    name: gameName,
                    type: 'PLAYING',
                    details: gameDetails || 'Playing',
                    state: 'In Game',
                    assets: {
                        large_image: imageUrl || STATUS_CONFIG.defaultImages[gameName.toLowerCase()] || STATUS_CONFIG.defaultImages.default,
                        large_text: gameName,
                        small_image: STATUS_CONFIG.defaultImages.default,
                        small_text: 'Playing'
                    },
                    timestamps: { start: Date.now() },
                    flags: 1 << 0
                };

                await client.user.setActivity(presence);
                
                await Helpers.sendTemp(message, `
**🎮 Game Status Set**
Game: ${gameName}
${gameDetails ? `Details: ${gameDetails}` : ''}
${imageUrl ? `Image: Custom` : 'Image: Default'}`);

            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting game status.');
            }
            break;

        case 'spotify':
            try {
                const [songName, artist] = args.join(' ').split('|').map(s => s.trim());
                if (!songName) {
                    await Helpers.sendTemp(message, '❌ Please provide a song name!');
                    return;
                }

                await client.user.setActivity({
                    type: 'LISTENING',
                    name: 'Spotify',
                    state: artist || 'Unknown Artist',
                    details: songName,
                    assets: {
                        large_image: 'spotify:ab67616d0000b273c97f8c75e172c05a4c0c1878',
                        large_text: songName,
                        small_image: 'spotify:ab67616d0000b273c97f8c75e172c05a4c0c1878',
                        small_text: 'Spotify'
                    },
                    timestamps: {
                        start: Date.now()
                    },
                    application_id: CONFIG.spotify,
                    sync_id: Buffer.from(songName).toString('base64'),
                    flags: 48,
                    party: {
                        id: `spotify:${CONFIG.spotify}`
                    }
                });

                await Helpers.sendTemp(message, `
**🎵 Spotify Status Set**
Song: ${songName}
Artist: ${artist || 'Unknown Artist'}`);

            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting Spotify status.');
            }
            break;

        case 'clear':
            try {
                Helpers.clearAllIntervals();
                await client.user.setActivity(null);
                await Helpers.sendTemp(message, '**🧹 All Status Effects Cleared**');
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error clearing status.');
            }
            break;

        case 'help':
            try {
                const helpMessage = `
**🌟 Rich Presence Commands**
All commands start with: ${CONFIG.prefix}

${Buffer.from('Q3JlYXRlZCBieSBBUkFBTiBTSEVJS0g=', 'base64').toString('utf-8')}
Version: ${CONFIG.version}

**🎮 Gaming Commands**
\`game <game> | <details> | <imageUrl>\` - Set game status with optional image
\`preset <game>\` - Use game preset (valorant, minecraft)
\`tournament <game> | <details> | <rank>\` - Tournament mode
\`tourwin <details>\` - Tournament victory status
\`scrim <team1> | <team2> | <score>\` - Scrim match status
\`random\` - Random game status

**🎵 Music Commands**
\`spotify <song> | <artist>\` - Set Spotify status

**🎥 Streaming Commands**
\`stream <platform> | <name> | <url>\` - Set streaming status
\`live <title> | <game> | <url>\` - Set live stream status

**✨ Special Features**
\`party <event> | <details>\` - Party mode with animations
\`afk <reason>\` - AFK status with timer
\`image <url>\` - Test custom status images

**🔄 Status Commands**
\`clear\` - Clear all effects

**🖼️ Image Support**
• Add custom images to game status using image URL
• Default images available for popular games
• Test images with the image command

**💡 Tips**
• Messages auto-delete after ${CONFIG.deleteDelay/1000} seconds
• Use | to separate parameters
• URLs are optional for most commands
• Images must be hosted (imgur, discord, etc.)

**📝 Examples**
\`$game Valorant | Competitive | https://i.imgur.com/image.png\`
\`$tournament Valorant | Finals | Immortal\`
\`$random\`
\`$live Amazing Stream | Valorant | https://twitch.tv/username\`
\`$party Birthday Celebration | With Friends\`
\`$afk Taking a break\`

For more details about any command, use: ${CONFIG.prefix}helpcommand <command>`;

                await Helpers.sendTemp(message, helpMessage);
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error displaying help menu.');
            }
            break;

        case 'helpcommand':
            try {
                const command = args[0]?.toLowerCase();
                const helpDetails = {
                    game: `
**🎮 Game Command**
Usage: \`$game <game> | <details> | <imageUrl>\`
Examples:
• \`$game Valorant\` - Basic game status
• \`$game Minecraft | Building | https://i.imgur.com/image.png\` - With image
• \`$game CSGO | Competitive\` - With details`,
                    
                    tournament: `
**🏆 Tournament Command**
Usage: \`$tournament <game> | <details> | <rank>\`
Examples:
• \`$tournament Valorant | Finals | Immortal\`
• \`$tournament\` - Random tournament status
Related: \`$tourwin\`, \`$scrim\``,
                    
                    stream: `
**🎥 Stream Command**
Usage: \`$stream <platform> | <name> | <url>\`
Examples:
• \`$stream twitch | Gaming Stream | https://twitch.tv/...\`
• \`$live Stream Title | Valorant | https://twitch.tv/...\``,

                    random: `
**🎲 Random Status**
Usage: \`$random\`
Generates random:
• Game selection
• Activity type
• Rank/Status
• Game image
• Emoji`,

                    party: `
**🎉 Party Mode**
Usage: \`$party <event> | <details>\`
Examples:
• \`$party Birthday Stream | Come join!\`
• \`$party Game Night | With Friends\`
Features animated emojis!`,

                    afk: `
**💤 AFK Status**
Usage: \`$afk <reason>\`
Examples:
• \`$afk Taking a break\`
• \`$afk\` - Uses random AFK reason
Shows duration when AFK`,

                    image: `
**🖼️ Image Command**
Usage: \`$image <url>\`
Examples:
• \`$image https://i.imgur.com/image.png\`
Supported formats: png, jpg, gif
Must be hosted URL`
                }[command];

                if (helpDetails) {
                    await Helpers.sendTemp(message, helpDetails);
                } else {
                    await Helpers.sendTemp(message, '❌ Command not found. Use $help for all commands.');
                }
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error displaying command help.');
            }
            break;

        case 'preset':
            try {
                const presetName = args[0]?.toLowerCase();
                if (!presetName || !STATUS_CONFIG.gamePresets[presetName]) {
                    await Helpers.sendTemp(message, '❌ Available presets: valorant, minecraft');
                    return;
                }

                const preset = STATUS_CONFIG.gamePresets[presetName];
                const presence = {
                    application_id: CONFIG.app,
                    name: preset.name,
                    type: 'PLAYING',
                    details: preset.details,
                    state: preset.state,
                    assets: {
                        large_image: STATUS_CONFIG.defaultImages[presetName] || STATUS_CONFIG.defaultImages.default,
                        large_text: preset.name,
                        small_image: STATUS_CONFIG.defaultImages.default,
                        small_text: 'Playing'
                    },
                    timestamps: { start: Date.now() },
                    flags: 1 << 0
                };

                await client.user.setActivity(presence);
                await Helpers.sendTemp(message, `
**🎮 Preset Status Set**
Game: ${preset.name}
Details: ${preset.details}
State: ${preset.state}`);

            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting preset status.');
            }
            break;

        case 'tournament':
            try {
                const [game, details, rank] = args.join(' ').split('|').map(s => s.trim());
                const selectedGame = game || STATUS_CONFIG.tournamentGames[Math.floor(Math.random() * STATUS_CONFIG.tournamentGames.length)];
                
                const presence = {
                    application_id: CONFIG.app,
                    name: selectedGame,
                    type: 'COMPETING',
                    details: details || 'Tournament Mode',
                    state: rank || 'Competitive',
                    assets: {
                        large_image: STATUS_CONFIG.defaultImages[selectedGame.toLowerCase()] || STATUS_CONFIG.defaultImages.default,
                        large_text: `${selectedGame} Tournament`,
                        small_image: STATUS_CONFIG.defaultImages.default,
                        small_text: rank || 'Competitive'
                    },
                    timestamps: { start: Date.now() },
                    flags: 1 << 0
                };

                await client.user.setActivity(presence);
                await Helpers.sendTemp(message, `
**🏆 Tournament Status Set**
Game: ${selectedGame}
${details ? `Details: ${details}` : ''}
${rank ? `Rank: ${rank}` : ''}`);

            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting tournament status.');
            }
            break;

        case 'tourwin':
            try {
                const details = args.join(' ') || 'Champion';
                const presence = {
                    application_id: CONFIG.app,
                    name: 'Tournament Victory',
                    type: 'COMPETING',
                    details: '🏆 Tournament Winner',
                    state: details,
                    assets: {
                        large_image: STATUS_CONFIG.defaultImages.default,
                        large_text: 'Tournament Victory',
                        small_image: STATUS_CONFIG.defaultImages.default,
                        small_text: 'Champion'
                    },
                    timestamps: { start: Date.now() },
                    flags: 1 << 0
                };

                await client.user.setActivity(presence);
                await Helpers.sendTemp(message, `
**🏆 Tournament Victory Status Set**
Details: ${details}
Status: Tournament Winner`);
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting victory status.');
            }
            break;

        case 'scrim':
            try {
                const [team1, team2, score] = args.join(' ').split('|').map(s => s.trim());
                const presence = Helpers.createRichPresence(
                    'Scrim Match',
                    `${team1 || 'Team A'} vs ${team2 || 'Team B'}`,
                    score || 'In Progress',
                    'scrim'
                );

                await client.user.setActivity(presence);
                await Helpers.sendTemp(message, `
**⚔️ Scrim Status Set**
Match: ${team1 || 'Team A'} vs ${team2 || 'Team B'}
Score: ${score || 'In Progress'}`);
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting scrim status.');
            }
            break;

        case 'stream':
            try {
                const [platform, streamName, streamUrl] = args.join(' ').split('|').map(s => s.trim());
                const presence = {
                    type: 'STREAMING',
                    name: streamName || 'Live Stream',
                    url: streamUrl || `https://${platform}.com/`,
                    details: 'Live Now',
                    timestamps: { start: Date.now() }
                };

                await client.user.setActivity(presence);
                await Helpers.sendTemp(message, `
**🎥 Stream Status Set**
Platform: ${platform}
Stream: ${streamName}
URL: ${streamUrl || `https://${platform}.com/`}`);

            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting stream status.');
            }
            break;

        case 'live':
            try {
                const [title, game, url] = args.join(' ').split('|').map(s => s.trim());
                
                if (!title) {
                    await Helpers.sendTemp(message, '❌ Usage: $live Stream Title | Game | URL');
                    return;
                }

                const presence = {
                    type: 'STREAMING',
                    name: title,
                    details: game || 'Live Stream',
                    url: url || 'https://twitch.tv/',
                    assets: {
                        large_image: 'mp:attachments/875768640320962650/875768640320962650/live',
                        large_text: title,
                        small_image: 'mp:attachments/875768640320962650/875768640320962650/live',
                        small_text: '🔴 LIVE'
                    },
                    application_id: CONFIG.app,
                    timestamps: { start: Date.now() }
                };

                await client.user.setActivity(presence);
                await Helpers.sendTemp(message, `
**🔴 Live Status Set**
Title: ${title}
${game ? `Game: ${game}` : ''}
${url ? `URL: ${url}` : ''}`);

            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting live status.');
            }
            break;

        case 'party':
            try {
                const [eventName, ...details] = args.join(' ').split('|').map(s => s.trim());
                if (!eventName) {
                    await Helpers.sendTemp(message, '❌ Usage: $party Event Name | Details');
                    return;
                }

                const partyEmojis = ['🎉', '🎊', '🎈', '🎆', '🎇', '✨'];
                let emojiIndex = 0;

                Helpers.clearAllIntervals();
                STATE.timeInterval = setInterval(() => {
                    const emoji = partyEmojis[emojiIndex];
                    client.user.setActivity({
                        application_id: CONFIG.app,
                        name: eventName,
                        type: 'COMPETING',
                        details: `${emoji} ${eventName}`,
                        state: details.join(' | ') || 'Party Time!',
                        timestamps: { start: Date.now() }
                    });
                    emojiIndex = (emojiIndex + 1) % partyEmojis.length;
                }, 1500);

                await Helpers.sendTemp(message, `
**🎉 Party Mode Enabled**
Event: ${eventName}
${details.length ? `Details: ${details.join(' | ')}` : ''}`);
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting party mode.');
            }
            break;

        case 'afk':
            try {
                const reason = args.join(' ') || STATUS_CONFIG.afkReasons[Math.floor(Math.random() * STATUS_CONFIG.afkReasons.length)];
                STATE.afkMode = !STATE.afkMode;

                if (STATE.afkMode) {
                    Helpers.clearAllIntervals();
                    STATE.timeInterval = setInterval(() => {
                        const now = new Date();
                        const timeAway = Math.floor((now - STATE.afkStartTime) / 60000);
                        client.user.setActivity(`💤 AFK: ${reason} (${timeAway}m)`, { type: 'CUSTOM' });
                    }, 60000);

                    STATE.afkStartTime = new Date();
                    await Helpers.sendTemp(message, `**💤 AFK Mode Enabled**\nReason: ${reason}`);
                } else {
                    Helpers.clearAllIntervals();
                    client.user.setActivity(null);
                    await Helpers.sendTemp(message, '**💤 AFK Mode Disabled**');
                }
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error toggling AFK mode.');
            }
            break;

        case 'random':
            try {
                Helpers.clearAllIntervals();
                STATE.statusRotation = !STATE.statusRotation;

                if (STATE.statusRotation) {
                    STATE.timeInterval = setInterval(() => {
                        const config = STATUS_CONFIG.randomStatuses;
                        const game = config.games[Math.floor(Math.random() * config.games.length)];
                        const activity = config.activities[Math.floor(Math.random() * config.activities.length)];
                        const rank = config.ranks[Math.floor(Math.random() * config.ranks.length)];
                        const emoji = config.emojis[Math.floor(Math.random() * config.emojis.length)];

                        const presence = {
                            application_id: CONFIG.app,
                            name: game,
                            type: 'PLAYING',
                            details: `${emoji} ${activity}`,
                            state: rank,
                            assets: {
                                large_image: 'mp:attachments/875768640320962650/875768640320962650/gaming',
                                large_text: game,
                                small_image: 'mp:attachments/875768640320962650/875768640320962650/gaming',
                                small_text: rank
                            },
                            timestamps: { start: Date.now() }
                        };

                        client.user.setActivity(presence);
                    }, 10000); // Changes every 10 seconds

                    await Helpers.sendTemp(message, `
**���� Random Status Rotation Enabled**
• Changes every 10 seconds
• Use \`${CONFIG.prefix}random\` to disable
• Use \`${CONFIG.prefix}clear\` to stop`);
                } else {
                    Helpers.clearAllIntervals();
                    await client.user.setActivity(null);
                    await Helpers.sendTemp(message, '**🎲 Random Status Rotation Disabled**');
                }

            } catch (error) {
                console.error('Error setting random status:', error);
                await Helpers.sendTemp(message, '❌ Error setting random status.');
            }
            break;

        case 'image':
            try {
                const [imageUrl] = args;
                if (!imageUrl) {
                    await Helpers.sendTemp(message, '❌ Please provide an image URL!');
                    return;
                }

                const presence = {
                    application_id: CONFIG.app,
                    type: 'PLAYING',
                    name: 'Custom Image',
                    state: 'Image Test',
                    details: 'Custom Image Active',
                    assets: {
                        large_image: `attachment://${imageUrl}`,  // Using attachment:// protocol
                        large_text: 'Custom Image',
                        small_image: STATUS_CONFIG.defaultImages.default,
                        small_text: 'Testing'
                    },
                    timestamps: { start: Date.now() },
                    instance: true,
                    flags: 1 << 0
                };

                await client.user.setActivity(presence);
                await Helpers.sendTemp(message, `
**🖼️ Custom Image Set**
URL: ${imageUrl}

The image should now be visible in your status!`);

            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error setting image. Make sure the URL is valid and accessible.');
            }
            break;

        case 'credits':
            try {
                const creditsMessage = Buffer.from(`
**✨ Rich Presence Selfbot**
Created by: ${CONFIG.credits}
Version: ${CONFIG.version}
GitHub: https://github.com/araan-sheikh
Discord: araan_sheikh`, 'utf-8').toString('base64');

                await Helpers.sendTemp(message, Buffer.from(creditsMessage, 'base64').toString('utf-8'));
            } catch (error) {
                console.error('Error:', error);
                await Helpers.sendTemp(message, '❌ Error displaying credits.');
            }
            break;
    }
});

// Ready Event
client.on('ready', async () => {
    console.clear();
    const encryptedCredits = Buffer.from('Created by ARAAN SHEIKH').toString('base64');
    console.log(`╔═══════════════════════════════════════════╗
║        Rich Presence Selfbot Started      ║
║───────────────────────────────────────────║
║ User: ${client.user.tag}
║ Status: Online ✅
║ Version: ${CONFIG.version}
║ Credits: ${Buffer.from(encryptedCredits, 'base64').toString('utf-8')}
╚═══════════════════════════════════════════╝`);

    const channel = await client.channels.fetch('YOUR-CHANNEL-ID').catch(() => null);
    if (channel) {
        channel.send(`\`\`\`
Selfbot Started Successfully!
${Buffer.from('Q3JlYXRlZCBieSBBUkFBTiBTSEVJS0g=', 'base64').toString('utf-8')}
\`\`\``).then(msg => setTimeout(() => msg.delete(), 5000));
    }
});

// Login to Discord
client.login('TOKEN');
