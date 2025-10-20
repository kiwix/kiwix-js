#!/usr/bin/env node

/**
 * Simple replacement for start-server-and-test that doesn't rely on wmic.exe
 * Starts http-server, waits for it to be ready, runs tests, then cleanly shuts down
 */

/* global process */

import { spawn, spawnSync } from 'child_process';
import http from 'http';
import { existsSync } from 'fs';

const PORT = 8080;
const MAX_WAIT_TIME = 30000; // 30 seconds
const testCommand = process.argv[2];

if (!testCommand) {
    console.error('Usage: node start-server-and-run-tests.js <test-command>');
    process.exit(1);
}

// Detect where www/index.html is located relative to current directory
function detectIndexPath() {
    // Always look for www/index.html in current working directory
    if (existsSync('www/index.html')) {
        console.log('Running tests against: ./www/index.html (current directory)');
        return '/www/index.html';
    }
    // Fallback
    console.error('Error: Could not find www/index.html in current directory');
    console.error('Make sure you run tests from the correct directory (root or dist)');
    process.exit(1);
}

const INDEX_PATH = detectIndexPath();

let serverProcess = null;
let testExitCode = 0;

// Function to check if server is ready
function checkServer(debug = false) {
    return new Promise((resolve) => {
        // Use 127.0.0.1 explicitly to avoid IPv6 issues
        // Check the detected index path
        const req = http.get(`http://127.0.0.1:${PORT}${INDEX_PATH}`, (res) => {
            // Got a response - server is ready
            if (debug) console.log(`[DEBUG] Got response with status code: ${res.statusCode}`);
            res.resume(); // Consume response to free up memory
            resolve(true);
        });
        req.on('error', (err) => {
            if (debug) console.log(`[DEBUG] Got error: ${err.code} - ${err.message}`);
            // ECONNREFUSED means server not ready, anything else might mean server is up
            resolve(err.code !== 'ECONNREFUSED');
        });
        req.on('timeout', () => {
            if (debug) console.log(`[DEBUG] Request timed out`);
            req.destroy();
            resolve(false);
        });
        req.setTimeout(500);
    });
}

// Function to wait for server to be ready
async function waitForServer() {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 250ms = 15 seconds max

    // Show progress every 10 attempts
    while (attempts < maxAttempts && Date.now() - startTime < MAX_WAIT_TIME) {
        attempts++;
        // Enable debug on attempts 5 and 15 to see what's happening
        const debug = (attempts === 5 || attempts === 15);
        if (await checkServer(debug)) {
            console.log(`Server is ready on port ${PORT} (attempt ${attempts})`);
            return true;
        }
        if (attempts % 10 === 0) {
            console.log(`Still waiting for server... (attempt ${attempts})`);
        }
        // Wait a bit before next attempt
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    console.error(`Server did not respond after ${attempts} attempts`);
    console.error(`Try manually accessing http://localhost:${PORT}/ in a browser to debug`);
    return false;
}

// Function to start the server
function startServer() {
    return new Promise((resolve, reject) => {
        console.log('Starting http-server...');
        serverProcess = spawn('npx', ['http-server', '-p', PORT.toString()], {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });

        let serverStarted = false;

        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            // http-server outputs "Starting up" and "Available on:" when ready
            if ((output.includes('Starting up') || output.includes('Available on')) && !serverStarted) {
                serverStarted = true;
                console.log('http-server process started');
            }
        });

        serverProcess.stderr.on('data', (data) => {
            const errorMsg = data.toString();
            // Check for port in use error
            if (errorMsg.includes('EADDRINUSE') || errorMsg.includes('address already in use')) {
                console.error(`\nError: Port ${PORT} is already in use.`);
                console.error('Please close any running http-server instances or other applications using this port.');
                console.error(`On Windows, you can find the process with: netstat -ano | findstr :${PORT}`);
                console.error('Then kill it with: taskkill /PID <process-id> /F\n');
                reject(new Error(`Port ${PORT} already in use`));
            } else {
                console.error(`Server error: ${errorMsg}`);
            }
        });

        serverProcess.on('error', (err) => {
            reject(err);
        });

        // Give server a moment to start before we begin health checks
        setTimeout(() => resolve(), 1500);
    });
}

// Function to run tests
function runTests() {
    return new Promise((resolve) => {
        console.log(`Running tests: ${testCommand}`);
        const testProcess = spawn(testCommand, [], {
            stdio: 'inherit',
            shell: true
        });

        testProcess.on('exit', (code) => {
            testExitCode = code || 0;
            resolve();
        });

        testProcess.on('error', (err) => {
            console.error(`Test process error: ${err}`);
            testExitCode = 1;
            resolve();
        });
    });
}

// Function to stop the server cleanly
function stopServer() {
    return new Promise((resolve) => {
        if (!serverProcess || serverProcess.killed) {
            resolve();
            return;
        }

        console.log('Stopping http-server...');

        // On Windows, kill the entire process tree
        if (process.platform === 'win32') {
            try {
                // Use taskkill to kill the process tree on Windows - must be synchronous
                const result = spawnSync('taskkill', ['/pid', serverProcess.pid.toString(), '/T', '/F'], {
                    shell: true
                });

                if (result.error) {
                    console.error('Failed to kill server process:', result.error.message);
                }

                // Wait a moment for the port to be released
                setTimeout(() => {
                    console.log('Server stopped');
                    resolve();
                }, 1000);
            } catch (err) {
                console.error('Failed to kill server process:', err.message);
                resolve();
            }
        } else {
            serverProcess.kill('SIGTERM');

            // Wait for process to exit
            serverProcess.once('exit', () => {
                console.log('Server stopped');
                resolve();
            });

            // Force kill after 2 seconds if still running
            setTimeout(() => {
                if (serverProcess && !serverProcess.killed) {
                    serverProcess.kill('SIGKILL');
                    resolve();
                }
            }, 2000);
        }
    });
}

// Main execution
async function main() {
    try {
        // Start server
        await startServer();

        // Wait for server to be ready
        const serverReady = await waitForServer();
        if (!serverReady) {
            console.error('Server failed to start within timeout period');
            await stopServer();
            process.exit(1);
        }

        // Run tests
        await runTests();

        // Stop server and wait for it to fully stop
        await stopServer();

        // Exit with test exit code
        process.exit(testExitCode);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        await stopServer();
        process.exit(1);
    }
}

// Handle cleanup on exit signals
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, cleaning up...');
    await stopServer();
    process.exit(130);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, cleaning up...');
    await stopServer();
    process.exit(143);
});

main();
