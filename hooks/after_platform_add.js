#!/usr/bin/env node

/**
 * After Platform Add Hook - Installs Native ATT Plugin
 * This runs after 'cordova platform add ios' and installs our ATT plugin
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = function(context) {
    const projectRoot = context.opts.projectRoot;
    const pluginPath = path.join(projectRoot, 'plugins', 'cordova-plugin-att-native');
    
    console.log('=====================================');
    console.log('Installing ATT Plugin...');
    console.log('Plugin path:', pluginPath);
    console.log('=====================================');
    
    // Check if plugin folder exists
    if (!fs.existsSync(pluginPath)) {
        console.log('ERROR: ATT plugin folder not found!');
        return;
    }
    
    try {
        // Install the plugin using cordova plugin add with absolute path
        const cmd = `cordova plugin add "${pluginPath}"`;
        console.log('Running:', cmd);
        execSync(cmd, { cwd: projectRoot, stdio: 'inherit' });
        console.log('✅ ATT Plugin installed successfully!');
    } catch (error) {
        console.log('❌ Failed to install ATT plugin:', error.message);
    }
};
