# Adding runtime dependencies to the app via NPM

If you install a new RUNTIME dependency (rather than a development dependency) via NPM, and then you import the dependency into a module in the app, then you will need to take care that this dependency is available both to the unbundled and the bundled versions of the app when it is published. Although we only expect users to use the bundled version, we also expect the app to run unbundled from at least the development server https://kiwix.github.io/kiwix-js/. This is so that we can easily live-debug the app on remote systems such as BrowserStack.

When you import the dependency, you cannot use the "shorthand" syntax that you will often see in documentation. This is because we need the dependency to load in browser contexts and not only in contexts where NodeJS is running. So, instead of something like `import i18next from 'i18next';`, you will need to give the full path to the imported file, e.g.:

`import i18next from '../../../node_modules/i18next/dist/es/i18next.js';`

This syntax is sufficient for the bundler, rollup.js, to pick up the dependency and include it in the bundle. However, two versions of the app are published to the development server: the raw app (address https://kiwix.github.io/kiwix-js/) and the bundled app (address: https://kiwix.github.io/kiwix-js/dist/). It is the former that we need to add some support for.

The problem is that the `node_modules` folder is usually ignored so that developers do not submit modules to the Repository. But unless we make an exception for dependencies, they won't be available to the unbundled version, so we have to take care of that.

## Update the `gitignore.patch` (NOT `.gitignore`)

The app publishes to the development server after running `npm install` and bundling on the `gh-pages` branch. It uses the workflow `publish-extension.yaml`.  There, you will see the following lines:

```
# Apply the patch to gitignore to allow some dependencies to be included
git apply ./scripts/gitignore.patch
```

As this implies, you will need to add the dependency to the `gitignore.patch` so that it is no longer ignored when the app is published in this specific context. N.B., you must NOT directly commit the changes to `.gitignore` itself, because we do not want multiple versions of dependencies committed to the Repo and kept forever. The only branch that should have these dependencies committed is `gh-pages`, and that branch is force-pushed each time that the app is published, so only the latest versions of dependencies are committed and kept.

To update the patch, you will need the help of software, because the format of a diff patch is a bit tricky

1. On your PR branch make sure your working tree is clean (that you have committed other irrelevant changes);
2. Then run the exising patch with `git apply ./scripts/gitignore.patch`. Do NOT commit these changes, but do save them;
3. Add your your dependency as well to `.gitignore`, putting it in alphabetical order into the existing block of changes, e.g.:
   ```
   !/node_modules/i18next
   /node_modules/i18next/*
   !/node_modules/i18next/dist
   /node_modules/i18next/dist/*
   !/node_modules/i18next/dist/es
   !/node_modules/i18next/dist/es/*
   ```
   This unwieldy syntax is necessary to exclude all the contents of each folder other than the file(s) you wish to include;
4. Save the file (but don't commit it);
5. Run something like `git diff > mypatch.patch`;
6. Take the code in `mypatch.patch` and overwrite the code (but not the comment) in the current `./scripts/gitignore.patch`;
7. Save the chnages to `gitignore.patch`, and discard changes to `.gitignore` and `mypatch.patch`;
8. Test your patch works with `git apply ./scripts/gitignore.patch`;
9. If it works, discard the changes to `.gitignore` again, and you can finally push the `gitignore.patch`.
