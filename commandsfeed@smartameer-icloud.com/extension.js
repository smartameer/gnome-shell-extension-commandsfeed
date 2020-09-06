'use strict';

const { GObject } = imports.gi
const { main: Main } = imports.ui
const { extensionUtils: Extension } = imports.misc

const Me = Extension.getCurrentExtension()
const CommandsFeed = Me.imports.CommandsFeed
let commandsFeedExt = null
var CommandsFeedIndicator = GObject.registerClass({
    GTypeName: 'CommandsFeedIndicator',
}, CommandsFeed.CommandsFeedClass)

function init() {
    //
}

function enable() {
    commandsFeedExt = new CommandsFeedIndicator()
    Main.panel.addToStatusArea('commandsfeed', commandsFeedExt, 1)
}

function disable() {
    if (commandsFeedExt !== null) {
        commandsFeedExt.destroy()
        commandsFeedExt = null
    }
}
