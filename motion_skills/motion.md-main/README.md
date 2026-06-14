# motion.md

`motion.md` is a powerful npm package and CLI tool designed for creating dynamic, high-quality videos using Markdown syntax. Fully compatible with [Slidev](https://sli.dev) syntax, `motion.md` extends the syntax to include advanced configuration options in both the front matter and at the slide level, leveraging [Remotion](https://remotion.dev) to transform your slides into stunning videos. This makes `motion.md` ideal for presentations, tutorials, and content creation.

## Features

- **Extended Markdown Syntax**: Write your video content using simple and familiar Markdown syntax, with advanced configuration options.
- **Slidev Compatibility & Superset**: Reuse your existing Slidev presentations and enhance them with new features.
- **Layouts and Stock Assets**: Use pre-defined layouts and integrate stock photos/videos seamlessly.
- **Video Rendering with Remotion**: Generate high-quality videos directly from your Markdown.
- **Voiceover Support**: Add voiceovers to any slide or component.
- **Customizable**: Enhance your videos with custom animations, transitions, and styles.
- **CLI and Programmatic API**: Use `motion.md` from the command line or integrate it into your Node.js projects.

## Installation

Install the `motion.md` CLI globally:

```bash
npm install -g motion.md
```

Or add it as a dependency in your project:

```bash
npm install motion.md
```

## Usage

### CLI

Create a Markdown file (`slides.md`) with extended Slidev-compatible syntax:

```md
---
title: My Video Presentation
output: video.mp4
fps: 30
resolution:
  width: 1920
  height: 1080
transition: fade
---
layout: intro
voiceover: Discover motion.md - the future of dynamic video generation
---

# Welcome to motion.md

This is a powerful tool for creating videos from Markdown.

---
voiceover: Markdown-based workflow explained.
layout: cover
---

## Features

- Markdown-based workflow
- Slidev syntax compatibility
- Video output with Remotion

---
background: stock:mountains.jpg
voiceover: Here are some amazing features.
transition: slide
---

## Advanced Configuration

This slide uses nested frontmatter for configuration.
```

Generate a video from your Markdown file:

```bash
motion.md render slides.md
```

Alternatively, render Markdown content as a string:

```javascript
import { render } from 'motion.md';

await render(`# Welcome\n---\n# Motion.md Demo`, {
  output: 'output.mp4',
  fps: 30,
  resolution: { width: 1920, height: 1080 },
});
```

### MDX Example

For MDX, each slide is represented as a top-level component without the need for front matter:

````mdx
---
title: AI Motion
voice: Nova
music: Upbeat techno
format: 1920x1080
fps: 60
---

<Intro title='AI Motion' voiceover='Introducing AI Motion, the declarative way to create motion graphics with AI.'>
  `bash npx create-ai-motion`
</Intro>

<Video
  voiceover='Bring your ideas to life using a simple markdown-based format.'
  prompt='Zooming into the pixels inside Markdown code on a computer screen that once blown up, transforming into a realistic view of a SpaceX rocket launch.'
/>

<Code voiceover='Markdown and MDX are easy to write and read, and can include a combination of structured data, unstructured content, executable code, and UI components.'>
  ```mdx --- title: AI Motion ---
  <Intro title='AI Motion' voiceover='Hello world!' />
  ```
</Code>

<Browser voiceover='Powered by Remotion, a framework that renders React components into video' url='https://remotion.dev' />
````



### Available Components

`motion.md` provides the following MDX components for enhanced video creation:

- **Intro**: A slide with a headline and introductory message.
- **Outro**: A closing slide with customizable messages.
- **Code**: Render beautifully styled code snippets.
- **Browser**: Display a simulated browser window.
- **Video**: Embed videos seamlessly.
- **Animation**: Add animated elements to your slides.
- **Meme**: Include memes for a fun touch.
- **Image**: Display high-quality images.
- **Screenshot**: Showcase screenshots effectively.

## Voiceover Support

Add voiceovers easily:

- **Markdown Front Matter**: Specify slide-specific properties like background, voiceover, and transitions directly in Markdown files.
- **MDX Components**: Use `voiceover` as a prop for MDX components.
- **Timing Defaults**: Each slide’s duration defaults to the length of the voiceover. Specify custom durations if needed.

## Configuration

You can configure `motion.md` with a `motion.config.js` or `motion.config.ts` file in your project root:

```javascript
export default {
  output: 'video.mp4',
  fps: 30,
  resolution: {
    width: 1920,
    height: 1080,
  },
  theme: 'default',
  transition: 'fade',
  slideDuration: 'auto', // Default timing based on voiceover length
};
```

## Roadmap

- Add support for live previews.
- Extend animation options and themes.
- Add advanced voiceover customization.
- Improve documentation and tutorials.

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests on [GitHub](https://github.com/yourusername/motion.md).

## License

`motion.md` is licensed under the MIT License.

