const { extensionUtils: Extension } = imports.misc
const Gettext = imports.gettext

const Me = Extension.getCurrentExtension()

Gettext.bindtextdomain('commandsfeed', Me.dir.get_child('locale').get_path())
Gettext.textdomain('commandsfeed')

var translate = Gettext.gettext
