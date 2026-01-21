#!/usr/bin/env node

const { program } = require('commander');
const { execSync } = require('child_process');
const path = require('path');

program
  .name('postgrest-codemod')
  .description('Codemods for migrating to @supabase-cache-helpers v2')
  .version('0.0.1');

program
  .command('migrate-to-v2')
  .description('Migrate all hooks to the new v2 single object argument pattern')
  .argument('[path]', 'Path to transform (default: .)', '.')
  .option('--dry', 'Dry run (no changes written)')
  .option('--print', 'Print transformed files to stdout')
  .option(
    '--extensions <exts>',
    'File extensions to transform',
    'tsx,ts,jsx,js',
  )
  .action((targetPath, options) => {
    const transformsDir = path.join(__dirname, '..', 'dist', 'transforms');
    const transforms = [
      'migrate-query-hooks.js',
      'migrate-mutation-hooks.js',
      'migrate-subscription-hooks.js',
    ];

    const commonArgs = [
      `--extensions=${options.extensions}`,
      options.dry ? '--dry' : '',
      options.print ? '--print' : '',
      '--parser=tsx',
      '--ignore-pattern=**/node_modules/**',
      '--ignore-pattern=**/dist/**',
      '--ignore-pattern=**/.next/**',
    ]
      .filter(Boolean)
      .join(' ');

    transforms.forEach((transform) => {
      const transformPath = path.join(transformsDir, transform);
      const cmd = `npx jscodeshift -t ${transformPath} ${targetPath} ${commonArgs}`;
      console.log(`Running: ${transform.replace('.js', '')}...`);
      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch (error) {
        // jscodeshift exits with non-zero even for partial success
        console.log(`Completed ${transform.replace('.js', '')}`);
      }
    });

    console.log('\nMigration complete!');
    console.log('Please review the changes and run your tests.');
  });

program
  .command('query-hooks')
  .description('Migrate only query hooks')
  .argument('[path]', 'Path to transform (default: .)', '.')
  .option('--dry', 'Dry run (no changes written)')
  .option('--print', 'Print transformed files to stdout')
  .option(
    '--extensions <exts>',
    'File extensions to transform',
    'tsx,ts,jsx,js',
  )
  .action((targetPath, options) => {
    const transformPath = path.join(
      __dirname,
      '..',
      'dist',
      'transforms',
      'migrate-query-hooks.js',
    );
    const commonArgs = [
      `--extensions=${options.extensions}`,
      options.dry ? '--dry' : '',
      options.print ? '--print' : '',
      '--parser=tsx',
      '--ignore-pattern=**/node_modules/**',
    ]
      .filter(Boolean)
      .join(' ');

    const cmd = `npx jscodeshift -t ${transformPath} ${targetPath} ${commonArgs}`;
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      // jscodeshift may exit non-zero for partial success
    }
  });

program
  .command('mutation-hooks')
  .description('Migrate only mutation hooks')
  .argument('[path]', 'Path to transform (default: .)', '.')
  .option('--dry', 'Dry run (no changes written)')
  .option('--print', 'Print transformed files to stdout')
  .option(
    '--extensions <exts>',
    'File extensions to transform',
    'tsx,ts,jsx,js',
  )
  .action((targetPath, options) => {
    const transformPath = path.join(
      __dirname,
      '..',
      'dist',
      'transforms',
      'migrate-mutation-hooks.js',
    );
    const commonArgs = [
      `--extensions=${options.extensions}`,
      options.dry ? '--dry' : '',
      options.print ? '--print' : '',
      '--parser=tsx',
      '--ignore-pattern=**/node_modules/**',
    ]
      .filter(Boolean)
      .join(' ');

    const cmd = `npx jscodeshift -t ${transformPath} ${targetPath} ${commonArgs}`;
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      // jscodeshift may exit non-zero for partial success
    }
  });

program
  .command('subscription-hooks')
  .description('Migrate only subscription hooks')
  .argument('[path]', 'Path to transform (default: .)', '.')
  .option('--dry', 'Dry run (no changes written)')
  .option('--print', 'Print transformed files to stdout')
  .option(
    '--extensions <exts>',
    'File extensions to transform',
    'tsx,ts,jsx,js',
  )
  .action((targetPath, options) => {
    const transformPath = path.join(
      __dirname,
      '..',
      'dist',
      'transforms',
      'migrate-subscription-hooks.js',
    );
    const commonArgs = [
      `--extensions=${options.extensions}`,
      options.dry ? '--dry' : '',
      options.print ? '--print' : '',
      '--parser=tsx',
      '--ignore-pattern=**/node_modules/**',
    ]
      .filter(Boolean)
      .join(' ');

    const cmd = `npx jscodeshift -t ${transformPath} ${targetPath} ${commonArgs}`;
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      // jscodeshift may exit non-zero for partial success
    }
  });

program.parse();
