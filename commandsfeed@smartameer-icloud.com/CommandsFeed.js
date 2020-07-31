'use strict';

const { St, GLib, Gio, Soup } = imports.gi
const { main: Main, panelMenu: PanelMenu, popupMenu: PopupMenu } = imports.ui
const { extensionUtils: Extension, util: Util } = imports.misc

const Me = Extension.getCurrentExtension()
const Clipboard = St.Clipboard.get_default()
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD
const CommandsFeedClass = class CommandsFeedClass extends PanelMenu.Button {
    _init () {
        super._init(1)
        this._httpSession = null
        this._commandData = {}
        this._base_api = 'http://www.commandlinefu.com/commands/random/json'
        let icon = new St.Icon({
            gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/console.svg'),
            style_class: 'system-status-icon'
        })

        this.add_child(icon)

        // command section
        const commandSection = new PopupMenu.PopupMenuSection({
            style_class: 'popup-command-section'
        })
        const dataBox = new St.BoxLayout({
            style_class: 'popup-command-box',
            vertical: true,
            height: 180,
            width: 420
        })

        const dataSummary = new St.BoxLayout({ style_class: 'popup-command-summary-box' })
        this.summaryText = new St.Label({
            text : '.... ..... ......',
            style_class: 'popup-command-summary'
        })
        this.summaryText.clutter_text.line_wrap = true
        dataSummary.add_actor(this.summaryText)
        dataBox.add_actor(dataSummary)

        const dataCommand = new St.BoxLayout({ style_class: 'popup-command-command-box' })
        this.commandText = new St.Label({
            text : '..... ..... ...',
            style_class: 'popup-command-command'
        })
        this.commandText.clutter_text.line_wrap = true
        dataCommand.add_actor(this.commandText)
        dataBox.add_actor(dataCommand)

        const dataVotes = new St.BoxLayout({ style_class: 'popup-command-votes-box' }) 
        this.votesText = new St.Label({
            text : '.... .. .',
            style_class: 'popup-command-votes'
        })
        dataVotes.add_actor(this.votesText)
        dataBox.add_actor(dataVotes)


        const dataContainer = new St.BoxLayout()
        dataContainer.add_actor(dataBox)
        commandSection.actor.add(dataContainer)

        this.menu.addMenuItem(commandSection, 0)
        this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem(), 1)

        // copy action
        const copyItem = new PopupMenu.PopupMenuItem('Copy')
        copyItem.connect('activate', () => {
            Clipboard.set_text(CLIPBOARD_TYPE, this._commandData.command)
        })
        this.menu.addMenuItem(copyItem, 3)

        // website link action
        const visitItem = new PopupMenu.PopupMenuItem('Visit')
        visitItem.connect('activate', () => {
            Util.trySpawnCommandLine( 'xdg-open ' + this._commandData.url)
        })
        this.menu.addMenuItem(visitItem, 4)

        this.menu.connect('open-state-changed', (menu, open) => {
            if (!open) {
                this._update()
            }
        })

        this._update()
    }

    _update () {
        this._fetch((status, data) => {
            if (data !== null) {
                this._commandData = data[0]
                const { summary, command, votes } = this._commandData

                this._set_text(this.summaryText, summary)
                this._set_text(this.commandText, '$ ' + command)
                this._set_text(this.votesText, `Votes: ${votes}`)
            } else {
                Main.notify('Commands Feed Extension', 'Unable to retrieve commands. Please check your internet connection.')
            }
        })
    }

    _set_text (instance, text) {
        instance.set_text(text)
    }

    _fetch (callback) {
        if (this._httpSession === null) {
            this._httpSession = new Soup.SessionAsync()
        }

        Soup.Session.prototype.add_feature.call(this._httpSession, new Soup.ProxyResolverDefault())
        const request = Soup.Message.new('GET', this._base_api)

        this._httpSession.queue_message(request, function(_httpSession, message) {
            if (message.status_code !== 200) {
                callback(message.status_code, null)
                return
            }

            const commandDetails = request.response_body.data
            callback(null, JSON.parse(commandDetails))
        })
    }
}
