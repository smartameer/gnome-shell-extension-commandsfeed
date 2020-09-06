const { Clutter, GObject, Gio, Gtk, Soup, St, GLib } = imports.gi
const { shellEntry: ShellEntry ,modalDialog: ModalDialog } = imports.ui
const { extensionUtils: Extension, util: Util } = imports.misc

const Clipboard = St.Clipboard.get_default()
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD
const Me = Extension.getCurrentExtension()
const Translation = Me.imports.Translation
const _ = Translation.translate

var SearchDialog = GObject.registerClass(
    class SearchDialog extends ModalDialog.ModalDialog {

        _init() {
            super._init({
                styleClass: 'commands-feed-dialog'
            })
            this._httpSession = null
            this._build()
            this._base_api = "http://www.commandlinefu.com/commands/matching/"
            this._last_search = ''
        }

        _build() {
            let headline = new St.BoxLayout({
                style_class: 'commands-feed-dialog-header',
                width: 600,
                vertical: true
            })

            let title = new St.Label({
                style_class: 'commands-feed-dialog-title',
                text: _("Search Commands")
            })

            headline.add_actor(title)

            this._searchInput = new St.Entry({ style_class: 'commands-feed-dialog-search-input' })
            ShellEntry.addContextMenu(this._searchInput)
            this._searchInput.label_actor = title
            this._searchBox = this._searchInput.clutter_text
            headline.add_actor(this._searchInput)
            this.contentLayout.set_style_pseudo_class('commands-feed-dialog-content')
            this.contentLayout.add(headline)

            this.setInitialKeyFocus(this._searchBox)
            this._searchBox.connect('key-press-event', this._eventHandler.bind(this))

            this._stack = new St.Widget({
                layout_manager: new Clutter.BinLayout()
            })

            this._commandsBox = new St.BoxLayout({
                vertical: true
            })
            this._scrollView = new St.ScrollView({
                style_class: 'nm-dialog-scroll-view',
                width: 640,
                height: 420
            })
            this._scrollView.set_x_expand(true)
            this._scrollView.set_y_expand(true)
            this._scrollView.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
            this._scrollView.add_actor(this._commandsBox)
            this._stack.add_child(this._scrollView)

            this.contentLayout.add(this._stack, { expand: true })

            let footerLabel = new St.Label({
                style_class: 'commands-feed-dialog-footer-title',
                text: _("Press ESC to close")
            })
            this.contentLayout.add(footerLabel, { y_align: St.Align.MIDDLE })

            // this._cancelButton = this.addButton({ action: this.close.bind(this), label: _("Close") }, { expand: true, x_align: St.Align.MIDDLE })
        }

        _eventHandler (object, event) {
            let symbol = event.get_key_symbol()

            if (symbol == Clutter.KEY_Return || symbol == Clutter.KEY_KP_Enter || symbol == Clutter.KEY_ISO_Entern) {
                this._search()
            }
            if (symbol == Clutter.KEY_Escape) {
                this.close()
            }
        }

        _search () {
            if (this._httpSession === null) {
                this._httpSession = new Soup.SessionAsync()
            }
            Soup.Session.prototype.add_feature.call(this._httpSession, new Soup.ProxyResolverDefault())

            let searchDialog = this;
            let input = this._searchInput.get_text()

            if (input !== null && input.trim().length > 0) {
                if (input === this._last_search) {
                    return
                }
                this._commandsBox.remove_all_children()
                this._commandsBox.add_child(new St.Label({ text: '.... ..... ......'}))
                this._last_search = input
                var getQuery = input.trim() + '/' + GLib.base64_encode(input.trim()) + '/json'
                var request = Soup.Message.new('GET', this._base_api + getQuery)
                this._httpSession.queue_message(request, (_httpSession, message) => {
                    this._commandsBox.remove_all_children()
                    if (message.status_code === 200) {
                        let response = request.response_body.data;
                        let jsonResponse = JSON.parse(response);
                        if (jsonResponse.length > 0) {
                            for (var i = 0; i < jsonResponse.length; i++) {
                                this._createItem(jsonResponse[i])
                            }
                        } else {
                            this._commandsBox.add_child(new St.Label({ text: _("No commands found for the searched text.")}))
                        }
                    } else {
                        this._commandsBox.add_child(new St.Label({ text: _("Server returned status code: ") + message.status_code || 0 }))
                    }
                });
            }
        }

        _createItem (item) {
            const itemBox = new St.BoxLayout({
                style_class: 'search-command-box',
                vertical: false
            })
            const dataBox = new St.BoxLayout({
                vertical: true,
                height: 60,
                width: 530
            })
            const summary = new St.Label({ text: item.summary, style_class: 'search-command-summary' })

            const dataCommand = new St.BoxLayout({ style_class: 'search-command-command-box' })
            const command = new St.Label({ text: item.command, style_class: 'search-command-command' })
            dataCommand.add_child(command)

            dataBox.add_child(summary)
            dataBox.add_child(dataCommand)

            itemBox.add_child(dataBox)
            const copyIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/copy.svg'),
                icon_size: 24
            })
            const copyButton = new St.Button({ can_focus: true, style_class: 'search-control-button' })
            copyButton.set_child(copyIcon)
            copyButton.connect('clicked', () => {
                Clipboard.set_text(CLIPBOARD_TYPE, item.command)
            })
            copyButton.connect('key-press-event', (object, event) => {
                let symbol = event.get_key_symbol()

                if (symbol == Clutter.KEY_Escape) {
                    this.close()
                }
            })
            itemBox.add_child(copyButton)
            const visitIcon = new St.Icon({
                gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/link.svg'),
                icon_size: 24
            })
            const visitButton = new St.Button({ can_focus: true, style_class: 'search-control-button' })
            visitButton.set_child(visitIcon)
            visitButton.connect('clicked', () => {
                Util.trySpawnCommandLine('xdg-open ' + item.url)
                this.close()
            })
            visitButton.connect('key-press-event', (object, event) => {
                let symbol = event.get_key_symbol()

                if (symbol == Clutter.KEY_Escape) {
                    this.close()
                }
            })
            itemBox.add_child(visitButton)
            this._commandsBox.add_child(itemBox)
        }
    })
