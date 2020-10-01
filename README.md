# Sherlocked Frequency Station

This is one of the interactions I made for Sherlocked's new adventure; The Alchemist.
Read [SETUP.md](SETUP.md) to learn how it should be setup before use.

## Development

1. In `client-oscilloscope` you find the sound generation engine
2. In `server-node` you'll find a websocket server that passes messages from the magnetoscope to the sound generation engine
3. in `client-pi` you find the magnetoscope, it runs on a Raspberry Pi
