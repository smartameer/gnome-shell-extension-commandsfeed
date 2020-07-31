const { main: Main } = imports.ui
const { extensionUtils: Extension } = imports.misc

const Me = Extension.getCurrentExtension()
const CommandsFeedClass = Me.imports.CommandsFeedClass.CommandsFeedClass

let commandsFeedExt

function init() {
}

function enable() {
    commandsFeedExt = new CommandsFeedClass()
    Main.panel.addToStatusArea('commandsfeed', commandsFeedExt, 1)
}

function disable() {
    commandsFeedExt.destroy()
}
