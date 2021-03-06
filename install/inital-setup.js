// noinspection ES6MissingAwait

let systemglobal = require('./../config.json');
const fs = require('fs');
const path = require('path');
const RateLimiter = require('limiter').RateLimiter;
const minimist = require("minimist");
const eris = require("eris");
let args = minimist(process.argv.slice(2));
const inquirer = require('inquirer');

const db = require('./../js/utils/shutauraSQL')("InitSetup");

const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let discordClient = null;
let authwareOnly = false;

(async () => {
    try {
        let discordKey = undefined;
        const type = await inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'e',
                    message: 'What system are you settings up?',
                    choices: [
                        'Storage / Omnibus',
                        'Authentication Only'
                    ]
                }
            ])
        switch (type.e) {
            case 'Storage / Omnibus':
                discordKey = systemglobal.Discord_Key;
                break;
            case 'Authentication Only':
                discordKey = systemglobal.Authware_Key;
                authwareOnly = true;
                break;
            default:
                console.error('Invalid Option')
                process.exit(1)
                break;
        }
        const discordClient = new eris.Client(discordKey, {
            compress: true,
            restMode: true,
            intents: [
                'guilds',
                'guildMembers',
                'guildEmojis',
            ]
        });
        console.log("Connecting to Discord...")

        await discordClient.on("ready", async () => {
            const searchParents = [
                "Control Center",
                "System Status",
                "System Data",
                "Pictures",
                "NSFW",
                "Files",
                "Archives",
            ];
            let parentMap = [];
            let channels = [];

            const joinBot = await inquirer
                .prompt([
                    {
                        type: 'confirm',
                        name: 'e',
                        message: 'Have you added the bot to the server and assigned the role yet?',
                    }
                ])
            if (!joinBot.e) {
                console.log('Please add the bot to the server and assign the \'System Engine\' role for Framework or assign the \'Security Engine\' role to AuthWare');
                process.exit(1)
            }

            const guilds = await discordClient.getRESTGuilds()
            if (guilds.length === 0) {
                console.error(`Bot is not a member of any servers`)
                process.exit(1);
            }
            console.log(`DANGER: NEVER import an existing server again as it will erase all data associated with that server!\n`);
            const guildSelect = await inquirer
                .prompt([
                    {
                        type: 'list',
                        name: 'e',
                        message: 'Select server to configure?',
                        choices: [
                            ...guilds.map(e => `${e.name} - ${e.id}`)
                        ]
                    }
                ])
            const guild = guilds.filter(e => e.name === guildSelect.e.split(' - ')[0] && e.id === guildSelect.e.split(' - ')[1])
            if (guild.length === 0) {
                console.error(`${guildSelect.e} was not found`)
                process.exit(1);
            }

            const expectedEmojis = [
                {
                    serverid: guild[0].id,
                    position: 0,
                    reaction_name: "Clear",
                    readd: 0,
                },
                {
                    serverid: guild[0].id,
                    position: 0,
                    reaction_name: "DeleteThread",
                    readd: 0,
                },
                {
                    serverid: guild[0].id,
                    position: 0,
                    reaction_name: "AlarmSnooze",
                    readd: 0,
                },
                {
                    serverid: guild[0].id,
                    position: 1,
                    reaction_name: "Download",
                    readd: 0,
                },
                {
                    serverid: guild[0].id,
                    position: 1,
                    reaction_name: "WatchLaterYT",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 2,
                    reaction_name: "Check",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 2,
                    reaction_name: "LikeRT",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 3,
                    reaction_name: "Like",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 4,
                    reaction_name: "Retweet",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 5,
                    reaction_name: "ReplyTweet",
                    readd: 0,
                },
                {
                    serverid: guild[0].id,
                    position: 6,
                    reaction_name: "AddUser",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 7,
                    reaction_name: "ExpandSearch",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 20,
                    reaction_name: "Pin",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 98,
                    reaction_name: "MoveMessage",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 99,
                    reaction_name: "ReqFile",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 100,
                    reaction_name: "Archive",
                    readd: 1,
                },
                {
                    serverid: guild[0].id,
                    position: 101,
                    reaction_name: "RemoveFile",
                    readd: 1,
                },
            ];

            console.log("Reading Roles...")
            const roles = await discordClient.getRESTGuildRoles(guild[0].id)
            let rolesRecords = []
            await Promise.all(roles.map(e => {
                const r = e.name.replace(/[\u{0080}-\u{FFFF}]/gu, "").trim()
                if (e.name.startsWith("????")) {
                    rolesRecords.push({
                        name: r.toLowerCase().trim().split(' ').join('_') + '_read',
                        role: e.id,
                        server: guild[0].id
                    })
                } else if (e.name.startsWith("????")) {
                    rolesRecords.push({
                        name: r.toLowerCase().trim().split(' ').join('_') + '_write',
                        role: e.id,
                        server: guild[0].id
                    })
                } else if (e.name.startsWith("????")) {
                    rolesRecords.push({
                        name: r.toLowerCase().trim().split(' ').join('_') + '_manage',
                        role: e.id,
                        server: guild[0].id
                    })
                } else if (r === "Sequenzia Access") {
                    rolesRecords.push({
                        name: 'system_user',
                        role: e.id,
                        server: guild[0].id
                    })
                } else if (r === "Content Manager") {
                    rolesRecords.push({
                        name: 'system_interact',
                        role: e.id,
                        server: guild[0].id
                    })
                } else if (r === "Server Manager") {
                    rolesRecords.push({
                        name: 'system_admin',
                        role: e.id,
                        server: guild[0].id
                    })
                } else if (r === "System Engine" || r === "Security Engine" || r === "Data Reader" || r === "Modules") {
                    rolesRecords.push({
                        name: 'sysbot',
                        role: e.id,
                        server: guild[0].id
                    })
                } else if (r === "Admin Mode") {
                    rolesRecords.push({
                        name: 'syselevated',
                        role: e.id,
                        server: guild[0].id
                    })
                }
            }))
            await Promise.all(rolesRecords.map(async e => {
                console.log(` - Created ${e.name}`)
                await db.query(`REPLACE INTO discord_permissons SET ?`, e);
            }))
            console.log(`??? Roles Installed`)

            let serverMap = {
                serverid: guild[0].id,
                avatar: guild[0].icon,
                name: guild[0].name,
                short_name: guild[0].name.replace(/[\u{0080}-\u{FFFF}]/gu, "").trim().substring(0,3).toUpperCase()
            };
            if (!authwareOnly) {
                console.log("Reading Channels...")
                const chs = await discordClient.getRESTGuildChannels(guild[0].id)
                await Promise.all(chs.filter(e => e.type === 4 && searchParents.indexOf(e.name.replace(/[\u{0080}-\u{FFFF}]/gu, "").trim()) !== -1).map(async channel => {
                    let values = {
                        source: 0,
                        channelid: channel.id,
                        serverid: guild[0].id,
                        position: channel.position,
                        name: channel.name,
                        short_name: channel.name.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*!/g, '').trim(),
                        parent: 'isparent',
                        nsfw: (channel.nsfw) ? 1 : 0,
                        description: null,
                    }
                    switch (searchParents.indexOf(channel.name)) {
                        case 0:
                        case 1:
                        case 2:
                            values.classification = "system";
                            values.role = null;
                            values.role_write = null;
                            values.role_manage = null;
                            break;
                        case 3:
                        case 4:
                            values.classification = "pictures";
                            values.role = "photo_read";
                            values.role_write = 'photo_write';
                            values.role_manage = 'photo_manage';
                            break;
                        case 5:
                            values.classification = "data";
                            values.role = "files_read";
                            values.role_write = 'files_write';
                            values.role_manage = 'files_manage';
                            break;
                        case 6:
                            values.classification = "archives";
                            values.role = "admin";
                            values.role_write = 'admin';
                            values.role_manage = 'admin';
                            break;
                        default:
                            values.classification = null;
                            values.role = null;
                            values.role_write = null;
                            values.role_manage = null;
                            break;
                    }
                    parentMap.push({
                        id: channel.id,
                        name: channel.name,
                        class: values.classification,
                        role: values.role,
                        write: values.role_write,
                        manage: values.role_manage
                    })
                    channels.push(values)
                }))
                await Promise.all(chs.filter(e => e.type === 0).map(async channel => {
                    let values = {
                        source: 0,
                        channelid: channel.id,
                        serverid: guild[0].id,
                        position: channel.position,
                        name: channel.name,
                        short_name: channel.name.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '').trim(),
                        parent: channel.parentID,
                        nsfw: (channel.nsfw) ? 1 : 0,
                        description: (channel.topic) ? channel.topic : null,
                    }
                    const parent = parentMap.filter(e => e.id === channel.parentID)
                    const channel_name = channel.name.replace(/[\u{0080}-\u{FFFF}]/gu, "").trim()
                    if (parent.length > 0) {
                        values.classification = parent[0].class;
                        values.role = parent[0].role;
                        values.role_write = parent[0].write;
                        values.role_manage = parent[0].manage;
                    } else {
                        values.classification = null;
                        values.role = null;
                        values.role_write = null;
                        values.role_manage = null;
                    }
                    switch (channel_name.toLowerCase()) {
                        case 'mailbox':
                            values.watch_folder = `Tripcode`;
                            values.classification = 'data';
                            values.role = 'admin';
                            values.role_write = 'admin';
                            values.role_manage = 'admin';
                            break;
                        case 'tripcode':
                            values.watch_folder = `Tripcode`;
                            values.classification = 'data';
                            values.role = 'admin';
                            values.role_write = 'admin';
                            values.role_manage = 'admin';
                            break;
                        case 'notebook':
                        case 'bookmarks':
                            values.classification = 'notes';
                            values.role = 'admin';
                            values.role_write = 'admin';
                            values.role_manage = 'admin';
                            break;
                        case 'downloads':
                            values.classification = 'data';
                            values.role = 'admin';
                            values.role_write = 'admin';
                            values.role_manage = 'admin';
                            serverMap.chid_download = channel.id;
                            serverMap.chid_download_video = channel.id;
                            break;
                        case 'root-fs':
                            values.watch_folder = `Data`;
                            values.classification = 'data';
                            values.role = 'admin';
                            values.role_write = 'admin';
                            values.role_manage = 'admin';
                            break;
                        case 'console':
                            serverMap.chid_system = channel.id;
                            break;
                        case 'notifications':
                            values.classification = "system";
                            values.role = null;
                            values.role_write = null;
                            values.role_manage = null;
                            serverMap.chid_msg_notif = channel.id;
                            break;
                        case 'infomation':
                            serverMap.chid_msg_info = channel.id;
                            break;
                        case 'warnings':
                            serverMap.chid_msg_warn = channel.id;
                            break;
                        case 'errors':
                            serverMap.chid_msg_err = channel.id;
                            break;
                        case 'critical':
                            serverMap.chid_msg_crit = channel.id;
                            break;
                        case 'system-file-parity':
                            serverMap.chid_filedata = channel.id;
                            break;
                        case 'system-cache':
                            serverMap.chid_filecache = channel.id;
                            break;
                        case 'archives-root':
                            serverMap.chid_archive = channel.id;
                            break;
                        case 'archives-nsfw':
                            serverMap.chid_archive_nsfw = channel.id;
                            break;
                        default:
                            break;
                    }
                    channels.push(values);
                }))
                let serverEmojis = await discordClient.getRESTGuildEmojis(guild[0].id)
                await Promise.all(fs.readdirSync(path.join(process.cwd(), '/assets/emojis/')).filter(e => path.extname(e.toLowerCase()) === ".png" && expectedEmojis.filter(f => f.reaction_name.toLowerCase() === path.basename(e, path.extname(e.toLowerCase()))) && serverEmojis.filter(f => f.name === path.basename(e, path.extname(e.toLowerCase()))).length === 0).map(async e => {
                    await discordClient.createGuildEmoji(guild[0].id, {
                        image: 'data:image/png;base64,' + fs.readFileSync(path.join(process.cwd(), '/assets/emojis/', e)).toString('base64'),
                        name: path.basename(e, path.extname(e))
                    })
                    console.log(`??? Installed Emoji "${path.basename(e, path.extname(e))}"`)
                }))
                serverEmojis = await discordClient.getRESTGuildEmojis(guild[0].id)
                await Promise.all(serverEmojis.map(async emoji => {
                    const preparedEmoji = expectedEmojis.filter(e => e.reaction_name.toLowerCase() === emoji.name.toLowerCase() && emoji.id);
                    if (preparedEmoji.length === 0) {
                        console.error(` - ${emoji.name} skipped`);
                    } else {
                        let values = preparedEmoji[0];
                        values.reaction_emoji = emoji.name;
                        values.reaction_custom = `${emoji.name}:${emoji.id}`;

                        await db.query('REPLACE INTO discord_reactions SET ?', values);
                        console.log(` - ${values.reaction_name} => ${values.reaction_custom}`);
                    }
                }))
                console.log(`??? Installed Emojis`)


                await Promise.all(channels.map(async c => {
                    console.log(` - Created ${c.name}`)
                    await db.query(`REPLACE INTO kanmi_channels SET ?`, c);
                }))
                console.log("??? Installed Channels");

                console.log('Settings Up Seq Super/Classes....')
                const superClass = [
                    {
                        super: `images`,
                        position: 1,
                        name: 'Photos',
                        uri: 'gallery'
                    },
                    {
                        super: `files`,
                        position: 10,
                        name: 'Files',
                        uri: 'files'
                    },
                    {
                        super: `cards`,
                        position: 20,
                        name: 'Cards',
                        uri: 'cards'
                    }
                ]
                const classes = [
                    {
                        class: 'pictures',
                        super: 'images',
                        position: 0,
                        name: 'Pictures',
                        icon: 'fa-image'
                    },
                    {
                        class: 'data',
                        super: 'files',
                        position: 0,
                        name: 'Files',
                        icon: 'fa-folder'
                    },
                    {
                        class: 'archives',
                        super: 'files',
                        position: 99,
                        name: 'Archives',
                        icon: 'fa-archive'
                    },
                    {
                        class: 'notes',
                        super: 'cards',
                        position: 0,
                        name: 'Notes',
                        icon: 'fa-clipboard'
                    },
                ]
                await superClass.forEach(async (e) => {
                    await db.query(`REPLACE INTO sequenzia_superclass SET ?`, e);
                })
                await classes.forEach(async (e, i) => {
                    await db.query(`REPLACE INTO sequenzia_class SET ?`, e);
                })
                console.log(`??? Installed Basic Sequenzia Classes`)
            }
            const exsistingServer = await db.query(`SELECT * FROM discord_servers WHERE serverid = ?`, [guild[0].id])
            if (exsistingServer && exsistingServer.rows && exsistingServer.rows.length === 0) {
                const names = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'a',
                        message: 'Server Path (Max 3 letters, Ex: SEQ, Leave blank for default):'
                    },
                    {
                        type: 'input',
                        name: 'b',
                        message: 'Server Public Name (Name that is displayed in Sequenzia, Leave blank for default):'
                    },
                    {
                        type: 'confirm',
                        name: 'c',
                        message: 'Enable Login to Web via this server (Always yes, for Onmibus setups)',
                        default: true
                    }
                ])
                if (names.a && names.a.length > 0)
                    serverMap.short_name = names.a.replace(/[\u{0080}-\u{FFFF}]/gu, "").trim().substring(0,3).toUpperCase()
                if (names.b && names.b.length > 0)
                    serverMap.nice_name = names.b
                serverMap.authware_enabled = (authwareOnly || names.c) ? 1 : 0
                await db.query('REPLACE INTO discord_servers SET ?', serverMap);
                console.log(`??? Server Installed`)
            } else {
                await db.query('UPDATE discord_servers SET ? WHERE serverid = ?', [serverMap, guild[0].id]);
                console.log(`??? Server Modified`)
            }

            console.log(`All Done! Waiting for background tasks to sync...`)

            setTimeout(() => {
                process.exit(0);
            }, 30000);
        });

        discordClient.on("error", (err) => {
            console.error(err);
            process.exit(1);
        });

        await discordClient.connect().catch((er) => { console.error(er); process.exit(1) });

    } catch (e) {
        console.log(e)
        process.exit(1)
    }
})()