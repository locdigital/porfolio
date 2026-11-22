## Writing thumbnail rule

Whenever a new article is created in `src/content/writing/`, complete the repository-local `writing-thumbnail` skill at `.agent/skills/writing-thumbnail/SKILL.md` before considering the article finished.

The default article cover must be a newly generated cute chibi pixel-art transformation of a randomly selected, people-free scenery photo from the Photography collection. The source image must not contain any person, human figure, face, body part, portrait, crowd, or recognizable human silhouette, including small people in the background. Visually inspect the selected source before generation and reject it if any person is present. Do not attach the unmodified source photo and do not substitute a generic image. The workflow must generate the final WebP and write its `coverImage` metadata into the article frontmatter automatically.
