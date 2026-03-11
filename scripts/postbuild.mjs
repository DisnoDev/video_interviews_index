import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

const apacheRewrite = `Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ index.html [L]
`;

const iisRewrite = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
`;

const netlifyRedirects = `/* /index.html 200
`;

const vercelConfig = {
  rewrites: [{ source: '/(.*)', destination: '/index.html' }],
};

await mkdir(distDir, { recursive: true });
await copyFile(indexPath, path.join(distDir, '404.html'));
await writeFile(path.join(distDir, '.htaccess'), apacheRewrite, 'utf8');
await writeFile(path.join(distDir, 'web.config'), iisRewrite, 'utf8');
await writeFile(path.join(distDir, '_redirects'), netlifyRedirects, 'utf8');
await writeFile(path.join(distDir, 'vercel.json'), `${JSON.stringify(vercelConfig, null, 2)}\n`, 'utf8');
