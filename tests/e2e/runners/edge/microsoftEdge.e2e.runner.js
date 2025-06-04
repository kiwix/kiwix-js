import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/edge.js';
import legacyRayCharles from '../../spec/legacy-ray_charles.e2e.spec.js';
import gutenbergRo from '../../spec/gutenberg_ro.e2e.spec.js';
import tonedearTests from '../../spec/tonedear.e2e.spec.js';

/* global process */

async function loadMSEdgeDriver () {
    const options = new Options();
    
    // Run it headless if the environment variable GITHUB_ACTIONS is set
    if (process.env.GITHUB_ACTIONS) {
        options.addArguments('--headless=new');
        // Additional headless-specific options for better element visibility
        options.addArguments('--window-size=1920,1080');
        options.addArguments('--force-device-scale-factor=1');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-gpu-sandbox');
        options.addArguments('--disable-software-rasterizer');
    }
    
    // Disable Edge promotional content and notifications
    options.addArguments('--disable-features=msEdgeGuidedSwitch');
    options.addArguments('--disable-features=msEdgeDiscoverNavigationInfo');
    options.addArguments('--disable-features=msEdgeSidebarButton');
    options.addArguments('--disable-features=msEdgeCopilot');
    options.addArguments('--no-first-run');
    options.addArguments('--disable-popup-blocking');
    options.addArguments('--disable-notifications');
    options.addArguments('--disable-infobars');
    options.addArguments('--disable-web-security');
    options.addArguments('--disable-features=VizDisplayCompositor');
    
    // Set preferences to minimize interruptions
    options.setUserPreferences({
        'profile.default_content_setting_values.notifications': 2,
        'profile.default_content_settings.popups': 0,
        'browser.edge_tips_enabled': false
    });
    
    const driver = await new Builder()
        .forBrowser('MicrosoftEdge')
        .setEdgeOptions(options)
        .build();
    
    // Set window size for better element visibility
    await driver.manage().window().setRect({ width: 1920, height: 1080 });
    
    return driver;
};

// Preserve the order of loading, because when a user runs these on local machine, the third driver will be on top of and cover the first one
// so we need to use the third one first
const driver_for_tonedear = await loadMSEdgeDriver();
const driver_for_gutenberg = await loadMSEdgeDriver();
const driver_for_ray_charles = await loadMSEdgeDriver();

await legacyRayCharles.runTests(driver_for_ray_charles);
await gutenbergRo.runTests(driver_for_gutenberg);
await tonedearTests.runTests(driver_for_tonedear);
