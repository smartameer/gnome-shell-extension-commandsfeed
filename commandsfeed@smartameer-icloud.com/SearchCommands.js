const { Clutter, GObject, Gtk, Soup, St } = imports.gi
const ModalDialog = imports.ui.modalDialog
const { extensionUtils: Extension } = imports.misc

const Me = Extension.getCurrentExtension()
const Translation = Me.imports.Translation
const _ = Translation.translate

var SearchDialog = GObject.registerClass(
  class SearchDialog extends ModalDialog.ModalDialog {

    _init() {
        super._init({
            styleClass: 'commands-feed-dialog'
        })
        this._build()
    }

    _build() {
        let headline = new St.BoxLayout({
            style_class: 'commands-feed-dialog-header',
            width: 600,
            vertical: true
        })

        let title = new St.Label({
            style_class: 'commands-feed-dialog-title',
            text: _("Browse Commands")
        })
        headline.add_actor(title, { expand: true, x_fill: St.Align.MIDDLE })

        this.contentLayout.set_style_pseudo_class('commands-feed-dialog-content');
        this.contentLayout.add(headline)

        this._stack = new St.Widget({
            layout_manager: new Clutter.BinLayout()
        });

        this._itemBox = new St.BoxLayout({
            vertical: true
        });
        this._scrollView = new St.ScrollView({
            style_class: 'nm-dialog-scroll-view',
            width: 600,
            height: 420
        });
        this._scrollView.set_x_expand(true);
        this._scrollView.set_y_expand(true);
        this._scrollView.set_policy(Gtk.PolicyType.NEVER,
            Gtk.PolicyType.AUTOMATIC);
        this._scrollView.add_actor(this._itemBox);
        this._stack.add_child(this._scrollView);

        this.contentLayout.add(this._stack, {
            expand: true
        });

        this._cancelButton = this.addButton({ action: this.close.bind(this), label: _("Close") }, { expand: true, x_align: St.Align.MIDDLE })
    }

})
