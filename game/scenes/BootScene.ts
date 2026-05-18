import { Scene } from 'phaser';

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load assets here
    }

    create() {
        this.scene.start('MainGameScene');
    }
}