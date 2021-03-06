'use strict';

const { Gio, Soup, St } = imports.gi
const { main: Main, panelMenu: PanelMenu, popupMenu: PopupMenu } = imports.ui
const { extensionUtils: Extension, util: Util } = imports.misc

const Me = Extension.getCurrentExtension()
const Translation = Me.imports.Translation
const SearchCommands = Me.imports.SearchCommands
const Clipboard = St.Clipboard.get_default()
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD
const _ = Translation.translate

var CommandsFeedClass = class CommandsFeedClass extends PanelMenu.Button {
    _init () {
        super._init(0)
        this._httpSession = null
        this._commandData = {}
        this._base_api = 'http://www.commandlinefu.com/commands/random/json'
        let icon = new St.Icon({
            gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/console.svg'),
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
            height: 200,
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

        // control items like copy visit refresh etc..
        const controlBox = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false
        })

        const copyIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/copy.svg'),
            icon_size: 28
        })
        const copyButton = new St.Button({ can_focus: true, style_class: 'system-control-button' })
        copyButton.set_child(copyIcon)
        copyButton.connect('clicked', () => {
            Clipboard.set_text(CLIPBOARD_TYPE, this._commandData.command)
        })
        controlBox.actor.add(copyButton, { expand: true, x_fill: false })

        const visitIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/link.svg'),
            icon_size: 28
        })
        const visitButton = new St.Button({ can_focus: true, style_class: 'system-control-button' })
        visitButton.set_child(visitIcon)
        visitButton.connect('clicked', () => {
            Util.trySpawnCommandLine( 'xdg-open ' + this._commandData.url)
            this.menu.close()
        })
        controlBox.actor.add(visitButton, { expand: true, x_fill: false })

        const refreshIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/refresh.svg'),
            icon_size: 28
        })
        const refreshButton = new St.Button({ can_focus: true, style_class: 'system-control-button' })
        refreshButton.set_child(refreshIcon)
        refreshButton.connect('clicked', () => {
            this._update()
        })
        controlBox.actor.add(refreshButton, { expand: true, x_fill: false })

        const searchIcon = new St.Icon({
            gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/search.svg'),
            icon_size: 28
        })
        const searchButton = new St.Button({ can_focus: true, style_class: 'system-control-button' })
        searchButton.set_child(searchIcon)
        searchButton.connect('clicked', () => {
            this.menu.close()
            this.searchPanel = new SearchCommands.SearchDialog()
            this.searchPanel.open()
        })
        controlBox.actor.add(searchButton, { expand: true, x_fill: false })
        this.menu.addMenuItem(commandSection, 0)
        this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem(), 1)
        this.menu.addMenuItem(controlBox, 2)

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
                this._set_text(this.votesText, _('Votes') + `: ${votes}`)
            } else {
                Main.notify('Commands Feed Extension', _('Unable to retrieve commands. Please check your internet connection.'))
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
