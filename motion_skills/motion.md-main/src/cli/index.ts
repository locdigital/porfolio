#!/usr/bin/env node
import { Command } from 'commander'
import { renderCommand } from './commands'

const program = new Command()

program.name('motion.md').description('Generate videos from Markdown files').version('1.0.0')

program
  .command('render')
  .description('Generate a video from a Markdown file')
  .argument('<input>', 'Input Markdown file')
  .option('-o, --output <path>', 'Output video file path')
  .option('--fps <number>', 'Frames per second', '30')
  .option('--width <number>', 'Video width', '1920')
  .option('--height <number>', 'Video height', '1080')
  .action(async (input, options) => {
    await renderCommand(input, {
      output: options.output,
      fps: parseInt(options.fps),
      width: parseInt(options.width),
      height: parseInt(options.height),
    })
  })

program.parse()
